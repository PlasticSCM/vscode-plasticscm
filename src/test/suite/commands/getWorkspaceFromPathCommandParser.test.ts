import { expect } from "chai";
import * as os from "os";
import { ICmParser } from "../../../cmShell";
import { GetWorkspaceFromPathParser } from "../../../commands/getWorkspaceFromPath/getWorkspaceFromPathParser";
import { IWorkspaceInfo } from "../../../models";

describe("GetWorkspaceFromPath Parser", () => {
  it("receives correct input", async () => {
    const parser: ICmParser<IWorkspaceInfo> = new GetWorkspaceFromPathParser();
    const line: string = "a@#@b@#@c";
    parser.readLineOut(line);

    const result: IWorkspaceInfo | undefined = parser.parse();
    expect(result).to.be.not.undefined;
    expect(result!.id).to.be.equal("a");
    expect(result!.name).to.be.equal("b");
    expect(result!.path).to.be.equal("c");
    expect(parser.getError()).to.be.undefined;
    expect(parser.getOutputLines()).to.eql([line]);
  });

  it("receives empty leading and trailing lines", async () => {
    const parser: ICmParser<IWorkspaceInfo> = new GetWorkspaceFromPathParser();
    const stdout: string[] = [
      "",
      "",
      "a@#@b@#@c",
      "",
    ];

    stdout.forEach(line => parser.readLineOut(line));

    expect(parser.getOutputLines()).to.eql(stdout);

    const result: IWorkspaceInfo | undefined = parser.parse();
    expect(result).to.be.not.undefined;
    expect(result!.id).to.be.equal("a");
    expect(result!.name).to.be.equal("b");
    expect(result!.path).to.be.equal("c");
    expect(parser.getError()).to.be.undefined;
  });

  it("receives multiple lines with text", async () => {
    const parser: ICmParser<IWorkspaceInfo> = new GetWorkspaceFromPathParser();
    const stdout: string[] = [
      "a@#@b@#@c",
      "this shouldn't be here",
    ];

    stdout.forEach(line => parser.readLineOut(line));

    expect(parser.getOutputLines()).to.eql(stdout);
    expect(parser.parse()).to.be.undefined;

    const error: Error | undefined = parser.getError();
    expect(error).to.be.not.undefined;
    expect(error!.message).to.be.equal(["Unexpected output:", ...stdout].join(os.EOL));
  });

  it("receives line with parsing errors", async () => {
    const parser: ICmParser<IWorkspaceInfo> = new GetWorkspaceFromPathParser();
    const line: string = "a@#@b";
    parser.readLineOut(line);

    expect(parser.getOutputLines()).to.eql([line]);
    expect(parser.parse()).to.be.undefined;

    const error: Error | undefined = parser.getError();
    expect(error).to.be.not.undefined;
    expect(error!.message).to.be.equal(["Parsing failed:", "a@#@b"].join(os.EOL));
  });

  it("receives stderr lines", () => {
    const parser: ICmParser<IWorkspaceInfo> = new GetWorkspaceFromPathParser();

    const stdout: string = "a@#@b@#@c";
    const stderr: string[] = [
      "error1",
      "error2",
      "error3",
    ];

    parser.readLineOut(stdout);
    stderr.forEach(line => parser.readLineErr(line));

    expect(parser.getOutputLines()).to.eql([stdout, ...stderr]);

    const result: IWorkspaceInfo | undefined = parser.parse();
    expect(result).to.be.not.undefined;
    expect(result!.id).to.be.equal("a");
    expect(result!.name).to.be.equal("b");
    expect(result!.path).to.be.equal("c");

    const error: Error | undefined = parser.getError();
    expect(error).to.be.not.undefined;
    expect(error!.message).to.be.equal(stderr.join(os.EOL));
  });
});
