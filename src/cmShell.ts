import * as os from 'os';
import * as byline from 'byline';
import * as path from 'path';
import * as proc from 'process';
import * as uuid from 'uuid';
import { ChildProcess, spawn } from 'child_process';
import { StringDecoder } from 'string_decoder';
import * as fs from 'fs';

export interface ICmdResult<T> {
  result?: T;
  error?: Error;
  success: boolean;
}

export interface IParser<T> {
  readLineOut(line: string): void;
  readLineErr(line: string): void;
  parse(): T;
  getError(): Error;
}

export interface ICmShell {
  readonly isRunning: boolean;

  start(path: string): Promise<boolean>;
  exec<T>(
    command: string,
    args: string[],
    parser: IParser<T>): Promise<ICmdResult<T>>;
  stop(): void;
}

declare const UTF8 = 'utf8';

export class CmShell implements ICmShell {
  public get isRunning(): boolean {
    return this.mbIsRunning;
  }

  constructor(startDir: string) {
    this.mStartDir = startDir;
    this.mOutStream = new LineStream(UTF8);
    this.mErrStream = new LineStream(UTF8);
  }

  async start(): Promise<boolean> {
    const commFile = path.join(os.tmpdir(), uuid.v4());

    this.mbIsRunning = true;
    this.mProcess = spawn('cm',
      [
        'shell', '--encoding=UTF-8', `--commfile=${commFile}`, this.mStartDir
      ], {
      env: proc.env,
      cwd: this.mStartDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.mProcess.once('exit', this.onExit);
    this.mProcess.stdout?.on('data', this.mOutStream.write);
    this.mProcess.stderr?.on('data', this.mErrStream.write);

    if (!await this.waitUntilFileDeleted(commFile, 3000)) {
      this.mProcess.stdout?.off('data', this.mOutStream.write);
      this.mProcess.stderr?.off('data', this.mErrStream.write);
      return false;
    }
    return true;
  }

  stop(): void {
    this.write('exit');
  }

  async exec<T>(
      command: string,
      args: string[],
      parser: IParser<T>)
      : Promise<ICmdResult<T>> {
    const commandResultToken = 'CommandResult ';
    const result: ICmdResult<T> = {
      success: false
    };

    this.mErrStream.on('data', parser.readLineErr);
    const listenResult: Promise<void> = new Promise<void>(resolve => {
      this.mOutStream.on('data', line => {
        if (!line.startsWith(commandResultToken)) {
          parser.readLineOut(line);
          return;
        }

        result.success = parseInt(commandResultToken.substr(commandResultToken.length)) === 0;
        this.mOutStream.off('data', parser.readLineOut);
        resolve();
      });
    });

    this.write(command, ...args);

    await listenResult;

    result.result = parser.parse();
    result.error = parser.getError();
    return result;
  }

  private onExit(code: number, signal: string) {
    console.info(`Shell exited with code ${code}`);
    this.mbIsRunning = false;
  }

  private write(command: string, ...args: string[]) {
    this.mProcess?.stdin?.write(command);
    if (args && args.length > 0) {
      this.mProcess?.stdin?.write(` ${args.map(arg => `"${arg}"`).join(' ')}`);
    }
    this.mProcess?.stdin?.write('\n');
    this.mProcess?.stdin?.end();
  }

  private waitUntilFileDeleted(path: string, timeout: number): Promise<boolean> {
    let retries = 0;
    const intervalTime = 50;

    return new Promise<boolean>(resolve => {
      const interval = setInterval(() => {
        if (!fs.existsSync(path)) {
          clearInterval(interval);
          resolve(true);
        }
  
        if (retries < timeout / intervalTime) {
          retries += 1;
          return;
        }
        
        clearInterval(interval);
        resolve(false);
      }, intervalTime);
    });
  }

  private readonly mStartDir: string;
  private mProcess?: ChildProcess;
  private mbIsRunning: boolean = false;
  private readonly mOutStream: LineStream;
  private readonly mErrStream: LineStream;
}


class LineStream {
  get on() {
    return this.lines.on;
  }

  get off() {
    return this.lines.off;
  }

  constructor(encoding: string) {
    this.decoder = new StringDecoder(encoding);
    this.lines = new byline.LineStream({ encoding });
  }
  
  write(buffer: Buffer) {
    this.lines.write(this.decoder.write(buffer));
  }

  private readonly decoder: StringDecoder;
  private readonly lines: byline.LineStream;
}
