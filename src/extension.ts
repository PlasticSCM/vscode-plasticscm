import { PlasticScm } from './plasticScm';
import { OutputChannel, ExtensionContext, window, Disposable } from 'vscode';

export function activate(context: ExtensionContext) {
  const plasticScmChannel: OutputChannel = window.createOutputChannel('Plastic SCM');

  context.subscriptions.push(Disposable.from(
    plasticScmChannel, new PlasticScm(plasticScmChannel)));
}

export function deactivate() {}
