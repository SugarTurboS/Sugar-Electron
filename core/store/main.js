const { STORE, SET_STATE, STATE_CHANGE } = require('./const');
const { MAIN_PROCESS_NAME } = require('../const');
const ipc = require('../ipc/main');
const Event = require('events');
const event = new Event();

ipc.response(SET_STATE, (json = {}, cb) => {
    setState(json);
    cb(true);
});

function initStore(store, modules = []) {
    try {
        for (let key in store) {
            const item = store[key];
            switch (key) {
                case 'state':
                    var keyState = `${STORE}${modules.join('|')}`;
                    global[keyState] = item;
                    if (keyState === STORE) {
                        moduleExports.state = global[keyState];
                    }
                    break;
                case 'modules':
                    var keyModules = `${STORE}${modules.join('|')}keys`;
                    if (!global[keyModules]) {
                        global[keyModules] = []
                    }
                    for (let moduleKey in item) {
                        global[keyModules].push(moduleKey);
                        initStore(item[moduleKey], modules.concat([moduleKey]));
                    }
                    break;
                default:
            }
        }
    } catch (error) {
        console.error(error);
    }
}

function setState(json) {
    const { type, key, value, state = {}, modules = [] } = json;
    try {
        const moduleKey = `${STORE}${modules.join('|')}`;
        const eventName = `${STATE_CHANGE}${modules.join('|')}`;
        let body = {};
        if (type === 0) {
            Object.assign(global[moduleKey], state);
            body = state;
        } else {
            global[moduleKey][key] = value;
            body[key] = value;
        }
        ipc._publisher({ header: { fromId: MAIN_PROCESS_NAME, eventName }, body });
        event.emit(eventName, body);
    } catch (error) {
        console.error(error);
    }
    return true;
}

// 初始化
const moduleExports = {
    createStore(store = {}) {
        initStore(store);
    },
    state: {},
    setState() {
        // 与渲染进程异步保持一致
        return new Promise((resolve, reject) => {
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
            };
            setState({ type, key, value, state, modules });
            resolve(true);
        });
    },
    getModules(modules = []) {
        const obj = {};
        const key = `${STORE}${modules.join('|')}keys`;
        const keys = global[key] || [];
        keys.forEach(key => {
            obj[key] = this.getModule(key, modules);
        });
        return obj;
    },
    subscribe(cb, modules = []) {
        const eventName = `${STATE_CHANGE}${modules.join('|')}`;
        event.on(eventName, cb);
        return () => {
            this.unsubscribe(eventName, cb);
        }
    },
    unsubscribe(cb, modules = []) {
        const eventName = `${STATE_CHANGE}${modules.join('|')}`;
        event.off(eventName, cb);
    },
    getModule(moduleName, modules = []) {
        const key = `${STORE}${modules.concat([moduleName]).join('|')}`;
        const _modules = modules.concat([moduleName]);
        const self = this;
        return {
            state: global[key],
            getModule: moduleName => this.getModule(moduleName, _modules),
            setState: (...args) => this.setState(...args, _modules),
            subscribe: cb => this.subscribe(cb, _modules),
            unsubscribe: cb => this.unsubscribe(cb, _modules),
            getModules: () => this.getModules(_modules)
        }
    }
};

module.exports = moduleExports;
