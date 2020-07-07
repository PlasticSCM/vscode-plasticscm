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
  debounce,
  throttle,
} from "./decorators";
import {
  Disposable,
  Event,
  scm,
  SourceControl,
  SourceControlResourceGroup,
  Uri,
  window as VsCodeWindow,
  workspace as VsCodeWorkspace,
} from "vscode";
import { configuration } from "./configuration";
import { ICmShell } from "./cmShell";
import { IWorkspaceOperations } from "./workspaceOperations";
import { PlasticScmResource } from "./plasticScmResource";
import { Status } from "./commands";

export class Workspace implements Disposable {

  public get StatusResourceGroup(): IPlasticScmResourceGroup {
    return this.mStatusResourceGroup as IPlasticScmResourceGroup;
  }

  public get WorkspaceConfig(): IWorkspaceConfig | undefined {
    return this.mWorkspaceConfig;
  }
  public readonly shell: ICmShell;

  private readonly mWorkingDir: string;
  private readonly mWkInfo: IWorkspaceInfo;
  private readonly mSourceControl: SourceControl;
  private readonly mStatusResourceGroup: SourceControlResourceGroup;

  private readonly mOperations: IWorkspaceOperations;

  private readonly mDisposables: Disposable;

  private mWorkspaceConfig?: IWorkspaceConfig;
  private mbIsStatusSlow = false;

  public static async build(
    workingDir: string,
    workspaceInfo: IWorkspaceInfo,
    shell: ICmShell,
    workspaceOperations: IWorkspaceOperations): Promise<Workspace> {

    const result = new Workspace(workingDir, workspaceInfo, shell, workspaceOperations);
    await result.updateWorkspaceStatus();
    return result;
  }

  private constructor(
    workingDir: string,
    workspaceInfo: IWorkspaceInfo,
    shell: ICmShell,
    workspaceOperations: IWorkspaceOperations) {

    this.mWorkingDir = workingDir;
    this.mWkInfo = workspaceInfo;
    this.shell = shell;
    this.mSourceControl = scm.createSourceControl(
      constants.extensionId,
      constants.extensionDisplayName,
      Uri.file(workspaceInfo.path));
    this.mStatusResourceGroup = this.mSourceControl.createResourceGroup(
      "status", "Workspace status");

    this.mOperations = workspaceOperations;

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
  }

  public dispose(): void {
    this.mDisposables.dispose();
  }

  private async onFileChanged(): Promise<void> {
    if (!configuration.get().autorefresh) {
      return;
    }

    if (this.mbIsStatusSlow) {
      // IMPROVEMENT: ask the user if they want to keep calculating status on this workspace automatically.
    }

    if (!this.mOperations.isIdle()) {
      return;
    }

    await this.eventuallyUpdateWorkspaceStatusWhenIdleAndWait();
  }

  @debounce(2500)
  private async eventuallyUpdateWorkspaceStatusWhenIdleAndWait(): Promise<void> {
    await this.updateWorkspaceStatusWhenIdleAndWait();
  }

  @throttle
  private async updateWorkspaceStatusWhenIdleAndWait(): Promise<void> {
    await this.idleAndFocused();
    await this.updateWorkspaceStatus();
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  private async idleAndFocused(): Promise<void> {
    while (true) {
      if (!this.mOperations.isIdle()) {
        // Improvement: listen to event that indicates an operation finished.
        continue;
      }

      if (!VsCodeWindow.state.focused) {
        const onDidFocusWindow = events.filterEvent(
          VsCodeWindow.onDidChangeWindowState, e => e.focused);
        await events.eventToPromise(onDidFocusWindow);
        continue;
      }
      return;
    }
  }

  private async updateWorkspaceStatus(): Promise<void> {
    // Improvement: measure status time and update the 'this.mbIsStatusSlow' flag.
    // ! Status XML output does not print performance warnings!
    const pendingChanges: IPendingChanges =
      await Status.run(this.mWorkingDir, this.shell);

    this.mWorkspaceConfig = pendingChanges.workspaceConfig;

    const changeInfos: IChangeInfo[] = Array.from(pendingChanges.changes.values());

    const sourceControlResources: PlasticScmResource[] = changeInfos.map(
      changeInfo => new PlasticScmResource(changeInfo));

    this.mStatusResourceGroup.resourceStates = sourceControlResources;
    this.mSourceControl.count = changeInfos.filter(
      changeInfo => changeInfo.type !== ChangeType.Private).length;

    this.mSourceControl.inputBox.placeholder = "🥺 Checkin changes is not supported yet";
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
