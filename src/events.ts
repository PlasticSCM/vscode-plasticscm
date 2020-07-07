import { Event } from "vscode";

export interface IDisposable {
  dispose(): void;
}

export function disposeAll<T extends IDisposable>(disposables: T[]): T[] {
  disposables.forEach(d => d.dispose());
  return [];
}

export function toDisposable(dispose: () => void): IDisposable {
  return { dispose };
}

export function combineDisposables(disposables: IDisposable[]): IDisposable {
  return toDisposable(() => disposeAll(disposables));
}

export function anyEvent<T>(...events: Array<Event<T>>): Event<T> {
  return (listener, thisArgs = null, disposables?) => {
    const result = combineDisposables(events.map(event => event(i => listener.call(thisArgs, i))));

    if (disposables) {
      disposables.push(result);
    }

    return result;
  };
}

export function filterEvent<T>(event: Event<T>, filter: (e: T) => boolean): Event<T> {
  return (listener, thisArg = null, disposables?) =>
    event(e => filter(e) && listener(e), thisArg, disposables);
}

export function onceEvent<T>(event: Event<T>): Event<T> {
  return (listener, thisArgs = null, disposables?) => {
    const result = event(e => {
      result.dispose();
      return listener.call(thisArgs, e);
    }, null, disposables);

    return result;
  };
}

export function eventToPromise<T>(event: Event<T>): Promise<T> {
  return new Promise<T>(c => onceEvent(event)(c));
}
