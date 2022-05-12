import {
  commands,
  Disposable,
  SourceControlResourceState,
  TextDocumentShowOptions,
  Uri,
  ViewColumn,
  window,
} from "vscode";
import { ChangeType } from "../models";
import { existsSync } from "fs";
import { PlasticScm } from "../plasticScm";
import { PlasticScmResource } from "../plasticScmResource";

export class OpenFileCommand implements Disposable {
  private readonly mPlasticScm: PlasticScm;
  private readonly mDisposable?: Disposable;

  public constructor(plasticScm: PlasticScm) {
    this.mPlasticScm = plasticScm;
    this.mDisposable = commands.registerCommand(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      "plastic-scm.openFile", args => this.execute(args));
  }

  public dispose(): void {
    if (this.mDisposable) {
      this.mDisposable.dispose();
    }
  }

  public async execute(
      arg?: PlasticScmResource | Uri,
      ...resourceStates: SourceControlResourceState[]): Promise<void> {
    const preserveFocus = arg instanceof PlasticScmResource;

    let uris: Uri[] | undefined;

    if (arg instanceof Uri) {
      if (arg.scheme === "file") {
        uris = [arg];
      }
    } else {
      const resource = arg;

      // if (!(resource instanceof PlasticScmResource)) {
      //   // can happen when called from a keybinding
      //   resource = this.getSCMResource();
      // }

      if (resource) {
        uris = ([ resource, ...resourceStates ] as PlasticScmResource[])
          .filter(r => r.type !== ChangeType.Deleted)
          .map(r => r.resourceUri);
      } else if (window.activeTextEditor) {
        uris = [window.activeTextEditor.document.uri];
      }
    }

    if (!uris) {
      return;
    }

    const activeTextEditor = window.activeTextEditor;
    // Must extract these now because opening a new document will change the activeTextEditor reference
    const previousVisibleRange = activeTextEditor?.visibleRanges[0];
    const previousURI = activeTextEditor?.document.uri;
    const previousSelection = activeTextEditor?.selection;

    for (const uri of uris) {
      const opts: TextDocumentShowOptions = {
        preserveFocus,
        preview: false,
        viewColumn: ViewColumn.Active,
      };

      if (uri.scheme === "file" && !existsSync(uri.fsPath)) {
        continue;
      }

      await commands.executeCommand("vscode.open", uri, {
        ...opts,
      });

      const document = window.activeTextEditor?.document;

      // If the document doesn't match what we opened then don't attempt to select the range
      // Additioanlly if there was no previous document we don't have information to select a range
      if (document?.uri.toString() !== uri.toString() || !activeTextEditor || !previousURI || !previousSelection) {
        continue;
      }

      // Check if active text editor has same path as other editor. we cannot compare via
      // URI.toString() here because the schemas can be different. Instead we just go by path.
      if (previousURI.path === uri.path && document) {
        // preserve not only selection but also visible range
        opts.selection = previousSelection;
        const editor = await window.showTextDocument(document, opts);
        // This should always be defined but just in case
        if (previousVisibleRange) {
          editor.revealRange(previousVisibleRange);
        }
      }
    }
  }
}
