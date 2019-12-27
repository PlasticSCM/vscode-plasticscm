import { expect } from "chai";
import { IMock, It, Mock, MockBehavior, Times } from "typemoq";

import { OutputChannel } from "vscode";
import { CmShell, ICmParser } from "../../cmShell";

describe("CmShell", () => {
  context("not running", () => {
    const channel: IMock<OutputChannel> = Mock.ofType<OutputChannel>(
      undefined, MockBehavior.Strict);
    channel.setup(ch => ch.appendLine(It.isAnyString()));

    const parser: IMock<ICmParser<any>> = Mock.ofType<ICmParser<any>>(
      undefined, MockBehavior.Strict);

    const cmShell: CmShell = new CmShell("mydir", channel.object);

    it("shouldn't run commands", async () => {
      const result = await cmShell.exec("location", [], parser.object);
      expect(cmShell.isRunning).to.be.false;
      expect(result).to.be.not.null.and.not.undefined;
      expect(result.success).to.be.false;
      expect(result.error).to.be.not.undefined;
      expect(result.error).to.have.property("message", "Shell wasn't running");
      expect(result.result).to.be.undefined;

      channel.verify(
        ch => ch.appendLine(It.is(
          message => message.includes("unable to run command 'location'"))),
        Times.once());
      parser.verify(
        p => p.readLineErr(It.isAnyString()),
        Times.never());
    });
  });
});
