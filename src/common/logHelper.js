const vscode = require('vscode');
const moment = require('../utils/moment');

const channelName = 'SylixOS 插件日志';

const logHelper = {
    channel: null,

    logInit() {
        this.channel = vscode.window.createOutputChannel(channelName);
    },

    logAppend(content, show = false, time = false){
        if (time) {
            this.channel.append(`[${moment(new Date().getTime()).format('MM-DD HH:mm:ss')}] ` + content);
        } else {
            this.channel.append(content);
        }
        
        if (show) {
            this.logShow();
        }
    },

    logAppendLine(content, show = false){
        this.channel.appendLine(`[${moment(new Date().getTime()).format('MM-DD HH:mm:ss')}] ` + content);
        if (show) {
            this.logShow();
        }
    },

    logShow(){
        this.channel.show();
    },

    logClear(){
        this.channel.clear();
    }
}

module.exports = logHelper;