import { Disposable, workspace as vscodeWorkspace } from "vscode";
import { disposeAll, filterEvent } from "./events";
import { PlasticScm } from "./plasticScm";
import { PlasticSCMDecorationProvider } from "./decorationProvider";
import { Workspace } from "./workspace";

export class PlasticScmDecorations {
  private disposables: Disposable[] = [];
  private modelDisposables: Disposable[] = [];
  private providers = new Map<Workspace, Disposable>();
  private model: PlasticScm;

  public constructor(model: PlasticScm) {
    this.model = model;

    const onEnablementChange = filterEvent(
      vscodeWorkspace.onDidChangeConfiguration, e => e.affectsConfiguration("plastic-scm.decorations.enabled")
    );
    onEnablementChange(this.update.bind(this), this, this.disposables);
    this.update();
  }

  public dispose(): void {
    this.disable();
    this.disposables = disposeAll(this.disposables);
  }

  private update(): void {
    const enabled = vscodeWorkspace.getConfiguration("plastic-scm").get<boolean>("decorations.enabled");

    if (enabled) {
      this.enable();
    } else {
      this.disable();
    }
  }

  private enable(): void {
    this.model.workspaces.forEach(this.onDidOpenWorkspace.bind(this), this);
  }

  private disable(): void {
    this.modelDisposables = disposeAll(this.modelDisposables);
    this.providers.forEach(value => {
      value.dispose();
    });
    this.providers.clear();
  }

  private onDidOpenWorkspace(repository: Workspace): void {
    const provider = new PlasticSCMDecorationProvider(repository);
    this.providers.set(repository, provider);
  }
}
