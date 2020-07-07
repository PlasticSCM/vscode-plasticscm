import * as os from "os";
import { IPendingChanges, WkConfigType } from "../../../../../models";
import { ChangeType } from "../../../../../models/changeInfo";
import { expect } from "chai";
import { ICmParser } from "../../../../../cm/shell";
import { StatusParser } from "../../../../../cm/commands/status/statusParser";

describe("Status Parser", () => {
  context("When there is no input", () => {
    let error: Error | undefined;
    let result: IPendingChanges | undefined;
    let outputLines: string[];

    before(async () => {
      const parser: ICmParser<IPendingChanges> = new StatusParser();

      result = await parser.parse();
      error = parser.getError();
      outputLines = parser.getOutputLines();
    });

    it("produces an undefined result", () => {
      expect(result).to.be.undefined;
    });

    it("holds the output correctly", () => {
      expect(outputLines).to.eql([]);
    });

    it("XML parser fails", () => {
      expect(error).to.be.not.undefined;
    });
  });

  context("When there aren't any changes", () => {
    const stdout: string[] = [
      "<?xml version=\"1.0\" encoding=\"utf-8\"?>",
      "<StatusOutput>",
      "  <WorkspaceStatus>",
      "    <Status>",
      "      <RepSpec>",
      "        <Server>codice@cloud</Server>",
      "        <Name>codice</Name>",
      "      </RepSpec>",
      "      <Changeset>175175</Changeset>",
      "    </Status>",
      "  </WorkspaceStatus>",
      "  <WkConfigType>Branch</WkConfigType>",
      "  <WkConfigName>/main/scm26979@codice@codice@cloud</WkConfigName>",
      "</StatusOutput>",
    ];

    let error: Error | undefined;
    let result: IPendingChanges | undefined;
    let outputLines: string[];

    before(async () => {
      const parser: ICmParser<IPendingChanges> = new StatusParser();
      stdout.forEach(line => parser.readLineOut(line));

      result = await parser.parse();
      error = parser.getError();
      outputLines = parser.getOutputLines();
    });

    it("produces a result object", () => {
      expect(result).to.be.not.undefined;
    });

    it("contains the correct workspace info", () => {
      expect(result!.workspaceConfig).to.be.not.undefined;
      expect(result!.workspaceConfig.configType).to.be.eql(WkConfigType.Branch);
      expect(result!.workspaceConfig.location).to.be.eql("/main/scm26979");
      expect(result!.workspaceConfig.repSpec).to.be.eql("codice@codice@cloud");
    });

    it("doesn't contain any changes", () => {
      expect(result!.changes).to.be.not.undefined;
      expect(result!.changes.size).to.eql(0);
    });

    it("holds the output correctly", () => {
      expect(outputLines).to.eql(stdout);
    });

    it("doesn't produce any error", () => {
      expect(error).to.be.undefined;
    });
  });

  context("When there are three changes", () => {
    const stdout: string[] = [
      "<?xml version=\"1.0\" encoding=\"utf-8\"?>",
      "<StatusOutput>",
      "  <WorkspaceStatus>",
      "    <Status>",
      "      <RepSpec>",
      "        <Server>codice@cloud</Server>",
      "        <Name>codice</Name>",
      "      </RepSpec>",
      "      <Changeset>175175</Changeset>",
      "    </Status>",
      "  </WorkspaceStatus>",
      "  <WkConfigType>Branch</WkConfigType>",
      "  <WkConfigName>/main/scm26979@codice@codice@cloud</WkConfigName>",
      "  <Changes>",
      "    <Change>",
      "      <Type>CH</Type>",
      "      <TypeVerbose>Changed</TypeVerbose>",
      "      <Path>01plastic\\build\\server\\default.build</Path>",
      "      <OldPath />",
      "      <PrintableMovedPath />",
      "      <MergesInfo />",
      "      <SimilarityPerUnit>0</SimilarityPerUnit>",
      "      <Similarity />",
      "      <Size>214142</Size>",
      "      <PrintableSize>209.12 KB</PrintableSize>",
      "      <PrintableLastModified>17 seconds ago</PrintableLastModified>",
      "      <RevisionType>enTextFile</RevisionType>",
      "      <LastModified>2020-07-03T16:40:39+02:00</LastModified>",
      "    </Change>",
      "    <Change>",
      "      <Type>MV</Type>",
      "      <TypeVerbose>Moved</TypeVerbose>",
      "      <Path>01plastic\\build\\server\\nant.old.sh</Path>",
      "      <OldPath>01plastic\\build\\server\\nant.sh</OldPath>",
      "      <PrintableMovedPath>01plastic\\build\\server\\nant.sh -&gt; " +
        "01plastic\\build\\server\\nant.old.sh</PrintableMovedPath>",
      "      <MergesInfo />",
      "      <SimilarityPerUnit>1</SimilarityPerUnit>",
      "      <Similarity />",
      "      <Size>367</Size>",
      "      <PrintableSize>367 bytes</PrintableSize>",
      "      <PrintableLastModified />",
      "      <RevisionType>enTextFile</RevisionType>",
      "      <LastModified>0001-01-01T00:00:00</LastModified>",
      "    </Change>",
      "    <Change>",
      "      <Type>AD</Type>",
      "      <TypeVerbose>Added</TypeVerbose>",
      "      <Path>01plastic\\build\\server\\versionDefinition.json</Path>",
      "      <OldPath />",
      "      <PrintableMovedPath />",
      "      <MergesInfo />",
      "      <SimilarityPerUnit>0</SimilarityPerUnit>",
      "      <Similarity />",
      "      <Size>3</Size>",
      "      <PrintableSize>3 bytes</PrintableSize>",
      "      <PrintableLastModified>9 seconds ago</PrintableLastModified>",
      "      <RevisionType>enTextFile</RevisionType>",
      "      <LastModified>2020-07-03T16:40:48+02:00</LastModified>",
      "    </Change>",
      "  </Changes>",
      "</StatusOutput>",
    ];

    let error: Error | undefined;
    let result: IPendingChanges | undefined;
    let outputLines: string[];

    before(async () => {
      const parser: ICmParser<IPendingChanges> = new StatusParser();
      stdout.forEach(line => parser.readLineOut(line));

      result = await parser.parse();
      error = parser.getError();
      outputLines = parser.getOutputLines();
    });

    it("produces a result object", () => {
      expect(result).to.be.not.undefined;
    });

    it("contains the correct workspace info", () => {
      expect(result!.workspaceConfig).to.be.not.undefined;
      expect(result!.workspaceConfig.configType).to.be.eql(WkConfigType.Branch);
      expect(result!.workspaceConfig.location).to.be.eql("/main/scm26979");
      expect(result!.workspaceConfig.repSpec).to.be.eql("codice@codice@cloud");
    });

    it("contains 3 changes", () => {
      expect(result!.changes).to.be.not.undefined;
      expect(result!.changes.size).to.eql(3);
    });

    it("contains an added item", () => {
      const added = result!.changes.get("/01plastic/build/server/versionDefinition.json");
      expect(added).to.be.not.undefined;
      expect(added!.oldPath).to.be.undefined;
      expect(added!.path.path).to.be.eql("/01plastic/build/server/versionDefinition.json");
      expect(added!.type).to.be.eql(ChangeType.Added);
    });

    it("contains a moved item", () => {
      const added = result!.changes.get("/01plastic/build/server/nant.old.sh");
      expect(added).to.be.not.undefined;
      expect(added!.oldPath).to.be.not.undefined;
      expect(added!.oldPath!.path).to.be.eql("/01plastic/build/server/nant.sh");
      expect(added!.path.path).to.be.eql("/01plastic/build/server/nant.old.sh");
      expect(added!.type).to.be.eql(ChangeType.Moved);
    });

    it("contains a locally changed item", () => {
      const added = result!.changes.get("/01plastic/build/server/default.build");
      expect(added).to.be.not.undefined;
      expect(added!.oldPath).to.be.undefined;
      expect(added!.path.path).to.be.eql("/01plastic/build/server/default.build");
      expect(added!.type).to.be.eql(ChangeType.Changed);
    });

    it("holds the output correctly", () => {
      expect(outputLines).to.eql(stdout);
    });

    it("doesn't produce any error", () => {
      expect(error).to.be.undefined;
    });
  });

  context("When there are error lines", () => {
    const stdout: string[] = [
      "<?xml version=\"1.0\" encoding=\"utf-8\"?>",
      "<StatusOutput>",
      "  <WorkspaceStatus>",
      "    <Status>",
      "      <RepSpec>",
      "        <Server>codice@cloud</Server>",
      "        <Name>codice</Name>",
      "      </RepSpec>",
      "      <Changeset>175175</Changeset>",
      "    </Status>",
      "  </WorkspaceStatus>",
      "  <WkConfigType>Branch</WkConfigType>",
      "  <WkConfigName>/main/scm26979@codice@codice@cloud</WkConfigName>",
      "</StatusOutput>",
    ];
    const stderr: string[] = [
      "error1",
      "error2",
      "error3",
    ];

    let error: Error | undefined;
    let result: IPendingChanges | undefined;
    let outputLines: string[];

    before(async () => {
      const parser: ICmParser<IPendingChanges> = new StatusParser();
      stdout.forEach(line => parser.readLineOut(line));
      stderr.forEach(line => parser.readLineErr(line));

      result = await parser.parse();
      error = parser.getError();
      outputLines = parser.getOutputLines();
    });

    it("produces a non-undefined result", () => {
      expect(result).to.be.not.undefined;
    });

    it("holds the output correctly", () => {
      expect(outputLines).to.eql(stdout.concat(stderr));
    });

    it("produces an error object", () => {
      expect(error).to.be.not.undefined;
    });

    it("has the appropriate error message", () => {
      expect(error!.message).to.be.equal(stderr.join(os.EOL));
    });
  });
});
