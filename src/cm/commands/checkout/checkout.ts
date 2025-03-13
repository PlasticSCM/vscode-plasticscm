import { ICmParser, ICmResult, ICmShell } from "../../shell";
import { CheckoutFileParser } from "./checkoutFileParser";

export class Checkout {

  public static async run(
      shell: ICmShell,
      paths: string[] 
  ): Promise<void | undefined> {

    if (!paths) {
      return;
    }
    
    const parser: ICmParser<void> = new CheckoutFileParser();
    try {
      await shell.exec("co", paths, parser);
    } catch { 

    }
  }
}
