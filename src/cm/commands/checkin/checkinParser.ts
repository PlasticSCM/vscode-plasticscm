import * as os from "os";
import { ICheckinChangeset } from "../../../models";
import { ICmParser } from "../../shell";
import * as checkinChangeset from "./checkinChangeset";

export class CheckinParser implements ICmParser<ICheckinChangeset[]> {
  public static readonly SEPARATOR: string = "@#@";
  private static readonly CHANGESET_LINE_START: string = "CHANGESET";
  private static readonly CHANGESET_SEPARATOR: string = ",";

  private static readonly InvalidCheckin: ICheckinChangeset = {
    changesetInfo: {
      changesetId: -1,
      repository: "invalid",
      server: "invalid",
    },
    mountPath: "invalid",
  };

  private readonly mOutputBuffer: string[] = [];
  private readonly mErrorBuffer: string[] = [];
  private mParseError?: Error;

  public readLineOut(line: string): void {
    this.mOutputBuffer.push(line);
  }

  public readLineErr(line: string): void {
    this.mErrorBuffer.push(line);
  }

  public async parse(): Promise<ICheckinChangeset[]> {
    return this.mOutputBuffer.reduce<ICheckinChangeset[]>(
      (previous: ICheckinChangeset[], line: string) => {
        if (previous && previous.length) {
          return previous;
        }

        return this.parseLine(line);
    }, []);
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

  private parseLine(line: string): ICheckinChangeset[] {
    if (!line) {
      return [];
    }

    const params: string[] = line.trim().split(CheckinParser.SEPARATOR);
    if (!params || !params.length || params[0] !== CheckinParser.CHANGESET_LINE_START) {
      return [];
    }

    return params[1]
      .trim()
      .split(CheckinParser.CHANGESET_SEPARATOR)
      .reduce<ICheckinChangeset[]>((csets, checkinCsetSpec) => {
        const checkinCset: ICheckinChangeset | null = checkinChangeset.parse(checkinCsetSpec);
        return checkinCset ? csets.concat(checkinCset) : csets;
      }, [])
      .sort((x, y) => x.mountPath.localeCompare(y.mountPath));
  }
}
