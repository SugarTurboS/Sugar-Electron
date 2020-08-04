const path = require('path');
const fs = require('fs');
const os = require('os');
// eslint-disable-next-line no-undef
const DEFAULT_PATH = path.join(process.cwd(), 'config');
const APP_DATA = path.join(os.homedir(), '/AppData/Roaming');
const { SUGAR_OPTION, CONFIG_GET } = require('../const');
global[SUGAR_OPTION].configPath = DEFAULT_PATH;
const config = {};
let hasInit = false;
let appName = '';
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
function getConfigFromAppData(appName) {
    const configPath = path.join(APP_DATA, appName, 'config.json');
    let config = {};
    try {
        // 从appData读取环境变量
        const res = fs.readFileSync(configPath);
        config = JSON.parse(res.toString());
    } catch (error) {
        console.error('获取appData配置失败，不影响使用');
    }
    return Object.assign({ env: '', config: {} }, config);
}
// 获取项目本地config基础配置
function getLocalBaseConfig(configPath) {
    try {
        return require(path.join(configPath, 'config.base')) || {}
    } catch (error) {
        console.error(error);
        return {};
    }
}
// 获取项目本地config配置
function getLocalConfig(configPath, env) {
    const configName = `config.${env}`.replace(/\.$/, '');
    try {
        return require(path.join(configPath, configName)) || {};
    } catch (error) {
        console.error(error);
        return {};
    }
}

const getConfig = global[CONFIG_GET] = function () {
    if (hasInit === false) {
        const appData = getConfigFromAppData(appName);
        const argv = getProcessArgv();
        const env = appData.env || argv.env || '';
        const baseLocalConfig = getLocalBaseConfig(global[SUGAR_OPTION].configPath);
        const localConfig = getLocalConfig(global[SUGAR_OPTION].configPath, env);
        Object.assign(config, { argv }, baseLocalConfig, localConfig, appData.config);
        hasInit = true;
    }
    return config;
}

/**
 * 设置参数
 * @param {object} params
 * option.appName 应用名
 * option.configPath 默认配置目录路径，如果不传则自动加载根目录config目录 
 * */
const setOption = function(params = {}) {
    appName = params.appName || '';
    global[SUGAR_OPTION].configPath = params.configPath;
    return getConfig();
}

config.getConfig = getConfig;
config.setOption = setOption;

module.exports = config;


