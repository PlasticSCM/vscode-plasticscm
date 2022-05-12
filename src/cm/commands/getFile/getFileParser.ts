import * as os from "os";
import { ICmParser } from "../../shell";

export class GetFileParser implements ICmParser<void> {
  private readonly mOutputBuffer: string[] = [];
  private readonly mErrorBuffer: string[] = [];

  public readLineOut(line: string): void {
    this.mOutputBuffer.push(line);
  }

  public readLineErr(line: string): void {
    this.mErrorBuffer.push(line);
  }

  public async parse(): Promise<void> {
    // Do nothing
  }

  public getError(): Error | undefined {
    return this.mErrorBuffer.length !== 0
      ? new Error(this.mErrorBuffer.join(os.EOL))
      : undefined;
  }

  public getOutputLines(): string[] {
    return this.mOutputBuffer.concat(this.mErrorBuffer);
  }
}
