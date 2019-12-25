# Suger-Electron

[![NPM version][npm-image]][npm-url]
[![NPM quality][quality-image]][quality-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][vulnerabilities-image]][vulnerabilities-url]
[![Lincense][lincense-image]][lincense-url]

[npm-image]: https://img.shields.io/npm/v/sugar-electron?style=flat-square
[npm-url]: https://www.npmjs.com/package/sugar-electron
[quality-image]: https://npm.packagequality.com/shield/sugar-electron.svg
[quality-url]: http://packagequality.com/#?package=sugar-electron
[david-image]: https://img.shields.io/david/SugarTeam/Sugar-Electron
[david-url]: https://david-dm.org/SugarTeam/Sugar-Electron
[vulnerabilities-image]: https://img.shields.io/snyk/vulnerabilities/github/SugarTeam/Sugar-Electron?style=flat-square
[vulnerabilities-url]: https://app.snyk.io/org/sugarteam/project/a50b5a82-6b37-4494-8138-7355dbb57d2a?action=retest&success=true&result=RETESTED
[lincense-image]: https://img.shields.io/github/license/SugarTeam/Sugar-Electron?style=flat-square
[lincense-url]: https://github.com/SugarTeam/Sugar-Electron/blob/master/LICENSE

## 安装

```bash
npm i sugar-electron --save-dev
```

## Sugar-Electron 是什么？

Sugar-Electron为Electron跨平台桌面应用而生，我们希望由Sugar-Electron衍生出更多的上层框架，甚至打造基于Sugar-Electron框架生态，帮助开发团队和开发人员降低开发和维护成本。

我们知道Electron应用程序有三大基础模块。

* 主进程
* 渲染进程
* 进程间通信

在以往大部分情况下，应用会将大量的业务逻辑写在主进程中，在渲染进程中只处理UI相关的逻辑，这为整个程序的稳定性埋下了隐患。在Electron中，主进程控制了整个程序的
生命周期，同时也负责管理它创建出来的各个渲染进程。一旦主进程的代码出现问题，那么会导致以下情况发生

* 主进程出现不可捕获的异常：如通过ffi调用dll，dll未捕获异常会直接导致Electorn主进程崩溃，进而整个程序崩溃退出
* 主进程代码中，写了耗时较长的同步代码或同步死循环。这会导致主进程阻塞，主进程阻塞又会导致全部渲染进程卡主，程序处于假死状态

为了解决诸如此类的问题，提高Electorn应用的稳定性，我们实现了Sugar-Electron这个轻量级的框架。


## 设计原则

Sugar-Electron所有的模块都基于渲染进程设计，将原有在主进程的逻辑移植到渲染进程中，原有的主进程仅充当守护进程的角色。
这样的好处是，及时渲染进程崩溃，也不会影响到整个应用，同时主进程可以守护当前挂掉的渲染进程，可以重新创建该进程，达到复原的效果。

以这样的模式开发，会有很多的问题需要解决，如进程管理、进程间通信、数据共享等，Sugar-Electron框架对这些模块进行了高度的封装，开发时不需要重写这些模块。
Sugar-Electron也借鉴了Egg.js的设计模式，提供了一套完整的开发规范来约束团队成员开发，提高项目代码一致性及降低沟通成本。

Sugar-Electron具有较高的扩展性，通过插件机制，可以讲框架的部分能力与框架本身解耦，同时使用者也可以根据自己的业务场景定制插件组合到框架中，降低开发成本。

