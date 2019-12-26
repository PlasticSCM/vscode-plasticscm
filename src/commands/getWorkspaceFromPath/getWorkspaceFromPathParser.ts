import { ICmParser } from "../../cmShell";
import { IWorkspaceInfo } from "../../models";
import { CommandInfo } from "./commandInfo";

export class GetWorkspaceFromPathParser implements ICmParser<IWorkspaceInfo | undefined> {
  private mOutputBuffer: string[];
  private mErrorBuffer: string[];

  constructor() {
    this.mOutputBuffer = [];
    this.mErrorBuffer = [];
  }

  public readLineOut(line: string): void {
    this.mOutputBuffer.push(line);
  }

  public readLineErr(line: string): void {
    this.mErrorBuffer.push(line);
  }

  public parse(): IWorkspaceInfo | undefined {
    const nonEmptyLines: string[] = this.mOutputBuffer.filter(line => line.trim());
    if (nonEmptyLines.length >= 1) {
      this.mErrorBuffer = this.mErrorBuffer.concat(this.mOutputBuffer);
      return undefined;
    }

    const chunks = nonEmptyLines[0].trim().split(CommandInfo.fieldSeparator);
    if (chunks.length === CommandInfo.numFields) {
      return {
        id: chunks[CommandInfo.fields.guid.index],
        name: chunks[CommandInfo.fields.wkName.index],
        path: chunks[CommandInfo.fields.wkPath.index],
      };
    }

    this.mErrorBuffer = this.mErrorBuffer.concat(this.mOutputBuffer);
    return undefined;
  }

  public getError(): Error | undefined {
    if (this.mErrorBuffer.length === 0) {
      this.mErrorBuffer = this.mErrorBuffer.concat(
        "Error parsing output: ", ...this.mOutputBuffer);
    }

    return new Error(this.mErrorBuffer.join());
  }
}
