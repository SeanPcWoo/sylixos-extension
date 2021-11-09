const toolChainHelper = require('../utils/toolchainhelper');
const simpleMakefile = require('../utils/simpleMakefile');
const path = require('path');
const { eventEngine } = require('./eventEngine');

const REALEVOIDE_WORKSPACE_FILE = "/ide/configuration/.settings/org.eclipse.ui.ide.prefs"

const envMange = {
    /* ACOINFO IDE 的环境变量 */
    realEvoIdeEnv: {},

    /* workspace 环境变量 */
    workspaceEnv: {},

    /* 获取 RealEvoIde 的 WORKSPACExx 变量内容 */
    async updaterealEvoEnv() {
        toolChainHelper.toolChainRootPathUpdate();
        let configFile;

        if (toolChainHelper.realEvoIdePath) {
            configFile = path.join(toolChainHelper.realEvoIdePath, REALEVOIDE_WORKSPACE_FILE);
            let str = await simpleMakefile.getArgumentDefineInMk(configFile, "RECENT_WORKSPACES");
            if (str.length > 0) {
                /* 得到的应该是一个数组，第一个成员是 MAX_RECENT_WORKSPACES 的值，第二个才是需要的内容 */
                let wks = str[1].split("\\n");
                wks.forEach(wk => {
                    this.realEvoIdeEnv["WORKSPACE_" + path.basename(wk)] = path.normalize(wk);
                });
            }
        }
    },

    /* workspace 环境变量初始化 */
    async workspaceEvnInit() {
        await this.updaterealEvoEnv();
        this.workspaceEnv = this.realEvoIdeEnv;
    },

    /* 给 workspace 的环境变量添加一个元素 */
    addWorkspaceEnv(env) {
        Object.assign(this.workspaceEnv, env);
        eventEngine.emit('workspace.env.add', env);
    },

    /* workspace 的环境变量删除一个元素 */
    delWorkspaceEnv(envName) {
        delete this.workspaceEnv[envName];
        eventEngine.emit('workspace.env.delete', envName);
    }
}

module.exports = envMange;