// tslint:disable-next-line: interface-name
export interface IConfig {
  cmConfiguration: IShellConfig;
  autorefresh: boolean;
}

export interface IShellConfig {
  cmPath: string;
  millisToStop: number;
  millisToWaitUntilUp: number;
}
