# Sugar-Electron

> 基于Electorn的轻量级开发框架

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

简体中文 | [English](./README.en.md)

## 安装

```bash
npm i sugar-electron
```

## 脚手架

```bash
npm i sugar-electron-cli -g

sugar-electron-cli init
```

## 注意事项
- sugar-electron渲染进程依赖node模块，所以nodeIntegration、enableRemoteModule必须是开启状态，[详情请参考](https://www.electronjs.org/docs/api/browser-window)
- 目前sugar-electron支持的版本是Electron10，如后续因Electron新版本不兼容，请及时提issues

## 前言
今天给大家带来一款基于Electron桌面开发平台的自研应用框架Sugar-Electron，期望能改善Electron应用稳定性和帮助开发团队降低开发和维护成本。

笔者使用Electron做桌面应用，已经有3年的时间，期间也遇到很多大大小小的坑。但总结起来，最大的问题还是应用稳定性和开发效率问题。我们期望通过这个框架，能让应用程序在这两个方面有所优化。

项目源码地址：
[https://github.com/SugarTurboS/Sugar-Electron](https://github.com/SugarTurboS/Sugar-Electron)

文档地址：
[https://sugarturbos.github.io/Sugar-Electron/](https://sugarturbos.github.io/Sugar-Electron/)


如有任何疑问，可以扫码加入微信群聊讨论

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200812140641160.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0ZvcmV2ZXJDamw=,size_16,color_FFFFFF,t_70#pic_center)


## 关于应用稳定性

我们知道Electron应用程序有三大基础模块。
- 主进程
- 渲染进程
- 进程间通信

由于我们属于多窗口（多渲染进程）的应用，所以我们会把窗口公共的服务模块都写到主进程模块，这为整个程序的稳定性埋下了隐患。

在Electron中，主进程控制了整个程序的生命周期，同时也负责管理它创建出来的各个渲染进程。一旦主进程的代码出现问题，那么会导致以下情况发生。
- 主进程出现未捕获的异常崩溃，直接导致应用退出。
- 主进程出现阻塞，直接导致全部渲染进程阻塞，UI处于阻塞无响应状态。

所以，在Sugar-Electron中，我们引入了Service进程的概念，期望将业务原来写在主进程的代码，迁移到Service进程中（本质上是渲染进程），使得这些代码导致的崩溃不会使得整个程序退出。而主进程的进程管理器可以在Service崩溃时，重启该进程并恢复崩溃前的状态，从而提高整个程序的稳定性和可用性。

## 关于开发效率低

Electron属于桌面开发平台提供桌面应用开发的能力框架，上手简单。但框架本身缺少约定，因此使用Electron做应用开发，系统模块会出现各种千奇百怪的划分，代码会出现多种多样的写法，这会显著的增加学习成本，降低开发人员的效率。sugar-electron按照约定进行开发，降低团队协作成本，以提升效率。

# 特性

- 内置进程间通信模块，支持请求响应、发布订阅的方式
- 内置进程间状态共享模块，支持状态同步变更、状态变更监听
- 内置进程管理模块，支持进程模块集中式管理
- 内置配置管理模块，支持开发、测试、生产环境配置切换
- 内置插件模块，支持高度可扩展的插件机制
- 框架侵入性低，项目接入改造成本低
- 渐进式开发


# 设计原则

一、sugar-electron一切围绕渲染进程为核心设计，主进程只是充当进程管理（创建、删除、异常监控）和调度（进程通信、状态功能桥梁）的守护进程的角色。

主进程不处理业务逻辑，这么设计的好处：

1. 可以避免主进程出现未捕获异常崩溃，导致应用退出
2. 避免主进程出现阻塞，引起全部渲染进程阻塞，导致UI阻塞无响应

二、sugar-electron所有的业务模块都是渲染进程。我们知道进程之间是不能直接访问的，为了让进程之间的调用就像同线程模块之间直接调用一样方便，sugar-electron提供了以下三个模块：

1. 进程间通信模块
2. 进程间状态共享模块
3. 进程管理模块

三、为了保证框架核心的足够精简、稳定、高效，因此框架的扩展能力至关重要，为此sugar-electron提供自定义插件机制扩展框架能力，还可以促进业务逻辑复用，甚至于生态圈的形成。


**如下是框架逻辑视图：**
![image](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9zdG9yZS1nMS5zZWV3by5jb20vZWFzaWNsYXNzLXB1YmxpYy9lYmU0Yzc2NjBmOTA0ZWQzYjAxY2RlMTAyNjIyMDYxNg?x-oss-process=image/format,png)

**sugar-electron基于类微内核架构设计，如下图所示：**

![image](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9zdG9yZS1nMS5zZWV3by5jb20vZWFzaWNsYXNzLXB1YmxpYy84ZTVjNzY2NWY1NmE0ODRmOWQ4OGExNWIyZDQ2MzgxNA?x-oss-process=image/format,png)

**其框架核心有七大模块:**
- 基础进程类BaseWindow
- 服务进程类Service
- 进程管理windowCenter
- 进程间通信ipc
- 进程间状态共享store
- 配置中心config
- 插件管理plugins

## Maintainers

[@Tomey](https://github.com/954053260)

[@SugarTurboS](https://github.com/SugarTurboS)

## Contributing

PRs accepted.

## License

MIT © 2020 Tomey/SugarTurboS
