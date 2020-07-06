import { IChangeInfo, IPendingChanges, WkConfigType } from "../../../models";
import { ICmParser, ICmResult, ICmShell } from "../../shell";
import { StatusParser } from "./statusParser";

export class Status {
  public static readonly EmptyChanges: IPendingChanges = {
    changes: new Map<string, IChangeInfo>(),
    workspaceConfig: {
      configType: WkConfigType.Unknown,
      location: "unknown",
      repSpec: "unknown@unknown",
    },
  };

  public static async run(rootDir: string, shell: ICmShell): Promise<IPendingChanges> {
    const parser: ICmParser<IPendingChanges> = new StatusParser();

    const result: ICmResult<IPendingChanges> = await shell.exec(
      "status",
      [rootDir, "--xml", "--encoding=utf-8", "--fp"],
      parser);

    if (!result.success) {
      throw new Error("Command execution failed.");
    }

    if (result.error) {
      throw result.error;
    }

    return result.result ?? Status.EmptyChanges;
  }
}
