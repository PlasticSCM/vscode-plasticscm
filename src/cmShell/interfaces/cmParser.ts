export interface ICmParser<T> {
  readLineOut(line: string): void;
  readLineErr(line: string): void;
  parse(): Promise<T | undefined>;
  getError(): Error | undefined;
  getOutputLines(): string[];
}
