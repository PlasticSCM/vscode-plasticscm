import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as uuid from "uuid";
import { ChildProcess, spawn } from "child_process";
import { Disposable, OutputChannel } from "vscode";
import { ICmParser, ICmResult, ICmShell } from "./interfaces";
import { Configuration } from "../../configuration";
import { IShellConfig } from "../../config";
import { LineStream } from "./lineStream";
import { Readable } from "stream";

const UTF8 = "utf8";
const COMMAND_RESULT_TOKEN = "CommandResult ";

export class CmShell implements ICmShell {

  public get isBusy(): boolean {
    return this.mbIsBusy;
  }

  private readonly mStartDir: string;
  private readonly mChannel: OutputChannel;
  private mProcess?: ChildProcess;
  private mbIsRunning = false;
  private readonly mOutStream: LineStream;
  private readonly mErrStream: LineStream;
  private mbIsBusy = true;
  private mConfiguration: Configuration;
  private mOnConfigurationDidChange: Disposable;
  private mShellConfig: IShellConfig;

  public get isRunning(): boolean {
    return this.mbIsRunning;
  }

  public constructor(
      startDir: string,
      channel: OutputChannel,
      configuration: Configuration) {
    this.mStartDir = startDir;
    this.mChannel = channel;
    this.mOutStream = new LineStream(UTF8);
    this.mErrStream = new LineStream(UTF8);
    this.mOutStream.on("data", line => {
      this.mChannel.appendLine(`DEBUG: ${line}`);
    });
    this.mConfiguration = configuration;
    this.mShellConfig = configuration.get().cmConfiguration;
    this.mOnConfigurationDidChange = configuration.onDidChange(
      async () => await this.updateShellConfig());
  }

  public dispose(): void {
    this.mErrStream.dispose();
    this.mOutStream.dispose();
    if (this.mProcess && this.isRunning) {
      this.mProcess.kill();
    }
    this.mOnConfigurationDidChange.dispose();
  }

  public async start(): Promise<boolean> {
    const commFile = path.join(os.tmpdir(), uuid.v4());
    await new Promise<void>(resolve => {
      fs.writeFile(commFile, "", () => resolve());
    });

    this.mProcess = spawn(
      this.mShellConfig.cmPath,
      [
        "shell", "--encoding=UTF-8", `--commfile=${commFile}`, this.mStartDir,
      ],
      {
        cwd: this.mStartDir,
        env: process.env,
        stdio: [ "pipe", "pipe", "pipe" ],
      });

    const logError = (err: Error) => this.mChannel.appendLine(`ERROR: ${err.message}`);
    this.mProcess.on("error", logError);

    const readOut: (chunk: any) => void = chunk => this.mOutStream.write(chunk);
    const readErr: (chunk: any) => void = chunk => this.mErrStream.write(chunk);
    CmShell.bindProcessStream(this.mProcess.stdout, readOut);
    CmShell.bindProcessStream(this.mProcess.stderr, readErr);

    if (!await this.waitUntilFileDeleted(commFile, this.mShellConfig.millisToWaitUntilUp)) {
      CmShell.unbindProcessStream(this.mProcess.stdout, readOut);
      CmShell.unbindProcessStream(this.mProcess.stderr, readErr);
      this.mChannel.appendLine("Cm shell didn't respond after 3 seconds");

      if (fs.existsSync(commFile)) {
        await new Promise<void>(resolve => fs.unlink(commFile, () => resolve()));
      }
      return false;
    }
    this.mbIsRunning = true;
    this.mbIsBusy = false;
    await this.runInfoCommand("version");
    await this.runInfoCommand("location");
    return true;
  }

  public stop(): Promise<void> {
    if (!this.isRunning) {
      return Promise.resolve();
    }

    this.write("exit");
    this.mbIsRunning = false;
    this.mbIsBusy = true;
    this.mProcess?.stdin?.end();

    return new Promise(resolve => {
      if (!this.mProcess?.connected) {
        resolve();
        return;
      }

      setTimeout(() => {
        if (this.mProcess?.connected) {
          this.mChannel.appendLine("Shell was alive after 500ms, killing it manually");
          try {
            this.mProcess.kill();
          } catch (error) {
            this.mChannel.appendLine(`Error killing the process: ${(error as Error).message}`);
          }
        }
        resolve();
      }, 500);

      this.mProcess.on("exit", () => {
        resolve();
      });
    });
  }

