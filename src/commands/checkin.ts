import { commands, Disposable, window } from "vscode";
import { PlasticScm } from "../plasticScm";
import { Workspace } from "../workspace";

export class CheckinCommand implements Disposable {
  private readonly mPlasticScm: PlasticScm;
  private readonly mDisposable?: Disposable;

  public constructor(plasticScm: PlasticScm) {
    this.mPlasticScm = plasticScm;
    this.mDisposable = commands.registerCommand(
      "plastic-scm.checkin", args => this.execute(args));
  }

  public dispose() {
    if (this.mDisposable) {
      this.mDisposable.dispose();
    }
  }

  private async execute(args: any[]): Promise<any> {
    const workspace: Workspace | undefined = await this.getWorkspace(args);
    if (!workspace) {
      return;
    }

    window.showInformationMessage(`Checkin to ${workspace.info.name} successful!`);
  }

  private async getWorkspace(args: any[]): Promise<Workspace | undefined> {
    if (args instanceof Workspace) {
      return args as Workspace;
    }

    if (this.mPlasticScm.workspaces.size === 1) {
      return Array.from(this.mPlasticScm.workspaces.values())[0];
    }

    const choice = await window.showQuickPick(
      Array.from(this.mPlasticScm.workspaces.values()).map(wk => {
        return {
          description: wk.info.path,
          label: wk.info.name,
          workspace: wk,
        };
      }),
      {
        canPickMany: false,
        ignoreFocusOut: true,
        placeHolder: "Checkin to what workspace?",
      });

    return choice?.workspace;
  }
}
