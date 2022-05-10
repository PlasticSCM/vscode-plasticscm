import { ICmParser, ICmShell } from "../../../../../cm/shell";
import { IMock, It, Mock, MockBehavior, Times } from "typemoq";
import { Checkin } from "../../../../../cm/commands";
import { expect } from "chai";
import { ICheckinChangeset } from "../../../../../models";
import { OutputChannel } from "vscode";

describe("Checkin Command", () => {
  context("When the command runs successfully", () => {
    context("When output is correct", () => {
      const cmShellMock: IMock<ICmShell> = Mock.ofType<ICmShell>(undefined, MockBehavior.Strict);
      const channelMock: IMock<OutputChannel> = Mock.ofType<OutputChannel>();
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
          It.is(() => true),
          It.is<ICmParser<ICheckinChangeset[]>>(() => true)))
        .returns(() => Promise.resolve({
          result,
          success: true,
        }));

      before(async () => {
        cmdResult = await Checkin.run(
          cmShellMock.object,
          channelMock.object,
          "ci message",
          "/path/to/wk/foo.c",
          "/path/to/wk/bar.c");
      });

      it("produces a result", () => {
        expect(cmdResult).to.be.not.undefined;
      });

      it("has the correct result", () => {
        expect(cmdResult).to.eql(result);
      });

      it("calls the expected shell methods", () => {
        cmShellMock.verify(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          mock => mock.exec(It.isAny(), It.isAny(), It.isAny()),
          Times.once());
      });
    });

    context("When output is incorrect", () => {
      const cmShellMock = Mock.ofType<ICmShell>(undefined, MockBehavior.Strict);
      const channelMock: IMock<OutputChannel> = Mock.ofType<OutputChannel>();
      let error: Error | undefined;

      cmShellMock
        .setup(mock => mock.exec(
          It.isAnyString(),
          It.is(() => true),
          It.is<ICmParser<ICheckinChangeset[]>>(() => true)))
        .returns(() => Promise.resolve({
          error: new Error("Sample error"),
          success: true,
        }));

      before(async () => {
        try {
          await Checkin.run(
            cmShellMock.object,
            channelMock.object,
            "ci message",
            "/path/to/wk/foo.c",
            "/path/to/wk/bar.c");
        } catch (e) {
          error = e as Error;
        }
      });

      it("produces the expected error", () => {
        expect(error).to.be.not.undefined;
        expect(error!.message).to.equal("Sample error");
      });

      it("calls the expected shell methods", () => {
        cmShellMock.verify(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          mock => mock.exec(It.isAny(), It.isAny(), It.isAny()),
          Times.once());
      });
    });
  });

  context("When the command fails", () => {
    const cmShellMock = Mock.ofType<ICmShell>(undefined, MockBehavior.Strict);
    const channelMock: IMock<OutputChannel> = Mock.ofType<OutputChannel>();
    let error: Error | undefined;

    cmShellMock
      .setup(mock => mock.exec(
        It.isAnyString(),
        It.is(() => true),
        It.is<ICmParser<ICheckinChangeset[]>>(() => true)))
      .returns(() => Promise.resolve({
        error: new Error("Sample error"),
        success: false,
      }));

    before(async () => {
      try {
        await Checkin.run(
          cmShellMock.object,
          channelMock.object,
          "ci message",
          "/path/to/wk/foo.c",
          "/path/to/wk/bar.c");
      } catch (e) {
        error = e as Error;
      }
    });

    it("produces the expected error", () => {
      expect(error).to.be.not.undefined;
      expect(error!.message).to.equal("Sample error");
    });

    it("calls the expected shell methods", () => {
      cmShellMock.verify(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        mock => mock.exec(It.isAny(), It.isAny(), It.isAny()),
        Times.once());
    });
  });
});
