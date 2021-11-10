const vscode = require('vscode');
const  {projectGenPath, projectGenName} = require('../project/project');
const workspace = require('../workspace/workspace');

async function buildSylixOSPro (uri) {
	const projectName = await projectGenName(uri);
	const projectPath = await projectGenPath(uri);
	const project = workspace.getProject(projectName, projectPath);

    if (project) {
        await vscode.commands.executeCommand("workbench.action.tasks.runTask", 'build ' + projectName);
    } else {
        vscode.window.showErrorMessage("获取工程失败");
    }
}

async function cleanSylixOSPro (uri) {
	const projectName = await projectGenName(uri);
	const projectPath = await projectGenPath(uri);
	const project = workspace.getProject(projectName, projectPath);

    if (project) {
        await vscode.commands.executeCommand("workbench.action.tasks.runTask", 'clean ' + projectName);
    } else {
        vscode.window.showErrorMessage("获取工程失败");
    }
}

async function cleanBuildPro (uri) {
	const projectName = await projectGenName(uri);
	const projectPath = await projectGenPath(uri);
	const project = workspace.getProject(projectName, projectPath);

    if (project) {
        await vscode.commands.executeCommand("workbench.action.tasks.runTask", 'clean&build ' + projectName);
    } else {
        vscode.window.showErrorMessage("获取工程失败");
    }
}

module.exports = function(context) {
    let buildprocmd = vscode.commands.registerCommand('vscode-js-sylixos.buildpro', buildSylixOSPro);
    let cleanprocmd = vscode.commands.registerCommand('vscode-js-sylixos.cleanpro', cleanSylixOSPro);
    let cleanbuildprocmd = vscode.commands.registerCommand('vscode-js-sylixos.cleanbuildpro', cleanBuildPro);

    context.subscriptions.push(buildprocmd);
	context.subscriptions.push(cleanprocmd);
    context.subscriptions.push(cleanbuildprocmd);
}