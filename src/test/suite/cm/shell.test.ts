import { CmShell, ICmParser } from "../../../cm/shell";
import { IMock, It, Mock, MockBehavior, Times } from "typemoq";

import { expect } from "chai";
import { fail } from "assert";
import { OutputChannel } from "vscode";

describe("CmShell", () => {
  context("When shell isn't running", () => {
    const channel: IMock<OutputChannel> = Mock.ofType<OutputChannel>(
      undefined, MockBehavior.Strict);

    const parser: IMock<ICmParser<any>> = Mock.ofType<ICmParser<any>>(
      undefined, MockBehavior.Strict);

    let cmShell: CmShell;
    let response: any;

    channel.setup(ch => ch.appendLine(It.isAnyString()));

    before(async () => {
      cmShell = new CmShell(
        "mydir",
        channel.object,
        {
          cmPath: "cm",
          millisToStop: 5000,
          millisToWaitUntilUp: 5000,
        });
      response = await cmShell.exec("location", [], parser.object);
    });

    after(() => {
      if (cmShell) {
        cmShell.dispose();
      }
    });

    it("isn't running (duh)", () => {
      expect(cmShell.isRunning).to.be.false;
    });

    it("produced a response", () => {
      expect(response).to.be.not.null.and.not.undefined;
    });

    it("didn't succeed", () => {
      if (!response) {
        fail("Invalid response");
      }
      expect(response.success).to.be.false;
    });

    it("produced the expected error", () => {
      if (!response) {
        fail("Invalid response");
      }
      expect(response.error).to.be.not.undefined;
      expect(response.error.message).to.equal("Shell wasn't running");
    });

    it("didn't produce a result", () => {
      if (!response) {
        fail("Invalid response");
      }
      expect(response.result).to.be.undefined;
    });

    it("called the expected channel methods", () => {
      channel.verify(
        ch => ch.appendLine(It.is(
          message => message.includes("unable to run command 'location'"))),
        Times.once());
    });

    it("called the expected parser methods", () => {
      parser.verify(
        p => p.readLineErr(It.isAnyString()),
        Times.never());
    });
  });
});
