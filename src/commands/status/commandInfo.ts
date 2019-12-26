interface IField {
  index: number;
  name: string;
}

interface IFormatFields {
}

interface ICommandInfo {
  readonly commandName: string;
  readonly fieldSeparator: string;
  readonly numFields: number;
  readonly fields: IFormatFields;
}

export const CommandInfo: ICommandInfo = {
  commandName: "status",
  fieldSeparator: "@#@",
  fields: {
  },
  numFields: 0,
};
