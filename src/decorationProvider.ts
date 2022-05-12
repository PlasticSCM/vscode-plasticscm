import { Disposable, Event, EventEmitter, FileDecoration, FileDecorationProvider, Uri, window } from "vscode";
import { IPlasticScmResourceGroup, Workspace } from "./workspace";
import { ChangeType } from "./models";

export class PlasticSCMDecorationProvider implements FileDecorationProvider {
  public readonly onDidChangeFileDecorations: Event<Uri[]>;

  private readonly onDidChangeDecorations: EventEmitter<Uri[]>;
  private disposables: Disposable[] = [];
  private decorations = new Map<string, FileDecoration>();

  public constructor(private workspace: Workspace) {
    this.onDidChangeDecorations = new EventEmitter<Uri[]>();
    this.onDidChangeFileDecorations = this.onDidChangeDecorations.event;

    this.disposables.push(
      window.registerFileDecorationProvider(this),
      workspace.onDidRunStatus(this.onDidRunStatus.bind(this), this)
    );
  }

  public provideFileDecoration(uri: Uri): FileDecoration | undefined {
    return this.decorations.get(uri.toString());
  }

  public dispose(): void {
    this.disposables.forEach(d => {
      d.dispose();
    });
  }

  private onDidRunStatus(): void {
    const newDecorations = new Map<string, FileDecoration>();

    this.collectDecorationData(this.workspace.statusResourceGroup, newDecorations);

    const uris = new Set([...this.decorations.keys()].concat([...newDecorations.keys()]));
    this.decorations = newDecorations;
    this.onDidChangeDecorations.fire([...uris.values()].map(value => Uri.parse(value, true)));
  }

  private collectDecorationData(group: IPlasticScmResourceGroup, bucket: Map<string, FileDecoration>): void {
    for (const r of group.resourceStates) {
      const decoration = r.resourceDecoration;

      if (decoration) {
        // not deleted and has a decoration
        bucket.set(r.resourceUri.toString(), decoration);

        if (r.type === ChangeType.Moved) {
          bucket.set(r.resourceUri.toString(), decoration);
        }
      }
    }
  }
}
