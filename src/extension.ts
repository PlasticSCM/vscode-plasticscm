import { PlasticScm } from './plasticScm';
import { OutputChannel, ExtensionContext, window, Disposable } from 'vscode';
import { Configuration, configuration } from './configuration';

export function activate(context: ExtensionContext) {
  Configuration.configureEvents(context);
  const plasticScmChannel: OutputChannel = window.createOutputChannel('Plastic SCM');
  const plasticScm = new PlasticScm(plasticScmChannel);

  context.subscriptions.push(Disposable.from(
    plasticScmChannel, plasticScm));

  plasticScm.initialize();
}

export function deactivate() {}
