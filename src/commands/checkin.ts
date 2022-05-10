import { commands, Disposable, SourceControlResourceGroup, window } from "vscode";
import { Checkin as CmCheckinCommand } from "../cm/commands";
import { PlasticScm } from "../plasticScm";
import { PlasticScmResource } from "../plasticScmResource";
import { Workspace } from "../workspace";
import { WorkspaceOperation } from "../workspaceOperations";

export class CheckinCommand implements Disposable {
  private readonly mPlasticScm: PlasticScm;
  private readonly mDisposable?: Disposable;

  public constructor(plasticScm: PlasticScm) {
    this.mPlasticScm = plasticScm;
    this.mDisposable = commands.registerCommand(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      "plastic-scm.checkin", args => this.execute(args));
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

    const comment: string | undefined = await this.getComment(workspace);
    if (comment === undefined) {
      return;
    }

    if (workspace.operations.isRunning(WorkspaceOperation.Checkin)) {
      return;
    }

    await workspace.operations.run(WorkspaceOperation.Checkin, async () => {
      try {
        const ciResult = await CmCheckinCommand.run(
          workspace.shell,
          this.mPlasticScm.channel,
          comment,
          ...this.getCheckinPaths(workspace.statusResourceGroup));

        await Promise.all(ciResult.map(cset => window.showInformationMessage(
          `Created changeset cs:${cset.changesetInfo.changesetId}`)));

        workspace.sourceControl.inputBox.value = "";
      } catch (e) {
        const error = e as Error;
        const token = "Error: ";
        const message = error.message.substring(error.message.lastIndexOf(token) + token.length);
        this.mPlasticScm.channel.appendLine(`ERROR: ${message}`);
        await window.showErrorMessage(`Plastic SCM Checkin failed: ${message}`);
      }
    });
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

  private getCheckinPaths(group: SourceControlResourceGroup): string[] {
    const results = group.resourceStates.map(entry => {
      const change = entry as PlasticScmResource;
      return change.isPrivate ? null : change.resourceUri.fsPath;
    });
    return results.filter(path => path !== null) as string[];
  }
}
