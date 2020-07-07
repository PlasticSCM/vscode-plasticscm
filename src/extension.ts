import { Disposable, ExtensionContext, OutputChannel, window } from "vscode";
import { Configuration } from "./configuration";
import { PlasticScm } from "./plasticScm";

let plasticScm: PlasticScm;

export async function activate(context: ExtensionContext): Promise<void> {
  Configuration.configureEvents(context);
  const plasticScmChannel: OutputChannel = window.createOutputChannel("Plastic SCM");
  plasticScm = new PlasticScm(plasticScmChannel);

  context.subscriptions.push(Disposable.from(
    plasticScmChannel, plasticScm));

  await plasticScm.initialize();
}

export function deactivate(): Promise<void[]> {
  return plasticScm.stop();
}
