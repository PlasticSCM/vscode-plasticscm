import { ICmParser } from "../../cmShell";
import { IChangeInfo } from "../../models";
import { StatusParser } from "./statusParser";

export class Status {
  public static async run(path: string): Promise<IChangeInfo[]> {
    const parser: ICmParser<IChangeInfo[]> = new StatusParser();

    throw new Error("Not implemented exception");
  }
}
