import * as vscode from 'vscode';
import { convertCsharpToTypescript } from './converter';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('csharpToTs.convert', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor found.');
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showWarningMessage('Please select C# properties to convert.');
      return;
    }

    const selectedText = editor.document.getText(selection);
    const converted = convertCsharpToTypescript(selectedText);

    if (!converted) {
      vscode.window.showWarningMessage('No valid C# properties found in selection.');
      return;
    }

    editor.edit((editBuilder) => {
      editBuilder.replace(selection, converted);
    });
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
