
import { ICmParser, ICmResult, ICmShell } from "../../shell";
import { AddParser } from "./addParser";

export class Add {

  public static async run(
      shell: ICmShell,
      paths: string[] | undefined
  ): Promise<void | undefined> {

    if (!paths) {
      return;
    }

    const args: string[] = [
      ...paths,
      `--format='ADD {0}'`,
      `--errorformat='ERR {0}'`,
    ];

    const parser: ICmParser<void> = new AddParser();
    try {
      const result: ICmResult<void> = await shell.exec("add", args, parser);
      if (!result.success || result.error) {
        throw result.error;
      }
      return undefined;
    } catch(e) {
      console.log(e)
    }
  }
}