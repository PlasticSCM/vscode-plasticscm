import { expect } from 'chai';
import * as sinon from 'sinon';

import { CmShell, ICmdParser } from '../../cmShell';
import { OutputChannel } from 'vscode';

describe('CmShell', () => {
  context("Shell isn't running", () => {
    const channel = sinon.createStubInstance<OutputChannel>(
      () => {});
    const parser = sinon.createStubInstance<ICmdParser<any>>(() => {});
    const cmShell: CmShell = new CmShell('mydir', <OutputChannel>channel);

    it("shouldn't run anything if shell isn't running", () => {
      cmShell.exec('location', [], <ICmdParser<any>>parser)
      expect(cmShell.isRunning).to.be.false;
      expect(channel.appendLine.calledOnce).to.be.true;
      expect(parser.readLineErr.notCalled).to.be.true;
    });
  });
});
