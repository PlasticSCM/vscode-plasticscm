import * as constants from "./constants";
import * as events from "./events";
import {
  ChangeType,
  IChangeInfo,
  IPendingChanges,
  IWorkspaceConfig,
  IWorkspaceInfo,
  WkConfigType,
} from "./models";
import { GetFile as CmGetFileCommand, Status as CmStatusCommand } from "./cm/commands";
import {
  Disposable,
  Event,
  EventEmitter,
  OutputChannel,
  QuickDiffProvider,
  RelativePattern,
  scm,
  SourceControl,
  SourceControlResourceGroup,
  SourceControlResourceState,
  Uri,
  workspace as VsCodeWorkspace,
} from "vscode";
import { IWorkspaceOperations, WorkspaceOperation } from "./workspaceOperations";
import { ICmShell } from "./cm/shell";
import { IConfig } from "./config";
import { isBinaryFile } from "isbinaryfile";
import { PlasticScmResource } from "./plasticScmResource";
import { throttle } from "./decorators";
import path = require("path");

export class Workspace implements Disposable, QuickDiffProvider {

  public get sourceControl(): SourceControl {
    return this.mSourceControl;
  }

  public get statusResourceGroup(): IPlasticScmResourceGroup {
    return this.mStatusResourceGroup as IPlasticScmResourceGroup;
  }

