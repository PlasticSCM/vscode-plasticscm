import * as path from "path";
import { Command, SourceControlResourceDecorations, SourceControlResourceState, ThemeColor, Uri } from "vscode";
import { memoize } from "./decorators";
import { ChangeType, IChangeInfo } from "./models";

const iconsRootPath = path.join(__dirname, "..", "images", "icons");

function getIconPath(iconName: string, theme: string): Uri {
  return Uri.file(path.join(iconsRootPath, theme, `${iconName}.svg`));
}

export class PlasticScmResource implements SourceControlResourceState {

  @memoize
  public get resourceUri(): Uri {
    return this.mChangeInfo.path;
  }

  public get isPrivate(): boolean {
    return this.mChangeInfo.type === ChangeType.Private;
  }

  public get decorations(): SourceControlResourceDecorations {
    return {
      dark: { iconPath: PlasticScmResource.getIconPath(this.mChangeInfo.type, "dark") },
      faded: false, // Maybe in the future for ignored items
      light: { iconPath: PlasticScmResource.getIconPath(this.mChangeInfo.type, "light") },
      strikeThrough: this.mChangeInfo.type === ChangeType.Deleted,
      tooltip: this.tooltip,
    };
  }

  public get letter(): string | undefined {
    const result: string[] = [];

    if (this.mChangeInfo.type & ChangeType.Private) {
      result.push("P");
    }

    if (this.mChangeInfo.type & ChangeType.Added) {
      result.push("A");
    }

    if (this.mChangeInfo.type & ChangeType.Changed) {
      result.push("C");
    }

    if (this.mChangeInfo.type & ChangeType.Moved) {
      result.push("M");
    }

    if (this.mChangeInfo.type & ChangeType.Checkedout) {
      result.push("C");
    }

    if (this.mChangeInfo.type & ChangeType.Deleted) {
      result.push("D");
    }

    return result.join("");
  }

  public get color(): ThemeColor | undefined {
    if (this.mChangeInfo.type & ChangeType.Private) {
      return new ThemeColor("gitDecoration.untrackedResourceForeground");
    }

    if (this.mChangeInfo.type & ChangeType.Added) {
      return new ThemeColor("gitDecoration.addedResourceForeground");
    }

    if (this.mChangeInfo.type & ChangeType.Changed) {
      return new ThemeColor("gitDecoration.modifiedResourceForeground");
    }

    if (this.mChangeInfo.type & ChangeType.Moved) {
      return new ThemeColor("gitDecoration.modifiedResourceForeground");
    }

    if (this.mChangeInfo.type & ChangeType.Checkedout) {
      return new ThemeColor("gitDecoration.modifiedResourceForeground");
    }

    if (this.mChangeInfo.type & ChangeType.Deleted) {
      return new ThemeColor("gitDecoration.deletedResourceForeground");
    }

    return undefined;
  }

  private get tooltip(): string {
    if (this.mChangeInfo.type & ChangeType.Moved) {
      return `Moved from ${this.mChangeInfo.oldPath?.fsPath}`;
    }

    if (this.mChangeInfo.type & ChangeType.Private) {
      return "Private";
    }

    if (this.mChangeInfo.type & ChangeType.Added) {
      return "Added";
    }

    if (this.mChangeInfo.type & ChangeType.Changed) {
      return "Changed";
    }

    if (this.mChangeInfo.type & ChangeType.Moved) {
      return "Moved";
    }

    if (this.mChangeInfo.type & ChangeType.Checkedout) {
      return "Checked Out";
    }

    if (this.mChangeInfo.type & ChangeType.Deleted) {
      return "Deleted";
    }

    return "Unknown";
  }

  private static Icons: any = {
    dark: {
      Added: getIconPath("status-added", "dark"),
      Changed: getIconPath("status-modified", "dark"),
      Checkedout: getIconPath("status-modified", "dark"),
      Deleted: getIconPath("status-deleted", "dark"),
      Moved: getIconPath("status-renamed", "dark"),
      Private: getIconPath("status-unversioned", "dark"),
    },
    light: {
      Added: getIconPath("status-added", "light"),
      Changed: getIconPath("status-modified", "light"),
      Checkedout: getIconPath("status-modified", "light"),
      Deleted: getIconPath("status-deleted", "light"),
      Moved: getIconPath("status-renamed", "light"),
      Private: getIconPath("status-unversioned", "light"),
    },
  };

  private static getIconPath(changeType: ChangeType, theme: string): Uri {
    if (changeType & ChangeType.Private) {
      return PlasticScmResource.Icons[theme].Private;
    }

    if (changeType & ChangeType.Added) {
      return PlasticScmResource.Icons[theme].Added;
    }

    if (changeType & ChangeType.Changed) {
      return PlasticScmResource.Icons[theme].Changed;
    }

    if (changeType & ChangeType.Moved) {
      return PlasticScmResource.Icons[theme].Moved;
    }

    if (changeType & ChangeType.Checkedout) {
      return PlasticScmResource.Icons[theme].Checkedout;
    }

    if (changeType & ChangeType.Deleted) {
      return PlasticScmResource.Icons[theme].Deleted;
    }

    throw new Error(`Unknown ChangeType: ${changeType}`);
  }

  public command?: Command;

  private mChangeInfo: IChangeInfo;

  public constructor(changeInfo: IChangeInfo) {
    this.mChangeInfo = changeInfo;
  }
}
