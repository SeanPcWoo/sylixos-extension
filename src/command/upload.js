const vscode = require('vscode');
const path = require('path');
const ftpHelper = require('../utils/ftphelper');
const  {projectGenPath, projectGenName} = require('../project/project');
const workspace = require('../workspace/workspace');

const statusBar = require('../common/statusbar');

const channel = vscode.window.createOutputChannel('SylixOS Upload 信息');
const stopUploadCommandID = 'vscode-js-sylixos.stopuploadpro';

async function upload (uri) {
	const projectName = await projectGenName(uri);
	const projectPath = await projectGenPath(uri);
	const project = workspace.getProject(projectName, projectPath);

    if (project) {
        /* 初始化好两个 bar item 的状态 */
        statusBar.handlebarcmd(stopUploadCommandID);

        channel.clear();
        channel.show();
        statusBar.handlebarshow('停止传输');

        ftpHelper.ftpUploadAllFiles(project.uploadDev, project.uploadFiles, file => {
            channel.append(`部署: ${file.local}\t`);

            statusBar.infobarshow(`[${projectName}]部署: ${path.basename(file.local)} `);
        }, file => {
            channel.append(`远端: ${file.remote}\t`);
        }, info => {
            channel.appendLine(`状态:${info}\t`);
        }).then(() => {
            statusBar.infobarshow(`[${projectName}]完成部署`);
            statusBar.handlebarhide();
        });
    } else {
        vscode.window.showErrorMessage("获取工程失败");
    }
}

module.exports = function(context) {
	let disposable = vscode.commands.registerCommand('vscode-js-sylixos.uploadpro', upload);

	context.subscriptions.push(disposable);
}