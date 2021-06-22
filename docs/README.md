# 核心功能

## 基础进程类——BaseWindow
基础进程类BaseWindow基于BrowserWindow二次封装，sugar-electron以BaseWindow为载体，聚合了框架所有核心模块。

### 举个例子


**使用BrowserWindow创建渲染进程**

``` js
// 在主进程中.
const { BrowserWindow } = require('electron')
let win = new BrowserWindow({ width: 800, height: 600, show: false });
win.on('ready-to-show', () => {})
win.loadURL('https://github.com');

```

**使用BaseWindow创建渲染进程**

``` js
// 在主进程中.
const { BaseWindow } = require('sugar-electron');
let win = new BaseWindow('winA', {
  url: 'https://github.com' // BaseWindow 特有属性，默认打开的页面
  width: 800, ght: 600, show: false
});
win.on('ready-to-show', () => {})
const browserWindowInstance = winA.open();

```

## 服务进程类——Service
在实际业务开发中，我们需要有一个进程去承载业务进程通用模块的功能，Service为此而生。Service进程实例实际上也是渲染进程，只是开发者只需要传入启动入口js文件，即可创建一个渲染进程，且BaseWindow一样，聚合框架所有核心模块。

### 举个例子

``` js
// -----------------------主进程-----------------------
const service = new Service('service', path.join(__dirname, 'app.js'), true);
service.on('success', function () {
    console.log('service进程启动成功');
});
service.on('fail', function () {
    console.log('service进程启动异常');
});
service.on('crashed', function () {
    console.log('service进程崩溃'); // 对应webContents.on('crashed')
});
service.on('closed', function () {
    console.log('service进程关闭'); // 对应browserWindow.on('closed')
});
```

## 进程通信——ipc

ipc作为进程间通信核心模块，支持三种通信方式：

1. 请求响应（渲染进程间）
1. 发布订阅（渲染进程间）
1. 主进程与渲染进程通信


## 请求响应

**逻辑视图：**

![image](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9zdG9yZS1nMS5zZWV3by5jb20vZWFzaWNsYXNzLXB1YmxpYy85NzJmMGUyYTUxYjI0ZTYzYTRhMzQxMDMwNWE1ZjEyNA?x-oss-process=image/format,png)

### 举个例子


``` js
// 服务进程service
const { ipc } = require('sugar-electron');  
// 注册响应服务A1
ipc.response('service-1', (json, cb) => {
    console.log(json); // { name: 'winA' }
    cb('service-1响应');
});

// 渲染进程winA
const { ipc, windowCenter } = require('sugar-electron');  

const r1 = await windowCenter.service.request('service-1', { name: 'winA' });
console.log(r1); // service-1响应
// 等同
const r2 = await ipc.request('service', 'service-1', { name: 'winA' });
console.log(r2); // service-1响应

```

**异常**


状态码 1 | 说明 2
---|---
1 | 找不到进程
2 | 找不到进程注册服务
3 | 超时

## 发布订阅

**逻辑视图：**

![image](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9zdG9yZS1nMS5zZWV3by5jb20vZWFzaWNsYXNzLXB1YmxpYy8wNjg2ZmJiZjJkMDc0NGU0YTAxMWUwOGQ5MGNhM2ZlOA?x-oss-process=image/format,png)

### 举个例子


``` js
// 服务进程service
const { ipc } = require('sugar-electron');
setInterval(() => {
    ipc.publisher('service-publisher', { name: '发布消息' });
}, 1000);

// winA
const { ipc, windowCenter } = require('sugar-electron');  

// 订阅
const unsubscribe = windowCenter.service.subscribe('service-publisher', (json) => {
    console.log(json); // { name: '发布消息' }
});
// 等同
const unsubscribe = ipc.subscribe('service', service-publisher', (json) => {
    console.log(json); // { name: '发布消息' }
});


// 取消订阅 
unsubscribe();
// 等同
windowCenter.service.unsubscribe('service-publisher', cb);

```

## 主进程与渲染进程间通信（进程名"main"，为主进程预留）

sugar-electron框架设计理念所有业务模块都有各个渲染进程完成，所以基本上不存在与主进程通信的功能，但不排除有主进程与渲染进程通信的场景。

所以sugar-electron进程通信模块支持与主进程通信接口，接口与渲染进程保持一致，只是主进程名占用==“main”==

### 举个例子

