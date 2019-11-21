const { ipcRenderer } = require('electron');
const { IPC_NAME, GET_STATE, SET_STATE, GET_MODULE } = require('./const');
function send(model, data) {
    return new Promise((resolve) => {
        ipcRenderer.send(IPC_NAME, { model, data });
        ipcRenderer.once(IPC_NAME, (e, data) => {
            resolve(data);
        });
    });
}

module.exports = {
    createStore(store, storeCenter) {
        try {
            for (let key in store) {
                const item = store[key];
                if (key === 'actions') {
                    for (let stateKey in item) {
                        storeCenter[stateKey] = item[stateKey];
                    }
                }

                if (key === 'modules') {
                    for (let moduleKey in item) {
                        storeCenter[moduleKey] = {};
                        this.createStore(item[moduleKey], storeCenter[moduleKey]);
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    },
    setState(key, value) {
        return this._setState(key, value);
    },
    getState(key) {
        return this._getState(key);
    },
    getModule(moduleName) {
        return this._getModule(moduleName);
    },
    _setState(key, value, modules = []) {
        return new Promise(async (resolve, reject) => {
            const r = await send(SET_STATE, { key, value, modules });
            if (r) {
                resolve(r);
            } else {
                reject(new Error(`找不到store state key => ${modules.join('.')}.${key}，请在主进程初始化store中声明`));
            }
        });
    },
    _getState(key, modules = []) {
        return new Promise(async (resolve) => {
            const r = await send(GET_STATE, { key, modules });
            resolve(r);
        });
    },
    _getModule(moduleName, modules = []) {
        modules.push(moduleName);
        return new Promise(async (resolve, reject) => {
            const r = await send(GET_MODULE, { modules });
            if (r) {
                resolve({
                    setState: (key, value) => {
                        return this._setState(key, value, modules);
                    },
                    getModule: (moduleName) => {
                        return this._getModule(moduleName, modules);
                    },
                    getState: (key) => {
                        return this._getState(key, modules);
                    }
                });
            } else {
                reject(new Error(`找不到store Modules => ${modules.join('.')}.${moduleName}，请在主进程初始化store中声明`));
            }
        });
    }
};