![设计原则](https://raw.githubusercontent.com/SugarTeam/Sugar-Electron/master/pictures/1.png)

Sugar-Electron基于类微内核架构设计，将内部分为以下七大核心模块：

* 基础进程类
* 服务进程类
* 进程通信
* 进程状态共享
* 配置
* 插件
* 进程管理中心

![设计原则](https://raw.githubusercontent.com/SugarTeam/Sugar-Electron/master/pictures/2.png)

注：基础进程类与服务进程类同属于原渲染进程

## 开始

需求：
1. 两个窗口winA、winB，服务进程service，程序启动是创建winA。
1. 在winA中，点击按钮btn1创建winB。
1. 在winB创建完成后，winA点击按钮btn2设置winB size[400, 400]。
1. winA点击按钮btn3 向winB B1、B2发送“我是winA”的消息，winB收到消息后回复“我是winB”
1. winA点击按钮btn4 向service service-1发送“我是winA”的消息，service收到消息后回复“service-1响应”

 ```js
// 主进程
const { start, BaseWindow, Service } = require('Sugar-Electron');
// 启动sugar-electron，basePath设置框架根目录
start({ appName: 'sugar-electron', basePath: __dirname });
// 设置窗口默认设置，详情请参考Electron BrowserWindow文档
BaseWindow.setDefaultOptions({
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

// service
const service = new Service('service', path.join(__dirname, 'app.js'));
service.on('success', function () {
    console.log('service进程启动成功');
});
service.on('fail', function () {
    console.log('service进程启动异常');
});
 
// 创建winA窗口实例
winA.open();
```
 ```js
 // winA
const { windowCenter } = require('Sugar-Electron');
const btn1 = document.querySelector('#btn1');
const btn2 = document.querySelector('#btn2');
const btn3 = document.querySelector('#btn3');
const btn4 = document.querySelector('#btn4');
// 获取winB句柄
const winB = windowCenter.winB;
// 获取service句柄
const service = windowCenter.service;
btn1.onclick = async function () {
    // 创建winB窗口实例
    await winB.open();
    
    // 订阅窗口创建完成“ready-to-show”
    const unsubscriber = winB.subscriber('ready-to-show', () => {
        // 解绑订阅
        unsubscriber();
        
        btn2.onclick = async function () {
            // 设置winB size[400, 400]
            const r1 = await winB.setSize(400, 400);
            // 获取winB size[400, 400]
            const r2 = await winB.getSize();
            console.log(r1, r2);
        }
    });
};

btn3.onclick = async function () {
    // 向winB请求B1
    const r1 = await winB.request('B1', '我是winA');
    console.log(r1); // B1,我是winB 
    // 向winB请求B2
    const r2 = await winB.request('B2', '我是winA');
    console.log(r2); // B2,我是winB
}

btn4.onclick = async function () {
    // 向winB请求B1
    const r1 = await service.request('service-1', '我是winA');
    console.log(r1); // service-1响应
}
```
 ```js
// winB
const { ipc } = require('Sugar-Electron');
ipc.response('B1', (json, cb) => {
    console.log(json); // 我是winA
    cb('B1,我是winB');
});

ipc.response('B2', (json, cb) => {
    console.log(json); // 我是winA
    cb('B2,我是winB');
});
```

 ```js
// service app.js
const { ipc } = require('Sugar-Electron');
ipc.response('service-1', (json, cb) => {
    console.log(json); // 我是winA
    cb('service-1响应');
});
```

## 基础进程类——BaseWindow

### 说明

Sugar-Electron框架核心基础进程类，以基础进程类为载体，聚合了框架所有`核心模块`。Sugar-Electron基础进程类BaseWindow基于BrowserWindow二次封装，新增方法：
- open // 创建一个BrowserWindow示例，并返回BrowserWindow实例
- getInstance // 获取BrowserWindow示例，示例未创建则返回null

一般情况下，基础进程类用于创建原有的渲染进程，处理窗口UI界面相关的逻辑。


### 示例
需求：
1. 创建winA实例
1. 创建winA窗口

 ```js
// 主进程
const { BaseWindow } = require('Sugar-Electron');
// 设置窗口默认设置，详情请参考Electron BrowserWindow文档
BaseWindow.setDefaultOptions({
   show: false
});
 
// 创建winA实例
const winA = new BaseWindow('winA', {
    url: `file://${__dirname}/indexA.html`
});
 
// 创建winA窗口
winA.open();
```
 ```js
// winA
const { windowCenter, ipc } = require('Sugar-Electron');
const winA = windowCenter.winA;
// 支持BrowserWindow实例所有生命周期对应事件
winA.subscriber('ready-to-show', () => { ... });
winA.subscriber('show', () => { ... });
winA.subscriber('hide', () => { ... });
winA.subscriber('focus', () => { ... });
...
// 支持BrowserWindow实例所有接口对应函数，但同步调用改成promise（原因是，sugar内部实现其实是通过ipc异步通信调用主进程窗口实例的函数）
await winA.setSize();
await winA.getSize();
await winA.show();
await winA.hide();
...
```

## 服务进程类——Service

### 说明

Sugar-Electron框架提供服务进程类，开发者只需要传入启动入口文件，即可创建一个服务进程。

所谓的服务进程，即承载了原来主进程应该执行的代码的渲染进程。上面有介绍到，为了保障整个应用的稳定性，我们将原来处于主进程中的业务逻辑，转移到了服务进程中。
它本质上就是一个渲染进程，拥有渲染进程的所有能力。只是在这基础之上，框架赋予了它特殊的能力，使得它能满足我们的业务场景，变为了”服务进程“。

服务进程与渲染进程区别：

* 服务进程不显示界面，纯执行逻辑
* 服务进程崩溃关闭后，可自动重启
* 服务进程在崩溃重启后，可通过进程数据共享模块复原状态

### 示例

```js
// 主进程
// 启动service
const service = new Service('service', path.join(__dirname, 'app.js'));
service.on('success', function () {
    console.log('service进程启动成功');
});
service.on('fail', function () {
    console.log('service进程启动异常');
});
```
```js
// app.js
const { ipc } = require('Sugar-Electron');
ipc.response('service-1', (json, cb) => {
    cb('service-1响应');
});
ipc.response('service-2', (json, cb) => {
    cb('service-2响应');
});

