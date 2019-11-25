# Suger-Electron

[![NPM version][npm-image]][npm-url]
[![NPM quality][quality-image]][quality-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][vulnerabilities-image]][vulnerabilities-url]

[npm-image]: https://img.shields.io/npm/v/sugar-electron?style=flat-square
[npm-url]: https://www.npmjs.com/package/sugar-electron
[quality-image]: https://npm.packagequality.com/shield/sugar-electron.svg
[quality-url]: http://packagequality.com/#?package=sugar-electron
[david-image]: https://img.shields.io/david/SugarTeam/Sugar-Electron
[david-url]: https://david-dm.org/SugarTeam/Sugar-Electron
[vulnerabilities-image]: https://img.shields.io/snyk/vulnerabilities/github/SugarTeam/Sugar-Electron?style=flat-square
[vulnerabilities-url]: https://app.snyk.io/org/sugarteam/project/a50b5a82-6b37-4494-8138-7355dbb57d2a?action=retest&success=true&result=RETESTED

## Suger-Electron 是什么？

Suger-Electron为Electron跨平台桌面应用而生，我们希望由Suger衍生出更多的上层框架，甚至打造基于Suger框架生态，帮助开发团队和开发人员降低开发和维护成本。

我们知道Electron应用程序有三大基础模块。

* 主进程
* 渲染进程
* 进程间通信

在以往大部分情况下，应用会将大量的业务逻辑写在主进程中，在渲染进程中只处理UI相关的逻辑，这为整个程序的稳定性埋下了隐患。在Electron中，主进程控制了整个程序的
生命周期，同时也负责管理它创建出来的各个渲染进程。一旦主进程的代码出现问题，那么会导致以下情况发生

* 主进程出现不可捕获的异常：如通过ffi调用dll，dll未捕获异常会直接导致Electorn主进程崩溃，进而整个程序崩溃退出
* 主进程代码中，写了耗时较长的同步代码或同步死循环。这会导致主进程阻塞，主进程阻塞又会导致全部渲染进程卡主，程序处于假死状态

为了解决诸如此类的问题，提高Electorn应用的稳定性，我们实现了Suger-Electron这个轻量级的框架。

## 设计原则

Suger-Electron所有的模块都基于渲染进程设计，将原有在主进程的逻辑移植到渲染进程中，原有的主进程仅充当守护进程的角色。
这样的好处是，及时渲染进程崩溃，也不会影响到整个应用，同时主进程可以守护当前挂掉的渲染进程，可以重新创建该进程，达到复原的效果。

以这样的模式开发，会有很多的问题需要解决，如进程管理、进程间通信、数据共享等，Suger-Electron框架对这些模块进行了高度的封装，开发时不需要重写这些模块。
Suger-Electron也借鉴了Egg.js的设计模式，提供了一套完整的开发规范来约束团队成员开发，提高项目代码一致性及降低沟通成本。

Suger-Electron具有较高的扩展性，通过插件机制，可以讲框架的部分能力与框架本身解耦，同时使用者也可以根据自己的业务场景定制插件组合到框架中，降低开发成本。

![设计原则](https://github.com/SugarTeam/Sugar-Electron/blob/master/pictures/1.png)

Suger-Electron基于类微内核架构设计，将内部分为以下六大核心模块：

* 基础进程类
* 服务进程类
* 进程通信
* 进程状态共享
* 插件
* 配置

![设计原则](https://github.com/SugarTeam/Sugar-Electron/blob/master/pictures/2.png)

注：基础进程类与服务进程类同属于原渲染进程

## 基础进程类

### 说明

Suger-Electron框架核心基础进程类，以基础进程类为载体，聚合了框架所有`核心模块`。Suger-Electron基础进程类BaseWindow继承于BrowserWindow，所以BrowserWindow所有的功能，BaseWindow都有。

一般情况下，基础进程类用于创建原有的渲染进程，处理窗口UI界面相关的逻辑。


### 示例

```js
const { BaseWindow } = require('Suger');
 
// 设置窗口默认设置，详情请参考Electron BrowserWindow文档
BaseWindow.setDefaultOptions({
   show: false
});
 
// 窗口A
class WinA {
    constructor() {
        this.name = 'winA';
        this.options = {
            url: `file://${__dirname}/index.html`,
            width: 800,
            height: 600
        }
    }
 
    open() {
       this.instance = new BaseWindow(this.name, this.options);
       this.instance.on('ready-to-show', () => {
            this.instance.show();
       });
       this.instance.loadURL(this.options.url);
    }
}
 
module.exports = new WinA();
 
