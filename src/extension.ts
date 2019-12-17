import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const disposables: vscode.Disposable[] = [];
  context.subscriptions.push(new vscode.Disposable(
    () => vscode.Disposable.from(...disposables)));
}

export function deactivate() {}
