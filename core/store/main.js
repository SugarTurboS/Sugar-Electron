const { GET_STATE, SET_STATE, GET_MODULE } = require('./const');
const ipc = require('../ipc');
let storeCenter = {};
ipc.response(GET_STATE, (json = {}, cb) => {
    let retureData, cacheStore = storeCenter;
    try {
        const { key, modules = [] } = json;
        modules.forEach(name => {
            cacheStore = cacheStore[name];
        });
        retureData = cacheStore[key];
    } catch (error) {
        console.error(error);
    }
    cb(retureData);
});

ipc.response(GET_MODULE, (json = {}, cb) => {
    let retureData, cacheStore = storeCenter;
    try {
        const { modules = [] } = json;
        modules.forEach(name => {
            cacheStore = cacheStore[name];
        });
        retureData = cacheStore; 
    } catch (error) {
        console.error(error);
    }
    cb(retureData);
});

ipc.response(SET_STATE, (json = {}, cb) => {
    let retureData, cacheStore = storeCenter;
    try {
        const { key, value, modules = [] } = json;
        modules.forEach(name => {
            cacheStore = cacheStore[name];
        });
        retureData = cacheStore[key] !== undefined;
        if (retureData) {
            if (cacheStore[key] !== value) {
                const eventName = `${modules.join('|')}|${key}`;
                ipc.publisher({ header: { fromId: 'main', eventName }, body: value });
            }
            cacheStore[key] = value;
        } 
    } catch (error) {
        console.error(error);
    }
    cb(retureData);
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