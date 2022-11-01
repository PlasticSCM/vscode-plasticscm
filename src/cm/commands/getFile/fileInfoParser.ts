import * as os from "os";
import * as xml2js from "xml2js";
import { firstCharLowerCase, parseBooleans, parseNumbers } from "xml2js/lib/processors";
import { ChangeType } from "../../../models";
import { ICmParser } from "../../shell";
import { IFileInfo } from "../../../models/fileInfo";
import { Uri } from "vscode";

export class FileInfoParser implements ICmParser<IFileInfo> {
  private readonly mOutputBuffer: string[] = [];
  private readonly mErrorBuffer: string[] = [];
  private mParseError?: Error;

  public readLineOut(line: string): void {
    this.mOutputBuffer.push(line);
  }

  public readLineErr(line: string): void {
    this.mErrorBuffer.push(line);
  }

  public async parse(): Promise<IFileInfo | undefined> {
    const options: xml2js.OptionsV2 = {
      explicitArray: false,
      explicitRoot: false,
      tagNameProcessors: [firstCharLowerCase],
      trim: true,
      valueProcessors: [ parseNumbers, parseBooleans ],
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return this.parseXml(await xml2js.parseStringPromise(
        this.mOutputBuffer.join(""), options));
    } catch (error) {
      this.mParseError = error as Error;
      return undefined;
    }
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

  private parseXml(output: IFileInfoOutput): IFileInfo {
    /* eslint-disable sort-keys */
    return {
      clientPath: Uri.file(output.fileInfo.clientPath),
      relativePath: output.fileInfo.relativePath,
      serverPath: output.fileInfo.serverPath,
      size: output.fileInfo.size,
      hash: output.fileInfo.hash,
      owner: output.fileInfo.owner,
      revisionChangeset: output.fileInfo.revisionChangeset,
      status: STATUS_TYPES[output.fileInfo.status] ?? ChangeType.Private,
      isUnderXlink: output.fileInfo.isUnderXlink,
      isXlink: output.fileInfo.isXlink,
      repSpec: output.fileInfo.repSpec,
    };
    /* eslint-enable sort-keys */
  }
}

/* eslint-disable sort-keys */
const STATUS_TYPES: { [key: string]: ChangeType } = {
  "added": ChangeType.Added,
  "changed": ChangeType.Changed,
  "controlled": ChangeType.Controlled,
  "checked-out": ChangeType.Checkedout,
  "deleted": ChangeType.Deleted,
  "private": ChangeType.Private,
  "moved": ChangeType.Moved,
};
/* eslint-enable sort-keys */

interface IFileInfoOutput {
  fileInfo: {
    clientPath: string;
    relativePath: string;
    serverPath: string;
    size: number;
    hash: string;
    owner: string;
    revisionChangeset: number;
    status: string;
    isUnderXlink: boolean;
    isXlink: boolean;
    repSpec: string;
  };
}
