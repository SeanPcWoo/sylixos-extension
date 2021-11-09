const logHelper = require('../common/logHelper');
const vscode = require('vscode');

function showLog(){
    logHelper.logShow();
}
module.exports = function(context) {
	let disposable = vscode.commands.registerCommand('vscode-js-sylixos.showlog', showLog);

	context.subscriptions.push(disposable);
} 