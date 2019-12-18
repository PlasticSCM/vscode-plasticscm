import * as vscode from 'vscode';
import { PlasticScm } from './plasticScm';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(new PlasticScm());
}

export function deactivate() {}
