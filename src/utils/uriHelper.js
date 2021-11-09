
const vscode = require('vscode');

/* 在命令和快捷键操作时，将工程目录内容的任意 uri 转为 工程 uri */
const uriHelper = {
    async uri2ProjectUri(uri) {
        /* 这里的 uri 可能为空；如果右击，则不为空，如果快捷键，则为空。*/
        if (!uri) {
            // so triggered by a keybinding
            await vscode.commands.executeCommand('copyFilePath');
            uri = await vscode.env.clipboard.readText();  

            // see note below for parsing multiple files/folders
            uri = vscode.Uri.file(uri);  
        }

        /* 通过传进来的 uri 找到 workspace 里对用的最上层的文件夹 uri  */
        return vscode.workspace.getWorkspaceFolder(uri).uri;
    },
}

module.exports = uriHelper;
