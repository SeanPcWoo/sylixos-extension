const path = require('path');
const os = require('os');
const fs = require('fs');
const vscode = require('vscode');
const { eventEngine } = require('../workspace/eventEngine');

const toolChainHelper = {
    toolChainPath: [],
    compileRootPath: null,
    realEvoIdePath: null,

    /* 根据编译器前缀，获取指定架构的 addr2line  */
    addr2LinePathGet(archPrefix){
        if (this.toolChainPath.length == 0) {
            return;
        }

        let addr2LinePath = this.toolChainPath.find(toolChain => {
            return toolChain.indexOf(archPrefix.split("-")[0]) != -1;
        });

        if (addr2LinePath) {
            if (os.type().indexOf('Windows') != -1) {
                addr2LinePath = path.join(addr2LinePath, "/" + archPrefix + "addr2line.exe");
            } else if (os.type().indexOf('Linux') != -1) {
                addr2LinePath = path.join(addr2LinePath, "/" + archPrefix + "addr2line");
            }
            return addr2LinePath;
        }

        return null;
    },

    /* 根据编译器前缀，获取指定架构的编译工具链地址 */
    toolChainGet(toolChainPrefix) {
        if (this.toolChainPath.length == 0) {
            return;
        }

        let tooChainPath = this.toolChainPath.find(toolChain => {
            return toolChain.indexOf(toolChainPrefix.split("-")[0]) != -1;
        });

        if (tooChainPath) {
            if (os.type().indexOf('Windows') != -1) {
                tooChainPath = path.join(tooChainPath, "/" + toolChainPrefix + "gcc.exe");
            } else if (os.type().indexOf('Linux') != -1) {
                tooChainPath = path.join(tooChainPath, "/" + toolChainPrefix + "gcc");
            }
            return tooChainPath;
        }

        return null;
    },

    linuxToolChainInit() {
        const ProjectSetting = vscode.workspace.getConfiguration('ProjectSetting');
        if (ProjectSetting.LinuxCompilePath) {
            this.compileRootPath = ProjectSetting.LinuxCompilePath;
            try {
                const files = fs.readdirSync(this.compileRootPath);
                if (files && files.length > 0) {
                    this.toolChainPath = files.map(file => {
                        if (file.indexOf('sylixos') != -1) {
                            return path.join(this.compileRootPath, `/${file}/bin`);
                        } else {
                            return '';
                        }
                    });
                }
            } catch (err) {
                console.log(err);
            }
        }
    },

    toolChainChangeInLinux() {
        toolChainHelper.linuxToolChainInit();
        /* 通知每一个 project ，编译器路径更新了 */
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const projectGenName = require('../project/project').projectGenName;
            vscode.workspace.workspaceFolders.forEach(async folder => {
                const projectName = await projectGenName(folder.uri);
                if (projectName) {
                    eventEngine.emit(`${projectName}.makefile.change`);
                }
            });
        }
    },

    toolChainInit() {
        /* 需要获取用户的编译器根目录 */
        if (os.type().indexOf('Windows') != -1) {
            /* Windows 下就通过 PATH 获取 IDE 和 编译器的根目录 */
            let envPath = process.env.PATH.split(path.delimiter);
            for (let i = 0; i < envPath.length; i++) {
                if ((envPath[i].indexOf("RealEvo") != -1) && (envPath[i].indexOf("compiler") != -1)) {
                    this.toolChainPath.push(envPath[i]);
                    if (!this.compileRootPath) {
                        /* 通过环境变量找到了编译器根目录 */
                        /* compilePath:  D:\\ACOINFO\\RealEvo\\compiler\\arm-none-toolchain\\bin */
                        let compilePath = path.parse(envPath[i]);
                        /* compilePath.dir:  D:\\ACOINFO\\RealEvo\\compiler\\arm-none-toolchain */
                        let compileRootPath = path.normalize(path.dirname(compilePath.dir));
                        this.compileRootPath = compileRootPath;
                        this.realEvoIdePath = path.dirname(compileRootPath);
                    }
                }
            }
        } else if (os.type().indexOf('Linux') != -1) {
            /* Linux 则需要用户自己去填写编译器的根目录 */
            const ProjectSetting = vscode.workspace.getConfiguration('ProjectSetting');
            if (!ProjectSetting.LinuxCompilePath) {
                /* 需要提示用户自己去设置一下 */
                vscode.window.showWarningMessage("SylixOS 获取编译器失败！请在 Linux 系统使用 'sudo -i' 进入特权模后，使用类似 'which aarch64-sylixos-elf-gcc' 命令获取编译器根目录。\
                                                 然后在 vscode 设置中搜索 'LinuxCompilePath'， 将路径填入。如：命令输出结果为: '/opt/aarch64-sylixos-elf-gcc', 则只需将 'LinuxCompilePath' 设置为 '/opt'");
            } else {
                this.linuxToolChainInit();
            }
        }

    },
}

module.exports = toolChainHelper;