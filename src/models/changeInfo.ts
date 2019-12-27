import { Uri } from "vscode";

export enum WkConfigType {
  Changeset,
  Branch,
  Label,
  Shelve,
  Unknown,
}

// tslint:disable: no-bitwise
export enum ChangeType {
  Controlled = 0,
  Private    = 1 << 0,
  Added      = 1 << 1,
  Changed    = 1 << 2,
  Checkedout = 1 << 3,
  Moved      = 1 << 4,
  Deleted    = 1 << 5,
}
// tslint:enable: no-bitwise

export interface IPendingChanges {
  readonly workspaceConfig: IWorkspaceConfig;
  readonly changes: Map<string, IChangeInfo>;
}

export interface IWorkspaceConfig {
  readonly repSpec: string;
  readonly configType: WkConfigType;
  readonly location: string;
}

export interface IChangeInfo {
  readonly path: Uri;
  readonly type: ChangeType;
}
