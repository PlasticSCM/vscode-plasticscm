import { ICmParser } from "../../cmShell";
import { IChangeInfo } from "../../models";

export class StatusParser implements ICmParser<IChangeInfo[]> {
  public readLineOut(line: string): void {
    throw new Error("Method not implemented.");
  }

  public readLineErr(line: string): void {
    throw new Error("Method not implemented.");
  }

  public parse(): IChangeInfo[] | undefined {
    throw new Error("Method not implemented.");
  }

  public getError(): Error | undefined {
    throw new Error("Method not implemented.");
  }

  public getOutputLines(): string[] {
    throw new Error("Method not implemented.");
  }
}
