const { app } = require('electron');
const path = require('path');
const appName = 'electron-core';
const configPath = path.join(__dirname, './config');
app.on('ready', function () {
   const { BaseWindow, config, store } = require('../core');
   const states = require('./store');
   const configData = config.setOption({ appName, configPath });

   // 初始化store
   store.createStore(states);

   // 打印配置
   console.log('[configData]', configData);

   // 设置窗口默认设置
   BaseWindow.setDefaultOptions({
      show: false
   });

   const { winA, winB, service } = require('./windowCenter');

   service.start();
   winA.open();
   winB.open();
});