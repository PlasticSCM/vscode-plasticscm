// tslint:disable-next-line: interface-name
export interface IConfig {
  cmConfiguration: {
    cmPath: string | null;
    millisToWaitUntilUp: number | null;
  };
  autorefresh: boolean;
}
