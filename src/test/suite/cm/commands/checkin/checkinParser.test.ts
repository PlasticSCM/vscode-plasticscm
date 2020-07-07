import { expect } from "chai";
import * as os from "os";
import { CheckinParser } from "../../../../../cm/commands/checkin/checkinParser";
import { ICmParser } from "../../../../../cm/shell";
import { ICheckinChangeset } from "../../../../../models";

describe("Checkin Parser", () => {
  const toSpec: (cset: ICheckinChangeset) => string = cset =>
    `cs:${cset.changesetInfo.changesetId}@br:${cset.changesetInfo.branch}@`
    + `${cset.changesetInfo.repository}@${cset.changesetInfo.server} (mount:'${cset.mountPath}')`;

  context("When there is no input", () => {
    let error: Error | undefined;
    let result: ICheckinChangeset[] | undefined;
    let outputLines: string[];

    before(async () => {
      const parser: ICmParser<ICheckinChangeset[]> = new CheckinParser();

      result = await parser.parse();
      error = parser.getError();
      outputLines = parser.getOutputLines();
    });

    it("produces an empty array as result", () => {
      expect(result).to.be.not.undefined;
      expect(result).to.be.eql([]);
    });

    it("holds the output correctly", () => {
      expect(outputLines).to.eql([]);
    });

    it("doesn't produce any error", () => {
      expect(error).to.be.undefined;
    });
  });

  context("When the CHANGESET line is missing", () => {
    const stdout = [
      `STAGE${CheckinParser.SEPARATOR}`,
      `CO${CheckinParser.SEPARATOR}c:\\Users\\miguel\\wkspaces\\wk1\\foo.c`,
      `CO${CheckinParser.SEPARATOR}c:\\Users\\miguel\\wkspaces\\wk1\\bar.c`,
    ];

    let error: Error | undefined;
    let result: ICheckinChangeset[] | undefined;
    let outputLines: string[];

    before(async () => {
      const parser: ICmParser<ICheckinChangeset[]> = new CheckinParser();
      stdout.forEach(line => parser.readLineOut(line));

      result = await parser.parse();
      error = parser.getError();
      outputLines = parser.getOutputLines();
    });

    it("produces an empty array as result", () => {
      expect(result).to.be.not.undefined;
      expect(result).to.eql([]);
    });

    it("holds the output correctly", () => {
      expect(outputLines).to.eql(stdout);
    });

    it("doesn't produce any error", () => {
      expect(error).to.be.undefined;
    });
  });

  context("When there's only one resulting changeset", () => {
    const csets: ICheckinChangeset[] = [
      {
        changesetInfo: {
          branch: "/main/scm001",
          changesetId: 503,
          repository: "root",
          server: "localhost:8084",
        },
        mountPath: "/",
      },
    ];

    const stdout = [
      `STAGE${CheckinParser.SEPARATOR}`,
      `CO${CheckinParser.SEPARATOR}c:\\Users\\miguel\\wkspaces\\wk1\\foo.c`,
      `CO${CheckinParser.SEPARATOR}c:\\Users\\miguel\\wkspaces\\wk1\\bar.c`,
      `CHANGESET${CheckinParser.SEPARATOR}${toSpec(csets[0])}`,
    ];

    let error: Error | undefined;
    let result: ICheckinChangeset[] | undefined;
    let outputLines: string[];

    before(async () => {
      const parser: ICmParser<ICheckinChangeset[]> = new CheckinParser();
      stdout.forEach(line => parser.readLineOut(line));

      result = await parser.parse();
      error = parser.getError();
      outputLines = parser.getOutputLines();
    });

    it("The result array the expected results", () => {
      expect(result).to.be.not.undefined;
      expect(result).to.eql(csets);
    });

    it("holds the output correctly", () => {
      expect(outputLines).to.eql(stdout);
    });

    it("doesn't produce any error", () => {
      expect(error).to.be.undefined;
    });
  });

  context("When there are multiple resulting changesets", () => {
    const csets: ICheckinChangeset[] = [
      {
        changesetInfo: {
          branch: "/main/scm001",
          changesetId: 503,
          repository: "root",
          server: "localhost:8084",
        },
        mountPath: "/",
      },
      {
        changesetInfo: {
          branch: "/main/scm002",
          changesetId: 18,
          repository: "xlink1",
          server: "localhost:8084",
        },
        mountPath: "/xlink1",
      },
      {
        changesetInfo: {
          branch: "/main/scm003",
          changesetId: 32,
          repository: "xlink2",
          server: "localhost:8084",
        },
        mountPath: "/xlink2",
      },
    ];

    const stdout = [
      `STAGE${CheckinParser.SEPARATOR}`,
      `CO${CheckinParser.SEPARATOR}c:\\Users\\miguel\\wkspaces\\wk1\\foo.c`,
      `CO${CheckinParser.SEPARATOR}c:\\Users\\miguel\\wkspaces\\wk1\\bar.c`,
      `CHANGESET${CheckinParser.SEPARATOR}${[csets[1], csets[2], csets[0]].map(toSpec).join(",")}`,
    ];

    let error: Error | undefined;
    let result: ICheckinChangeset[] | undefined;
    let outputLines: string[];

    before(async () => {
      const parser: ICmParser<ICheckinChangeset[]> = new CheckinParser();
      stdout.forEach(line => parser.readLineOut(line));

      result = await parser.parse();
      error = parser.getError();
      outputLines = parser.getOutputLines();
    });

    it("The result array the expected results", () => {
      expect(result).to.be.not.undefined;
      expect(result).to.eql(csets);
    });

    it("holds the output correctly", () => {
      expect(outputLines).to.eql(stdout);
    });

    it("doesn't produce any error", () => {
      expect(error).to.be.undefined;
    });
  });

  context("When there are error lines", () => {
    const stderr: string[] = [
      "error1",
      "error2",
      "error3",
    ];

    let error: Error | undefined;
    let result: ICheckinChangeset[] | undefined;
    let outputLines: string[];

    before(async () => {
      const parser: ICmParser<ICheckinChangeset[]> = new CheckinParser();
      stderr.forEach(line => parser.readLineErr(line));

      result = await parser.parse();
      error = parser.getError();
      outputLines = parser.getOutputLines();
    });

    it("produces an empty array as result", () => {
      expect(result).to.be.not.undefined;
      expect(result).to.eql([]);
    });

    it("holds the output correctly", () => {
      expect(outputLines).to.eql(stderr);
    });

    it("produces an error object", () => {
      expect(error).to.be.not.undefined;
    });

    it("has the appropriate error message", () => {
      expect(error!.message).to.be.equal(stderr.join(os.EOL));
    });
  });
});
