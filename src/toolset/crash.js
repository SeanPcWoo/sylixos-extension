const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const workspace = require('../workspace/workspace');
const toolChainHelper = require('../utils/toolchainhelper');
const execSync = require('child_process').execSync;

const _onDidChangeTreeData = new vscode.EventEmitter();

function getHexNum(num) {
    let newHexNum;
    if (Boolean(num.match(/^0x[0-9a-f]+$/i))) {
        return num;
    }
    newHexNum = '0x' + num.toString();
    if (Boolean(newHexNum.match(/^0x[0-9a-f]+$/i))) {
        return newHexNum;
    }
    return null;
}

/* 右击一个可执行文件，加入到 crash 分析工具中 */
async function addFileToCrashTool(uri) {
    if (!uri || !uri.scheme || uri.scheme != 'file' || !uri.path) {
        console.log("this uri need to add to crash tool is err:", uri);
        vscode.window.showErrorMessage("添加到分析工具失败，请选择一个正确的 SylixOS 可执行文件！");
        return;
    }

    try {
        const stat = fs.statSync(uri.fsPath);
        if (stat && stat.isFile()) {
            /* 获取工程属性和架构 */
            const project = workspace.getProjectByFile(uri.fsPath);
            let addr2linePath = null;
            if (!project || !project.compilerPath) {
                const archPrefix = await vscode.window.showQuickPick(["arm-sylixos-eabi-", "aarch64-sylixos-elf-",
                    "csky-sylixos-elfabiv2-", "mips-sylixos-elf", "mips64-sylixos-elf", "ppc-sylixos-eabi", "riscv-sylixos-elf-",
                    "x86_64-sylixos-elf-", "i386-sylixos-elf"], {
                    canPickMany: false,
                    placeHolder: `获取可执行文件架构失败，请手动指定架构前缀`,
                });
                if (archPrefix) {
                    /* 通过架构获取 addr2line 的路径 */
                    addr2linePath = toolChainHelper.addr2LinePathGet(archPrefix);
                    if (!addr2linePath) {
                        vscode.window.showErrorMessage("添加到分析工具失败，没能成功获取编译器信息！");
                        return;
                    }
                } else {
                    return;
                }
            } else {
                addr2linePath = project.compilerPath.replace(/gcc/g, 'addr2line');
            }

            let fileTreeItem = new vscode.TreeItem(path.basename(uri.fsPath), vscode.TreeItemCollapsibleState.Expanded);
            fileTreeItem.contextValue = "execfile";
            fileTreeItem.resourceUri = vscode.Uri.file(uri.fsPath);
            fileTreeItem.description = "基地址未设置";
            fileTreeItem.iconPath = vscode.ThemeIcon.Folder;
            fileTreeItem.addr2linePath = addr2linePath;
            fileTreeItem.filePath = uri.fsPath;
            fileTreeItem.functionItems = [];
            crashToolProvider.fileTreeItems.push(fileTreeItem);
            crashToolProvider.refresh();
            return;
        }
    } catch (err) {
        console.error("add file to crash failed:", err);
    }
    vscode.window.showErrorMessage("添加到分析工具失败，请选择一个正确的 SylixOS 可执行文件！");
    return;
}

/* 在 crash tool 工程上点击，添加一个新文件 */
async function crashToolAddFile() {
    const file = await vscode.window.showInputBox({ title: "需要分析的文件路径", prompt: "请不要选择 strip 目录下的可执行文件", ignoreFocusOut: true });

    if (file) {
        addFileToCrashTool(vscode.Uri.file(file));
    }
}

