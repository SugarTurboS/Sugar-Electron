const { remote } = require('electron');
const path = require('path');
const { SUGAR_OPTION } = require('../const');
const sugarOption = remote.getGlobal(SUGAR_OPTION);
const configPath = sugarOption.configPath;
const util = require('../util');
const ipc = require('../ipc/render');
const store = require('../store/render');
const config = require('../config/render');
const windowCenter = require('../windowCenter/render');
// 安装插件
function installPlugins() {
    const plugins = {};
    try {
        const ctx = { ipc, store, config, windowCenter, plugins };
        const threadId = util.getThreadId();
        const pluginsConfig = window.require(path.join(configPath, 'plugins'));
        for (let key in pluginsConfig) {
            let item = pluginsConfig[key] || {};
            if (typeof item === 'function') {
                item = item(sugarOption);
            }
            const { include, enable, package, params } = item;
            const isInclude = !util.isArray(include) || include.length === 0 || include.indexOf(threadId) > -1;
            if (isInclude && enable) {
                const pluginPath = package || item.path || path.join(getDefaultPath(), key);
                plugins[key] = window.require(pluginPath).install(ctx, params);
            }
        }
    } catch (error) {
    }
    return plugins;
}

function getDefaultPath() {
    return sugarOption.pluginsPath || path.join(sugarOption.basePath, 'plugins')
}

module.exports = installPlugins();
