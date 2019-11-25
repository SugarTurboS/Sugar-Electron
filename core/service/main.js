const { BrowserWindow } = require('electron');
const ipc = require('../ipc');
const Events = require('events');
const path = require('path');
class Service extends Events {
    constructor(name, runPath) {
        super();
        this.runPath = runPath;
        this.name = name;
        this.bs = null;
        this.start();
    }

    start() {
        try {
            if (this.bs) {
                this.bs.close();
                this.bs = null;
            }
            const URL = `file://${__dirname}/index.html`;
            this.bs = new BrowserWindow({
                show: false,
                fullscreen: false,
                focusable: false,
                skipTaskbar: false,
                webPreferences: {
                    preload: path.resolve(__dirname, '../BaseWindow/preload.js'), // 注入SDK
                }
            });
         
            ipc._register(this.name, this.bs);

            this.bs.windowId = this.name;

            this.bs.on('closed', () => {
                ipc._unregister(this.name);
                this.emit('closed');
                setTimeout(() => {
                    this.start();
                }, 1000);
            });
    
            this.bs.on('ready-to-show', () => {
                this.bs.setIgnoreMouseEvents(true);
                this.bs.webContents.executeJavaScript(`
                    const script = document.createElement('script');
                    script.src = 'file:///${this.runPath.replace(/\\/g, '/')}';
                    document.body.appendChild(script);
                `);
                this.emit('success');
            });

            this.bs.loadURL(URL);
        } catch (error) {
            console.log(error)
            this.emit('fail');
        }
    }
}

module.exports = Service;
