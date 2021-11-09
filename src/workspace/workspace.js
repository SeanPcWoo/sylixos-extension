
const vscode = require('vscode');
const  {projectGenPath, projectGenName, Project} = require('../project/project');
const {eventEngine, eventMange} = require('../workspace/eventEngine');
const envMange = require('./envmange');
const logHelper = require('../common/logHelper');

let workspace = {
    projects:[],
    async importProject(uri){
        const projectPath = await projectGenPath(uri);
        const projectName = await projectGenName(uri);
        if (projectName && projectPath) {
            let project = new Project(uri, projectName, projectPath);
            this.projects.push(project);
            eventEngine.emit('project.import', project);
            return project;
        }
        return null;
    },

    async removeProject(projectName){
        if (projectName) {
            eventEngine.emit('project.remove', projectName);
        }
        return true;
    },

    getProject(projectName, projectPath){
        return this.projects.find(project => project.name == projectName && project.path == projectPath);
    },

    async workspaceProjectInit() {
        if (vscode.workspace.workspaceFolders.length > 0) {
            let p = vscode.workspace.workspaceFolders.map(async folder => {
                await this.importProject(folder.uri);
            });
            await Promise.all(p);
        }
    },

    /* 启动 Vsocde 时调用 */
    async worksapceInit() {
        /* 这里加了一个符合 ACOINFO IDE 的配置：即双击才展开文件夹，单击选中文件夹 */
        vscode.workspace.getConfiguration('workbench').update('tree.expandMode', 'doubleClick');

        /* 初始化 workspace 的环境变量 */
        await envMange.workspaceEvnInit();

        /* 初始化事件管理系统 */
        eventMange.eventInit();

        /* 遍历当前 workspace 里的所有工程目录，为所有内容设置好处理逻辑 */
        await this.workspaceProjectInit();
    }
}

module.exports = workspace;