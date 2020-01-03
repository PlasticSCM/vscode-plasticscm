import * as os from "os";
import { Uri } from "vscode";
import * as xml2js from "xml2js";
import { firstCharLowerCase, parseBooleans, parseNumbers } from "xml2js/lib/processors";
import { ChangeType, IChangeInfo, IPendingChanges, WkConfigType } from "../../../models";
import { ICmParser } from "../../shell";

export class StatusParser implements ICmParser<IPendingChanges> {
  private readonly mOutputBuffer: string[] = [];
  private readonly mErrorBuffer: string[] = [];
  private mParseError?: Error;

  public readLineOut(line: string): void {
    this.mOutputBuffer.push(line);
  }

  public readLineErr(line: string): void {
    this.mErrorBuffer.push(line);
  }

  public async parse(): Promise<IPendingChanges | undefined> {
    const options: xml2js.OptionsV2 = {
      explicitArray: false,
      explicitRoot: false,
      tagNameProcessors: [firstCharLowerCase],
      trim: true,
      valueProcessors: [parseNumbers, parseBooleans],
    };

    try {
      return this.parseXml(await xml2js.parseStringPromise(
        this.mOutputBuffer.join(""), options));
    } catch (error) {
      this.mParseError = error;
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

  private parseXml(statusOutput: IStatusOutput): IPendingChanges {
    const repSpec: string = [
      statusOutput.workspaceStatus.status.repSpec.name,
      statusOutput.workspaceStatus.status.repSpec.server,
    ].join("@");

    const changes: Map<string, IChangeInfo> = new Map<string, IChangeInfo>();
    let pendingChanges: IChange[] = [];
    pendingChanges = pendingChanges.concat(statusOutput.changes.change);

    pendingChanges.forEach(change => {
      const uri: Uri = Uri.file(change.path);
      const newChange: IChangeInfo = {
        oldPath: change.oldPath ? Uri.file(change.oldPath) : undefined,
        path: uri,
        type: CHANGE_TYPES[change.type] ?? ChangeType.Controlled,
      };

      changes.set(uri.fsPath, this.mergeChanges(changes.get(uri.fsPath), newChange));
    });

    return {
      changes,
      workspaceConfig: {
        configType: statusOutput.wkConfigType,
        location: statusOutput.wkConfigName.replace(`@${repSpec}`, ""),
        repSpec,
      },
    };
  }

  private mergeChanges(
      destination: IChangeInfo | undefined, source: IChangeInfo): IChangeInfo {
    if (!destination) {
      return source;
    }

    return {
      oldPath: destination.oldPath ?? source.oldPath,
      path: destination!.path,
      type: destination!.type | source.type,
    };
  }
}

interface IStatusOutput {
  workspaceStatus: {
    status: {
      repSpec: {
        server: string;
        name: string;
      };
      changeset: number;
    };
  };
  wkConfigType: WkConfigType;
  wkConfigName: string;
  changes: {
    change: IChange[],
  };
}

const CHANGE_TYPES: { [key: string]: ChangeType } = {
  AD: ChangeType.Added,
  CH: ChangeType.Changed,
  CO: ChangeType.Checkedout,
  CP: ChangeType.Checkedout,
  DE: ChangeType.Deleted,
  IG: ChangeType.Private,
  LD: ChangeType.Deleted,
  LM: ChangeType.Moved,
  MV: ChangeType.Moved,
  PR: ChangeType.Private,
  RP: ChangeType.Checkedout,
};

interface IChange {
  type: string;
  typeVerbose: string;
  path: string;
  oldPath: string;
  printableMovedPath: string;
  mergesInfo: string;
  similarityPerUnit: number;
  similarity: string;
  size: number;
  printableSize: string;
  printableLastModified: string;
  revisionType: string;
  lastModified: Date;
}
