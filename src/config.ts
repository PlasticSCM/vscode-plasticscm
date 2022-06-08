export interface IConfig {
  autorefresh: boolean;
  hiddenChanges: string[];
  cmConfiguration: IShellConfig;
  enabled: boolean;
}

export interface IShellConfig {
  cmPath: string;
  millisToStop: number;
  millisToWaitUntilUp: number;
}