// 打开窗口A
const { winA } = require('./windowCenter');
winA.open();
```

## 服务进程类

### 说明

Suger-Electron框架提供服务进程类，开发者只需要传入启动入口文件，即可创建一个服务进程。

所谓的服务进程，即承载了原来主进程应该执行的代码的渲染进程。上面有介绍到，为了保障整个应用的稳定性，我们将原来处于主进程中的业务逻辑，转移到了服务进程中。
它本质上就是一个渲染进程，拥有渲染进程的所有能力。只是在这基础之上，框架赋予了它特殊的能力，使得它能满足我们的业务场景，变为了”服务进程“。

服务进程与渲染进程区别：

* 服务进程不显示界面，纯执行逻辑
* 服务进程崩溃关闭后，可自动重启
* 服务进程在崩溃重启后，可通过数据插件恢复现场数据

### 示例

服务进程代码 service.js

```js
// 服务进程service
const { Service } = require('Suger');
const path = require('path');
module.exports = {
    start() {
        // 创建服务进程service，服务进程启动入口app.js，要写入绝对路径
        const service = new Service('service', path.join(__dirname, 'app.js'));
        service.on('success', function () {
            console.log('service进程启动成功');
        });
       
        service.on('fail', function () {
            console.log('service进程启动异常');
        });
         
        return service;
    }
}
```

主进程调用 main.js

```js
const { service } = require('./service');
service.start();
```

## 进程状态共享

### 说明

Suger是多进程架构设计，在业务系统中，避免不了多个业务进程共享状态。由于进程间内存相互独立，不互通，为此Suger框架集成了进程状态共享模块。

进程状态共享模块分成两个部分：

主进程申明共享状态数据，渲染进程设置、获取共享状态数据

### 示例

```js
// 状态模块moduleA
module.exports = {
    state: {
        b: 2
    }
}

// 状态模块moduleB
module.exports = {
    state: {
        c: 3
    }
}

// store模块
const moduleA = require('./moduleA');
const moduleB = require('./moduleB');
module.exports = {
    state: {
        a: 1
    },
    modules: {
        moduleA,
        moduleB
    }
}

// 主进程——初始化申明state
const { store } = require('Suger');
const states = require('./store');
store.createStore(states);

// 渲染进程
const { ipcSDK } = require('Suger'); 
const r1 = await storeSDK.getState('a'); // 1

const moduleA = await storeSDK.getModule('moduleA');
const r2 = await moduleA.getState('b'); // 2

const is = await storeSDK.setState('a', 'a'); // true
const r3 = await storeSDK.getState('a'); // a

const is = await storeSDK.setState('b', 'a'); // Error: 找不到store state key => .b，请在主进程初始化store中声明

```

### 接口

#### 主进程模块接口

创建状态共享模块：createStore(store:Store)

store: 初始化申明state Store: { state: Object, modules: { module:Store } }

#### 渲染进程模块接口

设置state：setState(key:String, value: Any)

获取state：getState(key:String)

获取模块：getModule(moduleName:String)

返回： setState: 设置当前模块state getState: 获取当前模块state getModule: 获取当前模块的子模块

## 进程通信

### 说明

Suger是多进程架构设计，进程间通信模块必不可少。

支持两种通信方式：

* 请求响应
* 发布订阅

### 请求响应

```js
const { ipcSDK } = require('Suger');  
// 进程A注册响应服务A1
ipcSDK.response('A1', (json, cb) => {
   cb('winA响应请求A1:');
   console.log(json);
});
     
// 进程B向进程A发起请求A1
const r = await ipcSDK.request('winA', 'A1', {data: '请求参数'});
console.log('响应', r);
```

![进程通信](https://github.com/SugarTeam/Sugar-Electron/blob/master/pictures/5.png)

![进程通信](https://github.com/SugarTeam/Sugar-Electron/blob/master/pictures/3.png)

#### 通信异常状态码

状态码（code） | 说明 
-|-
0 | 成功
1 | 找不到进程
2 | 找不到进程注册服务 
3 | 超时

### 发布订阅

```js
const { ipcSDK } = require('Suger');
function cbA3(data) {
   console.log('收到A3订阅消息：', data);
}   
// 进程B向进程A订阅消息A3
ipcSDK.subscriber('winA', 'A3', cbA3);
     
// 进程A发布消息A3
ipcSDK.publisher('A3', { msg: '你好，我是A3消息'});
```

![进程通信](https://github.com/SugarTeam/Sugar-Electron/blob/master/pictures/4.png)

### 与主进程通信

Suger-Electron框架设计理念所有业务模块都有各个渲染进程完成，所以基本上不存在与主进程通信的功能，但也非绝无仅有。所以Suger进程通信模块支持与主进程通信接口。

```js

const { ipcSDK } = require('Suger');
// 渲染进程winA订阅主进程'main-test'
ipcSDK.onFromMain('main-test', (data) => {
    console.log(data);
});
     
