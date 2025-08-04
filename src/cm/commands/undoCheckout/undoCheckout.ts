import { ICmParser, ICmResult, ICmShell } from "../../shell";
import { CheckoutFileParser } from "./undoCheckoutFileParser";

export class UndoCheckout {

  public static async run(
      shell: ICmShell,
      paths: string[] 
  ): Promise<void | undefined> {

    if (!paths) {
      return;
    }

    const args: string[] = [
      "-k",
      ...paths,
    ];

    
    const parser: ICmParser<void> = new CheckoutFileParser();

    try {
      await shell.exec("unco", args, parser);
    } catch { 

    }
  }
}
