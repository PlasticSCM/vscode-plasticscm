import * as os from "os";
import { ICmParser } from "../../cmShell";
import { IChangesetInfo } from "../../models";

export class CheckinParser implements ICmParser<IChangesetInfo> {
  public static readonly SEPARATOR: string = "@#@";
  private static readonly CHANGESET_LINE_START: string = "CHANGESET";

  private readonly mOutputBuffer: string[] = [];
  private readonly mErrorBuffer: string[] = [];
  private mParseError?: Error;

  public readLineOut(line: string): void {
    this.mOutputBuffer.push(line);
  }

  public readLineErr(line: string): void {
    this.mErrorBuffer.push(line);
  }

  public async parse(): Promise<IChangesetInfo | undefined> {
    return this.mOutputBuffer.reduce<IChangesetInfo | undefined>(
      (previous: IChangesetInfo | undefined, line: string) => {
        if (previous) {
          return previous;
        }

        return this.parseLine(line);
    }, undefined);
  }

  public getError(): Error | undefined {
    if (this.mParseError) {
      return this.mParseError;
    }

    return this.mErrorBuffer.length !== 0
      ? new Error(this.mErrorBuffer.join(os.EOL))
      : undefined;
  }

  public getOutputLines(): string[] {
    return this.mOutputBuffer.concat(this.mErrorBuffer);
  }

  private parseLine(line: string): IChangesetInfo | undefined {
    if (!line) {
      return undefined;
    }

    const params: string[] = line.trim().split(CheckinParser.SEPARATOR);
    if (!params || !params.length || params[0] !== CheckinParser.CHANGESET_LINE_START) {
      return undefined;
    }

    const csetValues: string[] = params[1].trim().replace(/ \(mount:.*/, "").split("@");
    return {
      branch: csetValues[1],
      changesetId: parseInt(csetValues[0], 10),
      repository: csetValues[2],
      server: csetValues[3],
    };
  }
}
