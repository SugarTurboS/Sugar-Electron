const { remote } = require('electron');
const path = require('path');
const { CONFIG_PATH } = require('../const');
const configPath = remote.getGlobal(CONFIG_PATH);
const util = require('../util');
const pluginsJson = {};
// 安装插件
try {
    const ctx = {
        ipc: require('../ipc'),
        store: require('../store'),
        config: require('../config')
    }
    const threadId = util.getThreadId();
    const plugins = require(path.join(configPath, 'plugin'));
    for (let key in plugins) {
        const item = plugins[key];
        const { include, enable, package, params } = item;
        const isInclude = !util.isArray(include) || include.length === 0 || include.indexOf(threadId) > -1;
        if (isInclude && enable) {
            pluginsJson[key] = require(package || item.path).install(ctx, params);
        }
    }
} catch (error) {
    console.error(error);
}

module.exports = pluginsJson;