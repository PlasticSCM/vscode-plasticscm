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

    const comment: string | undefined = await this.getComment(workspace);
    if (comment === undefined) {
      return;
    }

    workspace.sourceControl.inputBox.value = "";
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

  private async getComment(workspace: Workspace): Promise<string | undefined> {
    if (workspace.sourceControl.inputBox.value) {
      return workspace.sourceControl.inputBox.value;
    }

    const yes = "Yes, go ahead!";
    const no = "No, let me write something first...";
    const allowEmpty: string | undefined = await window.showWarningMessage(
      "Do you really want to checkin with an empty comment?", { modal: true }, yes, no);

    if (allowEmpty === yes) {
      return "";
    }

    return await window.showInputBox({
      placeHolder: "Type here your checkin comment...",
    });
  }
}
