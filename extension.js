const worksapce = require('./src/workspace/workspace');
const logHelper = require('./src/common/logHelper');

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	/* 初始化 log 日志系统 */
	logHelper.logInit();

	require("./src/toolset/crash")(context);
	require("./src/toolset/tftpserver")(context);
	require("./src/command/build")(context);
	require("./src/command/upload")(context);
	require("./src/command/log")(context);
	require("./src/command/set")(context);

	logHelper.logAppendLine('SylixOS 插件激活成功!', true);
	logHelper.logAppendLine('SylixOS 插件正在检测当前 workspace !', true);
	await worksapce.worksapceInit();
	if (worksapce.projects.length) {
		logHelper.logAppend(`当前 workspace 发现如下 SylixOS 工程:`, false, true);
		for (let i = 0; i < worksapce.projects.length; i++) {
			logHelper.logAppend(`[${worksapce.projects[i].name}] `);
		}
		logHelper.logAppend('\n');
	} else {
		logHelper.logAppend('未发现 SylixOS 相关工程\n');
	}

	logHelper.logAppendLine('SylixOS 插件检测完成，欢迎使用!');
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
