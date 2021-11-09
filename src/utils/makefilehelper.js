const fs = require('fs');
const path = require('path');
const readline = require('readline');
const stream = require('stream');
const util = require('util');
const spawn = require('child_process').spawn;
const exists = util.promisify(require('fs').exists);


const deepFlattenEx = arr => [].concat(...arr.map(v => (Array.isArray(v) ? deepFlatten(v) : v)));
const deepFlatten = arr => deepFlattenEx(arr).filter(res => { return res != null });

/**
  * 支持读取 make -p 命令后会生成对应的工程 makefile 的规则信息文件
  * 支持读取规则信息文件指定变量内容
  */
const makefileHelper = {
    /**
    * 在一个工程中, 通过 make -qp 命令,生成一个当前工程的 makefile 规则和变量文件
    */
    async makefileRulesGet(file, writeALlData = false, envExt = {}) {
        return new Promise((resolve, reject) => {
            let rulesStream = fs.createWriteStream(file, { flags: 'w' });
            let child = spawn("make", ["-p"], { cwd: path.dirname(path.dirname(file)), env: envExt });
            const rl = readline.createInterface(child.stdout, rulesStream);

            if (writeALlData) {
                child.stdout.pipe(rulesStream);
            } else {
                const regEx = new RegExp(/_CFLAGS |LOCAL_INC_PATH |SYLIXOS_BASE_PATH |_DSYMBOL /, "g")  // i 表示对大小写不敏感
                rl.on('line', function (line) {
                    let res = line.match(regEx);
                    if (res != undefined && line.indexOf("#") == -1) {
                        rulesStream.write(line + "\n");
                    }
                });
            }

            child.on('close', function (code) {
                resolve(file);
            });
        })
    },

    /**
     * 获取文件内，指定（正则表达式）的内容
     * file: 文件绝对地址
     * SpecName：正则表达式
     * line：是否读取整行内容，如果为 true，则读取匹配的一整行
     */
    findSpecContentInFile(file, SpecName, lineContent = false) {
        let content = new Array();
        return new Promise((resolve) => {
            const inStream = fs.createReadStream(file);
            const outStream = new stream;
            const rl = readline.createInterface(inStream, outStream);
            const regEx = new RegExp(SpecName, "g")  // i 表示对大小写不敏感
            rl.on('line', function (line) {
                let res = line.match(regEx);
                if (res != undefined && line.indexOf("#") == -1) {
                    lineContent ? content.push(line) : content.push(res);
                }
            });
            rl.on('close', function () {
                resolve(content);
            });
        });
    },

    /* 查找所有的 CFLAGS 变量行内容集合 */
    async getCflagsLines(file) {
        return await this.findSpecContentInFile(file, "_CFLAGS :=", true);
    },

    /* 查找所有的 LOCAL_INC_PATH 变量行内容集合 */
    async getLocalIncPathLines(file) {
        return await this.findSpecContentInFile(file, "LOCAL_INC_PATH =", true);
    },

    /* 解析出一行 _CFLAGS 具体的每一个参数  */
    getCflagsLineVals(cflagsLine) {
        const allvals = cflagsLine.slice(cflagsLine.indexOf('-'));

        return allvals.trim().split(/\s+/);
    },

    /* 解析出一行 LOCAL_INC_PATH 具体的每一个参数 */
    getCflagsLineVals(includeIncPathLine) {
        const allvals = includeIncPathLine.slice(includeIncPathLine.indexOf('='));

        return allvals.trim().split(/\s+/);
    },

    async makefileArgAnalysisInLine(lines, file) {
        let argVals = new Array();

        if (lines.length == 0) {
            return argVals;
        }
        /* 解析出具体的值数组 */
        lines.forEach(line => {
            let val = line.slice(line.indexOf('=') + 1);
            argVals.push.apply(argVals, val.trim().split(/\s+/));
        });

        /* 遍历数组元素，如果元素中还存在变量就递归查找 */
        for (let i = 0; i < argVals.length; i++) {
            /* 说明还有变量没有找到，那就继续递推查找 */
            while (argVals[i].indexOf("$(") !== -1) {
                let newArg = argVals[i].slice(argVals[i].indexOf("(") + 1, argVals[i].indexOf(")"));
                let newVal = await this.makefileArgAnalysis(file, newArg);
                /* 
                 * 组装变量内容, 这里的方法是将原来的变量的值 argVals[i] 如 $(xx) 中的 xx 去掉，换成了新求出的值 newVal，同时去除了 $() 符号
                 * newVal 可能是一个数组，此时，xx 被替换的内容就是数组转成了字符串，这里用空格来分隔
                 */
                argVals[i] = argVals[i].slice(0, argVals[i].indexOf("$")) + newVal.join(" ") + argVals[i].slice(argVals[i].indexOf(")") + 1, argVals[i].length)
            }
        }

        /* 
         * 首先合并数组，并将空元素去除，这些空元素是因为没有找到对应的变量值产生的
         */
        return Array.from(new Set(argVals)).filter(function (e) { return e });
    },

    /* 
     * 尽力去分析出 makefile 变量的最终值
     * 如查找 LOCAL_INC_PATH 变量时，最终返回的结果为： [ '-I"./." -I"./src" -I"./src/include"']
     */
    async makefileArgAnalysis(file, Argument) {
        let argVals = new Array();
        let p1, p2;

        /* 如果文件不存在，则先生成文件 */
        if (!await exists(file)) {
            await this.makefileRulesGet(file);
        }

        /* 先获取含有此变量名字定义的行内容 */
        let line1 = Array.from(new Set(await this.findSpecContentInFile(file, `${Argument} =`, true)));
        if (line1) {
            p1 = this.makefileArgAnalysisInLine(line1, file);
        }

        let line2 = Array.from(new Set(await this.findSpecContentInFile(file, `${Argument} :=`, true)));
        if (line2) {
            p2 = this.makefileArgAnalysisInLine(line2, file);
        }

        let result = await Promise.all([p1, p2]);
        argVals.push.apply(argVals, result[0]);
        argVals.push.apply(argVals, result[1]);

        return argVals;
    },

    /* 解析一个文件中所有的 CFLAGS 变量参数 */
    async getCflagsValsFromFile(file) {
        let cflagsVals = new Array();
        const cflagsLines = await this.getCflagsLines(file);

        if (cflagsLines == null) {
            return cflagsVals;
        }

        /* 解析出所有的 flags 的参数内容 */
        cflagsLines.forEach(cflagsLine => {
            cflagsVals.push.apply(cflagsVals, this.getCflagsLineVals(cflagsLine));
        });

        return cflagsVals;
    },

    /* 通过 CFLAGS 参数数组中的 Define 信息, defineFlag: 输出结果是否带 '-D' 参数, 默认 false 不带*/
    getDefineInCflags(cflagsVals, defineFlag = false) {
        let defineVal = new Array();
        cflagsVals.forEach(val => {
            if (val.slice(0, 2) == '-D') {
                defineVal.push(defineFlag ? val : val.slice(2));
            }
        });

        return defineVal;
    },

    /* 通过 CFLAGS 参数数组中的 Include 信息, includeFlag: 输出结果是否带 '-I' 参数, 默认 false 不带 */
    getIncludeInCflags(cflagsVals, includeFlag = false) {
        let includeVal = new Array();
        cflagsVals.forEach(val => {
            if (val.slice(0, 3) == '-I\"') {
                includeVal.push(includeFlag ? val : val.slice(3, val.length - 1));
            }
        });

        return includeVal;
    },

    /* 通过 Makefile 的规则文件，获取 CFLAGS 中的 -I  信息, includeFlag: 输出结果是否带 '-I' 参数, 默认 false 不带, 默认结果不带重复 Include 信息*/
    async getIncludeInCflagsWithFile(file, includeFlag = false) {
        let cflagsVals = await this.getCflagsValsFromFile(file);

        /* 从解析出的 flags 的参数内容中找出 include 信息,并且去掉重复的返回 */
        return Array.from(new Set(this.getIncludeInCflags(cflagsVals, includeFlag)));
    },

    /* 通过 Makefile 的规则文件，获取 Define 信息, defineFlag: 输出结果是否带 '-D' 参数, 默认 false 不带, 默认结果不带重复 define 信息*/
    async getDefineWithFile(file, defineFlag = false) {
        /* 如果文件不存在，则先生成文件 */
        if (!await exists(file)) {
            await this.makefileRulesGet(file);
        }

        let cflagsVals = await this.getCflagsValsFromFile(file);

        /* 从解析出的 flags 的参数内容中找出 define 信息,并且去掉重复的返回 */
        return Array.from(new Set(this.getDefineInCflags(cflagsVals, defineFlag)));
    },

    /* 通过 Makefile 的规则文件，获取 include Path 信息 */
    async getIncludeInfoWithFile(file) {
        let cflagsIncludeVal = new Array();
        let localIncludeVal = new Array();

        /* 如果文件不存在，则先生成文件 */
        if (!await exists(file)) {
            await this.makefileRulesGet(file);
        }

        if (file) {
            /* 获取 cflags 中 -I 相关的参数内容 */
            cflagsIncludeVal = await this.getIncludeInCflagsWithFile(file);

            /* 获取 LOCAL_INC_PATH 变量内容 */
            let res = await this.makefileArgAnalysis(file, "LOCAL_INC_PATH");
            /* 获取 LOCAL_INC_PATH 变量内容可能是一串以空格隔开的字符串，那就将其转为数组 */
            if (res) {
                res.forEach(val => {
                    /* 首先以空格为单位拆分成数组 */
                    let tmp = val.trim().split(/\s+/);
                    /* 如果数组成员类似 -I"./xx/" 这种形式的话, 将 -I 和 引号 去除 */
                    tmp = tmp.map((item) => {
                        if (item.slice(0, 3) == '-I\"') {
                            return item.slice(3, item.length - 1);
                        }
                    });
                    localIncludeVal.push.apply(localIncludeVal, tmp);
                });
            }

            /* 将上述两个内容合并，并去重返回 */
            localIncludeVal.push.apply(localIncludeVal, cflagsIncludeVal);
            return Array.from(new Set(localIncludeVal));
        } else {
            return null
        }
    },
}

module.exports = makefileHelper;