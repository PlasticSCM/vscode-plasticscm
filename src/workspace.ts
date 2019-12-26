import { Disposable, scm, SourceControl, Uri } from "vscode";
import { ICmShell } from "./cmShell";
import * as constants from "./constants";
import { IWorkspaceInfo } from "./models";

export class Workspace implements Disposable {
  public readonly shell: ICmShell;

  private readonly mWkInfo: IWorkspaceInfo;
  private readonly mSourceControl: SourceControl;

  constructor(workspaceInfo: IWorkspaceInfo, shell: ICmShell) {
    this.mWkInfo = workspaceInfo;
    this.shell = shell;
    this.mSourceControl = scm.createSourceControl(
      constants.extensionId,
      constants.extensionDisplayName);
  }

  public dispose() {
    this.mSourceControl.dispose();
  }
}
