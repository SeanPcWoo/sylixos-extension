const uriHelper = require('../utils/uriHelper');
const path = require('path');
const existsSync = require('fs').existsSync;
const { eventEngine } = require('../workspace/eventEngine');
const envMange = require('../workspace/envmange');
const xmlHelper = require('../utils/xmlHelper');
const simpleMakefile = require('../utils/simpleMakefile');
const makefileHelper = require('../utils/makefilehelper');
const toolChainHelper = require('../utils/toolchainhelper');
const jsonHelper = require('../utils/jsonhelper');
const vscode = require('vscode');
const logHelper = require('../common/logHelper');

function projectValid(projectPath) {
    if (projectPath) {
        return existsSync(path.join(projectPath, '/.reproject')) ? true : false;
    } else {
        return false;
    }
}

/* 通过 URI 获取 project 的路径 */
async function projectGenPath(Uri) {
    const projectPathUri = await uriHelper.uri2ProjectUri(Uri);
    let proejctPath;
    if (projectPathUri) {
        proejctPath = projectPathUri.fsPath;
    }
    return projectValid(proejctPath) ? proejctPath : null;
}

/* 通过 URI 获取 project 的路径 */
async function projectGenName(Uri) {
    const projectPath = await projectGenPath(Uri);
    if (projectPath) {
        return path.basename(projectPath);
    } else {
        return null;
    }
}

class Project {
    constructor(uri, name, path) {
        /* 以下几个元素是工程管理运行时，必备的内容 */
        this.uri = uri;
        this.name = name;
        this.path = path;
        this.type = 'unknown';
        this.debuglv = '';
        this.env = {};
        this.compilerPath = null;

        this.uploadDev = {
            devName: '',
            host: '',
            port: '21'
        }
        this.uploadFiles = [];
        this.initFinish = false;

        this.projectEventInit();
    }

    async projectInit() {
        /* 更新工程环境变量 */
        await this.workspaceEnvChangeEvent();

        /* 更新 reproject 的信息到 setting 中 */
        await this.projectReprojectChangeEvent();

        /* 更新一下由 Makefile 引发的相关内容 */
        await this.projectMkChangeEvent();

        /* 更新编译相关 task 内容 */
        this.projectBuildChangeEvent();
    }

    /* 有一个工程导入了 */
    async projectImportEvent(project) {
        if (project.name != null) {
            if (project.name == this.name && this.initFinish == false) {
                /* 导入的是自己 */
                await this.projectInit();
            } else {
                /* 导入了另一个工程 */

                let newEnv = {}
                newEnv['WORKSPACE_' + project.name] = project.path;
                Object.assign(this.env, newEnv);
                /* 更新 workspace 的环境变量后，再触发一下 mkfile 事件，从而更新相关智能分析的内容 */
                if (this.initFinish) {
                    eventEngine.emit(`${this.name}.makefile.change`);
                }
            }
        }

        vscode.workspace.getConfiguration('files', project.uri).update('encoding', "gbk");
        this.initFinish = true;
        /* 告诉别人，我已经初始化完成 */
        eventEngine.emit('project.init.finish', this);
    }

    /* 有一个工程移除了 */
    async projectRemoveEvent(projectName) {
        if (projectName != null) {
            if (projectName == this.name) {
                /* 移除的是自己 */
            } else {
                /* 移除了另一个工程 */
                delete this.env['WORKSPACE_' + projectName];
                /* 更新 workspace 的环境变量后，再触发一下 mkfile 事件，从而更新相关智能分析的内容 */
                if (this.initFinish) {
                    eventEngine.emit(`${this.name}.makefile.change`);
                }
            }
        }
    }

