const worksapce = require('./src/workspace/workspace');
const logHelper = require('./src/common/logHelper');

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	/* 初始化 log 日志系统 */
	logHelper.logInit();

	require("./src/command/build")(context);
	require("./src/command/upload")(context);
	require("./src/command/log")(context);

	logHelper.logAppendLine('SylixOS 插件激活成功!');
	logHelper.logAppendLine('SylixOS 插件正在进行 workspace 初始化!');
	await worksapce.worksapceInit();
	logHelper.logAppend(`当前 workspace 发现如下 SylixOS 工程:`, true, true);
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
