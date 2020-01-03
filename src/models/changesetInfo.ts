export interface IChangesetInfo {
  branch?: string;
  changesetId: number;
  repository: string;
  server: string;
}

export interface ICheckinChangeset {
  changesetInfo: IChangesetInfo;
  mountPath: string;
}
