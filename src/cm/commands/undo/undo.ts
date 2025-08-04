import { ICmParser, ICmResult, ICmShell } from "../../shell";
import { UndoFileParser } from "./undoParser";

export class Undo {

  public static async run(
      shell: ICmShell,
      uris: string[] | undefined
  ): Promise<void | undefined> {

    if (!uris) {
      return;
    }
    
    const parser: ICmParser<void> = new UndoFileParser();

    try {
      await shell.exec("undo", uris, parser);
    } catch {

    }
  }
}
