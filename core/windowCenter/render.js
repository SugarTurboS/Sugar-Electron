const ipc = require('../ipc');
const { WINDOW_CENTER_IPC_NAME, WINDOW_CENTER_GET_INFO } = require('./const');
const modules = {};
const ipcKeys = ['request', 'subscriber', 'unsubscriber'];
async function actionWindow (windowName, action = '', args) {
    return await ipc.request('main', WINDOW_CENTER_IPC_NAME, {
        windowName, action, args
    });
}
// 初始化
ipc.request('main', WINDOW_CENTER_GET_INFO).then((json = {}) => {
    const { names = [], keys = [] } = json;
    names.forEach(name => {
        modules[name] = {};
        keys.forEach(key => {
            modules[name][key] = function () {
                const args = [].slice.call(arguments);
                return actionWindow(name, key, args);
            }
        });
        ipcKeys.forEach(key => {
            modules[name][key] = function () {
                const args = [].slice.call(arguments);
                return ipc[key].apply(ipc, [name].concat(args));
            }
        });
    });
});

module.exports = modules;