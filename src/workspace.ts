import { ICmShell } from "./cmShell";
import { IWorkspaceInfo } from "./models";

export class Workspace {
  public readonly shell: ICmShell;

  private readonly mWkInfo: IWorkspaceInfo;

  constructor(workspaceInfo: IWorkspaceInfo, shell: ICmShell) {
    this.mWkInfo = workspaceInfo;
    this.shell = shell;
  }
}