``` js
// 主进程
const { ipc } = require('sugar-electron');
ipc.response('test', (data, cb) => {
    console.log(data); // 我是渲染进程
    cb('我是主进程')
});
 
// winA
const res = ipc.request('main', 'test', '我是渲染进程');
console.log(res); // 我是主进程

```

## 进程管理——windowCenter
sugar-electron所有的业务模块都是渲染进程。我们知道进程之间是不能直接访问的，所有有了进程管理模块。

所有的渲染进程都能在windowCenter中根据进程名对应的唯一key找到对应的渲染进程，让进程之间的调用就像同线程模块之间直接调用一样方便。

### 举个例子

需求：winA内打开winB，并在winB webContents初始化完成后，设置窗口B setSize(400, 400)


``` js
// 主进程
const { BaseWindow, Service, windowCenter } = require('sugar-electron');
// 设置窗口默认设置，详情请参考Electron BrowserWindow文档
BaseWindow.setDefaultOption({
  show: false
});
 
// winA
const winA = new BaseWindow('winA', {
   url: `file://${__dirname}/indexA.html`
});
 
// winB
const winB = new BaseWindow('winB', {
   url: `file://${__dirname}/indexB.html`
});
 
// 创建winA窗口实例
windowCenter.winA.open(); // 等同于winA.open();
```

``` js
// winA
const { windowCenter } = require('sugar-electron');
const winB = windowCenter.winB;
// 创建winB窗口实例
await winB.open();
// 订阅窗口创建完成“ready-to-show”
const unsubscribe = winB.subscribe('ready-to-show', () => {
   // 解绑订阅
   unsubscribe();
  // 设置winB size[400, 400]
   const r1 = await winB.setSize(400, 400);
   // 获取winB size[400, 400]
   const r2 = await winB.getSize();
   console.log(r1, r2);
});
```

==备注：服务进程句柄通过windowCenter也可以获取==

## 进程间状态共享——store
sugar-electron是多进程架构设计，在业务系统中，避免不了多个业务进程共享状态。由于进程间内存相互独立，不互通，为此sugar-electron框架集成了进程状态共享模块。

进程状态共享模块分成两个部分：

- 主进程申明共享状态数据
- 渲染进程设置、获取共享状态数据，订阅状态变化

### 举个例子


``` js
// 主进程——初始化申明state
const { store } = require('sugar-electron');
store.createStore({
    state: {
        name: '我是store'
    },
    modules: {
        moduleA: {
            state: {
                name: '我是moduleA'
            }
        },
        moduleB: {
            state: {
                name: '我是moduleB'
            },
            modules: {
                moduleC: {
                    state: {
                        name: '我是moduleC'
                    }
                }
            }
        }
    }
});
```

``` js
// 渲染进程A，订阅state变化
const { store } = require('sugar-electron');
console.log(store.state.name); // 我是store
// 订阅更新消息
const unsubscribe = store.subscribe((data) => {
    console.log(store.state.name); // 改变state
    unsubscribe(); // 取消订阅
});
 
// moduleA
const moduleA = store.getModule('moduleA');
console.log(moduleA.state.name); // 我是moduleA
const unsubscribeA = moduleA.subscribe((data) => {
    console.log(moduleA.state.name); // 改变moduleA
    unsubscribeA(); // 取消订阅
});

```

``` js
// 渲染进程B，设置state
const { store } = require('sugar-electron');
await store.setState({
    'name': '改变state'
});
 
// moduleA
const moduleA = store.getModule('moduleA');
await moduleA.setState({
    'name': '改变moduleA'
});

```

## 配置——config
sugar-electron提供了多环境配置，可根据环境变量切换配置，默认加载生成环境配置。

``` js
config
|- config.base.js     // 基础配置
|- config.js          // 生产配置
|- config.test.js     // 测试配置——环境变量env=test
|- config.dev.js      // 开发配置——环境变量env=dev
```

**流程图：**

![image](https://store-g1.seewo.com/easiclass-public/7132693d3a8c429f9ec1bb650a8034fc)

### 举个例子
``` js
// 主进程
const { config, start } = require('sugar-electron');
start().then(() => {
  console.log(config);
});

