interface IField {
  index: number;
  name: string;
}

interface IFormatFields {
  readonly guid: IField;
  readonly wkName: IField;
  readonly wkPath: IField;
}

interface ICommandInfo {
  readonly commandName: string;
  readonly fieldSeparator: string;
  readonly numFields: number;
  readonly fields: IFormatFields;
}

export const CommandInfo: ICommandInfo = {
  commandName: "getworkspacefrompath",
  fieldSeparator: "@#@",
  fields: {
    guid: {
      index: 0,
      name: "guid",
    },
    wkName: {
      index: 1,
      name: "wkname",
    },
    wkPath: {
      index: 2,
      name: "wkpath",
    },
  },
  numFields: 3,
};
