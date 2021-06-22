# Sugar-Electron

> A lightweight framework base on Electron


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

[简体中文](./README.md) | English

## Install

```bash
npm i sugar-electron --save-dev
```

## Cli

```bash
npm i sugar-electron-cli -g

sugar-electron-cli init
```

## Preface

We expect Sugar-Electron to improve the stability of Electron applications and help the development team reduce development and maintenance costs.


Source code:
[https://github.com/SugarTurboS/Sugar-Electron](https://github.com/SugarTurboS/Sugar-Electron)

Docs:
[https://sugarturbos.github.io/Sugar-Electron/](https://sugarturbos.github.io/Sugar-Electron/)

If you have any questions, you can scan the QR code to join the WeChat group chat discussion.

![在这里插入图片描述](https://img-blog.csdnimg.cn/20200812140641160.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0ZvcmV2ZXJDamw=,size_16,color_FFFFFF,t_70#pic_center)


## About application stability

We know that the Electron application has three basic modules.

- Main Process
- Render Process
- IPC Messge

Since we belong to a multi-window (multi-rendering process) application, we will write all the service modules to the main process module, which lays a hidden danger for the stability of the entire program.

In Electron, tge main process controls this life cycle of the entire program and also managing the render processes 
create by it. Once there is a problem with the code of the main process, the following situations will occur.

- An uncaught abnormal crash of the main process directly causes the application to exit.
- The main process is blocked, which directly causes all rendering processes to be blocked, and the UI is blocked and unresponsive.

Therefore, in Sugar-Electron, we introduced the concept of Service process. We hope to migrate the code originally written in the main process to the Service process (essentially the rendering process), so that the crash caused by these codes will not make the entire Program exit.

The process manager of the main process can restart the process and restore the state before the crash when the Service crashes, thereby improving the stability and usability of the entire program.

## About low development efficiency

Electron belongs to the desktop development platform to provide desktop application development capability framework, so it is easy to get started.However, the framework itself lacks conventions. Therefore, when Electron is used for application development, there will be a variety of bizarre divisions in the system modules, and the code will appear in a variety of ways to write, which will significantly increase the cost of learning and reduce the efficiency of developers.Sugar-electron is developed in accordance with the agreement to reduce the cost of team collaboration and improve
 efficiency.

# Features

- Integrated communication module, support request response, publish and subscribe.
- Integrated inter-process state sharing module, support state synchronization change, state change monitoring.
- Integrated process management module, supporting centralized management of process modules.
- Integrated configuration management module, supporting development, testing, and production environment .configuration switching.
- Integrated plug-in module, support highly extensible plug-in mechanism.
- The framework is low intrusive, and the cost of project access and transformation is low
- Progressive development


# Design Principles

一、Sugar-electron is designed around the rendering process as its core. The main process only acts as a daemon for process management (creation, deletion, error monitoring) and scheduling (process communication, status function bridge).

The main process does not deal with business logic, the benefits of such a design:

1. Can prevent the main process from crashing with an uncaught exception, causing the application to exit.
2. Avoid blocking the main process, causing all rendering processes to be blocked, resulting in UI blocking and unresponsiveness.

二、All business modules of sugar-electron are rendering processes. We know that there is no direct access between processes. In order to make calls between processes as convenient as direct calls between modules of the same thread, sugar-electron provides the following three modules:

1. Process communication module
2. Process state sharing module
3. Process management module

三、In order to ensure that the core of the framework is sufficiently streamlined, stable, and efficient, the scalability of the framework is essential. For this reason, sugar-electron provides a custom plug-in mechanism to extend the framework's capabilities, which can also promote the reuse of business logic and even the formation of an ecosystem.


**Framework logical view:**
![image](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9zdG9yZS1nMS5zZWV3by5jb20vZWFzaWNsYXNzLXB1YmxpYy9lYmU0Yzc2NjBmOTA0ZWQzYjAxY2RlMTAyNjIyMDYxNg?x-oss-process=image/format,png)

**Sugar-electron is based on the micro-kernel architecture design:**

![image](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9zdG9yZS1nMS5zZWV3by5jb20vZWFzaWNsYXNzLXB1YmxpYy84ZTVjNzY2NWY1NmE0ODRmOWQ4OGExNWIyZDQ2MzgxNA?x-oss-process=image/format,png)

**Seven core modules in Sugar-electron:**
- BaseWindow
- Service
- WindowCenter
- Ipc
- Store
- Config
- Plugins

## Maintainers

[@Tomey](https://github.com/954053260)

[@SugarTurboS](https://github.com/SugarTurboS)

## Contributing

PRs accepted.

## License

MIT © 2020 Tomey/SugarTurboS