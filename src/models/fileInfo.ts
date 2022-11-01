import { ChangeType } from "./changeInfo";
import { Uri } from "vscode";

export interface IFileInfo {
  clientPath: Uri;
  relativePath: string;
  serverPath: string;
  size: number;
  hash: string;
  owner: string;
  revisionChangeset: number;
  status: ChangeType;
  isUnderXlink: boolean;
  isXlink: boolean;
  repSpec: string;
}