// 主进程发布'main-test'
ipcSDK.sendToRender('winA', 'main-test', { msg: '你好，我是A3消息'});
```

注：渲染进程订阅消息队列在主进程内缓存，所以发布服务进程重启不需要重新订阅，且通过监听渲染进程关闭事件，可自动释放对应的渲染进程缓存消息队列。

### 接口

#### 主进程模块接口

##### 发布消息：sendToRender(processName:String, eventName:String, params:Any)

-主进程发布消息到指定渲染进程 processName: 进程名 eventName: 事件名 cb: 回调函数

##### 绑定：onFromRender(eventName:String, cb:Function)

-绑定渲染进程发送到主进程消息 eventName: 事件名 cb: 回调函数

##### 解绑：removeListenerFromRender(eventName:String, cb:Function)

-解绑渲染进程发送到主进程消息 eventName: 事件名 cb: 回调函数

##### 解绑所有：removeListenerFromRender(eventName:String)

-解绑渲染进程发送到主进程消息 eventName: 事件名

#### 渲染进程模块接口介绍

##### 设置响应超时：setDefaultRequestTimeout(timeout:Number)

timeout: 超时时间，默认20s

##### 请求：request(toId:String, eventName:String, data:Object, timeout:Number)

toId: 请求服务进程ID（注册通信进程模块名） eventName: 服务进程响应事件名 data: 请求参数 timeout: 超时时间，默认20s return: 返回Promise对象

##### 注册响应服务：response(eventName:String, callback:Function)

eventName: 响应事件名 callback: 回调函数

##### 发布：publisher(eventName:String, params:Object)

eventName: 消息名 params: 消息参数

##### 订阅：subscriber(toId:String, eventName:String, callback:Function)

toId: 订阅消息进程ID（注册通信进程模块名） eventName: 消息名 callback: 回调函数

##### 退订：unsubscribe(toId:String, eventName:String, callback:Function)

toId: 订阅消息进程ID（注册通信进程模块名） eventName: 消息名 callback: 回调函数

##### 发布消息：sendToMain(eventName:String, params:Any)

渲染进程发布消息到主进程 eventName: 事件名 cb: 回调函数

##### 绑定：onFromMain(eventName:String, cb:Function)

绑定主进程发送到渲染进程消息 eventName: 事件名 cb: 回调函数

##### 解绑：removeListenerFromMain(eventName:String, cb:Function)

解绑主进程发送到渲染进程消息 eventName: 事件名 cb: 回调函数

##### 解绑所有：removeAllListenerFromMain(eventName:String)

解绑渲染进程发送到渲染进程消息 eventName: 事件名

## 插件

### 说明

一个好用的框架离不开框架的可扩展性，Suger-Electron插件模块提供开发者扩展Suger-Electron功能的能力。

Suger-Electron通过框架聚合这些插件，开发者可根据自己的业务场景定制配置，开发应用成本变得更低。

### 如何实现一个插件

```js
// 自定义插件adpter
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
     * 安装插件，每一个自定义插件必备
     * @ctx [object] 框架上下文对象{ config, ipcSDK, storeSDK }
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
                    const userId = await ctx.storeSDK.getState('userId');
                    const res = await axios({
                        method,
                        url: `${baseServer}${url}`,
                        data: options,
                        timeout: params.timeout // 通过插件配置超时时间
                    });
 
                    if (action === 'LOGOUT') {
                        // 通过进程间通信模块，告知主进程退出登录
                        ctx.ipcSDK.sendToMain('LOGOUT');
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

### 插件的使用

```js
// 配置文件目录config/plugin.js
const path = require('path');
exports.adpter = {
    enable: true, // 是否启动插件
    path: path.join(__dirname, '../plugins/adpter'), // 插件绝对路径
    // package: 'adpter', // 插件包名，如果package与path同时存在，则package优先级更高
    include: ['winA'], // 插件使用范围，如果为空，则所有渲染进程安装
    params: { timeout: 20000 } // 传入插件参数
};
 
// 渲染进程winA使用
const { plugins} = require('Suger');
const res = await plugins.callAPI('FETCH_DATA_1', {});
```

## 配置

### 说明

Suger提供了多环境配置，可根据环境变量切换配置，默认加载生成环境配置。

你可以在应用程序的config目录下按照如下规则定义配置文件

```js
config
|- config.base.js             // 基础配置
|- config.js                     // 生产配置
|- config.test.js              // 测试配置——环境变量env=test
|- config.dev.js              // 开发配置——环境变量env=dev
```

也可以通过在appdata目录中，创建config.json文件来覆盖应用配置

AppData/appName目录配置文件config.json

```js
{
"env": "环境变量",
"config": "配置"
}
```
![配置](https://github.com/SugarTeam/Sugar-Electron/blob/master/pictures/6.png)



