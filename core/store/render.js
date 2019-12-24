/* eslint-disable no-async-promise-executor */
const { GET_STATE, SET_STATE, GET_MODULE } = require('./const');
const ipc = require('../ipc');
module.exports = {
    setState(key, value) {
        return this._setState(key, value);
    },
    getState(key) {
        return this._getState(key);
    },
    getModule(moduleName) {
        return this._getModule(moduleName);
    },
    _subscriber(eventName, cb) {
        ipc.subscriber('main', eventName, cb);
        return () => {
            this._unsubscriber(eventName, cb);
        }
    },
    _unsubscriber(eventName, cb) {
        ipc.unsubscriber('main', eventName, cb);
    },
    _setState(key, value, modules = []) {
        return new Promise(async (resolve, reject) => {
            const r = await ipc.request('main', SET_STATE, { key, value, modules });
            if (r) {
                resolve(r);
            } else {
                reject(new Error(`找不到store state key => ${modules.join('.')}.${key}，请在主进程初始化store中声明`));
            }
        });
    },
    _getState(key, modules = []) {
        return new Promise(async (resolve) => {
            const eventName = `${modules.join('|')}|${key}`;
            const r = {
                subscriber: cb => this._subscriber(eventName, cb),
                unsubscriber: cb => this._unsubscriber(eventName, cb)
            };
            r.value = await ipc.request('main', GET_STATE, { key, modules });
            resolve(r);
        });
    },
    _getModule(moduleName, modules = []) {
        modules.push(moduleName);
        return new Promise(async (resolve, reject) => {
            const r = await ipc.request('main', GET_MODULE, { modules });
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