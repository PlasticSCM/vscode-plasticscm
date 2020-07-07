import { assert, expect } from "chai";
import { IMock, It, Mock, MockBehavior, Times } from "typemoq";
import { GetWorkspaceFromPath } from "../../../../../cm/commands";
import { ICmParser, ICmShell } from "../../../../../cm/shell";
import { IWorkspaceInfo } from "../../../../../models";

describe("GetWorkspaceFromPath Command", () => {
  context("When the command runs successfully", () => {
    context("When output is correct", () => {
      const cmShellMock: IMock<ICmShell> = Mock.ofType<ICmShell>(undefined, MockBehavior.Strict);
      let cmdResult: IWorkspaceInfo | undefined;

      cmShellMock
        .setup(mock => mock.exec(
          It.isAnyString(),
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

      before(async () => {
        cmdResult = await GetWorkspaceFromPath.run(
          "/foo/bar", cmShellMock.object);
      });

      it("produces a result", () => {
        expect(cmdResult).to.be.not.undefined;
      });

      it("contains the correct workspace path", () => {
        expect(cmdResult!.path).to.be.equal("/path/to/wk");
      });

      it("contains the correct workspace name", () => {
        expect(cmdResult!.name).to.be.equal("wkname");
      });

      it("contains the correct workspace ID", () => {
        expect(cmdResult!.id).to.be.string("95b0a429-7d9c-48af-8b5b-6f1ced257b20");
      });

      it("calls the expected shell methods", () => {
        cmShellMock.verify(
          mock => mock.exec(It.isAny(), It.isAny(), It.isAny()),
          Times.once());
      });
    });

    context("When output is incorrect", () => {
      const cmShellMock = Mock.ofType<ICmShell>(undefined, MockBehavior.Strict);
      let error: Error | undefined;

      cmShellMock
      .setup(mock => mock.exec(
          It.isAnyString(),
          It.is(args => true),
          It.is<ICmParser<IWorkspaceInfo | undefined>>(parser => true)))
        .returns(() => Promise.resolve({
          error: new Error("Sample error"),
          success: true,
        }));

      before(async () => {
        try {
          await GetWorkspaceFromPath.run("/foo/bar", cmShellMock.object);
        } catch (e) {
          error = e;
        }
      });

      it("produces the expected error", () => {
        expect(error).to.be.not.undefined;
        expect(error!.message).to.equal("Sample error");
      });

      it("calls the expected shell methods", () => {
        cmShellMock.verify(
          mock => mock.exec(It.isAny(), It.isAny(), It.isAny()),
          Times.once());
      });
    });
  });

  context("When the command fails", () => {
    const cmShellMock = Mock.ofType<ICmShell>(undefined, MockBehavior.Strict);
    let error: Error | undefined;

    cmShellMock
      .setup(mock => mock.exec(
        It.isAnyString(),
        It.is(args => true),
        It.is<ICmParser<IWorkspaceInfo>>(parser => true)))
      .returns(() => Promise.resolve({
        error: new Error("Sample error"),
        success: false,
      }));

    before(async () => {
      try {
        await GetWorkspaceFromPath.run("/foo/bar", cmShellMock.object);
      } catch (e) {
        error = e;
      }
    });

    it("produces the expected error", () => {
        expect(error).to.be.not.undefined;
        expect(error!.message).to.equal("Command failed: Sample error");
    });

    it("calls the expected shell methods", async () => {
      cmShellMock.verify(
        mock => mock.exec(It.isAny(), It.isAny(), It.isAny()),
        Times.once());
    });
  });
});
