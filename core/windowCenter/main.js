
const { BrowserWindow } = require('electron');
const ipc = require('../ipc');
const { WINDOW_CENTER_IPC_NAME, WINDOW_CENTER_GET_INFO } = require('./const');
const names = [];
const windowKeys = ['open']; 
for (let key in BrowserWindow.prototype) {
    windowKeys.push(key);
}

ipc.response(WINDOW_CENTER_IPC_NAME, (json = {}, cb) => {
    const { windowName = '', action = '', args = [] } = json;
    let result;
    try {
        if (action === 'open') {
            modules[windowName].open();
        } else {
            result = modules[windowName].getInstance()[action](...args);
        }
    } catch (error) {
        console.error(error);
    }
    cb(result);
});

ipc.response(WINDOW_CENTER_GET_INFO, (json = {}, cb) => {
    cb({ keys: windowKeys, names });
});

const modules = {
    // 注册进程服务
    _register(name, process) {
        names.push(name);
        this[name] = process;
    },
    // 注销进程服务
    _unegister(name) {
        delete this[name];
        const index = names.indexOf(name);
        names.splice(index, 1);
    }
}

module.exports = modules;