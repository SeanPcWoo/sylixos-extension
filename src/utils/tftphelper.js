const fs = require('fs');
const tftp = require('tftp2');
const path = require('path');
const { eventEngine } = require('../workspace/eventEngine');
const existsSync = require('fs').existsSync;

const tftpHelper = {
    server:null,
    port:0,
    flag:'stop',
    filelist:[],

    ServerStart(port) {
        if (this.server) {
            if (this.port != port) {
                this.server.close();
                this.server = null;
                this.flag = 'stop';
            } else {
                console.log("tftp server has started");
                return;
            }
        }

        this.server = tftp.createServer();

        this.server.on('get', async (req, send) => {
            const { filename, mode, address, port } = req;
            console.log('get', filename, mode, address, port);
            let sendFile = null;
            this.filelist.forEach(filelistItem => {
                let stat;
                let file;

                try {
                    stat = fs.statSync(filelistItem);
                } catch(err) {
                    console.log(err);
                    return;
                }
                
                if (stat) {
                    if (stat.isFile()) {
                        file = filelistItem;
                    } else if (stat.isDirectory()) {
                        file = path.join(filelistItem, filename);
                    }
                    
                    if (existsSync(file)) {
                        sendFile = file;
                    }
                } 
            });
            if (sendFile) {
                try {
                    eventEngine.emit('tftpserver.send', 'start', filename);
                    await send(fs.readFileSync(sendFile));
                    eventEngine.emit('tftpserver.send', 'finish', filename);
                } catch(err) {
                    console.log(err);
                    eventEngine.emit('tftpserver.send', 'error', filename, err);
                }
            }
        });

        this.server.on('put', async (req, read) => {
            const { filename, mode, address, port } = req;
            console.log('put', filename, mode, address, port);
            const buffer = [];
            read(chunk => buffer.push(chunk), () => {
                fs.writeFileSync(filename, Buffer.concat(buffer));
            });
        });

        this.server.on('listening', () => {
            this.flag = 'start';
            eventEngine.emit('tftpserver.update');
        });

        this.server.on('error', (err) => {
            this.server.close();
            this.server = null;
            this.flag = 'stop';
            eventEngine.emit('tftpserver.error', `${err.stack}`);
            eventEngine.emit('tftpserver.update');
        });

        this.server.bind(port);
        this.port = port;
    },

    ServerStop() {
        if (this.flag == 'start' && this.server) {
            this.server.close();
            this.server = null;
            this.flag = 'stop';
            eventEngine.emit('tftpserver.update');
        }
    },

    ServerRunStatus() {
        return this.flag == 'start';
    },

    ServerGetPort() {
        return this.port;
    },

    ServerGetFiles() {
        return this.filelist;
    },

    ServerFileAdd(file) {
        if (file) {
            this.filelist.push(file);
            eventEngine.emit('tftpserver.addFile', file);
        }
    },

    ServerFileListUpdate(filelist) {
        if (filelist) {
            this.filelist = filelist;
        }
    }
}

module.exports = tftpHelper;

