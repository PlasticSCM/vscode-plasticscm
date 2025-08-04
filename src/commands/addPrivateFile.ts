import { commands, Disposable} from "vscode";
import { 
  Add as CmAddCommand, 
} from "../cm/commands";
import { PlasticScm } from "../plasticScm";
import { PlasticScmResource } from "../plasticScmResource";
import { Workspace } from "../workspace";
import { WorkspaceOperation } from "../workspaceOperations";
import { ChangeType } from "../models";

export class AddPrivateFileCommand implements Disposable {
    private readonly mPlasticScm: PlasticScm;
    private readonly mDisposable?: Disposable;
  
    public constructor(plasticScm: PlasticScm) {
      this.mPlasticScm = plasticScm;
      this.mDisposable = commands.registerCommand(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        "plastic-scm.addPrivateFile", args => execute(args, plasticScm));
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

    const paths = resources.filter(r => r.type === ChangeType.Private).map(r => r.resourceUri.fsPath);

    if (paths.length === 0) {
      return;
    }
    await CmAddCommand.run(workspace.shell, paths);
}