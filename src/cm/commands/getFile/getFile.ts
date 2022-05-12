import { dirname, join, relative } from "path";
import { existsSync, promises } from "fs";
import { ICmParser, ICmResult, ICmShell } from "../../shell";
import { GetFileParser } from "./getFileParser";
import { Uri } from "vscode";

export class GetFile {
  public static cachedFileLocation(
      rootDir: string,
      filePath: Uri,
      changeset: number
  ): Uri {
    const cacheDir = join(rootDir, ".plastic", "fileCache");
    const outputFile = join(cacheDir, changeset.toString(), relative(rootDir, filePath.fsPath));
    return Uri.file(outputFile);
  }

  public static async run(
      rootDir: string,
      filePath: Uri,
      changeset: number,
      shell: ICmShell
  ): Promise<Uri | undefined> {
    const parser: ICmParser<void> = new GetFileParser();

    if (filePath.fsPath.includes(".plastic")) {
      return undefined;
    }

    const fileSpec = `${filePath.fsPath}#cs:${changeset}`;
    const cacheDir = join(rootDir, ".plastic", "fileCache");
    const outputFile = join(cacheDir, changeset.toString(), relative(rootDir, filePath.fsPath));

    // make sure the directory exists where we're going to store the outputFile
    // creates fileCache along the way if it doesn't exist yet
    if (!existsSync(dirname(outputFile))) {
      await promises.mkdir(dirname(outputFile), { recursive: true });
    }

    // prune old changesets
    const cacheDirContents = await promises.readdir(cacheDir);
    for (const file of cacheDirContents) {
      const fileNameAsChangeset = parseInt(file, 10);
      if (!isNaN(fileNameAsChangeset) && fileNameAsChangeset < changeset) {
        await promises.rmdir(join(cacheDir, file), { recursive: true });
      }
    }

    if (!existsSync(outputFile)) {
      const result: ICmResult<void> = await shell.exec(
        "getfile",
        [ fileSpec, `--file=${outputFile}` ],
        parser);

      if (!result.success) {
        throw new Error("Command execution failed.");
      }

      if (result.error) {
        throw result.error;
      }
    }

    return Uri.file(outputFile);
  }
}
