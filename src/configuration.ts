export * from "./config";

import {
  ConfigurationChangeEvent,
  Event,
  EventEmitter,
  ExtensionContext,
  workspace,
} from "vscode";
import { extensionId } from "./constants";
import { IConfig } from "./config";

export class Configuration {

  private mOnDidChange = new EventEmitter<ConfigurationChangeEvent>();
  private mOnDidChangeAny = new EventEmitter<ConfigurationChangeEvent>();
  private readonly mDefault: IConfig = {
    autorefresh: true,
    cmConfiguration: {
      cmPath: "cm",
      millisToStop: 5000,
      millisToWaitUntilUp: 5000,
    },
  };

  public get onDidChangeAny(): Event<ConfigurationChangeEvent> {
    return this.mOnDidChangeAny.event;
  }

  public get onDidChange(): Event<ConfigurationChangeEvent> {
    return this.mOnDidChange.event;
  }

  public static configureEvents(context: ExtensionContext): void {
    context.subscriptions.push(
      workspace.onDidChangeConfiguration(e => {
        configuration.mOnDidChangeAny.fire(e);
        if (e.affectsConfiguration(extensionId)) {
          configuration.mOnDidChange.fire(e);
        }
      }));
  }

  public get(): IConfig {
    return workspace.getConfiguration(undefined, null).get<IConfig>(extensionId, this.mDefault);
  }

  private static buildConfigKey(...args: any[]): string | undefined {
    if (args.length === 0 || typeof (args[0]) !== "string") {
      return undefined;
    }

    let result: string = args[0];
    let index: number;
    for (index = 1; index < args.length; index++) {
      if (typeof (args[index]) !== "string") {
        return result;
      }

      result += `.${args[index] as string}`;
    }

    return result;
  }

  private static getLastConfigKeyIndex(...args: any[]): number {
    for (let i = 0; i < args.length; i++) {
      if (typeof (args[i]) !== "string") {
        return i;
      }
    }

    return args.length;
  }
}

export const configuration = new Configuration();
