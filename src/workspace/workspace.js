
const vscode = require('vscode');
const  {projectGenPath, projectGenName, Project} = require('../project/project');
const {eventEngine, eventMange} = require('../workspace/eventEngine');
const envMange = require('./envmange');
const path = require('path');

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
        const index = this.projects.findIndex(project => project.name == projectName);
        if (index != -1) {
            eventEngine.emit('project.remove', projectName);
            this.projects.splice(index, 1);
        }
        return true;
    },

    getProject(projectName, projectPath){
        return this.projects.find(project => project.name == projectName && project.path == projectPath);
    },

    /* 通过工程中的一个文件路径获取工程结点 */
    getProjectByFile(filePath){
        if (!filePath) {
            return null;
        }
        return this.projects.find(project => {
            const relative = path.relative(project.path, filePath);
            return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
        });
    },

    projectInitFinishEvent(project){
        /* 遍历一下，看是否是所有的任务都已经初始化完成 */
        let allFinish = true;
        for (let i = 0; i < this.projects.length; i++) {
            if (!this.projects[i].initFinish) {
                allFinish = false;
            }
        }

        /* 如果都完成了，就更新一下 workspace 的环境变量 */
        if (allFinish) {
            let env = {};
            this.projects.forEach(project => {
                env[`WORKSPACE_${project.name}`] = project.path;
            });
            envMange.addWorkspaceEnv(env);
        }
    },

    async workspaceProjectInit() {
        eventEngine.on('project.init.finish', this.projectInitFinishEvent.bind(this));
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            let p = vscode.workspace.workspaceFolders.map(async folder => {
                await this.importProject(folder.uri);
            });
            await Promise.all(p);
        }
    },

    /* 启动 Vsocde 时调用 */
    async worksapceInit() {
        /* 这里加了符合 ACOINFO IDE 的配置：即双击才展开文件夹，单击选中文件夹； GBK 编码 */
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