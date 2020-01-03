import { ICheckinChangeset } from "../../../models";

interface IPatternGroups {
  branchName: string;
  changesetId: string;
  mountPath: string;
  repositoryName: string;
  serverName: string;
}

const patternGroups: IPatternGroups = {
  branchName: "brname",
  changesetId: "csetid",
  mountPath: "mountpath",
  repositoryName: "repo",
  serverName: "server",
};

const checkinCsetSpecPattern: RegExp = new RegExp([
  "^",
  `cs:(?<${patternGroups.changesetId}>[0-9]+)`,
  "@",
  `br:(?<${patternGroups.branchName}>[^@]+)`,
  "@",
  `(?<${patternGroups.repositoryName}>[^@]+)`,
  "@",
  `(?<${patternGroups.serverName}>[^ ]+)`,
  " ",
  `\\(mount:'(?<${patternGroups.mountPath}>[^']+)'\\)`,
  "$",
].join(""), "u");

export function parse(checkinCsetSpec: string): ICheckinChangeset | null {
  const matches: RegExpExecArray | null = checkinCsetSpecPattern.exec(checkinCsetSpec);
  if (!matches || !matches.length || !matches.groups) {
    return null;
  }

  return {
    changesetInfo: {
      branch: matches!.groups[patternGroups.branchName] ?? "",
      changesetId: parseInt(matches!.groups[patternGroups.changesetId] ?? "-1", 10),
      repository: matches!.groups[patternGroups.repositoryName] ?? "",
      server: matches!.groups[patternGroups.serverName] ?? "",
    },
    mountPath: matches!.groups[patternGroups.mountPath] ?? "",
  };
}
