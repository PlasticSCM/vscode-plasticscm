import { expect } from "chai";
import { IMock, It, Mock, MockBehavior, Times } from "typemoq";
import { Checkin } from "../../../../../cm/commands";
import { ICmParser, ICmShell } from "../../../../../cm/shell";
import { ICheckinChangeset } from "../../../../../models";

describe("Checkin Command", () => {
  context("When the command runs successfully", () => {
    context("When output is correct", () => {
      const cmShellMock: IMock<ICmShell> = Mock.ofType<ICmShell>(undefined, MockBehavior.Strict);
      const result: ICheckinChangeset[] = [
        {
          changesetInfo: {
            branch: "wkname",
            changesetId: 20,
            repository: "/path/to/wk",
            server: "",
          },
          mountPath: "",
        },
      ];

      let cmdResult: ICheckinChangeset[];

      cmShellMock
        .setup(mock => mock.exec(
          It.isAnyString(),
          It.is(args => true),
          It.is<ICmParser<ICheckinChangeset[]>>(parser => true)))
        .returns(() => Promise.resolve({
          result,
          success: true,
        }));

      before(async () => {
        cmdResult = await Checkin.run(
          cmShellMock.object, "ci message", "/path/to/wk/foo.c", "/path/to/wk/bar.c");
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
          It.is<ICmParser<ICheckinChangeset[]>>(parser => true)))
        .returns(() => Promise.resolve({
          error: new Error("Sample error"),
          success: true,
        }));

      before(async () => {
        try {
          await Checkin.run(
            cmShellMock.object, "ci message", "/path/to/wk/foo.c", "/path/to/wk/bar.c");
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
        It.is<ICmParser<ICheckinChangeset[]>>(parser => true)))
      .returns(() => Promise.resolve({
        error: new Error("Sample error"),
        success: false,
      }));

    before(async () => {
      try {
        await Checkin.run(
          cmShellMock.object, "ci message", "/path/to/wk/foo.c", "/path/to/wk/bar.c");
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
