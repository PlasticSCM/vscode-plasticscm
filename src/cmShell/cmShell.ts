import * as byline from "byline";
import { ChildProcess, spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { StringDecoder } from "string_decoder";
import * as uuid from "uuid";
import { Disposable, OutputChannel } from "vscode";
import { ICmParser, ICmResult, ICmShell } from "./interfaces";
import { LineStream } from "./lineStream";

const UTF8 = "utf8";

export class CmShell implements ICmShell {
  public get isRunning(): boolean {
    return this.mbIsRunning;
  }

  private static buildCommandLine(command: string, ...args: string[]) {
    if (!args || args.length === 0) {
      return command;
    }
    return `${command} ${args.map(arg => `"${arg}"`).join(" ")}`;
  }

  private readonly mStartDir: string;
  private readonly mChannel: OutputChannel;
  private mProcess?: ChildProcess;
  private mbIsRunning: boolean = false;
  private readonly mOutStream: LineStream;
  private readonly mErrStream: LineStream;

  constructor(startDir: string, channel: OutputChannel) {
    this.mStartDir = startDir;
    this.mChannel = channel;
    this.mOutStream = new LineStream(UTF8);
    this.mErrStream = new LineStream(UTF8);
  }

  public dispose() {
    this.mErrStream.dispose();
    this.mOutStream.dispose();
    if (this.mProcess && this.isRunning) {
      this.mProcess.kill();
    }
  }

  public async start(): Promise<boolean> {
    const commFile = path.join(os.tmpdir(), uuid.v4());
    await new Promise<void>(resolve => {
      fs.writeFile(commFile, "", () => resolve());
    });

    this.mProcess = spawn("cm",
      [
        "shell", "--encoding=UTF-8", `--commfile=${commFile}`, this.mStartDir,
      ], {
      cwd: this.mStartDir,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const logError = (err: Error) => this.mChannel.appendLine(`ERROR: ${err}`);
    this.mProcess.on("error", logError);

    const readOut: (chunk: any) => void = chunk => this.mOutStream.write(chunk);
    const readErr: (chunk: any) => void = chunk => this.mErrStream.write(chunk);
    this.mProcess.stdout!.on("data", readOut);
    this.mProcess.stderr!.on("data", readErr);

    if (!await this.waitUntilFileDeleted(commFile, 3000)) {
      this.mProcess.stdout!.off("data", readOut);
      this.mProcess.stderr!.off("data", readErr);
      this.mChannel.appendLine("Cm shell didn't respond after 3 seconds");

      if (fs.existsSync(commFile)) {
        await new Promise<void>(resolve => fs.unlink(commFile, () => resolve()));
      }
      return false;
    }
    this.mbIsRunning = true;
    return true;
  }

  public stop(): Promise<void> {
    if (!this.isRunning) {
      return Promise.resolve();
    }

    this.write("exit");
    this.mbIsRunning = false;
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
            this.mChannel.appendLine(`Error killing the process: ${error?.message}`);
          }
        }
        resolve();
      }, 500);

      this.mProcess.on("exit", (code, signal) => {
        resolve();
      });
    });
  }

  public async exec<T>(
      command: string,
      args: string[],
      parser: ICmParser<T>)
      : Promise<ICmResult<T>> {
    const commandLine = CmShell.buildCommandLine(command, ...args);

    if (!this.isRunning) {
      this.mChannel.appendLine(
        `Warning: unable to run command '${command}' because the shell isn't running!`);
      return {
        error: new Error("Shell wasn't running"),
        success: false,
      };
    }

    const commandResultToken = "CommandResult ";
    const result: ICmResult<T> = {
      success: false,
    };

    const parserErrorRead: (line: string) => void = line => parser.readLineErr(line);
    this.mErrStream.on("data", parserErrorRead);

    const listenResult: Promise<void> = new Promise<void>(resolve => {
      const parserOutRead: (line: string) => void = line => {
        if (!line.startsWith(commandResultToken)) {
          parser.readLineOut(line);
          return;
        }

        result.success = parseInt(line.substr(commandResultToken.length), 10) === 0;
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
      this.mChannel.appendLine(`ERROR: ${error}`);
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

  private write(commandLine: string) {
    this.mChannel.appendLine(`${this.mStartDir}> ${commandLine}`);
    this.mProcess?.stdin?.write(commandLine + "\n");
  }

  private async waitUntilFileDeleted(filePath: string, timeout: number): Promise<boolean> {
    const intervalTime = 50;
    let waitTime = 0;

    const delay: (ms: number) => Promise<void> = ms => {
      return new Promise<void>(resolve => setTimeout(resolve, ms));
    };

    while (waitTime < timeout) {
      if (!fs.existsSync(filePath)) {
        return true;
      }

      await delay(intervalTime);
      waitTime += intervalTime;
    }
    return false;
  }
}
