
import { workspace, Disposable, OutputChannel } from 'vscode';
import { ICmShell, CmShell, ICmdResult } from './cmShell';
import * as os from 'os';
import { GetWorkspaceFromPathResult, GetWorkspaceFromPath } from './commands/getWorkspaceFromPath';
import * as vscode from 'vscode';

class Workspace implements Disposable {

  constructor(path: string, name: string, id: string, shell: ICmShell) {
    this.mPath = path;
    this.mName = name;
    this.mId = id;
    this.mShell = shell;
  }

  async dispose(): Promise<void> {
    await this.mShell.stop();
    this.mShell.dispose();
  }

  private readonly mPath: string;
  private readonly mName: string;
  private readonly mId: string;
  private readonly mShell: ICmShell;
}

export class PlasticScm implements Disposable {
  constructor(channel: OutputChannel) {
    this.mChannel = channel;
  }

  public async initialize() {
    if (!workspace.workspaceFolders) {
      return;
    }

    const shell: ICmShell = new CmShell(os.tmpdir(), this.mChannel);
    if (!await shell.start()) {
      const errorMessage = 'Plastic SCM extension can\'t start: unable to start "cm shell"';
      vscode.window.showErrorMessage(errorMessage);
      this.mChannel.appendLine(errorMessage);
      return;
    }

    for (const folder of workspace.workspaceFolders) {
      try{
          const workspaceRoot : GetWorkspaceFromPathResult | null =
            await GetWorkspaceFromPath.run(folder.uri.fsPath, shell);

          if (!workspaceRoot || this.mWorkspaces.has(workspaceRoot.id)) {
            continue;
          }

          this.mWorkspaces.set(workspaceRoot.id,
            new Workspace(
              workspaceRoot.path,
              workspaceRoot.name,
              workspaceRoot.id,
            new CmShell(workspaceRoot.path, this.mChannel)));

        } catch (error) {
          console.error(`Unable to find workspace in ${folder.uri.fsPath}`, error);
        }
    }
  }

  dispose() {
    Disposable.from(...this.mWorkspaces.values()).dispose();
  }

  private readonly mWorkspaces: Map<string, Workspace> = new Map<string, Workspace>();
  private readonly mChannel: OutputChannel;
}
