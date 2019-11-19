const plugins = require('../plugins');
const ctx = {
    ipcSDK: require('../ipcSDK'),
    storeSDK: require('../store'),
    config: require('../config')
}
// 挂载核心模块
Object.assign(global, ctx);
// 安装插件
plugins.run(ctx);
