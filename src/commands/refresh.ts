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
    const workspace: Workspace | undefined = args instanceof Workspace ?
      args as Workspace :
      await this.mPlasticScm.promptUserToPickWorkspace();

    if (!workspace) {
      return;
    }

    await workspace.updateWorkspaceStatus();
  }
}
