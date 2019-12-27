// tslint:disable-next-line: interface-name
export interface Config {
  cmConfiguration: {
   cmPath: string | null;
   millisToWaitUntilUp: number | null;
  };
  autorefresh: boolean;
}
