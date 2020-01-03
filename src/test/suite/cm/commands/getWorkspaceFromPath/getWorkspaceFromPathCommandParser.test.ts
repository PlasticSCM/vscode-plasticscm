import { expect } from "chai";
import * as os from "os";
import { GetWorkspaceFromPathParser } from "../../../../../cm/commands/getWorkspaceFromPath/getWorkspaceFromPathParser";
import { ICmParser } from "../../../../../cm/shell";
import { IWorkspaceInfo } from "../../../../../models";

describe("GetWorkspaceFromPath Parser", () => {
  context("when input is correct", () => {
    const line: string = "a@#@b@#@c";

    let error: Error | undefined;
    let result: IWorkspaceInfo | undefined;
    let outputLines: string[];

    before(async () => {
      const parser: ICmParser<IWorkspaceInfo> = new GetWorkspaceFromPathParser();
      parser.readLineOut(line);

      result = await parser.parse();
      error = parser.getError();
      outputLines = parser.getOutputLines();
    });

    it("doesn't return undefined", () => {
      expect(result).to.be.not.undefined;
    });

    it("parses the ID correctly", () => {
      expect(result!.id).to.be.equal("a");
    });

    it("parses the name correctly", () => {
      expect(result!.name).to.be.equal("b");
    });

    it("parses the path correctly", () => {
      expect(result!.path).to.be.equal("c");
    });

    it("doesn't contain any errors", () => {
      expect(error).to.be.undefined;
    });

    it("holds the output correctly", () => {
      expect(outputLines).to.eql([line]);
    });
  });

  context("when there are empty leading and trailing lines", () => {
    const stdout: string[] = [
      "",
      "",
      "a@#@b@#@c",
      "",
    ];

    let error: Error | undefined;
    let result: IWorkspaceInfo | undefined;
    let outputLines: string[];

    before(async () => {
      const parser: ICmParser<IWorkspaceInfo> = new GetWorkspaceFromPathParser();
      stdout.forEach(line => parser.readLineOut(line));

      result = await parser.parse();
      error = parser.getError();
      outputLines = parser.getOutputLines();
    });

    it("doesn't return undefined", () => {
      expect(result).to.be.not.undefined;
    });

    it("parses the ID correctly", () => {
      expect(result!.id).to.be.equal("a");
    });

    it("parses the name correctly", () => {
      expect(result!.name).to.be.equal("b");
    });

    it("parses the path correctly", () => {
      expect(result!.path).to.be.equal("c");
    });

    it("holds the output correctly", () => {
      expect(outputLines).to.eql(stdout);
    });

    it("doesn't contain any errors", () => {
      expect(error).to.be.undefined;
    });
  });

  context("when there are multiple text lines", () => {
    const stdout: string[] = [
      "a@#@b@#@c",
      "this shouldn't be here",
    ];

    let error: Error | undefined;
    let result: IWorkspaceInfo | undefined;
    let outputLines: string[];

    before(async () => {
      const parser: ICmParser<IWorkspaceInfo> = new GetWorkspaceFromPathParser();
      stdout.forEach(line => parser.readLineOut(line));

      result = await parser.parse();
      error = parser.getError();
      outputLines = parser.getOutputLines();
    });

    it("doesn't parse anything", () => {
      expect(result).to.be.undefined;
    });

    it("holds the output correctly", () => {
      expect(outputLines).to.eql(stdout);
    });

    it("produces an error object", () => {
      expect(error).to.be.not.undefined;
    });

    it("has the appropriate error message", () => {
      expect(error!.message).to.be.equal(["Unexpected output:", ...stdout].join(os.EOL));
    });
  });

  context("when single line with parsing errors", () => {
    const line: string = "a@#@b";

    let error: Error | undefined;
    let result: IWorkspaceInfo | undefined;
    let outputLines: string[];

    before(async () => {
      const parser: ICmParser<IWorkspaceInfo> = new GetWorkspaceFromPathParser();
      parser.readLineOut(line);

      result = await parser.parse();
      error = parser.getError();
      outputLines = parser.getOutputLines();
    });

    it("holds the output correctly", () => {
      expect(outputLines).to.eql([line]);
    });

    it("has an undefined result", () => {
      expect(result).to.be.undefined;
    });

    it("produces an error object", () => {
      expect(error).to.be.not.undefined;
    });

    it ("has the appropriate error message", () => {
      expect(error?.message).to.be.equal(["Parsing failed:", "a@#@b"].join(os.EOL));
    });
  });

  context("when there are stderr lines", () => {
    const stdout: string = "a@#@b@#@c";
    const stderr: string[] = [
      "error1",
      "error2",
      "error3",
    ];

    let error: Error | undefined;
    let result: IWorkspaceInfo | undefined;
    let outputLines: string[];

    before(async () => {
      const parser: ICmParser<IWorkspaceInfo> = new GetWorkspaceFromPathParser();
      parser.readLineOut(stdout);
      stderr.forEach(line => parser.readLineErr(line));

      result = await parser.parse();
      error = parser.getError();
      outputLines = parser.getOutputLines();
    });

    it("produces a result object", () => {
      expect(result).to.be.not.undefined;
    });

    it("parses the ID correctly", () => {
      expect(result!.id).to.be.equal("a");
    });

    it("parses the name correctly", () => {
      expect(result!.name).to.be.equal("b");
    });

    it("parses the path correctly", () => {
      expect(result!.path).to.be.equal("c");
    });

    it("holds the output correctly", () => {
      expect(outputLines).to.eql([stdout, ...stderr]);
    });

    it("produces an error object", () => {
      expect(error).to.be.not.undefined;
    });

    it("has the appropriate error message", () => {
      expect(error!.message).to.be.equal(stderr.join(os.EOL));
    });
  });
});
