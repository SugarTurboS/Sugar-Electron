/* eslint-disable no-undef */
const { app, store } = require('electron');
const appName = 'electron-core';
const defaultState = {
   webPreferences: {
      nodeIntegration: true
   }
};
app.on('ready', function () {
   const { start, BaseWindow, windowCenter, store, ipc } = require('../core');

   // 启动sugar-electron
   start({
      appName,
      basePath: __dirname
   });

   console.log(BaseWindow)
   
   // 设置窗口默认设置
   BaseWindow.setDefaultOption(defaultState);
  
   const service = require('./services/service');
   service.start(true);
   const { winA } = windowCenter;
   winA.open();

   setInterval(() => {
      store.setState({
         a: 'a',
         A: 'A'
      });
      store.getModule('moduleA').setState({
         b: 'b'
      });

      ipc.request('winA', 'test', {}).then(res => {
         console.log('测试主进程请求winA');
      });

      ipc.publisher('test2', '测试主进程发布')
   }, 10000);

   ipc.subscribe('winA', 'test1', (data) =>{
      console.log('测试主进程订阅winA');
   });
});


