
import * as os from "os";
import { ICmParser } from "../../shell";

export class AddParser implements ICmParser<void> {
    private readonly mOutputBuffer: string[] = [];
    private readonly mErrorBuffer: string[] = [];

    readLineOut(line: string): void{
        this.mOutputBuffer.push(line);
    }
    readLineErr(line: string): void{
        this.mErrorBuffer.push(line);
    }

    parse(): Promise<void | undefined>{
        return new Promise<void>((resolve, reject) => {
            return Promise.all(this.mOutputBuffer);
        });
    }
    getError(): Error | undefined{
        var errMsg = this.mOutputBuffer.filter((line) => line.startsWith("ERR"));

        if(this.mErrorBuffer.length > 0){
            return new Error(this.mErrorBuffer.concat(errMsg).join(os.EOL))
        }

        if(errMsg.length > 0){
            return new Error(errMsg.join(os.EOL))
        }

        return undefined;
    }

    getOutputLines(): string[]{
        return this.mOutputBuffer.concat(this.mErrorBuffer);
    }
}