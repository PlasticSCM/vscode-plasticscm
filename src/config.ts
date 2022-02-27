export interface IConfig {
  autorefresh: boolean;
  cmConfiguration: IShellConfig;
  enabled: boolean;
}

export interface IShellConfig {
  cmPath: string;
  millisToStop: number;
  millisToWaitUntilUp: number;
}
