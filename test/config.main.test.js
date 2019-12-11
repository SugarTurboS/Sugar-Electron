/* eslint-disable no-undef */
const config = require('../core/config/main');
const path = require('path');
const configPath = path.join(__dirname, './config');
const json = config.setOption({ appName: 'test', configPath });
describe('config', () => {
    test('读取正式环境配置', () => {
        expect(json.value).toEqual('我是正式配置');
    });
});
