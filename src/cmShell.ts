import * as os from 'os';
import * as byline from 'byline';
import * as fs from 'fs';
import * as path from 'path';
import * as uuid from 'uuid';
import { ChildProcess, spawn } from 'child_process';
import { StringDecoder } from 'string_decoder';
import { Disposable, OutputChannel } from 'vscode';

export interface ICmdResult<T> {
  result?: T;
  error?: Error | undefined;
  success: boolean;
}

export interface ICmdParser<T> {
  readLineOut(line: string): void;
  readLineErr(line: string): void;
  parse(): T;
  getError(): Error | undefined;
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
    await new Promise<void>(resolve => {
      fs.writeFile(commFile, '', () => resolve());
    });

    this.mProcess = spawn('cm',
      [
        'shell', '--encoding=UTF-8', `--commfile=${commFile}`, this.mStartDir
      ], {
      env: process.env,
      cwd: this.mStartDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const logError = (err: Error) => this.mChannel.appendLine(`ERROR: ${err}`);
    this.mProcess.on('error', logError);

    const readOut: (chunk: any) => void = chunk => this.mOutStream.write(chunk);
    const readErr: (chunk: any) => void = chunk => this.mErrStream.write(chunk);
    this.mProcess.stdout!.on('data', readOut);
    this.mProcess.stderr!.on('data', readErr);

    if (!await this.waitUntilFileDeleted(commFile, 3000)) {
      this.mProcess.stdout!.off('data', readOut);
      this.mProcess.stderr!.off('data', readErr);

      if (fs.existsSync(commFile)) {
        await new Promise<void>(resolve => fs.unlink(commFile, () => resolve()));
      }
      return false;
    }
    this.mbIsRunning = true;
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
    const commandLine = CmShell.buildCommandLine(command, ...args);

    if (!this.isRunning) {
      this.mChannel.appendLine(
        `Warning: unable to run command '${command}' because the shell isn't running!`);
      return {
        error: new Error('Shell wasn\'t running'),
        success: false
      };
    }

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

    this.write(commandLine);
    try {
      await listenResult;
    } catch (error) {
      this.mChannel.appendLine(`ERROR: ${error}`);
    }

    result.result = parser.parse();
    result.error = parser.getError();
    return result;
  }

  private write(commandLine: string) {
    this.mChannel.appendLine(`${this.mStartDir}> ${commandLine}`);
    this.mProcess?.stdin?.write(commandLine + '\n');
  }

  private static buildCommandLine(command: string, ...args: string[]) {
    if (!args || args.length === 0) {
      return command;
    }
    return `${command} ${args.map(arg => `"${arg}"`).join(' ')}`;
  }

  private async waitUntilFileDeleted(path: string, timeout: number): Promise<boolean> {
    const intervalTime = 50;
    let waitTime = 0;

    const delay: (ms: number) => Promise<void> = ms => {
      return new Promise<void>(resolve => setTimeout(resolve, ms));
    };

    while (waitTime < timeout) {
      if (!fs.existsSync(path)) {
        return true;
      }

      await delay(intervalTime);
      waitTime += intervalTime;
    }
    return false;
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
