
import * as os from "os";
import { CmShell, ICmShell } from "./cm/shell";
import {
  Disposable,
  OutputChannel,
  window as VsCodeWindow,
  workspace as VsCodeWorkspace,
} from "vscode";
import { CheckinCommand } from "./commands";
import { GetWorkspaceFromPath } from "./cm/commands";
import { IWorkspaceInfo } from "./models";
import { Workspace } from "./workspace";
import { WorkspaceOperations } from "./workspaceOperations";

export class PlasticScm implements Disposable {
  public get workspaces(): Map<string, Workspace> {
    return this.mWorkspaces;
  }

  public get channel(): OutputChannel {
    return this.mChannel;
  }

  private readonly mWorkspaces: Map<string, Workspace> = new Map<string, Workspace>();
  private readonly mChannel: OutputChannel;
  private readonly mDisposables: Disposable[] = [];

  public constructor(channel: OutputChannel) {
    this.mChannel = channel;
  }

  public async initialize(): Promise<void> {
    if (!VsCodeWorkspace.workspaceFolders) {
      return;
    }

    const globalShell: ICmShell = new CmShell(os.tmpdir(), this.mChannel);
    if (!await globalShell.start()) {
      const errorMessage = 'Plastic SCM extension can\'t start: unable to start "cm shell"';
      this.mChannel.appendLine(errorMessage);
      await VsCodeWindow.showErrorMessage(errorMessage);
      return;
    }

    for (const folder of VsCodeWorkspace.workspaceFolders) {
      const workingDir: string = folder.uri.fsPath;

      try {
        const wkInfo: IWorkspaceInfo | undefined =
          await GetWorkspaceFromPath.run(workingDir, globalShell);

        if (!wkInfo || this.mWorkspaces.has(wkInfo.id)) {
          this.mChannel.appendLine(`No workspace found at '${workingDir}'`);
          continue;
        }

        const wkShell: ICmShell = new CmShell(wkInfo.path, this.mChannel);
        if (!await wkShell.start()) {
          this.mChannel.appendLine(`Unable to start shell for workspace "${wkInfo.path}"`);
          wkShell.dispose();
          continue;
        }

        const workspace: Workspace = await Workspace.build(
          workingDir, wkInfo, wkShell, new WorkspaceOperations());
        this.mDisposables.push(wkShell, workspace);
        this.mWorkspaces.set(wkInfo.id, workspace);
      } catch (e) {
        const error = e as Error;
        this.mChannel.appendLine(
          `Unable to find workspace in ${workingDir}: ${error?.message}`);
        await VsCodeWindow.showErrorMessage(error?.message);
      } finally {
        await globalShell.stop();
        globalShell.dispose();
      }
    }

    if (this.mWorkspaces.size) {
      this.mDisposables.push(new CheckinCommand(this));
    }
  }

  public stop(): Promise<void[]> {
    return Promise.all(
      Array.from(this.mWorkspaces.values()).map(wk => wk.shell.stop()));
  }

  public dispose(): void {
    this.mDisposables.forEach(disposable => {
      disposable.dispose();
    });
  }
}
