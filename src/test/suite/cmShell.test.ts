import { expect } from 'chai';
import { IMock, Mock, MockBehavior, It, Times } from 'typemoq';

import { CmShell, ICmdParser } from '../../cmShell';
import { OutputChannel, OnTypeFormattingEditProvider } from 'vscode';

describe('CmShell', () => {
  context('not running', () => {
    const channel: IMock<OutputChannel> = Mock.ofType<OutputChannel>(
      undefined, MockBehavior.Strict);

    const parser: IMock<ICmdParser<any>> = Mock.ofType<ICmdParser<any>>(
      undefined, MockBehavior.Strict);

    const cmShell: CmShell = new CmShell('mydir', channel.object);

    it("shouldn't run commands", () => {
      cmShell.exec('location', [], parser.object)
      expect(cmShell.isRunning).to.be.false;

      channel.verify(
        ch => ch.appendLine(It.is(
          message => message.includes("unable to run command 'location'"))),
        Times.once());
      parser.verify(
        p => p.readLineErr(It.isAnyString()),
        Times.never());
    }).timeout(2000);
  });
});
