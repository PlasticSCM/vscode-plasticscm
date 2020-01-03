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
import { Status as CmStatusCommand } from "./cm/commands";
import { ICmShell } from "./cm/shell";
import { configuration } from "./configuration";
import * as constants from "./constants";
import { debounce, throttle } from "./decorators";
import * as events from "./events";
import {
  ChangeType,
  IChangeInfo,
  IPendingChanges,
  IWorkspaceConfig,
  IWorkspaceInfo,
  WkConfigType,
} from "./models";
import * as paths from "./paths";
import { PlasticScmResource } from "./plasticScmResource";
import { IWorkspaceOperations } from "./workspaceOperations";

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

  private readonly mShell: ICmShell;
  private readonly mWorkingDir: string;
  private readonly mWkInfo: IWorkspaceInfo;
  private readonly mSourceControl: SourceControl;
  private readonly mStatusResourceGroup: SourceControlResourceGroup;

  private readonly mOperations: IWorkspaceOperations;

  private readonly mDisposables: Disposable;

  private mWorkspaceConfig?: IWorkspaceConfig;
  private mbIsStatusSlow: boolean = false;

  constructor(
    workingDir: string,
    workspaceInfo: IWorkspaceInfo,
    shell: ICmShell,
    workspaceOperations: IWorkspaceOperations) {

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
      onWorkspaceFileChangeEvent(uri => this.onFileChanged(uri), this),
    );

    this.mSourceControl.acceptInputCommand = {
      arguments: [this],
      command: "plastic-scm.checkin",
      title: "checkin",
    };
    this.updateWorkspaceStatus();
  }

  public dispose() {
    this.mDisposables.dispose();
  }

  private onFileChanged(uri: Uri): void {
    if (!configuration.get("autorefresh")) {
      return;
    }

    if (this.mbIsStatusSlow) {
      // IMPROVEMENT: ask the user if they want to keep calculating status on this workspace automatically.
    }

    if (!this.mOperations.isIdle()) {
      return;
    }

    this.eventuallyUpdateWorkspaceStatusWhenIdleAndWait();
  }

  @debounce(2500)
  private eventuallyUpdateWorkspaceStatusWhenIdleAndWait(): void {
    this.updateWorkspaceStatusWhenIdleAndWait();
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
