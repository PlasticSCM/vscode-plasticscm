import { ICmdParser, ICmdResult, ICmShell } from '../cmShell';

export class GetWorkspaceFromPath {
  static async  run(path: string, shell: ICmShell) :
    Promise<GetWorkspaceFromPathResult | undefined> {
    const parser = new Parser();

    const cmdResult : ICmdResult<GetWorkspaceFromPathResult | undefined> =
      await shell.exec('gwp', [path, '--format=\"{0}\t{1}\t{4}\"'], parser);

    return new Promise<GetWorkspaceFromPathResult>((resolve, reject) => {
      if (cmdResult.success) {
        resolve(cmdResult.result);
      }
      reject(new Error(`gwp: ${cmdResult.error}`));
    });
  }
}

export class GetWorkspaceFromPathResult
{
  get name(): string { return this.mName; }
  get path(): string { return this.mPath; }
  get id(): string { return this.mId; }

  constructor(path: string, name: string, id: string) {
    this.mPath = path;
    this.mName = name;
    this.mId = id;
  }

  private readonly mPath: string;
  private readonly mName: string;
  private readonly mId: string;
}

class Parser implements ICmdParser<GetWorkspaceFromPathResult | undefined> {

  constructor() {
    this.mOutputBuffer = [];
    this.mErrorBuffer = [];
  }

  readLineOut(line: string): void {
    this.mOutputBuffer.push(line);
  }

  readLineErr(line: string): void {
    this.mErrorBuffer.push(line);
  }

  parse(): GetWorkspaceFromPathResult | undefined {
    const chunks = this.mOutputBuffer.join().split('\t');
    if (chunks.length === 3) {
      return new GetWorkspaceFromPathResult(
        chunks[1], chunks[0], chunks[2]);
    }

    return undefined;
  }

  getError(): Error | undefined {
    if (this.mErrorBuffer.length === 0) {
      return undefined;
    }

    return new Error(this.mErrorBuffer.join());
  }

  private mOutputBuffer : Array<string>;
  private mErrorBuffer : Array<string>;
}
