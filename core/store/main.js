const { STORE, SET_STATE, STATE_CHANGE } = require('./const');
const ipc = require('../ipc/main');

ipc.response(SET_STATE, (json = {}, cb) => {
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
        ipc.publisher({ header: { fromId: 'main', eventName }, body });
    } catch (error) {
        console.error(error);
    }
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

module.exports = {
    createStore(store = {}) {
        initStore(store);
    }
};