// 渲染进程
const { config } = require('sugar-electron');
console.log(config);
```

==备注：==
- AppData/appName 配置文件config.json { "env": "环境变量", "config": "配置" }
- sugar-electron默认根据根目录config自动初始化


## 插件——plugins 
一个好用的框架离不开框架的可扩展性和业务复用。开发者通过plugins模块自定义插件和配置安装插件。


==使用一款插件，需要三个步骤：==
1. 自定义封装
1. config目录配置问题plugins.js配置插件安装
1. 使用插件

### 插件封装
``` js
// 1、自定义封装ajax插件adpter
const axios = require('axios');
const apis = {
    FETCH_DATA_1: {
        url: '/XXXXXXX1',
        method: 'POST'
    }
}
 
module.exports = {
    /**
     * 安装插件，自定义插件必备
     * @ctx [object] 框架上下文对象{ config, ipc, store, windowCenter, plugins }
     * @params [object] 配置参数
    */
    install(ctx, params = {}) {
        // 通过配置文件读取基础服务配置
        const baseServer = ctx.config.baseServer;
        return {
            async callAPI(action, option) {
                const { method, url } = apis[action];
                try {
                    // 通过进程状态共享SDK获取用户ID
                    const token = ctx.store.state.token;
                    const res = await axios({
                        method,
                        url: `${baseServer}${url}`,
                        data: option,
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
```

## 插件安装
在配置中心目录plugins.js配置插件安装
``` js
config
|- config.base.js     // 基础配置
|- config.js          // 生产配置
|- config.test.js     // 测试配置——环境变量env=test
|- config.dev.js      // 开发配置——环境变量env=dev
|- plugins.js         // 插件配置文件
```
``` js
// 2、配置插件安装
const path = require('path');
exports.adpter = {
    // 如果根路径plugins目录有对应的插件名，则不需要配置path或package
    path: path.join(__dirname, '../plugins/adpter'),  // 插件绝对路径
    package: 'adpter',  // 插件包名，如果package与path同时存在，则package优先级更高
    enable: true, // 是否启动插件
    env: ['main', 'render'], // 插件运行环境，main在主进程安装，render在渲染进程安装
    include: ['winA'], // 插件使用范围，如果为空，则所有渲染进程安装
    params: { timeout: 20000 } // 传入插件参数
};
```

## 插件使用

``` js
// 3、使用插件——winA
const { plugins } = require('sugar-electron');
const res = await plugins.adpter.callAPI('FETCH_DATA_1', {});
```

## 启动框架
启动框架，初始化框架核心模块，且在app.isReady() === true，返回Promise.resolve();

### 举个例子

``` js
const { start } = require('sugar-electron');
start({
    useAppPathConfig: false, // 可选，是否从应用安装系统缓存目录%appData%/应用/config.json中读取配置合并
    basePath: '启动目录', // 可选，默认根目录
    configPath: '配置中心目录', // 可选，默认basePath/config
    storePath: '进程状态共享目录', // 可选，默认basePath/store
    windowCenterPath: '配置中心目录', // 可选，默认basePath/windowCenter
    pluginsPath: '插件目录', // 可选，默认basePath/plugins
}).then(() => console.log('app ready'));
```

# 注意事项

1、由于sugar-electron核心模块会自动判断主进程或者渲染进程环境，自动选择加载不同环境的模块，如果使用webpack打包会导致把两个环境的代码都打包进去，可能还会出现异常。

因此，如果使用webpack打包，引入sugar-electron采用如下方式：


``` js
// 主进程
const { ipc, store, ... } = require('sugar-electron/main')


// 渲染进程
const { ipc, store, ... } = require('sugar-electron/render')
```

# API

## start
启动框架，初始化框架核心模块，且在app.isReady() === true，返回Promise.resolve();

**主进程API**

``` js
/**
 * 自动判断app.whenReady启动框架初始化
 * @param {object} options 启动参数
 * @param {string} options.useAppPathConfig 是否从应用安装系统缓存目录%appData%/应用/config.json中读取配置合并，默认false
 * @param {string} options.basePath 启动目录，默认根目录
 * @param {string} options.configPath 配置目录，默认basePath/config
 * @param {string} options.storePath 进程状态共享目录，默认basePath/store
 * @param {string} options.windowCenterPath 窗口中心目录，默认basePath/windowCenter
 * @param {string} options.pluginsPath 插件目录，默认basePath/plugins
 * @return {Promise}
*/
start(opions)
```
**使用举例**
``` js
// -----------------------主进程-----------------------
start({
    useAppPathConfig: boolean,
    basePath: string,
    configPath: string,
    storePath: string,
    windowCenterPath: string,
    pluginsPath: string
});
```

## BaseWindow
``` js
/**
 * 主进程调用
 * @param {string} name
 * @param {object} option
 */
new BaseWindow(name, option);
```
**主进程API**

**setDefaultOptions [类方法]设置窗口默认配置**
``` js
/**
 * @param {object} option 参考electron BrowserWindow
 */
setDefaultOptions(option)
```

**open [实例方法]创建一个BrowserWindow实例**
``` js
/**
 * @param {object} option 参考electron BrowserWindow
 * @return {browserWindow}
 */
open(option)
```
**getInstance [实例方法]**
``` js
/**
 * @return {browserWindow}
 */
getInstance()
```
**isInstanceExist [实例方法]判断窗口实例是否存在**
``` js
/**
 * @return {browserWindow}
 */
isInstanceExist()
```

**publisher [实例方法]向当前窗口发布通知，可参考ipc模块**
``` js
/**
 * @param {string} eventName 通知事件名
 * @param {object} param 参数
 * @return {promise}
 */
publisher(eventName, param)
```
**subscribe [实例方法]向当前窗口订阅通知，可参考ipc模块**
``` js
/**
 * @param {string} eventName 通知事件名
 * @param {function} callback 回调
 * @return {unsubscribe} 取消订阅函数
 */
subscribe(eventName, callback)
```
**unsubscribe [实例方法]向当前窗口取消订阅通知，可参考ipc模块**
``` js
/**
 * @param {string} eventName 通知事件名
 * @param {function} callback 回调
 */
unsubscribe(eventName, callback)
```
**request [实例方法]向当前窗口发起请求，可参考ipc模块**
``` js
/**
 * @param {string} eventName 请求事件名事件名
 * @param {object} param 参数
 * @param {number} timeout 超时时间
 * @return {promise}
 */
request(eventName, param, timeout)
```
**使用举例**
``` js
// -----------------------主进程-----------------------
const { BaseWindow } = require('sugar-electron');
BaseWindow.setDefaultOptions({
    width: 600,
    height: 800,
    show: false,
    ...
});
const winA = new BaseWindow('winA', { url: 'https://github.com' });
const instance = winA.open({...}); // 创建窗口
instance === winA.getInstance(); // true
```

## Service

**主进程API**
``` js
/*
 * 创建服务进程
 * @param {string} name 服务进程名
 * @param {string} path 启动入口文件路径（绝对路径）
 * @param {boolean} devTool  是否打开调试工具，默认false
 */
new Service(name = '', path = '', openDevTool = false);
```

**使用举例**
``` js
// -----------------------主进程-----------------------
const service = new Service('service', path.join(__dirname, 'app.js'), true);
service.on('success', function () {
    console.log('service进程启动成功');
});
service.on('fail', function () {
    console.log('service进程启动异常');
});
service.on('crashed', function () {
    console.log('service进程崩溃'); // 对应webContents.on('crashed')
});
service.on('closed', function () {
    console.log('service进程关闭'); // 对应browserWindow.on('closed')
});
```

## windowCenter

**主进程、渲染进程API**

``` js
windowCenter: object 进程集合key=进程名 value=进程实例，默认{}
```
**使用举例**
``` js
// -----------------------主进程-----------------------
const service = new Service('service', path.join(__dirname, 'app.js'), true);
const winA = new BaseWindow('winA', {});
const winB = new BaseWindow('winB', {});
windowCenter['service'] === service; // true
windowCenter['winA'] === winA; // true
windowCenter['winB'] === winB; // true
windowCenter['winA'].open(); // 创建winA窗口实例，同步调用
windowCenter['winA'].on('ready-to-show', () => {
    windowCenter['winA'].setFullscreen(true);
});
// -----------------------渲染进程-----------------------
// 渲染进程接口调用实际上是通过ipc通道通知主进程进程接口调用，所以接口异步而非同步
(async () => {
   await windowCenter['winA'].open(); // 创建winA窗口实例，异步Promise调用
   windowCenter['winA'].subscribe('ready-to-show', async () => {
       await windowCenter['winA'].setFullscreen(true);
   });
})()

```

## ipc
**主进程/渲染进程API**

**setDefaultRequestTimeout 设置响应超时时间**

``` js
setDefaultRequestTimeout(timeout = 0);
```
**request 请求**

``` js
/**
 * @param {string} toId 进程ID（注册通信进程模块名） 
 * @param {string} eventName 事件名 
 * @param {any} data 请求参数 
 * @param {number} timeout 超时时间，默认20s * 
 * @return 返回Promise对象
 */
request(toId, eventName, data, timeout)
```

**response 响应**

``` js
/**
 * 注册响应服务
 * @param {string} eventName 事件名  
 * @param {function} callback 回调
 */
response(eventName, callback)
```

**unresponse 注销响应服务**
``` js
/**
 * @param {string} eventName 事件名  
 * @param {function} callback 回调
 */
unresponse(eventName, callback)
```

**publisher 发布**
``` js
/**
 * @param {string} eventName 事件名  
 * @param {any} param 参数
 */
publisher(eventName, param)
```

**subscribe 订阅**
``` js
/**
 * @param {string} toId BaseWindow窗口名，不传，则默认订阅所有窗口进程
 * @param {string | array} eventName 事件名 
 * @param {function} callback 回调
 * Auguments.length === 2，则表示订阅所有进程
 */
subscribe(toId, eventName, callback)
```

**unsubscribe 取消订阅**
``` js
/**
 * @param {string} toId BaseWindow窗口名，不传，则默认取消订阅所有窗口进程
 * @param {string} eventName 事件名 
 * @param {function} callback 回调
 * Auguments.length === 2，则表示取消订阅所有进程
 */
unsubscribe(toId, eventName, callback)
```

**使用举例**

``` js
// ---------------------winA---------------------
const { ipc } = require('sugar-electron');  
// 注册响应服务A1
ipc.response('get-data', (json, cb) => {
    console.log(json); // { name: 'winB' }
    cb('winA响应');
});


// ---------------------winB---------------------
const { ipc, windowCenter } = require('sugar-electron');  
const btn1 = document.querySelector('#btn1');
const { winA } = windowCenter;
btn1.onclick = () => {
    const r1 = await winA.request('get-data', { name: 'winB' });
    console.log(r1); // winA响应
    // 等同
    const r2 = await ipc.request('get-data', 'get-data', { name: 'winB' });
    console.log(r2); // winA响应
}

```
## store

**主进程API**

**createStore 初始化state**

``` js
/**
 * @param {object} store
 */
createStore(store)
```

**渲染进程/主进程API**

**setState 设置state**

``` js
/**
 * 单个值设置
 * @param {string} key
 * @param {any} value
 * @return 返回Promise对象
 */
 setState(key, value)
 
 /**
 * 批量设置
 * @param {object} state
 * @return 返回Promise对象
 */
 setState(state)
```

**subscribe 订阅当前module的值变化通知**

``` js
/**
 * @param {function} cb 订阅回调
 * @return {function} 返回注销订阅function
 */
subscribe(cb)
```
**unsubscribe 注销订阅**

``` js
/**
 * @param {funtion} cb 订阅回调
 */
unsubscribe(cb)
```

**getModule 获取module**
 
``` js
/**
 * 获取module
 * @param {string} moduleName 模块名
 * @return {object} module
 * 返回：setState: 设置当前模块state;subscribe: 订阅;unsubscribe: 注销订阅;getModule: 获取当前模块的子模块;getModules
 */
getModule(moduleName)
```

**getModules 获取所有modules**

``` js
/**
 * @return {array} [module, module, module]
 */
getModules()
```

**使用举例**

```js
// 主进程——初始化申明state
const { store } = require('sugar-electron');
store.createStore({
    state: {
        name: '我是store'
    },
    modules: {
        moduleA: {
            state: {
                name: '我是moduleA'
            }
        },
        moduleB: {
            state: {
                name: '我是moduleB'
            },
            modules: {
                moduleC: {
                    state: {
                        name: '我是moduleC'
                    }
                }
            }
        }
    }
});
 
// 渲染进程
const { store } = require('sugar-electron');
store.state.name; // 我是store

// 订阅更新消息
const unsubscribe = store.subscribe((data) => {
    console.log('更新：', data); // 更新：{ name: '我是store1' }
});
await store.setState({
    'name': '我是store1'
});
unsubscribe(); // 取消订阅
 
// moduleA
const moduleA = store.getModule('moduleA');
moduleA.state.name; // 我是moduleA
const unsubscribeA = moduleA.subscribe((data) => {
    console.log('更新：', data); // 更新：{ name: '我是moduleA1' }
});
await moduleA.setState({
    'name': '我是moduleA1'
});
moduleA.unsubscribe(cb); // 取消订阅

```
