const worksapce = require('./src/workspace/workspace');
const logHelper = require('./src/common/logHelper');
const vscode = require('vscode');

let item = new vscode.TreeItem('p1-2', vscode.TreeItemCollapsibleState.None);
item.command = {
	title:"open",
	command:"vscode.open",
	tooltip:'open file',
	arguments:"D:\\work\\code\\git\\Tool\\netfirewall\\code\\netfirewall\\tc_net_secu\\tc_net_secu\\src\\comm.h"
}

let project1Functions = [
	new vscode.TreeItem('p1-1', vscode.TreeItemCollapsibleState.Collapsed),
	item
]

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	/* 初始化 log 日志系统 */
	logHelper.logInit();

	require("./src/toolset/crash")(context);

	// return;

	// let projectTreeItem1 = new vscode.TreeItem('project1', vscode.TreeItemCollapsibleState.Collapsed);
	// let projectTreeItem2 = new vscode.TreeItem('project2', vscode.TreeItemCollapsibleState.Collapsed);
	// let projectTreeItem3 = new vscode.TreeItem('project3', vscode.TreeItemCollapsibleState.Collapsed);

	// const _onDidChangeTreeData = new vscode.EventEmitter();

	// let crashToolProvider = {
	// 	onDidChangeTreeData: _onDidChangeTreeData.event,
		
	// 	refresh(){
	// 		_onDidChangeTreeData.fire();
	// 	},

	// 	getTreeItem(element) {
	// 		return element;
	// 	},
	// 	getChildren(element) {
	// 		if (!element) {
	// 			projectTreeItem1.contextValue = "project";
	// 			projectTreeItem1.description = "this is project";

	// 			projectTreeItem2.contextValue = "project";
	// 			projectTreeItem2.description = "this is project";

	// 			projectTreeItem3.contextValue = "project";
	// 			projectTreeItem3.description = "this is project";

	// 			return Promise.resolve([
	// 				projectTreeItem1,
	// 				projectTreeItem2,
	// 				projectTreeItem3,
	// 			])
	// 		}

	// 		if (element && element.label &&  element.label == 'project1') {

	// 			return Promise.resolve(project1Functions)
	// 		}
	// 	},

		
	// };

	// vscode.window.registerTreeDataProvider(
	// 	'SylixOSCrashTool',
	// 	crashToolProvider
	// );

	// context.subscriptions.push(vscode.commands.registerCommand('vscode-js-sylixos.crashToolSetBaseAddr', 
	// 	(arg) => {
	// 		console.log(arg);
	// 		console.log("delete project");
	// 	}
  	// ));

	//   context.subscriptions.push(vscode.commands.registerCommand('vscode-js-sylixos.crashToolAnaly', 
	//   async (arg) => {
	// 	project1Functions.push(new vscode.TreeItem('new item', vscode.TreeItemCollapsibleState.Collapsed));
	// 	const addr = await vscode.window.showInputBox({title:"需要分析的地址", value:'0x0', prompt:"请确保设置好工程运行的基地址", ignoreFocusOut:true});
	// 	console.log("addr = ", addr);
	// 	crashToolProvider.refresh();
	//   }
	// ));

	// return;
	require("./src/command/build")(context);
	require("./src/command/upload")(context);
	require("./src/command/log")(context);
	require("./src/command/set")(context);

	logHelper.logAppendLine('SylixOS 插件激活成功!', true);
	logHelper.logAppendLine('SylixOS 插件正在进行 workspace 初始化!', true);
	await worksapce.worksapceInit();
	logHelper.logAppend(`当前 workspace 发现如下 SylixOS 工程:`, false, true);
	for (let i = 0; i < worksapce.projects.length; i++) {
		logHelper.logAppend(`[${worksapce.projects[i].name}] `);
	}
	logHelper.logAppend('\n');
	logHelper.logAppendLine('SylixOS 插件初始化，欢迎使用!');
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
