import { ICmParser } from "../../shell";

export class UndoFileParser implements ICmParser<void> {
    readLineOut(line: string): void{}
    readLineErr(line: string): void{}
    parse(): Promise<void | undefined>{
        return new Promise<void>((resolve, reject) => {
            
        });
    }
    getError(): Error | undefined{
        return undefined
    }
    getOutputLines(): string[]{
        return []
    }
}