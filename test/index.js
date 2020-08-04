/* eslint-disable no-undef */
const { app} = require('electron');
const appName = 'electron-core';
const defaultState = {
   webPreferences: {
      nodeIntegration: true
   }
};
app.on('ready', function () {
   const { start, BaseWindow, windowCenter } = require('../core');

   // 启动sugar-electron
   start({
      appName,
      basePath: __dirname
   });
   
   // 设置窗口默认设置
   BaseWindow.setDefaultOptions(defaultState);
  
   const service = require('./services/service');
   service.start(true);
   const { winA } = windowCenter;
   winA.open();
});


