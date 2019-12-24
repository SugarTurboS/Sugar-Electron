const path = require('path');
const { SUGAR_OPTION } = require('../const');
const config = require('../config');
const store = require('../store');
const fs = require('fs');
module.exports = { 
    /**
     * 启动sugar
     * @option [object] 启动参数
    */
    start(option = {}) {
        try {
            const { appName, basePath } = option;
            global[SUGAR_OPTION] = option;
            if (basePath) {
                // 自动初始化config 
                config.setOption({
                    appName,
                    configPath: path.join(basePath, 'config')
                });
    
                // 自动初始化store
                const storeJson = require(path.join(basePath, 'store'))
                store.createStore(storeJson);
                // 自动初始化windowCenter
                const windowCenterPath = path.join(basePath, 'windowCenter');
                const items = fs.readdirSync(windowCenterPath);
                const dirs = items.filter(item => fs.statSync(path.join(windowCenterPath, item)).isDirectory());
                dirs.forEach(item => require(path.join(windowCenterPath, item)));
            }   
        } catch (error) {
            console.error(error);
        }
    }
};