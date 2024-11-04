import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as uuid from "uuid";
import { ICmParser, ICmResult, ICmShell } from "../../shell";
import { CheckinParser } from "./checkinParser";
import { ICheckinChangeset } from "../../../models";
import { OutputChannel } from "vscode";

export class Checkin {
  public static async run(
      shell: ICmShell,
      channel: OutputChannel,
      message: string,
      ...paths: string[]): Promise<ICheckinChangeset[]> {
    const parser: ICmParser<ICheckinChangeset[]> = new CheckinParser();

    const args: string[] = [
      "--machinereadable",
      ...paths,
    ];

    const checkinCommentsFile = Checkin.writeCheckinMessageToFile(message, channel);
    if (checkinCommentsFile) {
      args.push(`-commentsfile=${checkinCommentsFile}`);
    }

    try {
      const result: ICmResult<ICheckinChangeset[]> = await shell.exec("checkin", args, parser);

      if (!result.success || result.error) {
        throw result.error ?? Error("Checkin failed - unknown error");
      }

      return result.result ?? [];
    } finally {
      Checkin.deleteCheckinMessageFile(checkinCommentsFile, channel);
    }
  }

  private static writeCheckinMessageToFile(message: string, channel: OutputChannel): string | null {
    const commentsFile = path.join(os.tmpdir(), uuid.v4());
    try {
      fs.writeFileSync(commentsFile, message);
      return commentsFile;
    } catch (error) {
      channel.appendLine(
        `Unable to create comments file for checkin: ${(error as Error).message}`);
      return null;
    }
  }

  private static deleteCheckinMessageFile(commentsFile: string | null, channel: OutputChannel): void {
    if (!commentsFile) {
      return;
    }

    try {
      fs.unlinkSync(commentsFile);
    } catch (error) {
      channel.appendLine(
        `Unable to remove comments file '${commentsFile}: ${(error as Error).message}`);
    }
  }
}
