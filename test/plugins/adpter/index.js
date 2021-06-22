module.exports = {
    /**
     * 安装插件，每一个自定义插件必备
     * @ctx [object] 框架上下文对象{ config, ipc, store }
     * @params [object] 配置参数
    */
    install(ctx, params = {}) {
        return {
            async callAPI(action, options) {
                console.log('plugin', ctx, params);
            }
        }
    }
}

