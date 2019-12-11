const { BrowserWindow } = require('electron');
const ipc = require('../ipc');
const Events = require('events');
const path = require('path');
const windowCenter = require('../windowCenter');
class Service extends Events {
    constructor(name, runPath, isDebug = false) {
        super();
        this.runPath = runPath;
        this.name = name;
        this.bs = null;
        this.start(isDebug);
    }

    start(isDebug) {
        try {
            if (this.bs) {
                this.bs.close();
                this.bs = null;
            }
            const URL = `file://${__dirname}/index.html`;
            this.bs = new BrowserWindow({
                show: false,
                fullscreen: false,
                skipTaskbar: false,
                webPreferences: {
                    nodeIntegration: true,
                    preload: path.join(__dirname, 'preload.js')
                 }
            });
         
            ipc._register(this.name, this.bs);

            this.bs.windowId = this.name;
            this.bs.runPath = this.runPath;

            this.bs.on('closed', () => {
                ipc._unregister(this.name);
                this.emit('closed');
                setTimeout(() => {
                    this.start();
                }, 1000);
            });
    
            this.bs.on('ready-to-show', () => {
                if (isDebug) {
                    this.bs.show();
                    this.bs.webContents.openDevTools();
                } else {
                    this.bs.setFocusable(false);
                    this.bs.setIgnoreMouseEvents(true);
                }
                this.emit('success');
               
            });
            this.bs.loadURL(URL);
            windowCenter._register(this.name, this);
        } catch (error) {
            console.log(error)
            this.emit('fail');
        }
    }
}

module.exports = Service;
