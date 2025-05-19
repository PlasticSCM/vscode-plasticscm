import { commands, Disposable, window, Uri, SourceControlResourceState} from "vscode";
import { 
  Checkout as CmCheckouCommand, 
  Add as CmAddCommand, 
  Remove as CmRemoveCommand,
  Move as CmMoveCommand,
} from "../cm/commands";
import { PlasticScm } from "../plasticScm";
import { PlasticScmResource } from "../plasticScmResource";
import { Workspace } from "../workspace";
import { WorkspaceOperation } from "../workspaceOperations";
import { ChangeType } from "../models";

export class AddStagedChangesCommand implements Disposable {
  private readonly mPlasticScm: PlasticScm;
  private readonly mDisposable?: Disposable;

  public constructor(plasticScm: PlasticScm) {
    this.mPlasticScm = plasticScm;
    this.mDisposable = commands.registerCommand(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      "plastic-scm.addStagedChange", args => execute(args, plasticScm));
  }

  public dispose(): void {
    if (this.mDisposable) {
      this.mDisposable.dispose();
    }
  }
}

export class AddAllStagedChangesCommand implements Disposable {
  private readonly mPlasticScm: PlasticScm;
  private readonly mDisposable?: Disposable;

  public constructor(plasticScm: PlasticScm) {
    this.mPlasticScm = plasticScm;
    this.mDisposable = commands.registerCommand(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      "plastic-scm.addAllStagedChange", args => execute(args, plasticScm));
  }

  public dispose(): void {
    if (this.mDisposable) {
      this.mDisposable.dispose();
    }
  }
}


async function execute(arg: any, mPlasticScm: PlasticScm) {
  const workspace: Workspace | undefined = arg instanceof Workspace ?
    arg as Workspace :
    await mPlasticScm.promptUserToPickWorkspace();

  if (!workspace) {
    return;
  }

  if (workspace.operations.isRunning(WorkspaceOperation.Checkin)) {
    return;
  }

  let resources: PlasticScmResource[];
  if (!(arg instanceof PlasticScmResource)) {
    resources = arg.resourceStates;
  }else {
    resources = [arg];
  }

  let val;
  let optionList = new Map<ChangeType, string[]>();
  resources.forEach(element => {
    if(element.type === ChangeType.LocalMoved && element.oldResourceUri){

      val = optionList.get(element.type) || [];
      val.push(element.oldResourceUri.fsPath);
      val.push(element.resourceUri.fsPath);
      optionList.set(element.type, val);
    } else {

      val = optionList.get(element.type) || [];
      val.push(element.resourceUri.fsPath)
      optionList.set(element.type, val);
    }
  });

  optionList.forEach(async function(value: string[], key: ChangeType) {
      
      await workspace.operations.run(WorkspaceOperation.AddStagedChanges, async () => {
          try {
              switch (key) {
                  case ChangeType.Private:
                      await CmAddCommand.run(workspace.shell, value);
                      break;
                  case ChangeType.LocalDeleted:
                      await CmRemoveCommand.run(workspace.shell, value);
                      break;
                  case ChangeType.LocalMoved:
                      await CmMoveCommand.run(workspace.shell, value);
                      break;
                  case ChangeType.Changed:
                      await CmCheckouCommand.run(workspace.shell, value);
                  default:
                      break;
              }
          } catch (e) {
            const error = e as Error;
            const token = "Error: ";
            const message = error.message.substring(error.message.lastIndexOf(token) + token.length);
            mPlasticScm.channel.appendLine(`ERROR: ${message}`);
            await window.showErrorMessage(`Plastic SCM Add Staged Changes failed: ${message}`);
          }
      });
  });

}