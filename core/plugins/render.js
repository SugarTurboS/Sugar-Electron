const { remote } = require('electron');
const path = require('path');
const { SUGAR_OPTION } = require('../const');
const sugarOption = remote.getGlobal(SUGAR_OPTION);
const configPath = sugarOption.configPath;
const util = require('../util');
// 安装插件
function installPlugins() {
    const pluginsJson = {};
    try {
        const ctx = {
            ipc: require('../ipc'),
            store: require('../store'),
            config: require('../config')
        }
        const threadId = util.getThreadId();
        const plugins = require(path.join(configPath, 'plugins'));
        for (let key in plugins) {
            const item = plugins[key];
            const { include, enable, package, params } = item;
            const isInclude = !util.isArray(include) || include.length === 0 || include.indexOf(threadId) > -1;
            if (isInclude && enable) {
                const pluginPath = package || item.path || path.join(getDefaultPath(), key);
                pluginsJson[key] = require(pluginPath).install(ctx, params);
            }
        }
    } catch (error) {
        console.error(error);
    }
    return pluginsJson;
}

function getDefaultPath() {
    return path.join(sugarOption.basePath, 'plugins')
}


module.exports = installPlugins();