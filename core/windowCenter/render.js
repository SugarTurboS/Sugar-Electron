const remote = require('electron').remote;
const ipc = require('../ipc/render');
const { WINDOW_CENTER_IPC_NAME, WINDOW_CENTER_GET_INFO } = require('./const');
const { MAIN_PROCESS_NAME } = require('../const');
const modules = {};
const ipcKeys = ['request', 'subscribe', 'unsubscribe'];
async function actionWindow(windowName, action = '', args) {
    return await ipc.request(MAIN_PROCESS_NAME, WINDOW_CENTER_IPC_NAME, {
        windowName, action, args
    });
}
// 初始化
const { names = [], keys = [] } = remote.getGlobal(WINDOW_CENTER_GET_INFO);
names.concat([MAIN_PROCESS_NAME]).forEach(name => {
    modules[name] = {};
    if (name !== MAIN_PROCESS_NAME) {
        keys.concat(['isInstanceExist']).forEach(key => {
            modules[name][key] = function () {
                const args = [].slice.call(arguments);
                return actionWindow(name, key, args);
            }
        });
    }
    ipcKeys.forEach(key => {
        modules[name][key] = function () {
            const args = [].slice.call(arguments);
            return ipc[key].apply(ipc, [name].concat(args));
        }
    });
});

module.exports = modules;