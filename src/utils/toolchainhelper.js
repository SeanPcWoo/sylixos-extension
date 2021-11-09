const path = require('path');
const vscode = require('vscode');

const toolChainHelper = {
    toolChainPath: new Array(),
    compileRootPath: null,
    realEvoIdePath: null,
    
    /**
     * 尝试获取编译器的根目录,如果获取失败,则会更新编译器根目录
     */
    toolChainPathUpdate() {
        let envPath = process.env.PATH.split(path.delimiter);
        envPath.forEach(path => {
            if ((path.indexOf("RealEvo") != -1) && (path.indexOf("compiler") != -1)) {
                this.toolChainPath.push(path);
            }
        });
    },

    /* 根据编译器前缀，获取指定架构的编译工具链地址 */
    toolChainGet(toolChainPrefix) {
        if (this.toolChainPath.length == 0) {
            this.toolChainPathUpdate();
        }

        let tooChainPath = this.toolChainPath.find(toolChain => {
            return toolChain.indexOf(toolChainPrefix.split("-")[0]) != -1;
        });

        if (tooChainPath) {
            tooChainPath = path.join(tooChainPath, "/" + toolChainPrefix + "gcc.exe");
            return tooChainPath;
        }

        return null;
    },

    toolChainRootPathUpdate() {
        /* 需要获取用户的编译器根目录 */
        let envPath = process.env.PATH.split(path.delimiter);
        for (let i = 0; i < envPath.length; i++) {
            if ((envPath[i].indexOf("RealEvo") != -1) && (envPath[i].indexOf("compiler") != -1)) {
                /* 通过环境变量找到了编译器根目录 */
                /* compilePath:  D:\\ACOINFO\\RealEvo\\compiler\\arm-none-toolchain\\bin */
                let compilePath = path.parse(envPath[i]);
                /* compilePath.dir:  D:\\ACOINFO\\RealEvo\\compiler\\arm-none-toolchain */
                let compileRootPath = path.normalize(path.dirname(compilePath.dir));
                this.compileRootPath = compileRootPath;
                this.realEvoIdePath = path.dirname(compileRootPath);
                return;
            }
        }
    },
}

module.exports = toolChainHelper;