/* eslint-disable no-undef */
const { start, config, plugins, BaseWindow, windowCenter, store, ipc } = require('../core');

start({ basePath: __dirname }).then(() => {
   console.log('[sugar-config]', config);
   console.log('[sugar-plugins]', Object.keys(plugins.adpter));
   windowCenter.winA.open();
});



