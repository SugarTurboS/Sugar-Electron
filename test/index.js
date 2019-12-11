const { app} = require('electron');
const appName = 'electron-core';
// eslint-disable-next-line no-undef
app.on('ready', function () {
   const { start, BaseWindow, config, windowCenter } = require('../core');

   start({
      appName,
      // eslint-disable-next-line no-undef
      basePath: __dirname
   });

   const configData = config.getConfig();

   // 打印配置
   console.log('[configData]', configData);
   // 设置窗口默认设置
   BaseWindow.setDefaultOptions({
      show: true,
      webPreferences: {
         nodeIntegration: true
      }
   });

   const { winA, winB } = windowCenter;
   const service = require('./services/service');
   service.start(false);
   winA.open();
   winB.open();
});