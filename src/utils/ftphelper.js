const path = require('path');
const fs = require('fs');
var PromiseFtp = require('promise-ftp');

let loopnum = 0;
const MAX_LOOP_COUNT = 0xFFFF;
const ftpHelper = {
    ftpClient: new PromiseFtp(),

    /* 异步上传单个文件 */
    async ftpUploadFile (remotedev, file) {
        /* 检测本地文件是否有效，nodejs 的 ftp 貌似不会去检测 */
        try {
            const stats = fs.statSync(file.local);
            if (!stats.isFile()) {
                throw new Error("local file is a file!");
            }
        } catch (err) {
            throw new Error(err);
        }

        /* 连接远端设备 FTP Server */
        try {
            await this.ftpClient.connect(remotedev);
        } catch (err){
            throw new Error("connect failed!");
        }

        /* 递归 mkdir */
        try {
            await this.ftpClient.mkdir(path.dirname(file.remote), true);
        } catch (err){
            throw new Error("mkdir failed!");
        }

        /* upload 文件 */
        try {
            await this.ftpClient.put(file.local, file.remote);
        } catch (err){
            throw new Error('upload failed!');
        }

        /* 断开 FTP */
        try {
            await this.ftpClient.end();
        } catch (err){
            throw new Error('disconnect failed!');
        }

        return 'success!';
    },

    ftpUploadAllFiles(remotedev, files, startCb = null, afterCb = null, statusCb = null) {
        return new Promise((resolve, reject) => {
            if (files.length == 0) {
                reject('没有设置待部署文件');
                return;
            }
            if (files[loopnum]) {
                (startCb == null) ? null : startCb(files[loopnum]); 
                /* 开始传输一个文件 */
                this.ftpUploadFile(remotedev, files[loopnum]).then(async (log)=>{
                    if (loopnum < files.length) {
                        (afterCb == null) ? null : afterCb(files[loopnum]);
                        (statusCb == null) ? null : statusCb(log); 
                        loopnum++; 
                        this.ftpUploadAllFiles(remotedev, files, startCb, afterCb, statusCb).then(resolve, reject);     
                    } else {
                        loopnum = 0;
                        resolve();
                    }
                }).catch(async msg => {
                    if (loopnum < files.length) {
                        (afterCb == null) ? null : afterCb(files[loopnum]);
                        (statusCb == null) ? null : statusCb(msg); 
                        loopnum++; 
                        this.ftpUploadAllFiles(remotedev, files, startCb, afterCb, statusCb).then(resolve, reject);     
                    } else {
                        loopnum = 0;
                        reject();
                    }
                });
            } else {
                loopnum = 0;
                resolve();
            }
        });
    },
    

    /* 停止所有 ftp 传输 */
    async ftpUploadStopAll(){
        /* 将 loop 设置为最大的值，这样等到当前传输完成之后，之后的内容就会全部停止 */
        loopnum = MAX_LOOP_COUNT; 
        try {
            await this.ftpClient.end();
        } catch (err){
            throw new Error('disconnect failed!');
        }
    }
}

module.exports = ftpHelper;