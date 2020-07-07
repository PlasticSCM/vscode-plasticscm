import * as byline from "byline";
import { Disposable } from "vscode";
import { StringDecoder } from "string_decoder";

export class LineStream implements Disposable {

  private readonly decoder: StringDecoder;
  private readonly lines: byline.LineStream;

  public constructor(encoding: string) {
    this.decoder = new StringDecoder(encoding);
    this.lines = new byline.LineStream({ encoding });
  }

  public on(event: string, listener: (chunk: any) => void): void {
    this.lines.on(event, listener);
  }

  public off(event: string, listener: (chunk: any) => void): void {
    this.lines.off(event, listener);
  }

  public dispose(): void {
    this.decoder.end();
    this.lines.end();
    this.lines.destroy();
  }

  public write(buffer: Buffer): void {
    this.lines.write(this.decoder.write(buffer));
  }
}
