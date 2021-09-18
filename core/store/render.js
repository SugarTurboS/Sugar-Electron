/* eslint-disable no-async-promise-executor */
const { remote } = require('electron');
const { STORE, SET_STATE, STATE_CHANGE } = require('./const');
const { MAIN_PROCESS_NAME } = require('../const');
const ipc = require('../ipc/render');

module.exports = {
    state: remote.getGlobal(STORE),
    setState() {
        let type, key, value, state, modules;
        if (typeof arguments[0] === 'object') {
            type = 0;
            state = arguments[0];
            modules = arguments[1];
        } else {
            type = 1;
            key = arguments[0];
            value = arguments[1];
            modules = arguments[2];
        }
        return new Promise(async (resolve, reject) => {
            const r = await ipc.request(MAIN_PROCESS_NAME, SET_STATE, { type, key, value, state, modules });
            if (r) {
                resolve(r);
            } else {
                reject(new Error(`找不到store state key => ${modules.join('.')}，请在主进程初始化store中声明`));
            }
        });
    },
    getModules(modules = []) {
        const obj = {};
        const key = `${STORE}${modules.join('|')}keys`;
        const keys = remote.getGlobal(key) || [];
        keys.forEach(key => {
            obj[key] = this.getModule(key, modules);
        });
        return obj;
    },
    subscribe(cb, modules = []) {
        const eventName = `${STATE_CHANGE}${modules.join('|')}`;
        ipc.subscribe(MAIN_PROCESS_NAME, eventName, cb);
        return () => {
            this.unsubscribe(cb, modules);
        }
    },
    unsubscribe(cb, modules = []) {
        const eventName = `${STATE_CHANGE}${modules.join('|')}`;
        ipc.unsubscribe(MAIN_PROCESS_NAME, eventName, cb);
    },
    getModule(moduleName, modules = []) {
        const key = `${STORE}${modules.concat([moduleName]).join('|')}`;
        const _modules = modules.concat([moduleName]);
        return {
            state: remote.getGlobal(key),
            getModule: moduleName => this.getModule(moduleName, _modules),
            setState: (...args) => this.setState(...args, _modules),
            subscribe: (cb) => this.subscribe(cb, _modules),
            unsubscribe: (cb) => this.unsubscribe(cb, _modules),
            getModules: (modules) => this.getModules(modules)
        }
    }
};
