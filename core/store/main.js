const { ipcMain } = require('electron');
const { IPC_NAME, GET_STATE, SET_STATE, GET_MODULE } = require('./const');
let storeCenter = {};
ipcMain.on(IPC_NAME, (e, params = {}) => {
    const { model, data = {} } = params;
    const { key, value, modules = [] } = data;
    let retureData, cacheStore = storeCenter;
    try {
        modules.forEach(name => {
            cacheStore = cacheStore[name];
        });
        switch(model) {
            case GET_STATE:
                retureData = cacheStore[key];
                break;
            case GET_MODULE:
                retureData = cacheStore;
                break;
            case SET_STATE:
                if (retureData = cacheStore[key] !== undefined) {
                    cacheStore[key] = value;
                }
            default:
        }  
    } catch (error) {
        console.error(error);
    }
    e.sender.send(IPC_NAME, retureData);
});

module.exports = {
    _initStore(store, storeCenter) {
        try {
            for (let key in store) {
                const item = store[key];
                if (key === 'state') {
                    for (let stateKey in item) {
                        storeCenter[stateKey] = item[stateKey];
                    }
                }
    
                if (key === 'modules') {
                    for (let moduleKey in item) {
                        storeCenter[moduleKey] = {};
                        this._initStore(item[moduleKey], storeCenter[moduleKey]);
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    },
    createStore(store = {}) {
        this._initStore(store, storeCenter);
    }
};