```
## 进程通信——ipc

### 说明

Sugar-electron是多进程架构设计，进程间通信必不可少。

ipc作为Sugar-electron进程间通信核心模块，支持两种通信方式：

* 请求响应（渲染进程间）
* 发布订阅（渲染进程间）
* 主进程与渲染进程通信

### 请求响应

![进程间通信](https://raw.githubusercontent.com/SugarTeam/Sugar-Electron/master/pictures/3.png)

![进程间通信](https://raw.githubusercontent.com/SugarTeam/Sugar-Electron/master/pictures/6.png)

#### 示例

```js
// 服务进程service
const { ipc } = require('Sugar-electron');  
// 注册响应服务A1
ipc.response('service-1', (json, cb) => {
    console.log(json); // { name: 'winA' }
    cb('service-1响应');
});

```

```js
// winA
const { ipc, windowCenter } = require('Sugar-electron');  
const btn1 = document.querySelector('#btn1');
btn1.onclick = () => {
    const r1 = await windowCenter.service.request('service-1', { name: 'winA' });
    console.log(r1); // service-1响应
    // 等同
    const r2 = await ipc.request('service', 'service-1', { name: 'winA' });
    console.log(r2); // service-1响应
};
```
#### 异常

Sugar-electron对响应异常做处理。

状态码（code） | 说明 
-|-
1 | 找不到进程
2 | 找不到进程注册服务 
3 | 超时

### 发布订阅

![进程间通信](https://raw.githubusercontent.com/SugarTeam/Sugar-Electron/master/pictures/4.png)

#### 示例

```js
// 服务进程service
const { ipc } = require('Sugar-electron');
setInterval(() => {
    ipc.publisher('service-publisher', { name: '发布消息' });
}, 1000);

```

```js
// winA
const { ipc, windowCenter } = require('Sugar-electron');  
const btn1 = document.querySelector('#btn1');
// 订阅
const unsubscriber1 = windowCenter.service.subscriber('service-publisher', (json) => {
    console.log(json); // { name: '发布消息' }
});
// 订阅
const unsubscriber2 = ipc.subscriber('service', 'service-publisher', (json) => {
    console.log(json); // { name: '发布消息' }
});

btn1.onclick = () => {
    // 取消订阅
    unsubscriber1();
    unsubscriber2();
    // 或windowCenter.service.unsubscriber('service-publisher', cb);
    // 或ipc.unsubscriber('service', 'service-publisher', cb);
};
```

注：渲染进程订阅消息队列在主进程内缓存，所以发布服务进程重启不需要重新订阅，且通过监听渲染进程关闭事件，可自动释放对应的渲染进程缓存消息队列。

### 主进程与渲染进程间通信
Sugar-electron框架设计理念所有业务模块都有各个渲染进程完成，所以基本上不存在与主进程通信的功能，但也非绝无仅有。所以Sugar-electron进程通信模块支持与主进程通信接口。

### 示例
```js
// 主进程
const { ipc } = require('Sugar-electron');
ipc.response('test', (data, cb) => {
    console.log(data); // 我是渲染进程
    cb('我是主进程')
});

// winA
const { ipc } = require('Sugar-electron');
// 请求
ipc.request('main', 'test', '我是渲染进程' , (data) => {
    console.log(data); // 我是主进程
});
```

## 进程管理中心——windowCenter

### 说明

Sugar-electron是是多进程架构设计，在业务系统中，避免不了进程间相互调用，由于进程间彼此独立且进程可能并没有创建，并不能通过ipc消息调用。

sugar-electron核心模块windowCenter就是为了解决此类问题存在，保证所有的业务逻辑在独立在各个进程内完成，屏蔽中间进程通信流程。

windowCenter默认根据根目录windowCenter自动挂载基础进程

#### 示例
例如：winA内打开winB，并在winB webContents初始化完成后，设置窗口B setSize(400, 400)。
 ```js
