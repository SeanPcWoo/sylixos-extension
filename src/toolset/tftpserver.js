const vscode = require('vscode');
const tftpHelper = require('../utils/tftphelper');
const { eventEngine } = require('../workspace/eventEngine');
const moment = require('../utils/moment');

/* 创建底部的 bar item  */
let tftpServerItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
const channel = vscode.window.createOutputChannel('SylixOS TFTP Server 信息');

const TftpSetBarStartItem = {
    label:'Start',
    description: "start tftp server",
    detail:'启动 TFTP 服务器'
};

const TftpSetBarStopItem = {
    label:'Stop',
    description: "stop tftp server",
    detail:'停止 TFTP 服务器'
};

const TftpSetBarConfigItem = {
    label:'Config',
    description: "config tftp server",
    detail:'配置 TFTP 服务器相关内容'
};

function addToTftpServer(uri) {
    if (uri) {
        console.log(uri);
        tftpHelper.ServerFileAdd(uri.fsPath);
    }
}

async function tftpServerSet() {
    let tftpSetBarItems = [];
    if (tftpHelper.ServerRunStatus()) {
        tftpSetBarItems.push(TftpSetBarStopItem);
    } else {
        tftpSetBarItems.push(TftpSetBarStartItem);
    }
    tftpSetBarItems.push(TftpSetBarConfigItem);

    const selection = await vscode.window.showQuickPick(tftpSetBarItems);

    if (!selection) {
        return;
    }

    switch (selection.label) {
        case "Start":
            const port = await vscode.window.showInputBox({ title: "TFTP 服务器端口号", value:69, ignoreFocusOut: true });
            if (port) {
                tftpHelper.ServerStart(port);
            }
            break;
        case "Stop":
            tftpHelper.ServerStop();
            break;
        case "Config":
            console.log('chose Config');
            break;
        default:
            break;
    }
}

function tftpServerStatusUpdate () {
    const WorkspaceSetting = vscode.workspace.getConfiguration('WorkspaceSetting');

    tftpServerItem.text = tftpHelper.ServerRunStatus() ? `TFTP: $(check)` : `TFTP: $(close)`;

    /* 更新 workspace configuration */
    if (tftpHelper.ServerRunStatus() != WorkspaceSetting.tftpEnable) {
        WorkspaceSetting.update('tftpEnable', tftpHelper.ServerRunStatus());
    }
    
    if (tftpHelper.ServerGetPort() != WorkspaceSetting.tftpPort) {
        WorkspaceSetting.update('tftpPort', tftpHelper.ServerGetPort());
    }
}

function  tftpServerError(err) {
    if (err.indexOf('bind') != -1) {
        vscode.window.showErrorMessage(`TFTP Server 启动失败: 绑定端口失败！\n`);
    } else {
        vscode.window.showErrorMessage(`TFTP Server 出错: ${err}\n`);
    }
}

function  tftpServerSend (status, filename, error) {
    switch (status) {
        case "start":
            channel.appendLine(`[${moment(new Date().getTime()).format('MM-DD HH:mm:ss')}] ${filename}: 传输开启`);
            break;
        case "finish":
            channel.appendLine(`[${moment(new Date().getTime()).format('MM-DD HH:mm:ss')}] ${filename}: 传输完成`);
            break;
        case "error":
            channel.appendLine(`[${moment(new Date().getTime()).format('MM-DD HH:mm:ss')}] ${filename}: 传输出错:${error}`);
            break;
        default:
            break;
    }
    channel.show();
}

function tftpServeraddFile(file) {
    const WorkspaceSetting = vscode.workspace.getConfiguration('WorkspaceSetting');
    WorkspaceSetting.update('tftpContent', tftpHelper.ServerGetFiles());

    channel.appendLine(`[${moment(new Date().getTime()).format('MM-DD HH:mm:ss')}] TFTP 服务器添加新内容: ${file}`);
}

function tftpServerConfigurationHandle() {
    const WorkspaceSetting = vscode.workspace.getConfiguration('WorkspaceSetting');

    tftpHelper.ServerFileListUpdate(WorkspaceSetting.tftpContent);

    if (WorkspaceSetting.tftpEnable) {
        tftpHelper.ServerStart(WorkspaceSetting.tftpPort);
    } else {
        tftpHelper.port = WorkspaceSetting.tftpPort;
        tftpHelper.ServerStop();
    }
}

module.exports = function (context) {
    let add2TftpServerCmd = vscode.commands.registerCommand('vscode-js-sylixos.addToTftpServer', addToTftpServer);
    let tftpServerSetCmd = vscode.commands.registerCommand('vscode-js-sylixos.tftpServerSet', tftpServerSet);

    tftpServerItem.text = `TFTP: $(close)`;
    tftpServerItem.command = "vscode-js-sylixos.tftpServerSet";
    tftpServerItem.show();

    eventEngine.on('tftpserver.update', tftpServerStatusUpdate);
    eventEngine.on('tftpserver.send', tftpServerSend);
    eventEngine.on('tftpserver.error', tftpServerError);
    eventEngine.on('tftpserver.addFile', tftpServeraddFile);

    eventEngine.on('workspace.configuration.tftpserver', tftpServerConfigurationHandle);

    /* 初始化时，从 configuration 获取上一次的状态并进行恢复 */
    tftpServerConfigurationHandle();

    context.subscriptions.push(add2TftpServerCmd);
    context.subscriptions.push(tftpServerSetCmd);
}