  public async exec<T>(
      command: string,
      args: string[],
      parser: ICmParser<T>): Promise<ICmResult<T>> {
    const commandLine = CmShell.buildCommandLine(command, ...args);

    if (!this.isRunning) {
      this.mChannel.appendLine(
        `Warning: unable to run command '${command}' because the shell isn't running!`);
      return {
        error: new Error("Shell wasn't running"),
        success: false,
      };
    }

    if (this.isBusy) {
      this.mChannel.appendLine(
        `Warning: unable to run command '${command}' because the shell is busy!`);
      return {
        error: new Error("Shell was busy"),
        success: false,
      };
    }
    this.mbIsBusy = true;

    const result: ICmResult<T> = {
      success: false,
    };

    const parserErrorRead: (line: string) => void = line => parser.readLineErr(line);
    this.mErrStream.on("data", parserErrorRead);

    const listenResult: Promise<void> = new Promise<void>(resolve => {
      const parserOutRead: (line: string) => void = line => {
        if (!line.startsWith(COMMAND_RESULT_TOKEN)) {
          parser.readLineOut(line);
          return;
        }

        result.success = parseInt(line.substr(COMMAND_RESULT_TOKEN.length), 10) === 0;
        this.mOutStream.off("data", parserOutRead);
        this.mErrStream.off("data", parserErrorRead);
        resolve();
      };

      this.mOutStream.on("data", parserOutRead);
    });

    this.write(commandLine);
    try {
      await listenResult;
    } catch (error) {
      this.mChannel.appendLine(`ERROR: ${(error as Error).message}`);
    } finally {
      this.mbIsBusy = false;
    }

    if (result.success) {
      result.result = await parser.parse();
      result.error = parser.getError();
      return result;
    }

    result.error = new Error(
      parser.getOutputLines().join(os.EOL));
    return result;
  }

  private async updateShellConfig(): Promise<void> {
    const newConfig = this.mConfiguration.get().cmConfiguration;

    if (this.isRunning && this.mShellConfig.cmPath !== newConfig.cmPath) {
      await this.stop();
      await this.start();
    }

    this.mShellConfig = newConfig;
  }

  private static bindProcessStream(stream: Readable | null, handler: (chunk: any) => void): void {
    if (stream) {
      stream.on("data", handler);
    }
  }

  private static unbindProcessStream(stream: Readable | null, handler: (chunk: any) => void): void {
    if (stream) {
      stream.off("data", handler);
    }
  }

  private static buildCommandLine(command: string, ...args: string[]) {
    if (!args || args.length === 0) {
      return command;
    }
    return `${command} ${args.map(arg => `"${arg}"`).join(" ")}`;
  }

  private write(commandLine: string) {
    this.mChannel.appendLine(`${this.mStartDir}> ${commandLine}`);
    this.mProcess?.stdin?.write(commandLine + os.EOL);
  }

  private async waitUntilFileDeleted(filePath: string, timeout: number): Promise<boolean> {
    const intervalTime = 50;
    let waitTime = 0;

    const delay: (ms: number) => Promise<void> = ms => new Promise<void>(resolve => setTimeout(resolve, ms));

    while (waitTime < timeout) {
      if (!fs.existsSync(filePath)) {
        return true;
      }

      await delay(intervalTime);
      waitTime += intervalTime;
    }
    return false;
  }

  private async runInfoCommand(command: string): Promise<any> {
    const listenResult: Promise<void> = new Promise<void>(resolve => {
      const parserOutRead: (line: string) => void = line => {
        this.mChannel.appendLine(line);
        if (!line.startsWith(COMMAND_RESULT_TOKEN)) {
          return;
        }
        this.mOutStream.off("data", parserOutRead);
        resolve();
      };

      this.mOutStream.on("data", parserOutRead);
    });

    this.mProcess?.stdin?.write(command + os.EOL);
    try {
      await listenResult;
    } catch (error) {
      this.mChannel.appendLine(`ERROR: ${(error as Error).message}`);
    }
  }
}
