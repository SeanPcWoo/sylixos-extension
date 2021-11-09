const fs = require('fs');
const readline = require('readline');

/* 这个工具用于简单分析一个 makefie 的内容 */
const simpleMakefile = {
    /* 从一个 makefile 文件中获取到一个变量的定义内容，如果这个定义是多出地方，则对应返回值数组的不同元素 */
    getArgumentDefineInMk(file, Argument) {
        return new Promise((resolve, reject) => {
            let defines = [];
            let unfinish = false;
            let inStream;

            if (!fs.existsSync(file)){
                resolve(defines);
            }

            try {
                inStream = fs.createReadStream(file);
            } catch (err) {
                resolve(defines);
            }

            const rl = readline.createInterface(inStream);
            rl.on('line', function (line) {
                line = line.trim()

                if ((line.indexOf(`${Argument} =`) != -1 || line.indexOf(`${Argument} :=`) != -1 || 
                    line.indexOf(`${Argument} ?=`) != -1 || line.indexOf(`${Argument} +=`) != -1 ||
                    line.indexOf(`${Argument}=`) != -1 || line.indexOf(`${Argument}:=`) != -1 || 
                    line.indexOf(`${Argument}?=`) != -1 || line.indexOf(`${Argument}+=`) != -1)
                    && line.indexOf('#') == -1) {
                    /* 找到定义的那一行了 */
                    /* 首先去掉定义的那部分内容 */
                    line = line.slice(line.indexOf('=') + 1, line.length)

                    if (line.charAt(line.length - 1) == '\\') {
                        /* 当前定义是分好几行写的 */
                        unfinish = true;
                        /* 去掉结尾的 \  */
                        line = line.slice(0, line.length - 1);
                    } else {
                        unfinish = false;
                    }

                    defines.push(line);

                } else if (unfinish) {
                    let val = defines.pop() + line;
                    defines.push(val);

                    if (line.charAt(line.length - 1) == '\\') {
                        /* 当前定义是分好几行写的 */
                        unfinish = true;
                    } else {
                        unfinish = false;
                    }
                }
            });

            rl.on('close', function () {
                resolve(defines);
            });
        });
    },

    /* 从多个 makefile 文件中获取到一个变量的定义内容，如果这个定义是多出地方，则对应返回值数组的不同元素 */
    async getArgumentDefineInMks(files, argument){
        if (typeof(files) != "object") {
            files = [files];
        }

        let defines = [];

        let p = files.map(async (file) => {
            let define = await this.getArgumentDefineInMk(file, argument);
            defines.push.apply(defines, define);
        });
        
        await Promise.all(p);

        return defines;
    },

    /* 将变量定义数组进行格式，即汇聚成一个一维数组，且去除 \ 和 无效空格等内容 */
    arguementDefineFromat(arguementDefine) {
        let formatDefines = [];
        arguementDefine.forEach((item) => {
            /* 空格替代 \ */
            item = item.replace(/\\/g, " ");

            /* 按空格分割成数组 */
            let arr = item.split(" ");

            /* 去除空元素 */
            arr = arr.filter(item => item != "");

            /* 合并入格式化结果数组 */
            formatDefines.push.apply(formatDefines, arr);
        });

        return formatDefines;
    },

    /* 从一个定义中，获取新的变量名称集合，如 -I"$(WORKSPACE_ucdk)/ucd" 获取到新的变量名 WORKSPACE_ucdk */
    getNewArguments(arguementDefine) {
        let arg = new Object();
        arguementDefine.forEach((item) => {
            if (item.indexOf("$(") != -1) {
                let str = item.slice(item.indexOf("$(") + 2, item.length);
                str = str.slice(0, str.indexOf(")"));
                arg[str] = str;
            }
        });

        return arg;
    },

    async getArgumentFromMakefiles(files, Argument) {
        if (typeof(files) != "object") {
            files = [files];
        }
        let defines = this.arguementDefineFromat(await this.getArgumentDefineInMks(files, Argument));
        let newArgs = this.getNewArguments(defines);

        if (JSON.stringify(newArgs) != "{}") {
            /* 说明其中还存在一些新的变量未知 */
            let p = Object.keys(newArgs).map(async function (key) {
                let newArgDefine = await simpleMakefile.getArgumentFromMakefiles(files, key);
                if (newArgDefine != '') {
                    newArgs[key] = newArgDefine;
                }
            });

            await Promise.all(p);

            /* 找遍了所有的内容了，为变量替换成变量内容 */
            defines = defines.map((define) => {
                Object.keys(newArgs).map(key => {
                    define = define.replace(`$(${key})`, newArgs[key]);
                });
                return define;
            });
        } 

        return defines;
    }
}

module.exports = simpleMakefile;