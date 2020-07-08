import * as events from "./events";
import {
  ConfigurationChangeEvent,
  Disposable,
  Event,
  ExtensionContext,
  OutputChannel,
  window,
  workspace,
} from "vscode";
import { extensionId } from "./constants";
import { IConfig } from "./config";
import { PlasticScm } from "./plasticScm";
import { throttle } from "./decorators";

const defaultConfig: IConfig = {
  autorefresh: true,
  cmConfiguration: {
    cmPath: "cm",
    millisToStop: 5000,
    millisToWaitUntilUp: 5000,
  },
};

let extension: Extension;

export async function activate(context: ExtensionContext): Promise<void> {
  extension = new Extension();
  context.subscriptions.push(extension);
  await extension.start();
}

export async function deactivate(): Promise<void> {
  await extension.stop();
}

class Extension implements Disposable {
  private mOutputChannel: OutputChannel;
  private mPlasticScm?: PlasticScm;
  private mConfig: IConfig;
  private mDisposables: Disposable;

  public constructor() {
    this.mOutputChannel = window.createOutputChannel("Plastic SCM");
    this.mConfig = Extension.getConfiguration();

    const onExtensionConfigChangedEvent: Event<ConfigurationChangeEvent> = events.filterEvent(
      workspace.onDidChangeConfiguration,
      e => e.affectsConfiguration(extensionId));

    this.mDisposables = Disposable.from(
      this.mOutputChannel,
      onExtensionConfigChangedEvent(() => this.configurationChanged()));
  }

  public dispose(): any {
    this.mDisposables.dispose();
  }

  public async start(config?: IConfig): Promise<void> {
    this.mConfig = config || Extension.getConfiguration();
    this.mPlasticScm = new PlasticScm(this.mOutputChannel);
    await this.mPlasticScm.initialize(this.mConfig);
  }

  public async stop(): Promise<void> {
    if (!this.mPlasticScm) {
      return;
    }

    await this.mPlasticScm.stop();
    this.mPlasticScm.dispose();
    this.mPlasticScm = undefined;
  }

  @throttle(2500)
  private async configurationChanged(): Promise<void> {
    const newConfig = Extension.getConfiguration();
    if (!newConfig.cmConfiguration.cmPath) {
      newConfig.cmConfiguration.cmPath = defaultConfig.cmConfiguration.cmPath;
    }

    if (this.mConfig.cmConfiguration.cmPath !== newConfig.cmConfiguration.cmPath) {
      await this.stop();
      await this.start(newConfig);
      return;
    }

    this.updateConfig(newConfig);
  }

  private static getConfiguration(): IConfig {
    return workspace.getConfiguration(undefined, null).get<IConfig>(
      extensionId, defaultConfig);
  }

  private updateConfig(config: IConfig) {
    if (this.mPlasticScm) {
      this.mPlasticScm.updateConfig(config);
    }
    this.mConfig = config;
  }
}

