import { ICmParser, ICmResult, ICmShell } from "../../cmShell";
import { IChangeInfo } from "../../models";
import { StatusParser } from "./statusParser";

export class Status {
  public static async run(rootDir: string, shell: ICmShell): Promise<IChangeInfo[]> {
    const parser: ICmParser<IChangeInfo[]> = new StatusParser();

    const result: ICmResult<IChangeInfo[]> = await shell.exec(
      "status",
      [rootDir, "--xml", "--encoding=utf-8", "--fp"],
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
