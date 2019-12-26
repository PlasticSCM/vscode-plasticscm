import { assert, expect } from "chai";
import { IMock, It, Mock, MockBehavior, Times } from "typemoq";
import { ICmParser, ICmShell } from "../../../cmShell";
import { GetWorkspaceFromPath } from "../../../commands";
import { IWorkspaceInfo } from "../../../models";

describe("GetWorkspaceFromPath Command", () => {
  context("Successfully executes the command", () => {
    it("receives correct output", async () => {
      const cmShellMock: IMock<ICmShell> = Mock.ofType<ICmShell>(undefined, MockBehavior.Strict);
      cmShellMock
        .setup(mock => mock.exec(
            It.is(path => path === "/foo/bar"),
            It.is(args => true),
            It.is<ICmParser<IWorkspaceInfo | undefined>>(parser => true)))
        .returns(() => Promise.resolve({
          result: {
            id: "95b0a429-7d9c-48af-8b5b-6f1ced257b20",
            name: "wkname",
            path: "/path/to/wk",
          },
          success: true,
        }));

      const cmdResult: IWorkspaceInfo | undefined =
        await GetWorkspaceFromPath.run("/foo/bar", cmShellMock.object);

      expect(cmdResult).to.be.not.undefined;
      expect(cmdResult!.path).to.be.equal("/path/to/wk");
      expect(cmdResult!.name).to.be.equal("wkname");
      expect(cmdResult!.id).to.be.string("95b0a429-7d9c-48af-8b5b-6f1ced257b20");

      cmShellMock.verify(
        mock => mock.exec(It.isAny(), It.isAny(), It.isAny()),
        Times.once());
    });

    it("receives incorrect output", async () => {
      const cmShellMock = Mock.ofType<ICmShell>(undefined, MockBehavior.Strict);
      cmShellMock
      .setup(mock => mock.exec(
          It.is(path => path === "/foo/bar"),
          It.is(args => true),
          It.is<ICmParser<IWorkspaceInfo | undefined>>(parser => true)))
        .returns(() => Promise.resolve({
          error: new Error("Sample error"),
          success: true,
        }));

      try {
        const result: IWorkspaceInfo | undefined = await GetWorkspaceFromPath.run(
          "/foo/bar", cmShellMock.object);
        assert.fail("Command should have thrown an error");
      } catch (error) {
        expect(error).to.be.not.undefined.and.property("error", "Sample error");
      }

      cmShellMock.verify(
        mock => mock.exec(It.isAny(), It.isAny(), It.isAny()),
        Times.once());
    });
  });

  context("An error occured", () => {
    it("receives an unsuccessful result", async () => {
      const cmShellMock = Mock.ofType<ICmShell>(undefined, MockBehavior.Strict);
      cmShellMock
        .setup(mock => mock.exec(
          It.is(path => path === "/foo/bar"),
          It.is(args => true),
          It.is<ICmParser<IWorkspaceInfo>>(parser => true)))
        .returns(() => Promise.resolve({
          error: new Error("Sample error"),
          success: true,
        }));

      try {
        const result: IWorkspaceInfo | undefined = await GetWorkspaceFromPath.run(
          "/foo/bar", cmShellMock.object);
        assert.fail("Command should have thrown an error");
      } catch (error) {
        expect(error).to.be.not.undefined.and.property(
          "error", "Command failed: Sample error");
      }

      cmShellMock.verify(
        mock => mock.exec(It.isAny(), It.isAny(), It.isAny()),
        Times.once());
    });
  });
});