/* 给一个待分析的可执行文件设置运行基地址 */
async function crashToolSetBaseAddr(element) {
    let baseAddr = await vscode.window.showInputBox({ title: "输入可执行文件基地址", prompt: "包不包含 '0x' 均可", ignoreFocusOut: true });

    if (baseAddr) {
        baseAddr = getHexNum(baseAddr);
        if (baseAddr) {
            crashToolProvider.fileTreeItems.forEach(treeitem => {
                if (treeitem == element) {
                    treeitem.baseAddr = baseAddr;
                    treeitem.description = '基地址:' + baseAddr;
                    crashToolProvider.refresh();
                }
            });
        } else {
            vscode.window.showErrorMessage("基地址设置失败，请设置一个合法的 16 进制地址！");
        }
    }
}
/* 给定一个运行地址进行分析 */
async function analyseAddr(element) {
    let anaAddr = await vscode.window.showInputBox({ title: "输入可执行文件需要分析的地址", prompt: "包不包含 '0x' 均可", ignoreFocusOut: true });

    if (anaAddr) {
        anaAddr = getHexNum(anaAddr);
        if (!anaAddr) {
            vscode.window.showErrorMessage("分析地址设置失败，请设置一个合法的 16 进制地址！");
            return;
        }
        crashToolProvider.fileTreeItems.forEach(treeitem => {
            if (treeitem == element) {
                if (!treeitem.baseAddr) {
                    vscode.window.showErrorMessage("请先设置运行基地址！");
                    return;
                }
                /* 计算地址偏差 */
                const addr = anaAddr - treeitem.baseAddr;
                if (addr < 0) {
                    vscode.window.showErrorMessage("当前分析地址小于运行基地址！");
                    return;
                }
                try {
                    console.log('cmd:', `${treeitem.addr2linePath} -f -e ${treeitem.filePath} -a ${addr.toString(16)}`)
                    const ret = execSync(`${treeitem.addr2linePath} -f -e ${treeitem.filePath} -a ${addr.toString(16)}`);
                    if (!ret) {
                        throw ('没能获取结果');
                    }

                    const result = ret.toString().split('\n');
                    if (result.length < 3 || result[2].indexOf('?') != -1) {
                        throw ('结果为:' + ret.toString());
                    }

                    const fileName = result[2].slice(0, result[2].lastIndexOf(':'));
                    const line = result[2].slice(result[2].lastIndexOf(':') + 1, result[2].lastIndexOf('('));

                    let functionItem = new vscode.TreeItem(`[${anaAddr}]\t${result[1]}:${line}`, vscode.TreeItemCollapsibleState.None);
                    functionItem.iconPath = vscode.ThemeIcon.File;
                    functionItem.resourceUri = vscode.Uri.file(path.normalize(fileName));
                    functionItem.command = {
                        command: 'vscode-js-sylixos.openAnaSpecFile',
                        arguments: [result],
                    }

                    treeitem.functionItems.push(functionItem);
                    crashToolProvider.refresh();
                } catch (err) {
                    vscode.window.showWarningMessage("分析失败:", err);
                }

            }
        });
    }
}

function openAnaSpecFile(result) {
    const fileName = result[2].slice(0, result[2].lastIndexOf(':'));
    const line = result[2].slice(result[2].lastIndexOf(':') + 1, result[2].lastIndexOf('('));

    vscode.workspace.openTextDocument(vscode.Uri.file(fileName)).then(doc => {
        vscode.window.showTextDocument(doc).then(editor => {
            const range = new vscode.Range(new vscode.Position(Number(line), 0), new vscode.Position(Number(line), 0));
            editor.revealRange(range);
        })
    });
}

function crashToolRemove() {
    crashToolProvider.fileTreeItems = [];
    crashToolProvider.refresh();
}

const crashToolProvider = {
    fileTreeItems: [],
    onDidChangeTreeData: _onDidChangeTreeData.event,

    refresh() {
        _onDidChangeTreeData.fire();
    },

    getTreeItem(element) {
        return element;
    },
    getChildren(element) {
        if (!element) {
            return Promise.resolve(this.fileTreeItems);
        } else if (element.functionItems) {
            return Promise.resolve(element.functionItems);
        }
    },
};

module.exports = function (context) {
    let addFile2ToolDisposable = vscode.commands.registerCommand('vscode-js-sylixos.addToCrashTool', addFileToCrashTool);
    let crashToolAddFileDisposable = vscode.commands.registerCommand('vscode-js-sylixos.crashToolAddFile', crashToolAddFile);
    let crashToolRemoveDisposable = vscode.commands.registerCommand('vscode-js-sylixos.crashToolRemove', crashToolRemove);
    let anaDisposable = vscode.commands.registerCommand('vscode-js-sylixos.crashToolAnaly', analyseAddr);
    let SetBaseAddrDisposable = vscode.commands.registerCommand('vscode-js-sylixos.crashToolSetBaseAddr', crashToolSetBaseAddr);
    let openAnaSpecFileDisposable = vscode.commands.registerCommand('vscode-js-sylixos.openAnaSpecFile', openAnaSpecFile);

    vscode.window.registerTreeDataProvider(
        'SylixOSCrashTool',
        crashToolProvider
    );

    context.subscriptions.push(addFile2ToolDisposable);
    context.subscriptions.push(crashToolAddFileDisposable);
    context.subscriptions.push(crashToolRemoveDisposable);
    context.subscriptions.push(anaDisposable);
    context.subscriptions.push(SetBaseAddrDisposable);
    context.subscriptions.push(openAnaSpecFileDisposable);
}