import { ICmParser, ICmResult, ICmShell } from "../../cmShell";
import { IChangesetInfo } from "../../models";
import { CheckinParser } from "./checkinParser";

export class Checkin {
  public static readonly InvalidChangeset: IChangesetInfo = {
    changesetId: -1,
    repository: "invalid",
    server: "invalid",
  };

  public static async run(
      shell: ICmShell, message: string, ...paths: string[]): Promise<IChangesetInfo> {
    const parser: ICmParser<IChangesetInfo> = new CheckinParser();

    const result: ICmResult<IChangesetInfo> = await shell.exec(
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

    return result.result ?? Checkin.InvalidChangeset;
  }
}
