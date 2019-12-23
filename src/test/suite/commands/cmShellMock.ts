import { ICmShell, ICmdResult, ICmdParser } from "../../../cmShell";

export class CmShellMock implements ICmShell {
  isRunning: boolean;

  constructor(outputLines: string[], errorLines: string[], success: boolean) {
    this.isRunning = true;
    this.mOutputLines = outputLines;
    this.mErrorLines = errorLines;
    this.mSuccess = success;
  }

  start(): Promise<boolean> {
    return new Promise<boolean>(resolve => resolve(true));
  }

  exec<T>(command: string, args: string[], parser: ICmdParser<T>): Promise<ICmdResult<T>> {
    for (let outputLine of this.mOutputLines) {
      parser.readLineOut(outputLine);
    }

    for (let errorLine of this.mErrorLines) {
      parser.readLineErr(errorLine);
    }

    const result: ICmdResult<T> = {
      success: this.mSuccess,
      result: parser.parse(),
      error: parser.getError()
    };

    return  new Promise<ICmdResult<T>>(resolve => resolve(result));
  }

  stop(): void {

  }

  dispose() {

  }

  private readonly mOutputLines : string[];
  private readonly mErrorLines : string[];
  private readonly mSuccess : boolean;
}
