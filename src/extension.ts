import { PlasticScm } from './plasticScm';
import { OutputChannel, ExtensionContext, window, Disposable } from 'vscode';
import { Configuration, configuration } from './configuration';

export async function activate(context: ExtensionContext) {
  Configuration.configureEvents(context);
  const plasticScmChannel: OutputChannel = window.createOutputChannel('Plastic SCM');
  const plasticScm: PlasticScm = new PlasticScm(plasticScmChannel);

  await plasticScm.initialize();

  const disposables: Disposable = Disposable.from(
    plasticScmChannel,
    plasticScm);

  context.subscriptions.push(disposables);
}

export function deactivate() {}
