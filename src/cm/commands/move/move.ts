import { ICmParser, ICmResult, ICmShell } from "../../shell";
import { MoveParser } from "./moveParser";

export class Move {

  public static async run(
      shell: ICmShell,
      paths: string[] | undefined
  ): Promise<void | undefined> {

    if (!paths) {
      return;
    }
    
    const parser: ICmParser<void> = new MoveParser();

    try {
      await shell.exec("mv", paths, parser);
    } catch {

    }
  }
}
