const vscode = require('vscode');

const projectTaskUpdate = {
    /* 更新一个工程的编译 task，如果 workspace 里没有此工程编译 task ，则新添加一个 */
    updateWorkSpaceTask(task) {
        let templete = {version:'2.0.0', tasks:[]};
        let tasks = vscode.workspace.getConfiguration().tasks;

        if (tasks) {
            if (tasks.tasks) {
                templete.tasks = tasks.tasks;
            }
        }

        let update = false;
        let i;
        for (i = 0; i < templete.tasks.length; i++) {
            if (templete.tasks[i].label == task.label) {
                update = true;
                break;
            }
        }

        if (update) {
            templete.tasks[i] = task;
        } else {
            templete.tasks.push(task);
        }

        vscode.workspace.getConfiguration().update("tasks", templete);

        return task;
    },

    deleteWorkSpaceTask(taskName){
        let wktasks = vscode.workspace.getConfiguration('tasks').tasks;

        for (let i = 0; i < wktasks.length; i++) {
            if (wktasks[i].label == taskName) {
                wktasks.splice(i, 1);
                break;
            }
        }
    },

    updateBuildTask(project) {
        if (project.name == null) {
            return null;
        }

        let buildtask = {
            label: 'build ' + project.name,
            command: project.buildCmd,
            type: "shell",
            options: {
                cwd: project.path,
                env:project.env
            },
            presentation: {
                reveal: "always",
                echo: false,
                panel: "dedicated"
            }
        };

        return this.updateWorkSpaceTask(buildtask);
    },

    updateCleanTask(project) {
        if (project.name == null) {
            return null;
        }

        let cleantask = {
            label: 'clean ' + project.name,
            command: project.cleanCmd,
            type: "shell",
            options: {
                cwd: project.path,
                env:project.env
            },
            presentation: {
                reveal: "always",
                echo: false,
                panel: "dedicated"
            }
        };

        return this.updateWorkSpaceTask(cleantask);
    },

    updateCleanBuildTask(project) {
        if (project.name == null) {
            return null;
        }

        let cleanBuildTask = {
            label: 'clean&build ' + project.name,
            command: project.cleanCmd + ';' + project.buildCmd,
            type: "shell",
            options: {
                cwd: project.path,
                env:project.env
            },
            presentation: {
                reveal: "always",
                echo: false,
                panel: "dedicated"
            }
        };

        return this.updateWorkSpaceTask(cleanBuildTask);
    },

    deleteBuildTask(project) {
        this.deleteWorkSpaceTask('build ' + project.name);
    },

    deleteCleanTask(project) {
        this.deleteWorkSpaceTask('clean ' + project.name);
    },

    deleteCleanBuildTask(project) {
        this.deleteWorkSpaceTask('clean&build ' + project.name);
    },

    updateProjectTask(project) {
        this.updateBuildTask(project);
        this.updateCleanTask(project);
        this.updateCleanBuildTask(project);
    },
    
    deleteProjectTask(project) {
        this.deleteBuildTask(project);
        this.deleteCleanTask(project);
        this.deleteCleanBuildTask(project);
    },

    cleanWorkspaceTasks(){
        vscode.workspace.getConfiguration('tasks').update("tasks", []);
    }
}
module.exports = projectTaskUpdate;