    /* 用户更改了工程目录的 Makefile 相关文件 */
    async projectMkChangeEvent() {
        /* 更新 debug lv 和 env */
        let configMk = path.join(this.path, "./config.mk");
        let lv = await simpleMakefile.getArgumentDefineInMk(configMk, "DEBUG_LEVEL");
        if (lv.length > 0) {
            this.debuglv = lv[0].trim();
        } else {
            this.debuglv = '';
        }

        Object.assign(this.env, { Output: this.debuglv });


        let c_cpp_propeities = {
            env: {
                SylixOS_CompilerPath: "",
                BaseProPath: "",
                customIncludePath: []
            },
            configurations: [
                {
                    name: "SylixOS",
                    compilerPath: "${SylixOS_CompilerPath}",
                    intelliSenseMode: "",
                    includePath: ["${customIncludePath}"],
                    defines: [
                        "_DEBUG",
                        "UNICODE",
                        "_UNICODE"
                    ],
                    cStandard: "c99",
                    cppStandard: "c++17",
                    browse: {
                        path: [],
                        limitSymbolsToIncludedHeaders: false
                    },
                    compilerArgs: []
                }
            ]
        }

        /* 更新 makefile 的规则文件 */
        if (this.type != 'SylixOSBaseProject' && this.type != 'unknown') {
            const rulesFile = path.join(this.path, '/.vscode/.mkrules');
            await makefileHelper.makefileRulesGet(rulesFile, false, this.env);

            let p1 = makefileHelper.getIncludeInfoWithFile(rulesFile);
            let p2 = makefileHelper.getIncludeInCflagsWithFile(rulesFile, true);
            let p3 = makefileHelper.getDefineWithFile(rulesFile);
            let p4 = await makefileHelper.makefileArgAnalysis(rulesFile, "SYLIXOS_BASE_PATH");
            [c_cpp_propeities.env.customIncludePath, c_cpp_propeities.configurations[0].compilerArgs,
            c_cpp_propeities.configurations[0].defines, c_cpp_propeities.env.BaseProPath]
                = await Promise.all([p1, p2, p3, p4]);
        } else if (this.type == 'SylixOSBaseProject') {
            c_cpp_propeities.env.BaseProPath = [this.path];
        }

        if (c_cpp_propeities.env.BaseProPath.length == 0) {
            /* 说明没有指定 base 工程，这里就不对 c_cpp_properties.json 进行修改 */
            logHelper.logAppendLine(`${this.name} 获取 Base 工程失败，智能代码分析和编译等可能会失败！`);
            return this;
        }

        /* base 工程只有个 */
        c_cpp_propeities.env.BaseProPath = c_cpp_propeities.env.BaseProPath[0];

        /* 获取编译器地址等内容 */
        const baseProConfigMk = path.join(c_cpp_propeities.env.BaseProPath, "./config.mk");
        let toolChainPrefix = await simpleMakefile.getArgumentFromMakefiles(baseProConfigMk, "TOOLCHAIN_PREFIX");
        if (toolChainPrefix.length > 0) {
            c_cpp_propeities.env.SylixOS_CompilerPath = toolChainHelper.toolChainGet(toolChainPrefix[0]);
            /* 这里将编译工具链地址保存在 project 里，方便其他需要编译器操作时，快速获取编译器信息 */
            this.compilerPath = c_cpp_propeities.env.SylixOS_CompilerPath;

            /* TODO: 关于 intelliSenseMode 的设置，这里暂时这么设置，后续理解清楚后可以更新这部分配置 */
            if (toolChainPrefix[0].indexOf('64') != -1) {
                c_cpp_propeities.configurations[0].intelliSenseMode = "gcc-x64";
            } else {
                c_cpp_propeities.configurations[0].intelliSenseMode = "gcc-x86";
            }
        } else {
            /* 如果获取失败也不更新配置文件 */
            logHelper.logAppendLine(`${this.name} 获取编译器等配置信息失败，智能代码分析和编译等可能会失败！`);
            return this;
        }

        /* 更新 c_cpp_properties.json 文件内容 */
        /* 在更新前，将 base 路径后缀加上 **，表明递归搜索 */
        c_cpp_propeities.env.customIncludePath.push(path.join(c_cpp_propeities.env.BaseProPath, "/**"));
        const propertiesFile = path.join(this.path, '/.vscode/c_cpp_properties.json');
        jsonHelper.writeJson2File(propertiesFile, c_cpp_propeities);

        return this;
    }

