const axios = require('axios');
const apis = {
    FETCH_DATA_1: {
        url: '/XXXXXXX1',
        method: 'POST'
    },
    FETCH_DATA_2: {
        url: '/XXXXXXX2',
        method: 'GET'
    },
    FETCH_DATA_3: {
        url: '/XXXXXXX3',
        method: 'PUT'
    },
    FETCH_DATA_4: {
        url: '/XXXXXXX4',
        method: 'POST'
    }
}

module.exports = {
    /**
     * 安装插件，每一个自定义插件必备
     * @ctx [object] 框架上下文对象{ config, ipc, store }
     * @params [object] 配置参数
    */
    install(ctx, params = {}) {
        // 通过配置文件读取基础服务配置
        const baseServer = ctx.config.baseServer;
        return {
            async callAPI(action, options) {
                const { method, url } = apis[action];
                try {
                    // 通过进程状态共享SDK获取用户ID
                    const token = await ctx.store.getState('token');
                    const res = await axios({
                        method,
                        url: `${baseServer}${url}`,
                        data: options,
                        timeout: params.timeout // 通过插件配置超时时间
                    });
                    if (action === 'LOGOUT') {
                        // 通过进程间通信模块，告知主进程退出登录
                        ctx.ipc.sendToMain('LOGOUT');
                    }

                    return res;
                } catch (error) {
                    throw error;
                }
            }
        }
    }
}

