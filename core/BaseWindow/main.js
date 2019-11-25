const { BrowserWindow } = require('electron');
const util = require('../util');
const ipc = require('../ipc');
// 窗体默认属性
const defaultOptions = {};

class BaseWindow extends BrowserWindow {
    // 设置所有窗口默认属性
    static setDefaultOptions(options) {
        Object.assign(defaultOptions, options);
    }

    constructor(name, options = {}) {
        if (util.isBoolean(name) === false) {
            throw new Error('process name cannot be null');
        }
        const _option = Object.assign(defaultOptions, options);

        super(_option);

        // 窗口ID，必须
        this.windowId = name;

        ipc._register(name, this);

        this.on('closed', () => {
            ipc._unregister(name);
        });
    }
}

module.exports = BaseWindow;