const { BaseWindow } = require('../../../core');
class WinA {
    constructor() {
        this.name = 'winA';
        this.options = {
            url: `file://${__dirname}/index.html`,
            width: 800,
            height: 600
        }
    }

    open() {
       this.instance = new BaseWindow(this.name, this.options);
       this.instance.on('ready-to-show', () => {
            this.instance.show();
       });
       this.instance.loadURL(this.options.url);
    }
}

module.exports = new WinA();


