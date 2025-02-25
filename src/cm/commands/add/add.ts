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
    
    const parser: ICmParser<void> = new AddParser();
    try {
      await shell.exec("add", paths, parser);
    } catch(e) {
      console.log(e)
    }
  }
}
