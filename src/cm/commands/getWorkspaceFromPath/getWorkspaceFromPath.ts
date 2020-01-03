import { IWorkspaceInfo } from "../../../models";
import { ICmParser, ICmResult, ICmShell } from "../../shell";
import { CommandInfo } from "./commandInfo";
import { GetWorkspaceFromPathParser } from "./getWorkspaceFromPathParser";

export class GetWorkspaceFromPath {
  public static async run(path: string, shell: ICmShell): Promise<IWorkspaceInfo | undefined> {
    const parser = new GetWorkspaceFromPathParser();

    const cmResult: ICmResult<IWorkspaceInfo | undefined> =
      await shell.exec(
        CommandInfo.commandName,
        [path,
          '--format="'
          + `{${CommandInfo.fields.guid.name}}` + CommandInfo.fieldSeparator
          + `{${CommandInfo.fields.wkName.name}}` + CommandInfo.fieldSeparator
          + `{${CommandInfo.fields.wkPath.name}}"`],
        parser);

    if (!cmResult.success) {
      throw new Error(`Command failed: ${cmResult.error?.message}`);
    }

    if (cmResult.error) {
      throw cmResult.error;
    }

    return cmResult.result;
  }
}
