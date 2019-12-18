
import { workspace, Disposable, OutputChannel } from 'vscode';
import { ICmShell, CmShell } from './cmShell';
import * as os from 'os';

class Workspace implements Disposable {
  constructor(path: string, name: string, shell: ICmShell) {
    this.mPath = path;
    this.mName = name;
    this.mShell = shell;
  }

  async dispose(): Promise<void> {
    await this.mShell.stop();
    this.mShell.dispose();
  }

  private readonly mPath: string;
  private readonly mName: string;
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
      this.mChannel.appendLine(
        "Plastic SCM extension can't start: unable to start `cm shell'");
      return;
    }

    for (const folder of workspace.workspaceFolders) {
      try{
          const workspaceRoot: string = this.findWorkspaceRoot(shell, folder.uri.fsPath);

          if (this.mWorkspaces.has(workspaceRoot)) {
            continue;
          }

          this.mWorkspaces.set(workspaceRoot, new Workspace(
            workspaceRoot, '', new CmShell(workspaceRoot, this.mChannel)));

        } catch (error) {
          console.error(`Unable to find workspace in ${folder.uri.fsPath}`, error);
          
        }
    }
  }

  dispose() {
    Disposable.from(...this.mWorkspaces.values()).dispose();
  }

  private findWorkspaceRoot(shell: ICmShell, workspaceDir: string): string {
    // TODO use the shell here
    // const result: ICmdResult = shell.exec('gwp', [workspaceDir]);
    return '';
  }

  private readonly mWorkspaces: Map<string, Workspace> = new Map<string, Workspace>();
  private readonly mChannel: OutputChannel;
}
