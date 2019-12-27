import { Disposable, scm, SourceControl, SourceControlResourceGroup, Uri } from "vscode";
import { ICmShell } from "./cmShell";
import { Status } from "./commands";
import * as constants from "./constants";
import { ChangeType, IChangeInfo, IPendingChanges, IWorkspaceConfig, IWorkspaceInfo } from "./models";
import { PlasticScmResource } from "./plasticScmResource";

export class Workspace implements Disposable {
  public readonly shell: ICmShell;

  private readonly mWkInfo: IWorkspaceInfo;
  private readonly mSourceControl: SourceControl;
  private readonly mStatusResourceGroup: SourceControlResourceGroup;

  private readonly mDisposables: Disposable;

  private mWorkspaceConfig?: IWorkspaceConfig;

  public get StatusResourceGroup(): IPlasticScmResourceGroup {
    return this.mStatusResourceGroup as IPlasticScmResourceGroup;
  }

  public get WorkspaceConfig(): IWorkspaceConfig | undefined {
    return this.mWorkspaceConfig;
  }

  constructor(workspaceInfo: IWorkspaceInfo, shell: ICmShell) {
    this.mWkInfo = workspaceInfo;
    this.shell = shell;
    this.mSourceControl = scm.createSourceControl(
      constants.extensionId,
      constants.extensionDisplayName,
      Uri.file(workspaceInfo.path));
    this.mStatusResourceGroup = this.mSourceControl.createResourceGroup(
      "status", "Workspace status");

    this.mDisposables = Disposable.from(
      this.mSourceControl,
      this.mStatusResourceGroup,
    );

    this.updateWorkspaceStatus();
  }

  public dispose() {
    this.mDisposables.dispose();
  }

  private async updateWorkspaceStatus(): Promise<void> {
    const pendingChanges: IPendingChanges =
      await Status.run(this.mWkInfo.path, this.shell);

    this.mWorkspaceConfig = pendingChanges.workspaceConfig;

    const changeInfos: IChangeInfo[] = Array.from(pendingChanges.changes.values());

    const sourceControlResources: PlasticScmResource[] = changeInfos.map(
      changeInfo => new PlasticScmResource(changeInfo));

    this.mStatusResourceGroup.resourceStates = sourceControlResources;
    this.mSourceControl.count = changeInfos.filter(
      changeInfo => changeInfo.type !== ChangeType.Private).length;

    this.mSourceControl.inputBox.placeholder = "🥺 Checkin changes is not supported yet";
  }
}

export interface IPlasticScmResourceGroup extends SourceControlResourceGroup {
  resourceStates: PlasticScmResource[];
}
