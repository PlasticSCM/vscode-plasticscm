
import * as os from "os";
import {
  Disposable,
  OutputChannel,
  window as VsCodeWindow,
  workspace as VsCodeWorkspace,
} from "vscode";
import { CmShell, ICmShell } from "./cmShell";
import { GetWorkspaceFromPath } from "./commands";
import { IWorkspaceInfo } from "./models";
import { Workspace } from "./workspace";

export class PlasticScm implements Disposable {
  private readonly mWorkspaces: Map<string, Workspace> = new Map<string, Workspace>();
  private readonly mChannel: OutputChannel;
  private readonly mDisposables: Disposable[] = [];

  constructor(channel: OutputChannel) {
    this.mChannel = channel;
  }

  public async initialize() {
    if (!VsCodeWorkspace.workspaceFolders) {
      return;
    }

    const shell: ICmShell = new CmShell(os.tmpdir(), this.mChannel);
    if (!await shell.start()) {
      const errorMessage = 'Plastic SCM extension can\'t start: unable to start "cm shell"';
      VsCodeWindow.showErrorMessage(errorMessage);
      this.mChannel.appendLine(errorMessage);
      return;
    }

    for (const folder of VsCodeWorkspace.workspaceFolders) {
      try {
        const plasticWorkspace: IWorkspaceInfo | undefined =
          await GetWorkspaceFromPath.run(folder.uri.fsPath, shell);

        if (!plasticWorkspace || this.mWorkspaces.has(plasticWorkspace.id)) {
          continue;
        }

        const cmShell: ICmShell = new CmShell(plasticWorkspace.path, this.mChannel);
        const workspace: Workspace = new Workspace(plasticWorkspace, cmShell);
        this.mDisposables.push(cmShell, workspace);

        this.mWorkspaces.set(plasticWorkspace.id, workspace);

      } catch (error) {
        VsCodeWindow.showErrorMessage(error?.message);
        this.mChannel.appendLine(
          `Unable to find workspace in ${folder.uri.fsPath}: ${error?.message}`);
      }
    }
  }

  public async stop(): Promise<void> {
    const shells: ICmShell[] = [];
    for (const [wkId, wk] of this.mWorkspaces) {
      shells.push(wk.shell);
    }
    shells.forEach(async shell => await shell.stop());
  }

  public dispose() {
    this.mDisposables.forEach(disposable => disposable.dispose());
  }
}
