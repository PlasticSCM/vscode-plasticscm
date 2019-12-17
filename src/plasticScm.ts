import { Uri, workspace } from "vscode";

class Workspace {
  constructor(path: string, name: string) {
    this.mPath = path;
    this.mName = name;
  }

  private mPath: string;
  private mName: string;
}

interface ICmdResult {
  stdout?: string;
  stderr?: string;
  success: boolean;
}

class CmShell {
  constructor() {
  }

  public exec(command: string, args: string[]) : ICmdResult {
    return {
      success: true,
    };
  }
}

export class PlasticScm {
  constructor(shell: CmShell) {
    this.mCmShell = shell;
  }

  public initialize() {
    if (!workspace.workspaceFolders) {
      return;
    }

    const workspaces: {[key: string]: Workspace} = {};
    for (const folder of workspace.workspaceFolders) {
      const workspaceRoot: string = this.findWorkspaceRoot(folder.uri.fsPath);

      if (workspaces[workspaceRoot]) {
        continue;
      }

      workspaces[workspaceRoot] = new Workspace(workspaceRoot, '');
    }
  }

  private findWorkspaceRoot(workspaceDir: string): string {
    const result: ICmdResult = this.mCmShell.exec('gwp', [workspaceDir]);
    return '';
  }

  private mCmShell: CmShell;
}