// 主进程
const { BaseWindow, Service, windowCenter } = require('Sugar-Electron');
// 设置窗口默认设置，详情请参考Electron BrowserWindow文档
BaseWindow.setDefaultOptions({
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
 ```js
 // winA
const { windowCenter } = require('Sugar-Electron');
const btn1 = document.querySelector('#btn1');
const btn2 = document.querySelector('#btn2');
// 获取winB句柄
const winB = windowCenter.winB;
btn1.onclick = async function () {
    // 创建winB窗口实例
    await winB.open();
    
    // 订阅窗口创建完成“ready-to-show”
    const unsubscriber = winB.subscriber('ready-to-show', () => {
        // 解绑订阅
        unsubscriber();
        
        btn2.onclick = async function () {
            // 设置winB size[400, 400]
            const r1 = await winB.setSize(400, 400);
            // 获取winB size[400, 400]
            const r2 = await winB.getSize();
            console.log(r1, r2);
        }
    });
};
```
备注：服务进程句柄通过windowCenter也可以获取

## 进程间状态共享——store

### 说明

Sugar-electron是多进程架构设计，在业务系统中，避免不了多个业务进程共享状态。由于进程间内存相互独立，不互通，为此Sugar-electron框架集成了进程状态共享模块。

进程状态共享模块分成两个部分：
* 主进程申明共享状态数据
* 渲染进程设置、获取共享状态数据

注：sugar-electron默认根据根目录store自动初始化

#### 示例

```js
// 主进程——初始化申明state
const { store } = require('Sugar-electron');
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
            }
        }
    }
});
 
// 渲染进程
const { store } = require('Sugar-electron');
const r1 = await store.getState('name');
console.log(r1.value); // 我是store
// 订阅r1更新消息
const unsubscriber1 = r1.subscriber((value) => {
    console.log('更新：', value); // 更新：我是store1
});
await store.setState('name', '我是store1');
unsubscriber1(); // 取消订阅，或r1.unsubscriber(cb);
 
const moduleA = await store.getModule('moduleA');
const r2 = await moduleA.getState('name'); // 我是moduleA
console.log(r2.value); // 我是moduleA

// Error: 找不到store state key => .none，请在主进程初始化store中声明
await store.setState('none', '没有声明的state'); 

```
## 配置——config

### 说明

Sugar-electron提供了多环境配置，可根据环境变量切换配置，默认加载生成环境配置。

```js
config
|- config.base.js     // 基础配置
|- config.js          // 生产配置
|- config.test.js     // 测试配置——环境变量env=test
|- config.dev.js      // 开发配置——环境变量env=dev
```

![配置](https://raw.githubusercontent.com/SugarTeam/Sugar-Electron/master/pictures/5.png)

注：
- AppData/appName 配置文件config.json { "env": "环境变量", "config": "配置" }
- sugar-electron默认根据根目录config自动初始化

### 示例

```js
// 主进程
const { config } = require('Sugar-electron');
const { start, config } = require('Sugar-Electron');
// 启动sugar-electron，basePath设置框架根目录
start({ appName: 'sugar-electron', basePath: __dirname });
 
// 渲染进程
const { config } = require('Sugar-electron');
console.log(config);

```

## 插件——plugins

### 说明

一个好用的框架离不开框架的可扩展性，Sugar-electron插件模块提供开发者扩展Sugar-electron功能的能力。
Sugar-electron通过框架聚合这些插件，开发者可根据自己的业务场景定制配置，开发应用成本变得更低。

### 示例

使用一款插件，需要三个步骤：
* 自定义封装
* config目录配置问题plugins.js配置插件安装
* 使用插件

#### 插件封装

```js
// 1、自定义封装ajax插件adpter
const axios = require('axios');
const apis = {
    FETCH_DATA_1: {
        url: '/XXXXXXX1',
        method: 'POST'
    },
    FETCH_DATA_2: {
        url: '/XXXXXXX2',
        method: 'GET'
    },
    FETCH_DATA_3: {
        url: '/XXXXXXX3',
        method: 'PUT'
    },
    FETCH_DATA_4: {
        url: '/XXXXXXX4',
        method: 'POST'
    }
}

module.exports = {
    /**
     * 安装插件，自定义插件必备
     * @ctx [object] 框架上下文对象{ config, ipc, store, windowCenter }
     * @params [object] 配置参数
    */
    install(ctx, params = {}) {
        // 通过配置文件读取基础服务配置
        const baseServer = ctx.config.baseServer;
        return {
            async callAPI(action, options) {
                const { method, url } = apis[action];
                try {
                    // 通过进程状态共享SDK获取用户ID
                    const token = await ctx.store.getState('token');
                    const res = await axios({
                        method,
                        url: `${baseServer}${url}`,
                        data: options,
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

#### 插件安装

```js
// 2、配置插件安装
const path = require('path');
exports.adpter = {
    // 如果根路径plugins目录有对应的插件名，则不需要配置path或package
    path: path.join(__dirname, '../plugins/adpter'),  // 插件绝对路径
    package: 'adpter',  // 插件包名，如果package与path同时存在，则package优先级更高
    enable: true, // 是否启动插件
    include: ['winA'], // 插件使用范围，如果为空，则所有渲染进程安装
    params: { timeout: 20000 } // 传入插件参数
};
```

#### 插件使用

```js
// 3、使用插件——winA
const { plugins } = require('Sugar-electron');
const res = await plugins.adpter.callAPI('FETCH_DATA_1', {});
```

## API文档

```js
/**
 * @appName [string] 可选应用name
 * @basePath [string] 可选sugar-electron自动初始化模块（config、store、windowCenter）根目录
 */
start(appName, basePath)

```

### 基础进程类BaseWindow
```js
/**
 * @name [string] 必选 渲染进程名，唯一标识
 * @options [object] 可选 窗口配置，具体可参考electron BrowserWindow
 */
class BaseWindow(name, options)
实例
- open(options) // 创建一个BrowserWindow示例，并返回BrowserWindow实例；option可选参数，覆盖BaseWindow实例窗口配置
- getInstance() // 获取BrowserWindow示例，示例未创建则返回null

```

### 服务进程类Service
```js
/**
 * @name [string] 必选 服务进程名，唯一标识
 * @path [string] 必选 服务进程启动文件，绝对路径
 */
class Service(name, path)
实例
- start(isDebug) // 开始服务进程，isDebug是否打开调试工具
- stop() // 结束服务进程
```

### 配置config
```js
/**
 * @option [object] 可选
 * appName [string] 应用名，默认''
 * configPath [string] 配置目录路径，默认根目录config
 */
setOption({ appName, configPath })

```

### 进程间通信ipc
```js
// 主进程

/**
 * 响应，主进程名`main`，渲染进程通过ipc.request('main', eventName)请求主进程服务
 * @eventName [string] 事件名  
 * @callback [function] 回调
 */
response(eventName, callback)

// 渲染进程
/**
 * 设置响应超时时间
 * @timeout [number] 时间毫秒
 */
setDefaultRequestTimeout(timeout)

/**
 * 请求
 * @toId [string] 进程ID（注册通信进程模块名） 
 * @eventName [string] 事件名 
 * @data 请求参数 
 * @timeout [number] 超时时间，默认20s * 
 * @return 返回Promise对象
 */
request(toId, eventName, data, timeout)

/**
 * 响应
 * @eventName [string] 事件名  
 * @callback [function] 回调
 */
response(eventName, callback)

/**
 * 发布
 * @eventName [string] 事件名  
 * @params 参数
 */
publisher(eventName, params)

/**
 * 订阅
 * @toId [string] 进程ID（注册通信进程模块名） 
 * @eventName [string] 事件名 
 * @callback [function] 回调
 */
subscriber(toId, eventName, callback)

/**
 * 取消订阅
 * @toId [string] 进程ID（注册通信进程模块名） 
 * @eventName [string] 事件名 
 * @callback [function] 回调
 */
unsubscribe(toId, eventName, callback)

```
### 进程管理中心windowCenter
在主进程、渲染进程获取进程句柄，例如窗口A windowCenter['winA'];

### 进程间状态共享store
```js
// 主进程
/**
 * 初始化state
 * @createStore [object] 初始化state
 */
createStore({ appName, configPath })

// 渲染进程
/**
 * 设置state
 * @key [string]
 * @value state
 * @return 返回Promise对象
 */
setState(key, value)

/**
 * 获取state
 * @key [string] 事件名
 * @return 返回Promise对象 { value: '值', subscriber: '订阅更新', unsubscriber: '取消订阅'}
 */
getState(key)

/**
 * 获取module
 * @moduleName [string] 模块名
 * @return 返回Promise对象
 * 返回：setState: 设置当前模块state getState: 获取当前模块state getModule: 获取当前模块的子模块
 */
getModule(moduleName)
```

### 插件plugins
请参考插件说明模块
