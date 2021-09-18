const path = require('path');
const { app } = require('electron');
const { SUGAR_OPTION } = require('../const');
global[SUGAR_OPTION] = {};
const config = require('../config/main');
const store = require('../store/main');
const plugins = require('../plugins/main');
const fs = require('fs');

function ready() {
    return new Promise((resolve) => {
        if (app.isReady()) {
            resolve();
        } else {
            app.on('ready', () => {
                resolve();
            });
        }
    })
}

module.exports = { 
    /**
     * 启动sugar
     * @param option [object] 启动参数
     * @param option.useAppPathConfig [boolean] 是否使用%appData%配置
     * @param option.basePath [string] 启动目录
     * @param option.configPath [string] 配置目录
     * @param option.storePath [string] 进程状态共享目录
     * @param option.windowCenterPath [string] 窗口中心目录
     * @param option.pluginsPath [string] 插件目录
    */
    async start(option = {}) {
        await ready();
        const basePath = option.basePath || process.cwd();
        global[SUGAR_OPTION] = Object.assign({
            basePath: basePath,
            useAppPathConfig: false,
            configPath: path.join(basePath, '/config'),
            storePath: path.join(basePath, '/store'),
            windowCenterPath: path.join(basePath, '/windowCenter'),
            pluginsPath: path.join(basePath, '/plugins')
        }, option);
        const { configPath, storePath, windowCenterPath } = global[SUGAR_OPTION];
        try {
            if (fs.existsSync(configPath)) {
                config.getConfig({ configPath: configPath });
            }
        } catch (error) {
            console.log('[sugar-electron] init config fail', error);        
        }
      
        try {
            if (fs.existsSync(storePath)) {
                const storeJson = require(storePath)
                store.createStore(storeJson);
            } 
        } catch (error) {
            console.log('[sugar-electron] init store fail', error);   
        }

        try {
            if (fs.existsSync(windowCenterPath)) {
                const items = fs.readdirSync(windowCenterPath);
                const dirs = items.filter(item => fs.statSync(path.join(windowCenterPath, item)).isDirectory());
                dirs.forEach(item => require(path.join(windowCenterPath, item)));  
            }  
        } catch (error) {
            console.log('[sugar-electron] init windowCenter fail', error);   
        }

        try {
            plugins.installPlugins();
        } catch (error) {
            console.log('[sugar-electron] init plugins fail', error);   
        }
    }
};
