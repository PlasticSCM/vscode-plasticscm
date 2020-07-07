import { ICmParser, ICmResult, ICmShell } from "../../cmShell";
import { CheckinParser } from "./checkinParser";
import { ICheckinChangeset } from "../../models";

export class Checkin {
  public static async run(
    shell: ICmShell, message: string, ...paths: string[]): Promise<ICheckinChangeset[]> {
    const parser: ICmParser<ICheckinChangeset[]> = new CheckinParser();

    const result: ICmResult<ICheckinChangeset[]> = await shell.exec(
      "checkin",
      [
        `-c=${message}`,
        "--applychanged",
        "--machinereadable",
        ...paths,
      ],
      parser);

    if (!result.success) {
      throw new Error("Command execution failed.");
    }

    if (result.error) {
      throw result.error;
    }

    return result.result ?? [];
  }
}
