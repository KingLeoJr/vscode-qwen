"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
function activate(context) {
    const provider = new QwenViewProvider(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('qwenView', provider, {
        webviewOptions: { retainContextWhenHidden: true } // Preserve webview state
    }));
    context.subscriptions.push(vscode.commands.registerCommand('qwen.open', () => {
        // Open the Qwen view
        vscode.commands.executeCommand('workbench.view.extension.qwen');
    }));
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(comment-discussion) Qwen";
    statusBarItem.tooltip = "Open Qwen";
    statusBarItem.command = "qwen.open";
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
}
exports.activate = activate;
class QwenViewProvider {
    constructor(context) {
        this.context = context;
    }
    resolveWebviewView(webviewView) {
        this.webviewView = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            enableForms: true,
        };
        // Load the saved session URL or the default URL
        const config = vscode.workspace.getConfiguration('qwen');
        const defaultUrl = config.get('url', 'https://qwenlm.ai/');
        const sessionUrl = this.context.globalState.get('qwenSessionUrl', defaultUrl);
        this.updateWebview(sessionUrl);
        // Listen for messages from the webview
        webviewView.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case 'navigate':
                    // Save the new URL to global state
                    this.context.globalState.update('qwenSessionUrl', message.url);
                    break;
            }
        });
    }
    updateWebview(url) {
        if (this.webviewView) {
            this.webviewView.webview.html = `
        <html>
          <head>
            <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://qwenlm.ai; script-src 'self' https://qwenlm.ai 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://qwenlm.ai; style-src 'self' https://qwenlm.ai 'unsafe-inline';">
          </head>
          <body style="margin: 0; padding: 0; height: 100vh;">
            <iframe
              id="qwenIframe"
              src="${url}"
              style="width: 100%; height: 100%; border: none;"
            ></iframe>
            <script>
              const vscode = acquireVsCodeApi();
              const iframe = document.getElementById('qwenIframe');

              // Notify the extension when the iframe navigates
              iframe.onload = () => {
                const currentUrl = iframe.src;
                vscode.postMessage({
                  command: 'navigate',
                  url: currentUrl
                });
              };
            </script>
          </body>
        </html>
      `;
        }
    }
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map