    /* 用户更改 upload 的设置 */
    async projectUploadChangeEvent() {
        /* 分别读取 project 下的  .reproject 和 ACOINFO IDE workspace 下的 .remoteproject 文件 */
        const projectReFile = path.join(this.path, './.reproject');
        const realEvoWkReFile = path.join(path.dirname(this.path),
            '/.metadata/.plugins/com.realevo.remotefile/.remoteproject');
        const ProjectUpload = vscode.workspace.getConfiguration('Upload', this.uri);

        let ReFileContent = await xmlHelper.getXmlContent2File(projectReFile);
        let WkReFileContent = await xmlHelper.getXmlContent2File(realEvoWkReFile);

        /* 将对应的内容写入 reproject 文件 */
        if (ReFileContent) {
            /* 写入 DevName */
            if (!ReFileContent.SylixOSSetting.DeviceSetting) {
                ReFileContent.SylixOSSetting.DeviceSetting = { $: {} };
            }
            ReFileContent.SylixOSSetting.DeviceSetting.$.DevName = ProjectUpload.AHost;

            if (!ReFileContent.SylixOSSetting.UploadPath) {
                ReFileContent.SylixOSSetting.UploadPath = {};
            }

            /* 写入 files 信息 */
            let PairItem = ProjectUpload.EFiles.map(uploadRule => {
                let file = { $: {} };
                /* 通过 > 符号拆分 local 文件和 remote 文件，并且去除空格 */
                file.$.key = path.normalize(uploadRule.split('>')[0].replace(/\s*/g, ""));
                file.$.value = uploadRule.split('>')[1].replace(/\s*/g, "");
                return file;
            });

            if (PairItem.length == 1) {
                PairItem = PairItem[0];
            }

            ReFileContent.SylixOSSetting.UploadPath.PairItem = PairItem;
            xmlHelper.setXmlContent2File(projectReFile, ReFileContent);
        }

        /* 尝试将对应的内容写入 ACOINFO IDE 和 workspace 的配置文件 */
        if (WkReFileContent && WkReFileContent.remotesystem.Remote) {
            let remotes = WkReFileContent.remotesystem.Remote;
            if (remotes.length == undefined) {
                remotes = [remotes];
            }

            let index = remotes.findIndex(dev => dev.$.DeviceID == ProjectUpload.AHost);
            if (index == -1) {
                /* 没有找到则添加一个元素? */
                remotes.push({
                    $: {
                        DeviceID: ProjectUpload.AHost,
                        DeviceIp: ProjectUpload.AIp,
                        FTPProt: Number(ProjectUpload.BPort),
                        UserName: ProjectUpload.CUser,
                        UserPassword: ProjectUpload.DPassword,
                        /* 这是默认信息 */
                        DeviceProt: "23",
                        GDBProt: "1234"
                    }
                });
            } else {
                /* 找到则更新 */
                remotes[index].$.DeviceIp = ProjectUpload.AIp;
                remotes[index].$.FTPProt = Number(ProjectUpload.BPort);
                remotes[index].$.UserName = ProjectUpload.CUser;
                remotes[index].$.UserPassword = ProjectUpload.DPassword;
            }

            if (remotes.length == 1) {
                remotes = remotes[0];
            }
            WkReFileContent.remotesystem.Remote = remotes;
            xmlHelper.setXmlContent2File(realEvoWkReFile, WkReFileContent);
        }

        /* 最后当 reproject 文件修改时，触发一下事件，从而更新 project 实例和 upload 参数 */
        eventEngine.emit(`${this.name}.reproject.change`, false);
        return this;
    }

    addNewTasks(tasksNew, newTaskLabel, newTaskCmd){
        let newTask = {
            label: "",
            command: "",
            type: "shell",
            options: {
                cwd: `${this.path}`,
                env: {}
            },
            presentation: {
                reveal: "always",
                echo:true,
                panel: "dedicated",
                clear: true
            },
            problemMatcher: {
                owner: "cpp",
                fileLocation: [
                    "autoDetect", "${workspaceFolder}"
                ],
                pattern: {
                    regexp: "^(.*):(\\d+):(\\d+):\\s+(warning|error|note):\\s+(.*)$",
                    file: 1,
                    line: 2,
                    column: 3,
                    severity: 4,
                    message: 5
                }
            }
        };

        Object.assign(newTask.options.env, this.env);
        newTask.label = newTaskLabel;
        newTask.command = newTaskCmd;

        let index = -1;
        if (tasksNew.tasks) {
            index = tasksNew.tasks.findIndex(task => task.label == newTaskLabel);
        } else {
            tasksNew.tasks = [];
        }

        if (index != -1) {
            tasksNew.tasks[index] = newTask;
        } else {
            tasksNew.tasks.push(newTask);
        }
    }

