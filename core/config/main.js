const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { CONFIG } = require('../const');

// 获取环境变量参数
function getProcessArgv() {
    const argv = {};
    // eslint-disable-next-line no-undef
    process.argv.forEach(function (item, i) {
        if (i > 0) {
            const res = item.split('=');
            if (res.length === 2) {
                argv[res[0]] = res[1];
            }
        }
    });
    return argv;
}
// 从appData获取配置
function getConfigFromAppData(useAppPathConfig) {
    let config = {};
    if (useAppPathConfig) {
        try {
            const configPath = path.join(app.getPath('userData'), 'config.json');
            // 从appData读取环境变量
            const res = fs.readFileSync(configPath);
            config = JSON.parse(res.toString());
        } catch (error) {
            console.log('[sugar-electron] get appData fail，can continue to use');
        }
    }
    return Object.assign({ env: '', config: {} }, config);
}
// 获取项目本地config基础配置
function getLocalBaseConfig(configPath) {
    try {
        return require(path.join(configPath, 'config.base')) || {}
    } catch (error) {
        console.error('[sugar-electron]', error);
        return {};
    }
}
// 获取项目本地config配置
function getLocalConfig(configPath, env) {
    const configName = `config.${env}`.replace(/\.$/, '');
    try {
        return require(path.join(configPath, configName)) || {};
    } catch (error) {
        console.error('[sugar-electron]', error);
        return {};
    }
}

class Config {
    getConfig({ useAppPathConfig, configPath }) {
        const appData = getConfigFromAppData(useAppPathConfig);
        const argv = getProcessArgv();
        const env = appData.env || argv.env || '';
        const baseLocalConfig = getLocalBaseConfig(configPath);
        const localConfig = getLocalConfig(configPath, env);
        Object.assign(this, { argv }, baseLocalConfig, localConfig, appData.config);
        return this;
    }
}

const config = new Config();
global[CONFIG] = config;
module.exports = config;
