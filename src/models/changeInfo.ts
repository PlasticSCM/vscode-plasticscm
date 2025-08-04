import { Uri } from "vscode";

export enum WkConfigType {
  Changeset = "Changeset",
  Branch = "Branch",
  Label = "Label",
  Shelve = "Shelve",
  Unknown = "Unknown",
}

export enum ChangeType {
  Controlled = 0,
  Private = 1 << 0,
  Added = 1 << 1,
  Changed = 1 << 2,
  Checkedout = 1 << 3,
  Moved = 1 << 4,
  Deleted = 1 << 5,
  LocalMoved = 1 << 6,
  LocalDeleted = 1 << 7,
}

export interface IPendingChanges {
  readonly workspaceConfig: IWorkspaceConfig;
  readonly changes: Map<string, IChangeInfo>;
  readonly changeset: number;
}

export interface IWorkspaceConfig {
  readonly repSpec: string;
  readonly configType: WkConfigType;
  readonly location: string;
}

export interface IChangeInfo {
  readonly path: Uri;
  readonly oldPath?: Uri;
  readonly type: ChangeType;
}