    /* 用户更改 build 的设置 */
    projectBuildChangeEvent() {
        let ProjectSetting = vscode.workspace.getConfiguration('ProjectSetting', this.uri);

        if (ProjectSetting && ProjectSetting.CustomBuildCmd) {
            this.buildCmd = ProjectSetting.CustomBuildCmd;
        } else {
            this.buildCmd = "make all";
        }

        if (ProjectSetting && ProjectSetting.CustomCleanCmd) {
            this.cleanCmd = ProjectSetting.CustomCleanCmd;
        } else {
            this.cleanCmd = "make clean";
        }

        /* 更新 tasks.json 内容 */
        const tasksFile = path.join(this.path, '/.vscode/tasks.json');
        const tasksOld = jsonHelper.readJsonFromFile(tasksFile);
        let tasksNew = {version:"2.0.0"};
        if (tasksOld) {
            Object.assign(tasksNew, tasksOld);
        }

        this.addNewTasks(tasksNew, `build ${this.name}`, `${this.buildCmd}`);
        this.addNewTasks(tasksNew, `clean ${this.name}`, `${this.cleanCmd}`);
        this.addNewTasks(tasksNew, `clean&build ${this.name}`, `${this.cleanCmd};${this.buildCmd}`);
        jsonHelper.writeJson2File(tasksFile, tasksNew);
    }

    /* 用户更改了工程目录下 reproject 文件 */
    async projectReprojectChangeEvent(updateConfiguration = true) {
        /* 分别读取 project 下的  .reproject 和 ACOINFO IDE workspace 下的 .remoteproject 文件 */
        const projectReFile = path.join(this.path, './.reproject');
        const realEvoWkReFile = path.join(path.dirname(this.path),
            '/.metadata/.plugins/com.realevo.remotefile/.remoteproject');
        const ProjectUpload = vscode.workspace.getConfiguration('Upload', this.uri);

        const ReFileContent = await xmlHelper.getXmlContent2File(projectReFile);
        const WkReFileContent = await xmlHelper.getXmlContent2File(realEvoWkReFile);

        /* 获取工程类型 */
        if (ReFileContent && ReFileContent.SylixOSSetting.BaseSetting.$.ProjectType) {
            this.type = ReFileContent.SylixOSSetting.BaseSetting.$.ProjectType;
        } else {
            this.type = 'unknown';
        }

        /* 先初始化一下 remote dev 的信息 */
        this.uploadDev.devName = '';
        this.uploadDev.host = '';
        this.uploadDev.port = '21';
        this.uploadDev.user = '';
        this.uploadDev.password = '';

        /* 获取 remote dev 的信息 */
        if (ReFileContent && ReFileContent.SylixOSSetting.DeviceSetting) {
            this.uploadDev.devName = ReFileContent.SylixOSSetting.DeviceSetting.$;
            /* 查找 ACOIFNO IDE 和 workspace 的配置内容，看是否由这个 dev 的配置信息 */
            if (WkReFileContent && WkReFileContent.remotesystem.Remote) {
                let remotes = WkReFileContent.remotesystem.Remote;
                if (remotes.length == undefined) {
                    remotes = [remotes];
                }
                const devInfo = remotes.find(remote => remote.$.DeviceID == this.uploadDev.devName);
                if (devInfo) {
                    /* 找到了对应设备配置信息 */
                    this.uploadDev.host = devInfo.$.DeviceIp;
                    this.uploadDev.port = devInfo.$.FTPProt;
                    this.uploadDev.user = devInfo.$.UserName;
                    this.uploadDev.password = devInfo.$.UserPassword;
                }
            }
        }

        if (this.uploadDev.host == '') {
            /* 说明从工程配置文件和 ACOINFO IDE 的配置中获取信息失败，
               则使用 vscode 用户配置的内容作为 upload 的最终配置项 */
            if (ProjectUpload) {
                this.uploadDev.devName = ProjectUpload.AHost;
                this.uploadDev.host = ProjectUpload.AIp;
                this.uploadDev.port = ProjectUpload.BPort;
                this.uploadDev.user = ProjectUpload.CUser;
                this.uploadDev.password = ProjectUpload.DPassword;
            }
        }

        /* 获取 ftp files 信息和 ftp 的 files 根据就是工程的 reproject 文件 */
        this.uploadFiles = [];
        if (ReFileContent && ReFileContent.SylixOSSetting
            && ReFileContent.SylixOSSetting.UploadPath
            && ReFileContent.SylixOSSetting.UploadPath.PairItem) {
            let uploadFiles = ReFileContent.SylixOSSetting.UploadPath.PairItem;
            if (uploadFiles.length == undefined) {
                /* 只有一个元素 */
                uploadFiles = [uploadFiles];
                uploadFiles.forEach(fileinfo => {
                    if (fileinfo.$.key && fileinfo.$.value) {
                        let file = {
                            local: fileinfo.$.key,
                            remote: fileinfo.$.value,
                        };
                        /* 替换本工程的 workspace 的  output */
                        file.local = file.local.replace(`$(WORKSPACE_${this.name})`, this.path);
                        file.local = file.local.replace(`$(Output)`, this.debuglv);
                        file.local = path.normalize(file.local);
                        /* 判断一下当前文件是否存在，如果不存在则提示用户 */
                        if (!existsSync(file.local)) {
                            logHelper.logAppendLine(`未发现待 upload 的文件:[${file.local}], 请检查:${projectReFile}`);
                        }
                        this.uploadFiles.push(file);
                    }
                });
            }
        }

        /* 将当前的信息展示在 configuration  */
        let fileshow = [];
        this.uploadFiles.forEach(file => {
            let file_str = file.local + " > " + file.remote;
            fileshow.push(file_str);
        });

        if (updateConfiguration) {
            let p = [];
            p.push(ProjectUpload.update("AHost", this.uploadDev.devName, vscode.ConfigurationTarget.WorkspaceFolder));
            p.push(ProjectUpload.update("AIp", this.uploadDev.host, vscode.ConfigurationTarget.WorkspaceFolder));
            p.push(ProjectUpload.update("BPort", this.uploadDev.port, vscode.ConfigurationTarget.WorkspaceFolder));
            p.push(ProjectUpload.update("CUser", this.uploadDev.user, vscode.ConfigurationTarget.WorkspaceFolder));
            p.push(ProjectUpload.update("DPassword", this.uploadDev.password, vscode.ConfigurationTarget.WorkspaceFolder));
            p.push(ProjectUpload.update("EFiles", fileshow, vscode.ConfigurationTarget.WorkspaceFolder));
            await Promise.all(p);
        }
    }

