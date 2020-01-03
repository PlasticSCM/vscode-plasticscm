import * as os from "os";
import { IWorkspaceInfo } from "../../../models";
import { ICmParser } from "../../shell";
import { CommandInfo } from "./commandInfo";

export class GetWorkspaceFromPathParser implements ICmParser<IWorkspaceInfo> {
  private mOutputBuffer: string[];
  private mErrorBuffer: string[];
  private mError: Error | undefined;

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

  public parse(): Promise<IWorkspaceInfo | undefined> {
    const nonEmptyLines: string[] = this.mOutputBuffer.filter(line => line.trim());
    if (nonEmptyLines.length > 1) {
      this.mError = new Error(this.mErrorBuffer.concat(
        "Unexpected output:", ...this.mOutputBuffer).join(os.EOL));
      return Promise.resolve(undefined);
    }

    const chunks = nonEmptyLines[0].trim().split(CommandInfo.fieldSeparator);
    if (chunks.length === CommandInfo.numFields) {
      return Promise.resolve({
        id: chunks[CommandInfo.fields.guid.index],
        name: chunks[CommandInfo.fields.wkName.index],
        path: chunks[CommandInfo.fields.wkPath.index],
      });
    }

    this.mError = new Error(this.mErrorBuffer.concat(
      ["Parsing failed:", ...this.mOutputBuffer]).join(os.EOL));
    return Promise.resolve(undefined);
  }

  public getError(): Error | undefined {
    if (this.mError) {
      return this.mError;
    }

    if (this.mErrorBuffer.length === 0) {
      return undefined;
    }

    return new Error(this.mErrorBuffer.join(os.EOL));
  }

  public getOutputLines(): string[] {
    return this.mOutputBuffer.concat(this.mErrorBuffer);
  }
}
