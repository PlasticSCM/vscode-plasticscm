
import * as os from "os";
import {
  Disposable,
  OutputChannel,
  window as VsCodeWindow,
  workspace as VsCodeWorkspace,
} from "vscode";
import { CmShell, ICmShell } from "./cmShell";
import { GetWorkspaceFromPath, Status } from "./commands";
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

    const globalShell: ICmShell = new CmShell(os.tmpdir(), this.mChannel);
    if (!await globalShell.start()) {
      const errorMessage = 'Plastic SCM extension can\'t start: unable to start "cm shell"';
      VsCodeWindow.showErrorMessage(errorMessage);
      this.mChannel.appendLine(errorMessage);
      return;
    }

    for (const folder of VsCodeWorkspace.workspaceFolders) {
      try {
        const wkInfo: IWorkspaceInfo | undefined =
          await GetWorkspaceFromPath.run(folder.uri.fsPath, globalShell);

        if (!wkInfo || this.mWorkspaces.has(wkInfo.id)) {
          continue;
        }

        const wkShell: ICmShell = new CmShell(wkInfo.path, this.mChannel);
        if (!await wkShell.start()) {
          this.mChannel.appendLine(`Unable to start shell for workspace "${wkInfo.path}"`);
          wkShell.dispose();
          continue;
        }

        const workspace: Workspace = new Workspace(wkInfo, wkShell);
        this.mDisposables.push(wkShell, workspace);
        this.mWorkspaces.set(wkInfo.id, workspace);

        const changes = await Status.run(wkInfo.path, wkShell);
      } catch (error) {
        VsCodeWindow.showErrorMessage(error?.message);
        this.mChannel.appendLine(
          `Unable to find workspace in ${folder.uri.fsPath}: ${error?.message}`);
      } finally {
        await globalShell.stop();
        globalShell.dispose();
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
