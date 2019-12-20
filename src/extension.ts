import { PlasticScm } from './plasticScm';
import { OutputChannel, ExtensionContext, window, Disposable } from 'vscode';
import { Configuration, configuration } from './configuration';

export function activate(context: ExtensionContext) {
  Configuration.configureEvents(context);
  const plasticScmChannel: OutputChannel = window.createOutputChannel('Plastic SCM');

  context.subscriptions.push(Disposable.from(
    plasticScmChannel, new PlasticScm(plasticScmChannel)));
}

export function deactivate() {}
