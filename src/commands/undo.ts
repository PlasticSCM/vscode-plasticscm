import { commands, Disposable, window } from "vscode";
import { Undo as CmUndoCommand, Add as CmAddCommand, Remove as CmRemoveCommand } from "../cm/commands";
import { PlasticScm } from "../plasticScm";
import { PlasticScmResource } from "../plasticScmResource";
import { Workspace } from "../workspace";
import { WorkspaceOperation } from "../workspaceOperations";
import * as fs from "fs";


export class UndoCommand implements Disposable {
  private readonly mPlasticScm: PlasticScm;
  private readonly mDisposable?: Disposable;

  public constructor(plasticScm: PlasticScm) {
    this.mPlasticScm = plasticScm;
    this.mDisposable = commands.registerCommand(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      "plastic-scm.undo", args => execute(args, plasticScm));
  }

  public dispose(): void {
    if (this.mDisposable) {
      this.mDisposable.dispose();
    }
  }
}

export class UndoAllCommand implements Disposable {
  private readonly mPlasticScm: PlasticScm;
  private readonly mDisposable?: Disposable;

  public constructor(plasticScm: PlasticScm) {
    this.mPlasticScm = plasticScm;
    this.mDisposable = commands.registerCommand(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      "plastic-scm.undoAll", args => execute(args, plasticScm));
  }

  public dispose(): void {
    if (this.mDisposable) {
      this.mDisposable.dispose();
    }
  }
}


async function execute(arg: any, mPlasticScm: PlasticScm) {
  const workspace: Workspace | undefined = await mPlasticScm.promptUserToPickWorkspace();
  if (!workspace) {
    return;
  }

  if (!arg) {
    return;
  }

  let resources: PlasticScmResource[];
 
  if (!(arg instanceof PlasticScmResource)) {
    resources = arg.resourceStates;
  }else {
    resources = [arg];
  }

  let message: string;

  let delFile: string[] = [];
  let undoFile: string[] = [];
  
  if(resources.length === 1) {
    let opt_A = "Delete file";
    message = `Are you sure you want to DELETE ${resources[0].resourceUri.fsPath.replace(/^.*[\\\/]/, '')}?\nThis is IRREVERSIBLE! This file will be FOREVER LOST if you proceed.`
    if(!resources[0].isPrivate) {
      opt_A = "Discard Changes";
      message = `Are you sure you want to discard changes in ${resources[0].resourceUri.fsPath.replace(/^.*[\\\/]/, '')}?`
    }

    const allowEmpty: string | undefined = await window.showWarningMessage(message, { modal: true }, opt_A);
    if (allowEmpty !== opt_A) {
      return;
    }

    if(opt_A === "Delete file") {
      delFile.push(resources[0].resourceUri.fsPath);
    }else{
      undoFile.push(resources[0].resourceUri.fsPath);
    }
  } else {
    const delCount = resources.filter(v => v.isPrivate).length;
    const chCount = resources.length - delCount;
    let opt_A = `Discard ${chCount} Tracked Files`;
    let opt_B = `Discard All ${resources.length} Files`;

    message = `There are ${delCount} untracked files which will be DELETED FROM DISK if discarded. \n\n This is IRREVERSIBLE, your current working set will be FOREVER LOST.`
  
    const allowEmpty: string | undefined = await window.showWarningMessage(message, { modal: true }, opt_A, opt_B);
    if (allowEmpty !== opt_A && allowEmpty !== opt_B) {
      return;
    }
    undoFile = resources.filter(v => !v.isPrivate).map(r => r.resourceUri.fsPath);

    if(allowEmpty === opt_B) {
      delFile = resources.filter(v => v.isPrivate).map(r => r.resourceUri.fsPath);
    }
  }

  if (delFile.length > 0) {
    try {
      for (let index = 0; index < delFile.length; index++) {
        const element = delFile[index];
        fs.unlinkSync(element);
      }
    } catch (e) {
      const error = e as Error;
      const token = "Error: ";
      const message = error.message.substring(error.message.lastIndexOf(token) + token.length);
      mPlasticScm.channel.appendLine(`ERROR: ${message}`);
      await window.showErrorMessage(`Plastic SCM Undo File failed: ${message}`);
    }  
  }

  if (undoFile.length > 0) {
    await workspace.operations.run(WorkspaceOperation.Undo, async () => {
      try {
        await CmUndoCommand.run(  workspace.shell, undoFile);
      } catch (e) {
        const error = e as Error;
        const token = "Error: ";
        const message = error.message.substring(error.message.lastIndexOf(token) + token.length);
        mPlasticScm.channel.appendLine(`ERROR: ${message}`);
        await window.showErrorMessage(`Plastic SCM Undo File failed: ${message}`);
      }
    });
  }
}