  public get stagedChangesResourceGroup(): IPlasticScmResourceGroup {
    return this.mStagedChangesResourceGroup as IPlasticScmResourceGroup;
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

  public get currentChangeset(): number {
    return this.mCurrentChangeset || -1;
  }

  public get operations(): IWorkspaceOperations {
    return this.mOperations;
  }

  public readonly onDidRunStatus: Event<void>;

  private readonly mShell: ICmShell;
  private readonly mChannel: OutputChannel;
  private readonly mWkInfo: IWorkspaceInfo;
  private readonly mSourceControl: SourceControl;
  private readonly mStagedChangesResourceGroup: SourceControlResourceGroup;
  private readonly mStatusResourceGroup: SourceControlResourceGroup;
  private readonly mUnrealLevelsResourceGroup: SourceControlResourceGroup;

  private readonly mOperations: IWorkspaceOperations;

  private readonly mDisposables: Disposable;

  private mConfig: IConfig;
  private mWorkspaceConfig?: IWorkspaceConfig;
  private mbIsStatusSlow = false;
  private mCurrentChangeset?: number;

  private onDidChangeStatus: EventEmitter<void>;

  private mFileIsBinary: Map<string, boolean>;

  public static async build(
      workspaceInfo: IWorkspaceInfo,
      shell: ICmShell,
      channel: OutputChannel,
      workspaceOperations: IWorkspaceOperations,
      config: IConfig): Promise<Workspace> {

    const result = new Workspace(workspaceInfo, shell, channel, workspaceOperations, config);

    await result.updateWorkspaceStatus();
    return result;
  }

  private constructor(
      workspaceInfo: IWorkspaceInfo,
      shell: ICmShell,
      channel: OutputChannel,
      workspaceOperations: IWorkspaceOperations,
      config: IConfig) {

    this.onDidChangeStatus = new EventEmitter<void>();
    this.onDidRunStatus = this.onDidChangeStatus.event;

    this.mFileIsBinary = new Map<string, boolean>();

    this.mWkInfo = workspaceInfo;
    this.mShell = shell;
    this.mChannel = channel;
    this.mSourceControl = scm.createSourceControl(
      constants.extensionId,
      constants.extensionDisplayName,
      Uri.file(workspaceInfo.path));
    this.mUnrealLevelsResourceGroup = this.mSourceControl.createResourceGroup(
      "unreal-levels", "Dirty Unreal Levels");
    this.mStagedChangesResourceGroup = this.mSourceControl.createResourceGroup(
      "staged-changes", "Staged Changes");
    this.mStatusResourceGroup = this.mSourceControl.createResourceGroup(
      "status", "Changes");

    this.mUnrealLevelsResourceGroup.hideWhenEmpty = true;

    this.mOperations = workspaceOperations;
    this.mConfig = config;

    const fsWatcher = VsCodeWorkspace.createFileSystemWatcher(new RelativePattern(workspaceInfo.path, "**"));
    const onAnyFsOperationEvent: Event<Uri> = events.anyEvent(
      fsWatcher.onDidChange,
      fsWatcher.onDidCreate,
      fsWatcher.onDidDelete,
    );

    this.mDisposables = Disposable.from(
      this.mSourceControl,
      this.mUnrealLevelsResourceGroup,
      this.mStatusResourceGroup,
      this.mStagedChangesResourceGroup,
      fsWatcher,
      onAnyFsOperationEvent(async () => this.onFileChanged(), this),
    );

    this.mSourceControl.acceptInputCommand = {
      arguments: [this],
      command: "plastic-scm.checkin",
      title: "checkin",
    };

    this.mSourceControl.quickDiffProvider = this;
  }

  public dispose(): void {
    this.mDisposables.dispose();
  }

  public updateConfig(newConfig: IConfig): void {
    this.mConfig = newConfig;
  }

  public async provideOriginalResource(uri: Uri): Promise<Uri | undefined> {
    if (uri.scheme === "file") {
      if (typeof this.mCurrentChangeset === "undefined") {
        await this.mOperations.run(WorkspaceOperation.Status, async () => {
          while (this.mShell.isBusy) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          await this.updateWorkspaceStatus();
        });
      }

      if (!this.mCurrentChangeset) {
        return undefined;
      }

      return await CmGetFileCommand.run(this.mWkInfo.path, uri, this.mCurrentChangeset, this.mShell);

    } else {
      return undefined;
    }
  }

  public async updateWorkspaceStatus(): Promise<void> {
    // Improvement: measure status time and update the 'this.mbIsStatusSlow' flag.
    // ! Status XML output does not print performance warnings!
    const pendingChanges: IPendingChanges =
      await CmStatusCommand.run(this.mWkInfo.path, this.mShell);

    this.mWorkspaceConfig = pendingChanges.workspaceConfig;
    this.mCurrentChangeset = pendingChanges.changeset;

    const changeInfos: IChangeInfo[] = Array.from(pendingChanges.changes.values());

    const sourceControlResources: PlasticScmResource[] = [];
    const stagedChangesControlResources: PlasticScmResource[] = [];
    const unrealLevelResources: SourceControlResourceState[] = [];

    // regex pattern for Unreal Engine's One File Per Actor system
    const unrealOfpaRegex = /(__ExternalActors__|__ExternalObjects__)/;

    for (const changeInfo of changeInfos) {
      if (
        this.mConfig.consolidateUnrealOneFilePerActorChanges &&
        unrealOfpaRegex.exec(changeInfo.path.toString()) !== null
      ) {
        continue;
      }

      // prefetch original files for showing diff
      const unallowedFlag = ChangeType.Added | ChangeType.Private | ChangeType.Deleted | ChangeType.LocalDeleted | ChangeType.Moved;
      if (
        (changeInfo.type & unallowedFlag) === 0
      ) {
        let cachedFileType = this.mFileIsBinary.get(changeInfo.path.toString());
        if (typeof cachedFileType === "undefined") {
          // get the file type
          cachedFileType = await isBinaryFile(changeInfo.path.fsPath);
          this.mFileIsBinary.set(changeInfo.path.toString(), cachedFileType);
        }

        if (cachedFileType === false) {
          try {
            await CmGetFileCommand.run(this.mWkInfo.path, changeInfo.path, pendingChanges.changeset, this.mShell);
          } catch (e: any) {
            this.mChannel.appendLine(`Error trying to get file ${changeInfo.path.toString()}: ${(e as Error).message}`);
          }
        }
      }

      const stagedChangesType = [ChangeType.Checkedout, ChangeType.Added, ChangeType.Moved, ChangeType.Deleted] 

      if(stagedChangesType.indexOf(changeInfo.type) !==  -1){
        stagedChangesControlResources.push(new PlasticScmResource(changeInfo, this));
        continue;
      }
      sourceControlResources.push(new PlasticScmResource(changeInfo, this));
    }

    if (this.mConfig.consolidateUnrealOneFilePerActorChanges) {
      const unrealLevelNames: string[] = [];
      for (const changeInfo of changeInfos) {
        let skipFile =
          unrealOfpaRegex.exec(changeInfo.path.fsPath) === null ||
          !changeInfo.path.fsPath.endsWith("uasset");

        for (const name of unrealLevelNames) {
          if (changeInfo.path.fsPath.includes(name)) {
            skipFile = true;
            break;
          }
        }

        if (skipFile) {
          continue;
        }

        const pathParts = changeInfo.path.fsPath.replace(/\\/g, "/").split("/");
        const ofpaIndex = pathParts.findIndex((value: string) => unrealOfpaRegex.exec(value) !== null);
        const levelRelativeLocation = pathParts.slice(ofpaIndex + 1, pathParts.length - 3).join("/");
        const pathToContentDir = pathParts.slice(0, ofpaIndex).join("/");
        const levelName = path.basename(levelRelativeLocation);

        unrealLevelNames.push(levelName);

        const resourceState: SourceControlResourceState = {
          decorations: {
            faded: false,
            strikeThrough: false,
            tooltip: "Hello",
          },
          resourceUri: Uri.from({
            path: `${pathToContentDir}/${levelRelativeLocation}.umap`,
            scheme: "file",
          }),
        };

        unrealLevelResources.push(resourceState);
      }
    }

    this.mStatusResourceGroup.resourceStates = sourceControlResources;
    this.mStagedChangesResourceGroup.resourceStates = stagedChangesControlResources;
    this.mUnrealLevelsResourceGroup.resourceStates = unrealLevelResources;
    this.mSourceControl.count = sourceControlResources.length + unrealLevelResources.length + stagedChangesControlResources.length;


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

    this.onDidChangeStatus.fire();
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
