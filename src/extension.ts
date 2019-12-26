import { Disposable, ExtensionContext, OutputChannel, window } from "vscode";
import { Configuration } from "./configuration";
import { PlasticScm } from "./plasticScm";

let plasticScm: PlasticScm;

export function activate(context: ExtensionContext) {
  Configuration.configureEvents(context);
  const plasticScmChannel: OutputChannel = window.createOutputChannel("Plastic SCM");
  plasticScm = new PlasticScm(plasticScmChannel);

  context.subscriptions.push(Disposable.from(
    plasticScmChannel, plasticScm));

  plasticScm.initialize();
}

// No available actions in deactivate yet
// tslint:disable-next-line: no-empty
export async function deactivate(): Promise<any> {
  await plasticScm.stop();
}
