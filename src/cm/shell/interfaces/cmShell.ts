import { Disposable } from "vscode";
import { ICmParser } from "./cmParser";
import { ICmResult } from "./cmResult";

export interface ICmShell extends Disposable {
  readonly isRunning: boolean;

  start(): Promise<boolean>;
  exec<T>(
    command: string,
    args: string[],
    parser: ICmParser<T>): Promise<ICmResult<T>>;
  stop(): void;
}