    /* workspace 的环境变量发生了变化 */
    async workspaceEnvChangeEvent() {
        /* 对于当前版本的 project 环境变量来说，主要由两部分构成： workspace 环境变量 + 本身工程的 ‘Output’环境变化 */
        /* 获取 Output 环境变量值，即获取 Debug level */
        let env = envMange.workspaceEnv;
        Object.assign(env, { Output: this.debuglv });
        this.env = env;

        /* 更新 workspace 的环境变量后，再触发一下 mkfile 事件，从而更新相关智能分析的内容 */
        if (this.initFinish) {
            eventEngine.emit(`${this.name}.makefile.change`);
            /* 更新编译相关关 task 内容 */
            this.projectBuildChangeEvent();
        }
    }

    projectEventInit() {
        eventEngine.on('project.import', this.projectImportEvent.bind(this));
        eventEngine.on('project.remove', this.projectRemoveEvent.bind(this));

        eventEngine.on(`${this.name}.makefile.change`, this.projectMkChangeEvent.bind(this));
        eventEngine.on(`${this.name}.upload.change`, this.projectUploadChangeEvent.bind(this));
        eventEngine.on(`${this.name}.build.change`, this.projectBuildChangeEvent.bind(this));
        eventEngine.on(`${this.name}.reproject.change`, this.projectReprojectChangeEvent.bind(this));

        eventEngine.on('workspace.env.add', this.workspaceEnvChangeEvent.bind(this));
        eventEngine.on('workspace.env.delete', this.workspaceEnvChangeEvent.bind(this));
    }
}

module.exports = { projectGenPath, projectGenName, Project };