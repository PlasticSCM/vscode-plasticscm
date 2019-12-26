export * from './config';

import {
  Event,
  ExtensionContext,
  Uri,
  workspace,
  ConfigurationChangeEvent,
  WorkspaceConfiguration,
  EventEmitter } from 'vscode';
import { Config } from './config';
import { extensionId } from './constants';

export class Configuration {

  static configureEvents(context: ExtensionContext) {
    context.subscriptions.push(
      workspace.onDidChangeConfiguration(e => {
        configuration.mOnDidChangeAny.fire(e);
        if (e.affectsConfiguration(extensionId)) {
          configuration.mOnDidChange.fire(e);
        }
      }));
  }

  get onDidChangeAny(): Event<ConfigurationChangeEvent> {
    return this.mOnDidChangeAny.event;
  }

  get onDidChange(): Event<ConfigurationChangeEvent> {
    return this.mOnDidChange.event;
  }

  private onConfigurationChanged(e: ConfigurationChangeEvent) {
    if (!e.affectsConfiguration(extensionId, null!)) {
      this.mOnDidChangeAny.fire(e);
      return;
    }

    this.mOnDidChangeAny.fire(e);
    this.mOnDidChange.fire(e);
  }

  get(): Config;
  get<S1 extends keyof Config>(s1: S1, resource?: Uri | null, defaultValue?: Config[S1]): Config[S1];
  get<S1 extends keyof Config, S2 extends keyof Config[S1]>(
    s1: S1,
    s2: S2,
    resource?: Uri | null,
    defaultValue?: Config[S1][S2]
  ): Config[S1][S2];
  // Keep adding overloads here if configuration nestiness keeps growing.
  get<T>(...args: any[]): T {
    const section: string | undefined = Configuration.buildConfigKey(...args);
    const lastKeyIndex: number = Configuration.getLastConfigKeyIndex(...args);

    const defaultValue: T | undefined = args[lastKeyIndex + 1];
    const resource: Uri | null | undefined = args[lastKeyIndex + 2];

    const wkConfig: WorkspaceConfiguration =
      workspace.getConfiguration(
        section === undefined ? undefined : extensionId, resource);

    const result: T = defaultValue === undefined
      ? wkConfig.get<T>(section === undefined ? extensionId : section)!
      : wkConfig.get<T>(section === undefined ? extensionId : section, defaultValue);

    const anotherResult: any = defaultValue === undefined
        ? wkConfig.get(section === undefined ? extensionId : section)!
        : wkConfig.get(section === undefined ? extensionId : section, defaultValue);

    return result === undefined ? anotherResult : result;
  }

  changed<S1 extends keyof Config>(e: ConfigurationChangeEvent, s1: S1, resource?: Uri | null): boolean;
  changed<S1 extends keyof Config, S2 extends keyof Config[S1]>(
    e: ConfigurationChangeEvent, s1: S1, s2: S2, resource?: Uri | null
  ): boolean;
  changed(e: ConfigurationChangeEvent, ...args: any[]): boolean {
    const section: string = `${extensionId}.${Configuration.buildConfigKey(...args)!}`;
    const lastKeyIndex: number = Configuration.getLastConfigKeyIndex(...args);

    const resource: Uri | null | undefined = args[lastKeyIndex + 1];

    return e.affectsConfiguration(section, resource!);
  }

  static buildConfigKey(...args: any[]): string | undefined {
    if (args.length === 0 || typeof(args[0]) !== 'string') {
      return undefined;
    }

    let result: string = args[0];
    let index: number;
    for (index = 1; index < args.length; index++) {
      if (typeof(args[index]) !== 'string') {
        return result;
      }

      result += `.${args[index]}`;
    }

    return result;
  }

  static getLastConfigKeyIndex(...args: any[]): number {
    for (let i: number = 0; i < args.length; i++) {
      if (typeof(args[i]) !== 'string') {
        return i;
      }
    }

    return args.length;
  }

  private mOnDidChange: EventEmitter<ConfigurationChangeEvent> =
    new EventEmitter<ConfigurationChangeEvent>();

  private mOnDidChangeAny: EventEmitter<ConfigurationChangeEvent> =
    new EventEmitter<ConfigurationChangeEvent>();
}

export const configuration = new Configuration();
