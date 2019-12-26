
import * as os from "os";
import { Disposable, OutputChannel, workspace } from "vscode";
import * as vscode from "vscode";
import { CmShell, ICmResult, ICmShell } from "./cmShell";
import { GetWorkspaceFromPath } from "./commands";
import { IWorkspaceInfo } from "./models";
import { Workspace } from "./workspace";

export class PlasticScm implements Disposable {
  private readonly mWorkspaces: Map<string, Workspace> = new Map<string, Workspace>();
  private readonly mChannel: OutputChannel;

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
      try {
          const plasticWorkspace: IWorkspaceInfo | undefined =
            await GetWorkspaceFromPath.run(folder.uri.fsPath, shell);

          if (!plasticWorkspace || this.mWorkspaces.has(plasticWorkspace.id)) {
            continue;
          }

          this.mWorkspaces.set(plasticWorkspace.id,
            new Workspace(
              plasticWorkspace,
              new CmShell(plasticWorkspace.path, this.mChannel)));

        } catch (error) {
          vscode.window.showErrorMessage(error?.message);
          this.mChannel.appendLine(
            `Unable to find workspace in ${folder.uri.fsPath}: ${error?.message}`);
        }
    }
  }

  public async stop(): Promise<void> {
    this.getAllShells().forEach(async shell => await shell.stop());
  }

  public dispose() {
    Disposable.from(...this.getAllShells()).dispose();
  }

  private getAllShells(): ICmShell[] {
    const shells: ICmShell[] = [];
    for (const [wkId, wk] of this.mWorkspaces) {
      shells.push(wk.shell);
    }
    return shells;
  }
}
