import { ProgressLocation, window } from "vscode";

export const enum WorkspaceOperation {
  Status = "Status",
  Checkin = "Checkin",
}

export interface IWorkspaceOperations {
  isIdle(): boolean;
  isRunning(operation: WorkspaceOperation): boolean;
  run<T>(operation: WorkspaceOperation, action: () => Promise<T>): Promise<T>;
}

function isReadOnlyOperation(operation: WorkspaceOperation) {
  return operation !== WorkspaceOperation.Status;
}

export class WorkspaceOperations implements IWorkspaceOperations {
  private mOperations = new Map<WorkspaceOperation, number>();

  public isRunning(operation: WorkspaceOperation): boolean {
    return this.mOperations.has(operation);
  }

  public isIdle(): boolean {
    const runningOperations = this.mOperations.keys();

    for (const op of runningOperations) {
      if (!isReadOnlyOperation(op)) {
        return false;
      }
    }

    return true;
  }

  public async run(operation: WorkspaceOperation, action: () => Promise<any>): Promise<any> {
    this.start(operation);
    await window.withProgress({
      location: ProgressLocation.SourceControl,
    }, async progress => {
      progress.report({});
      await action();
    });
    this.end(operation);
  }

  private start(operation: WorkspaceOperation): void {
    this.mOperations.set(operation, (this.mOperations.get(operation) || 0) + 1);
  }

  private end(operation: WorkspaceOperation): void {
    const count = (this.mOperations.get(operation) || 0) - 1;

    if (count <= 0) {
      this.mOperations.delete(operation);
      return;
    }

    this.mOperations.set(operation, count);
  }
}
