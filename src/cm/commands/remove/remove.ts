import { ICmParser, ICmResult, ICmShell } from "../../shell";
import { RemoveParser } from "./removeParser";

export class Remove {

  public static async run(
      shell: ICmShell,
      paths: string[] | undefined
  ): Promise<void | undefined> {

    if (!paths) {
      return;
    }
    
    const parser: ICmParser<void> = new RemoveParser();

    try {
      await shell.exec("remove", paths, parser);
    } catch {

    }
  }
}
