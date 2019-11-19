const { remote } = require('electron');
const path = require('path');
const { CONFIG_PATH } = require('../const');
const configPath = remote.getGlobal(CONFIG_PATH);
const util = require('../util');

module.exports = {
    run(ctx) {
        try {
            const threadId = util.getThreadId();
            const plugins = require(path.join(configPath, 'plugin'));
            for (let key in plugins) {
                const item = plugins[key];
                const { include, enable, package, params } = item;
                const isInclude = !util.isArray(include) || include.length === 0 || include.indexOf(threadId) > -1;
                if (isInclude && enable) {
                    global[key] = require(package || item.path).install(ctx, params);
                }
            }
        } catch (error) {
            console.error(error);
        }  
    }
}

// 去重异常
// 窗口进程差异性注入
// 配置命名空间
