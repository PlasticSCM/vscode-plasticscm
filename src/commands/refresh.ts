import { commands, Disposable, window } from "vscode";
import { PlasticScm } from "../plasticScm";
import { Workspace } from "../workspace";

export class RefreshCommand implements Disposable {
  private readonly mPlasticScm: PlasticScm;
  private readonly mDisposable?: Disposable;

  public constructor(plasticScm: PlasticScm) {
    this.mPlasticScm = plasticScm;
    this.mDisposable = commands.registerCommand(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      "plastic-scm.refresh", args => this.execute(args));
  }

  public dispose(): void {
    if (this.mDisposable) {
      this.mDisposable.dispose();
    }
  }

  private async execute(args: any[]): Promise<any> {
    const workspace: Workspace | undefined = await this.getWorkspace(args);
    if (!workspace) {
      return;
    }

    await workspace.updateWorkspaceStatus();
  }

  private async getWorkspace(args: any[]): Promise<Workspace | undefined> {
    if (args instanceof Workspace) {
      return args as Workspace;
    }

    if (this.mPlasticScm.workspaces.size === 1) {
      return Array.from(this.mPlasticScm.workspaces.values())[0];
    }

    const choice = await window.showQuickPick(
      Array.from(this.mPlasticScm.workspaces.values()).map(wk => ({
        description: wk.info.path,
        label: wk.info.name,
        workspace: wk,
      })),
      {
        canPickMany: false,
        ignoreFocusOut: true,
        placeHolder: "Which workspace would you like to refresh?",
      });

    return choice?.workspace;
  }
}
