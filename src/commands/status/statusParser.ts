import * as os from "os";
import * as xml2js from "xml2js";
import { ICmParser } from "../../cmShell";
import { IChangeInfo } from "../../models";

export class StatusParser implements ICmParser<IChangeInfo[]> {
  private readonly mOutputBuffer: string[] = [];
  private readonly mErrorBuffer: string[] = [];
  private mParseError?: Error;

  public readLineOut(line: string): void {
    this.mOutputBuffer.push(line);
  }

  public readLineErr(line: string): void {
    this.mErrorBuffer.push(line);
  }

  public parse(): IChangeInfo[] | undefined {
    let results: IChangeInfo[] = [];

    xml2js.parseString(this.mOutputBuffer.join(""), (error, result) => {
      if (error) {
        this.mParseError = error;
        return;
      }
      results = results.concat(this.parseXml(result));
    });
    return results;
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

  private parseXml(result: any): IChangeInfo[] {
    // TODO implement the actual parsing process
    return [];
  }
}
