import * as byline from "byline";
import { StringDecoder } from "string_decoder";
import { Disposable } from "vscode";

export class LineStream implements Disposable {

  private readonly decoder: StringDecoder;
  private readonly lines: byline.LineStream;

  constructor(encoding: string) {
    this.decoder = new StringDecoder(encoding);
    this.lines = new byline.LineStream({ encoding });
  }
  public on(event: string, listener: (chunk: any) => void) {
    this.lines.on(event, listener);
  }

  public off(event: string, listener: (chunk: any) => void) {
    this.lines.off(event, listener);
  }

  public dispose() {
    this.decoder.end();
    this.lines.end();
    this.lines.destroy();
  }

  public write(buffer: Buffer) {
    this.lines.write(this.decoder.write(buffer));
  }
}
