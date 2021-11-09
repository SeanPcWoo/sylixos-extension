const vscode = require('vscode');

/* 创建两个底部的 bar item：
infoshowitem 用于显示信息；
handleitem：用于点击实现相关操作 */
let infoshowitem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
let handleitem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
infoshowitem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
handleitem.backgroundColor = new vscode.ThemeColor("statusBarItem.errorBackground");

const statusBar = {
    infobarshow(msg = null){
        if (msg) {
            infoshowitem.text = msg;
        }
        infoshowitem.show();
    },

    infobarhide(){
        infoshowitem.hide();
    },

    infobarbg(backgroundColor){
        infoshowitem.backgroundColor = backgroundColor;
    },

    handlebarshow(msg = null){
        if (msg) {
            handleitem.text = msg;
        }
        handleitem.show();
    },

    handlebarhide(){
        handleitem.hide();
    },

    handlebarbg(backgroundColor){
        handleitem.backgroundColor = backgroundColor;
    },

    handlebarcmd(command){
        handleitem.command = command;
    },

    allshow(infomsg, handlemsg){
        this.infobarshow(infomsg);
        this.handlebarshow(handlemsg);
    }

}

module.exports = statusBar;