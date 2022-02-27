import { Disposable, Event, workspace as vscodeWorkspace } from "vscode";
import { PlasticScm } from "./plasticScm";
import { PlasticSCMDecorationProvider } from "./decorationProvider";
import { Workspace } from "./workspace";

interface IDisposable {
  dispose(): void;
}

function dispose<T extends IDisposable>(disposables: T[]): T[] {
  disposables.forEach(d => d.dispose());
  return [];
}

function filterEvent<T>(event: Event<T>, filter: (e: T) => boolean): Event<T> {
  return (
      listener: (e: T) => any,
      thisArgs?: any,
      disposables?: Disposable[]
  ) => event(e => {
    if (filter(e)) {
      listener.call(thisArgs, e);
    }
  }, null, disposables);
}

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
    this.disposables = dispose(this.disposables);
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
    this.modelDisposables = dispose(this.modelDisposables);
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
