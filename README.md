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

注意：preload属性被Suger-Electron占用

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