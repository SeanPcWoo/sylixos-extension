const eventCommonEnging = require('../common/eventEngine');
const vscode = require('vscode');
const path = require('path');
const uriHelper = require('../utils/uriHelper');
const logHelper = require('../common/logHelper');
const os = require('os');

const eventEngine = new eventCommonEnging('SylixOSWorkspace');

const eventMange = {
    /* 当用户更改了工程配置后的事件处理函数 */
    configurationChangeEvent(event) {
        const projectGenName = require('../project/project').projectGenName;
        if (event.affectsConfiguration('ProjectSetting.LinuxCompilePath')) {
            if (os.type() == 'Linux') {
                /* 只在 Linux 下才做对应的操作 */
                eventEngine.emit('linux.compilepath.change');
            }
        }

        /* workspace 相关的 configuration 发生变化 */
        if (event.affectsConfiguration('WorkspaceSetting')) {
            eventEngine.emit('workspace.configuration.tftpserver');
        }

        if (vscode.workspace.workspaceFolders !== undefined) {
            vscode.workspace.workspaceFolders.forEach(async (folder) => {
                /* 工程设置属性发生的变化 */
                if (event.affectsConfiguration('ProjectSetting', folder.uri)) {
                    const projectName = await projectGenName(folder.uri);
                    if (projectName) {
                        eventEngine.emit(`${projectName}.build.change`);
                    }
                }

                if (event.affectsConfiguration('Upload', folder.uri)) {
                    const projectName = await projectGenName(folder.uri);
                    if (projectName) {
                        eventEngine.emit(`${projectName}.upload.change`);
                    }
                }
            })
        }
    },

    /* 当 workspace 发生导入文件夹和移除文件夹的事件处理 */
    async workspaceFoldersChangeEvent(event) {
        const workspace = require('./workspace');
        if (event.added.length > 0) {
            let p = event.added.map(async folder => {
                if (await workspace.importProject(folder.uri)) {
                    logHelper.logAppendLine('添加了一个工程: ' + folder.uri.fsPath);
                }

                /* 给每一个新导入的文件夹注册一个监听事件 */
                vscode.workspace.createFileSystemWatcher(
                    new vscode.RelativePattern(folder, "Makefile")).onDidCreate(
                        async uri => await workspace.importProject(await uriHelper.uri2ProjectUri(uri)));

                return true;
            });
            await Promise.all(p);
        }

        if (event.removed.length > 0) {
            let p = event.removed.map(async folder => {
                if (await workspace.removeProject(folder.name)) {
                    logHelper.logAppendLine('移除了一个工程: ' + folder.uri.fsPath);
                }

                return true;
            });
            await Promise.all(p);
        }
    },

    /* 文件重命名的事件处理 */
    fileRenameEvent({ oldUri, newUri }) {

        vscode.window.showInformationMessage('重命名了一个文件: ' + newUri.fsPath);
    },

    /* 某个文件发生了保存行为的事件处理 */
    async textDocumentSaveEvent(TextDocument) {
        const projectGenName = require('../project/project').projectGenName;

        /* 判断是不是 makefile 之类的文件 */
        if (path.extname(TextDocument.fileName) == ".mk" || path.basename(TextDocument.fileName) == "Makefile" ||
            path.basename(TextDocument.fileName) == "makefile") {
            const projectName = await projectGenName(TextDocument.uri);
            if (projectName) {
                eventEngine.emit(`${projectName}.makefile.change`);
            }
        }
    },

    /* 事件处理函数的注册 */
    eventInit() {
        vscode.workspace.onDidChangeConfiguration(this.configurationChangeEvent);
        vscode.workspace.onDidChangeWorkspaceFolders(this.workspaceFoldersChangeEvent);
        vscode.workspace.onDidRenameFiles(this.fileRenameEvent);
        vscode.workspace.onDidSaveTextDocument(this.textDocumentSaveEvent);
    }
}

module.exports = { eventEngine, eventMange };