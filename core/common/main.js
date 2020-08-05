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
        const { appName, basePath, configPath, storePath, windowCenterPath } = option;
        global[SUGAR_OPTION] = option;
        if (basePath) {
            try {
                // 自动初始化config
                const _configPath = configPath || path.join(basePath, '/config');
                if (fs.existsSync(_configPath)) {
                    config.setOption({
                        appName,
                        configPath: _configPath
                    });
                }
            } catch (error) {
                console.log(error);        
            }
          
            try {
                // 自动初始化store
                const _storePath = storePath || path.join(basePath, '/store');
                if (fs.existsSync(_storePath)) {
                    const storeJson = require(_storePath)
                    store.createStore(storeJson);
                } 
            } catch (error) {
                console.log(error);    
            }

            try {
                // 自动初始化windowCenter
                const _windowCenterPath = windowCenterPath || path.join(basePath, '/windowCenter');
                if (fs.existsSync(_windowCenterPath)) {
                    const items = fs.readdirSync(_windowCenterPath);
                    const dirs = items.filter(item => fs.statSync(path.join(_windowCenterPath, item)).isDirectory());
                    dirs.forEach(item => require(path.join(_windowCenterPath, item)));  
                }  
            } catch (error) {
                console.log(error);    
            }
        }   
    }
};