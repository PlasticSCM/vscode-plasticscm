import { expect } from "chai";
import { IMock, It, Mock, MockBehavior, Times } from "typemoq";
import { Uri } from "vscode";
import { Status } from "../../../../../cm/commands";
import { ICmParser, ICmShell } from "../../../../../cm/shell";
import { ChangeType, IChangeInfo, IPendingChanges, WkConfigType } from "../../../../../models";

describe("Status command", () => {
  context("When the command runs successfully", () => {
    context("When output is correct", () => {
      const cmShellMock: IMock<ICmShell> = Mock.ofType<ICmShell>(undefined, MockBehavior.Strict);
      const result: IPendingChanges = {
        changes: new Map<string, IChangeInfo>([
          [
            "/foo.c", {
              path: Uri.file("/foo.c"),
              type: ChangeType.Changed,
            },
          ],
        ]),
        workspaceConfig: {
          configType: WkConfigType.Branch,
          location: "/main/task001",
          repSpec: "repo@server:8087",
        },
      };

      let cmdResult: IPendingChanges;

      cmShellMock
        .setup(mock => mock.exec(
          It.isAnyString(),
          It.is(args => true),
          It.is<ICmParser<IPendingChanges>>(parser => true)))
        .returns(() => Promise.resolve({
          result,
          success: true,
        }));

      before(async () => {
        cmdResult = await Status.run("/path/to/wk", cmShellMock.object);
      });

      it("produces a result", () => {
        expect(cmdResult).to.be.not.undefined;
      });

      it("has the correct result", () => {
        expect(cmdResult).to.eql(result);
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
          It.is<ICmParser<IPendingChanges>>(parser => true)))
        .returns(() => Promise.resolve({
          error: new Error("Sample error"),
          success: true,
        }));

      before(async () => {
        try {
          await Status.run("/path/to/wk", cmShellMock.object);
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
        It.is<ICmParser<IPendingChanges>>(parser => true)))
      .returns(() => Promise.resolve({
        error: new Error("Sample error"),
        success: false,
      }));

    before(async () => {
      try {
          await Status.run("/path/to/wk", cmShellMock.object);
      } catch (e) {
        error = e;
      }
    });

    it("produces the expected error", () => {
        expect(error).to.be.not.undefined;
        expect(error!.message).to.equal("Command execution failed.");
    });

    it("calls the expected shell methods", async () => {
      cmShellMock.verify(
        mock => mock.exec(It.isAny(), It.isAny(), It.isAny()),
        Times.once());
    });
  });
});
