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
        if (this.bs) {
            return false;
        }

        try {
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
                this.bs = null;
                windowCenter._unegister(this.name);
                ipc._unregister(this.name);
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
            this.bs.webContents.on('crashed', () => {
                this.bs.reload();
                this.emit('fail');
            });
            windowCenter._register(this.name, this);
        } catch (error) {
            console.log(error)
            this.emit('fail');
        }
    }

    stop() {
        this.bs.close();
        this.bs = null;
    }
}

module.exports = Service;
