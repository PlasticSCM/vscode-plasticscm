import * as constants from "./constants";
import * as events from "./events";
import * as paths from "./paths";
import {
  ChangeType,
  IChangeInfo,
  IPendingChanges,
  IWorkspaceConfig,
  IWorkspaceInfo,
  WkConfigType,
} from "./models";
import {
  Disposable,
  Event,
  scm,
  SourceControl,
  SourceControlResourceGroup,
  Uri,
  workspace as VsCodeWorkspace,
} from "vscode";
import { IWorkspaceOperations, WorkspaceOperation } from "./workspaceOperations";
import { Status as CmStatusCommand } from "./cm/commands";
import { ICmShell } from "./cm/shell";
import { IConfig } from "./config";
import { PlasticScmResource } from "./plasticScmResource";
import { throttle } from "./decorators";

export class Workspace implements Disposable {

  public get sourceControl(): SourceControl {
    return this.mSourceControl;
  }

  public get statusResourceGroup(): IPlasticScmResourceGroup {
    return this.mStatusResourceGroup as IPlasticScmResourceGroup;
  }

  public get workspaceConfig(): IWorkspaceConfig | undefined {
    return this.mWorkspaceConfig;
  }

  public get info(): IWorkspaceInfo {
    return this.mWkInfo;
  }

  public get shell(): ICmShell {
    return this.mShell;
  }

  public get operations(): IWorkspaceOperations {
    return this.mOperations;
  }

  private readonly mShell: ICmShell;
  private readonly mWorkingDir: string;
  private readonly mWkInfo: IWorkspaceInfo;
  private readonly mSourceControl: SourceControl;
  private readonly mStatusResourceGroup: SourceControlResourceGroup;

  private readonly mOperations: IWorkspaceOperations;

  private readonly mDisposables: Disposable;

  private mConfig: IConfig;
  private mWorkspaceConfig?: IWorkspaceConfig;
  private mbIsStatusSlow = false;

  public static async build(
      workingDir: string,
      workspaceInfo: IWorkspaceInfo,
      shell: ICmShell,
      workspaceOperations: IWorkspaceOperations,
      config: IConfig): Promise<Workspace> {

    const result = new Workspace(workingDir, workspaceInfo, shell, workspaceOperations, config);
    await result.updateWorkspaceStatus();
    return result;
  }

  private constructor(
      workingDir: string,
      workspaceInfo: IWorkspaceInfo,
      shell: ICmShell,
      workspaceOperations: IWorkspaceOperations,
      config: IConfig) {

    this.mWorkingDir = workingDir;
    this.mWkInfo = workspaceInfo;
    this.mShell = shell;
    this.mSourceControl = scm.createSourceControl(
      constants.extensionId,
      constants.extensionDisplayName,
      Uri.file(workspaceInfo.path));
    this.mStatusResourceGroup = this.mSourceControl.createResourceGroup(
      "status", "Workspace status");

    this.mOperations = workspaceOperations;
    this.mConfig = config;

    const fsWatcher = VsCodeWorkspace.createFileSystemWatcher("**");
    const onAnyFsOperationEvent: Event<Uri> = events.anyEvent(
      fsWatcher.onDidChange,
      fsWatcher.onDidCreate,
      fsWatcher.onDidDelete,
    );
    const onWorkspaceFileChangeEvent: Event<Uri> = events.filterEvent(
      onAnyFsOperationEvent,
      uri => paths.isContainedOn(this.mWkInfo.path, uri.fsPath));

    this.mDisposables = Disposable.from(
      this.mSourceControl,
      this.mStatusResourceGroup,
      fsWatcher,
      onWorkspaceFileChangeEvent(async () => this.onFileChanged(), this),
    );

    this.mSourceControl.acceptInputCommand = {
      arguments: [this],
      command: "plastic-scm.checkin",
      title: "checkin",
    };
  }

  public dispose(): void {
    this.mDisposables.dispose();
  }

  public updateConfig(newConfig: IConfig): void {
    this.mConfig = newConfig;
  }

  @throttle(1000)
  private async onFileChanged(): Promise<void> {
    if (!this.mConfig.autorefresh) {
      return;
    }

    if (this.mbIsStatusSlow) {
      // IMPROVEMENT: ask the user if they want to keep calculating status on this workspace automatically.
    }

    if (this.mOperations.isRunning(WorkspaceOperation.Status)) {
      return;
    }

    await this.mOperations.run(WorkspaceOperation.Status, async () => {
      while (this.mShell.isBusy) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await this.updateWorkspaceStatus();
    });
  }

  private async updateWorkspaceStatus(): Promise<void> {
    // Improvement: measure status time and update the 'this.mbIsStatusSlow' flag.
    // ! Status XML output does not print performance warnings!
    const pendingChanges: IPendingChanges =
      await CmStatusCommand.run(this.mWorkingDir, this.mShell);

    this.mWorkspaceConfig = pendingChanges.workspaceConfig;

    const changeInfos: IChangeInfo[] = Array.from(pendingChanges.changes.values());

    const sourceControlResources: PlasticScmResource[] = changeInfos.map(
      changeInfo => new PlasticScmResource(changeInfo));

    this.mStatusResourceGroup.resourceStates = sourceControlResources;
    this.mSourceControl.count = changeInfos.filter(
      changeInfo => changeInfo.type !== ChangeType.Private).length;

    this.mSourceControl.inputBox.placeholder = this.getCheckinPlaceholder(this.mWorkspaceConfig);
    this.mSourceControl.statusBarCommands = [{
      command: "workbench.view.scm",
      title: [
        "$(",
        this.getStatusBarIconKey(this.mWorkspaceConfig.configType),
        ") ",
        this.getPrefix(this.mWorkspaceConfig.configType),
        this.mWorkspaceConfig.location,
      ].join(""),
      tooltip: [
        this.getPrefix(this.mWorkspaceConfig.configType),
        this.mWorkspaceConfig.location,
        "@",
        this.mWorkspaceConfig.repSpec,
      ].join(""),
    }];
  }

  private getCheckinPlaceholder(wkConfig: IWorkspaceConfig) {
    if (wkConfig.configType === WkConfigType.Branch) {
      return `Message (Ctrl+Enter to checkin in '${wkConfig.location}')`;
    }

    if (wkConfig.configType === WkConfigType.Changeset) {
      return `Message (Ctrl+Enter to checkin after '${wkConfig.location}')`;
    }

    return `Sorry, you can't checkin in ${wkConfig.configType} ${wkConfig.location} 🥺`;
  }

  private getStatusBarIconKey(wkConfigType: WkConfigType) {
    switch (wkConfigType) {
    case WkConfigType.Changeset:
      return "git-commit";
    case WkConfigType.Label:
      return "tag";
    case WkConfigType.Shelve:
      return "archive";
    case WkConfigType.Branch:
    default:
      return "git-branch";
    }
  }

  private getPrefix(wkConfigType: WkConfigType) {
    switch (wkConfigType) {
    case WkConfigType.Changeset:
      return "cs:";
    case WkConfigType.Label:
      return "lb:";
    case WkConfigType.Shelve:
      return "sh:";
    case WkConfigType.Branch:
      return "br:";
    default:
      return "";
    }
  }
}

export interface IPlasticScmResourceGroup extends SourceControlResourceGroup {
  resourceStates: PlasticScmResource[];
}
