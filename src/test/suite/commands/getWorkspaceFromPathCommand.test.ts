import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { GetWorkspaceFromPath, GetWorkspaceFromPathResult } from '../../../commands/getWorkspaceFromPath';
import { CmShellMock } from './cmShellMock';

chai.use(chaiAsPromised);

describe('GetWorkspaceFromPathCommand', () => {
  context('command successfully executed', () => {
    it("parses a well-formed output", async () => {
      const outputLines: string[] = ['wkname\t/path/to/wk\t95b0a429-7d9c-48af-8b5b-6f1ced257b20'];
      const cmShellMock: CmShellMock = new CmShellMock(outputLines, [], true);

      const cmdResult: GetWorkspaceFromPathResult | undefined =
        await GetWorkspaceFromPath.run('/foo/bar', cmShellMock);

      chai.expect(cmdResult).to.not.be.undefined;

      if (!cmdResult)
        return;

      chai.expect(cmdResult.path).to.be.string(
        '/path/to/wk', 'Wrong workspace path');
      chai.expect(cmdResult.name).to.be.string(
        'wkname', 'Wrong workspace name');
      chai.expect(cmdResult.id).to.be.string(
        '95b0a429-7d9c-48af-8b5b-6f1ced257b20', 'Wrong workspace id');
    });

    it("parses a non-well-formed output", async () => {
      const outputLines: string[] = ['wkname\t/path/to/wk'];
      const cmShellMock: CmShellMock = new CmShellMock(outputLines, [], true);

      const cmdResult: GetWorkspaceFromPathResult | undefined =
        await GetWorkspaceFromPath.run('/foo/bar', cmShellMock);

      chai.expect(cmdResult).to.be.undefined;
    });
  });

  context('error occured', () => {
    it("displays error from output stream", async () => {
      const errorMessage = '/foo/bar is not in a workspace.';
      const outputLines: string[] = [errorMessage];
      const cmShellMock: CmShellMock = new CmShellMock(outputLines, [], false);

      const result : Promise<GetWorkspaceFromPathResult | undefined> =
        GetWorkspaceFromPath.run('/foo/bar', cmShellMock);

      await chai.expect(result).to.be.rejectedWith(
        errorMessage, 'Wrong error message');
    });

    it("displays error from error stream", async () => {
      const errorMessage = 'Unexpected error notified through the error stream.';
      const errorLines: string[] = [errorMessage];
      const cmShellMock: CmShellMock = new CmShellMock([], errorLines, false);

      const result : Promise<GetWorkspaceFromPathResult | undefined> =
        GetWorkspaceFromPath.run('/foo/bar', cmShellMock);

      await chai.expect(result).to.be.rejectedWith(
        errorMessage, 'Wrong error message');
    });
  });
});
