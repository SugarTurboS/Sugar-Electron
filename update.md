## v1.1.0
1、 start(option)函数自动判断app.whenReady后执行框架初始化

``` js
// 旧
const { app } = require('electron');
const { start } = require('sugar-electron');
app.on('ready', () => {
  start();
  console.log('ready success');
});

// 新
const { start } = require('sugar-electron');
start().then(() => {
  console.log('ready success');
});
```

2、配置中心模块config
- 添加useAppPathConfig:boolean配置是否从应用安装系统缓存目录%appData%/应用/config.json中读取配置合并，默认false。
- config.setOption({ appName, configPath })函数，改成config.getConfig({ useAppPathConfig, configPath })

 ``` js
// 旧
const { app } = require('electron');
const { start, config } = require('sugar-electron');
app.on('ready', () => {
  console.log('ready success');
  // configPath可选，默认根目录/config
  start({ configPath: 'xxx/xxx' });
  // 打印xxx/xxx/config.json
  console.log(config);
  
  // 从xxx/xxx/xxx读取config
  const _config = config.setOption({ configPath: 'xxx/xxx/xxx' });
  // 打印xxx/xxx/xxx/config.json
  console.log(config);
  
  _config === config; // true
});

// 新
const { start, config } = require('sugar-electron');
start().then(() => {
  console.log('ready success');
  // configPath可选，默认根目录/config
  start({ configPath: 'xxx/xxx' });
  // 打印xxx/xxx/config.json
  console.log(config);
  
  // 从xxx/xxx/xxx读取config
  const _config = config.getConfig({ configPath: 'xxx/xxx/xxx' });
  // 打印xxx/xxx/xxx/config.json
  console.log(config);
  
  _config === config; // true
});
```
3、进程间通信模块ipc
- subscribe(winName, eventName, callback)，如果不传winName，则默认订阅所有进程事件
- unsubscribe(winName, eventName, callback)，如果不传winName，则默认取消订阅所有进程事件

4、插件模块plugins，增加插件配置env，插件运行环境，如果为空，则所有渲染进程安装

``` js
const path = require('path');
exports.log = {
    // 如果根路径plugins目录有对应的插件名，则不需要配置path或package
    path: path.join(__dirname, '../plugins/adpter'),  // 插件绝对路径
    package: 'log',  // 插件包名，如果package与path同时存在，则package优先级更高
    enable: true, // 是否启动插件
    env: ['main', 'render'], // 插件运行环境，main在主进程安装，render在渲染进程安装
    include: ['winA'], // 插件使用范围，如果为空，则所有渲染进程安装
    params: { timeout: 20000 } // 传入插件参数
};
```

**具体使用请查阅使用文档**
