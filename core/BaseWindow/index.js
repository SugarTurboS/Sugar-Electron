const { BrowserWindow } = require('electron');
const util = require('../util');
const path = require('path');
const ipcSDK = require('../ipcSDK');
// 窗体默认属性
const defaultOptions = {};

const webPreferences = {
    preload: path.resolve(__dirname, 'preload.js'), // 注入SDK
}

class BaseWindow extends BrowserWindow {
    // 设置所有窗口默认属性
    static setDefaultOptions(options) {
        Object.assign(defaultOptions, options);
    }

    constructor(name, options = {}) {
        if (util.isBoolean(name) === false) {
            throw new Error('process name is not null');
        }
        const _option = Object.assign(defaultOptions, options);
        if (util.isObject(_option.webPreferences) === false ) {
            _option.webPreferences = webPreferences;
        } else {
            Object.assign(_option.webPreferences, webPreferences);
        }

        super(_option);

        // 窗口ID，必须
        this.windowId = name;

        ipcSDK._register(name, this);

        this.on('closed', () => {
            ipcSDK._unregister(name);
        });
    }
}

module.exports = BaseWindow;