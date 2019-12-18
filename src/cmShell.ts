import * as os from 'os';
import * as byline from 'byline';
import * as path from 'path';
import * as proc from 'process';
import * as uuid from 'uuid';
import { ChildProcess, spawn } from 'child_process';
import { StringDecoder } from 'string_decoder';
import * as fs from 'fs';
import { Disposable, OutputChannel } from 'vscode';

export interface ICmdResult<T> {
  result?: T;
  error?: Error | null;
  success: boolean;
}

export interface ICmdParser<T> {
  readLineOut(line: string): void;
  readLineErr(line: string): void;
  parse(): T;
  getError(): Error | null;
}

export interface ICmShell extends Disposable {
  readonly isRunning: boolean;

  start(): Promise<boolean>;
  exec<T>(
    command: string,
    args: string[],
    parser: ICmdParser<T>): Promise<ICmdResult<T>>;
  stop(): void;
}

const UTF8 = 'utf8';

export class CmShell implements ICmShell {
  public get isRunning(): boolean {
    return this.mbIsRunning;
  }

  constructor(startDir: string, channel: OutputChannel) {
    this.mStartDir = startDir;
    this.mChannel = channel;
    this.mOutStream = new LineStream(UTF8);
    this.mErrStream = new LineStream(UTF8);
  }

  dispose() {
    this.mErrStream.dispose();
    this.mOutStream.dispose();
    if (this.mProcess && this.isRunning) {
      this.mProcess.kill();
    }
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

    const readOut: (chunk: any) => void = chunk => this.mOutStream.write(chunk);
    const readErr: (chunk: any) => void = chunk => this.mErrStream.write(chunk);
    this.mProcess.stdout!.on('data', readOut);
    this.mProcess.stderr!.on('data', readErr);

    if (!await this.waitUntilFileDeleted(commFile, 3000)) {
      this.mProcess.stdout!.off('data', readOut);
      this.mProcess.stderr!.off('data', readErr);
      return false;
    }
    return true;
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.write('exit');
    this.mbIsRunning = false;
    this.mProcess?.stdin?.end();
    if (this.mProcess?.connected) {
      this.mProcess?.disconnect();
    }
  }

  async exec<T>(
      command: string,
      args: string[],
      parser: ICmdParser<T>)
      : Promise<ICmdResult<T>> {
    const commandResultToken = 'CommandResult ';
    const result: ICmdResult<T> = {
      success: false
    };

    const parserErrorRead: (line: string) => void = line => parser.readLineErr(line);
    this.mErrStream.on('data', parserErrorRead);

    const listenResult: Promise<void> = new Promise<void>(resolve => {
      const parserOutRead: (line: string) => void = line => {
        if (!line.startsWith(commandResultToken)) {
          parser.readLineOut(line);
          return;
        }

        result.success = parseInt(line.substr(commandResultToken.length)) === 0;
        this.mOutStream.off('data', parserOutRead);
        this.mErrStream.off('data', parserErrorRead);
        resolve();
      };

      this.mOutStream.on('data', parserOutRead);
    });

    this.write(command, ...args);
    try {
      await listenResult;
    } catch (error) {
      debugger;
    }

    result.result = parser.parse();
    result.error = parser.getError();
    return result;
  }

  private write(commandName: string, ...args: string[]) {
    let command = commandName;
    if (args && args.length > 0) {
      command += ` ${args.map(arg => `"${arg}"`).join(' ')}`;
    }

    this.mChannel.appendLine(`${this.mStartDir}> ${command}`);
    this.mProcess?.stdin?.write(command + '\n');
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
  private readonly mChannel: OutputChannel;
  private mProcess?: ChildProcess;
  private mbIsRunning: boolean = false;
  private readonly mOutStream: LineStream;
  private readonly mErrStream: LineStream;
}


class LineStream implements Disposable {
  on(event: string, listener: (chunk: any) => void) {
    this.lines.on(event, listener);
  }

  off(event: string, listener: (chunk: any) => void) {
    this.lines.off(event, listener);
  }

  constructor(encoding: string) {
    this.decoder = new StringDecoder(encoding);
    this.lines = new byline.LineStream({ encoding });
  }

  dispose() {
    this.decoder.end();
    this.lines.end();
    this.lines.destroy();
  }
  
  write(buffer: Buffer) {
    this.lines.write(this.decoder.write(buffer));
  }

  private readonly decoder: StringDecoder;
  private readonly lines: byline.LineStream;
}
