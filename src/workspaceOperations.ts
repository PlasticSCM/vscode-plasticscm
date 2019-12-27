import { Workspace } from "./workspace";

export const enum WorkspaceOperation {
  Status = "Status",
}

export interface IWorkspaceOperations {
  isIdle(): boolean;
  isRunning(operation: WorkspaceOperation): boolean;
}

function isReadOnlyOperation(operation: WorkspaceOperation) {
  return true;
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
