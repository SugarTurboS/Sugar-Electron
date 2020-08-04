const path = require('path');
const { SUGAR_OPTION } = require('../const');
const config = require('../config/main');
const store = require('../store/main');
const fs = require('fs');
module.exports = { 
    /**
     * 启动sugar
     * @param option [object] 启动参数
     * @param option.appName [string] 应用名
     * @param option.basePath [string] 启动目录
     * @param option.configPath [string] 配置目录
     * @param option.storePath [string] 进程状态共享目录
     * @param option.windowCenterPath [string] 窗口中心目录
     * @param option.pluginsPath [string] 插件目录
    */
    start(option = {}) {
        try {
            const { appName, basePath, configPath, storePath, windowCenterPath } = option;
            global[SUGAR_OPTION] = option;
            if (basePath) {
                try {
                    // 自动初始化config 
                    config.setOption({
                        appName,
                        configPath: configPath || path.join(basePath, '/config')
                    });
                // eslint-disable-next-line no-empty
                } catch (e) {}

                try {
                    // 自动初始化store
                    const storeJson = require(storePath || path.join(basePath, '/store'))
                    store.createStore(storeJson);
                // eslint-disable-next-line no-empty
                } catch (e) {}

                try {
                    // 自动初始化windowCenter
                    const _windowCenterPath = windowCenterPath || path.join(basePath, '/windowCenter');
                    const items = fs.readdirSync(_windowCenterPath);
                    const dirs = items.filter(item => fs.statSync(path.join(_windowCenterPath, item)).isDirectory());
                    dirs.forEach(item => require(path.join(_windowCenterPath, item)));  
                // eslint-disable-next-line no-empty
                } catch (e) {}
            }   
        } catch (error) {
            console.error(error);
        }
    }
};