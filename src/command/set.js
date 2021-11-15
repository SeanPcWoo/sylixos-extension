const vscode = require('vscode');

async function setPro (uri) {
    await vscode.commands.executeCommand("workbench.action.openFolderSettings", {
        query:"@ext:wupengcheng.sylixos"
    });
}

module.exports = function(context) {
	let disposable = vscode.commands.registerCommand('vscode-js-sylixos.setpro', setPro);

	context.subscriptions.push(disposable);
}