import { ConfigurationChangeEvent, ExtensionContext, OutputChannel, window, workspace } from "vscode";
import { extensionId } from "./constants";
import { IConfig } from "./config";
import { PlasticScm } from "./plasticScm";

const defaultConfig: IConfig = {
  autorefresh: true,
  cmConfiguration: {
    cmPath: "cm",
    millisToStop: 5000,
    millisToWaitUntilUp: 5000,
  },
};

let plasticScm: PlasticScm;
let config: IConfig;

export async function activate(context: ExtensionContext): Promise<void> {
  const plasticScmChannel: OutputChannel = window.createOutputChannel("Plastic SCM");
  plasticScm = new PlasticScm(plasticScmChannel);

  context.subscriptions.push(
    plasticScmChannel,
    plasticScm,
    workspace.onDidChangeConfiguration(event => configurationChanged(event, plasticScm)));

  config = getConfig();
  await plasticScm.initialize(config);
}

export function deactivate(): Promise<void[]> {
  return plasticScm.stop();
}

async function configurationChanged(
    event: ConfigurationChangeEvent, plasticScmInstance: PlasticScm): Promise<void> {
  if (!event.affectsConfiguration(extensionId)) {
    return;
  }

  const newConfig = getConfig();
  if (config.cmConfiguration.cmPath !== newConfig.cmConfiguration.cmPath) {
    await plasticScmInstance.stop();
    await plasticScmInstance.initialize(newConfig);
    config = newConfig;
    return;
  }

  plasticScmInstance.updateConfig(newConfig);
  config = newConfig;
}

function getConfig(): IConfig {
  return workspace.getConfiguration(undefined, null).get<IConfig>(
    extensionId, defaultConfig);
}
