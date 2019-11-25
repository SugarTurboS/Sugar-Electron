const { ipcMain } = require('electron');
const { SERVICE_NOT_FOUND, MAIN_IPC_NAME, REQUEST_REPONSE, PUBLISHER, SUBSCRIBER, UNSUBSCRIBER, IPC_NAME } = require('./const');
const processes = {}; // 进程模块合集
const callbacks = {}; // 主进程注册回调
const subscriberTasks = {}; // 缓存进程订阅任务
class MainSDK {
    constructor() {
        ipcMain.on(IPC_NAME, (e, params = {}) => {
            try {
                const { header, body } = params;
                const { model, eventName } = header;
                switch (model) {
                    // 请求、响应
                    case REQUEST_REPONSE:
                        this._requestResponseMessageForwarding(params);
                        break;
                    // 订阅
                    case SUBSCRIBER:
                        this._subscriber(params);
                        break;
                    case UNSUBSCRIBER:
                        this._unsubscriber(params);
                        break;
                    // 发布
                    case PUBLISHER:
                        this._publisher(params);
                        break;
                    case MAIN_IPC_NAME:
                        callbacks[eventName].forEach(fn => fn(body));
                        break;
                    default:
                }
            } catch (error) {
                console.error(error);
            }
        });
    }

    // 请求响应消息转发
    _requestResponseMessageForwarding(params = {}) {
        const { toId } = params.header;
        if (processes[toId]) {
            // 如果进程被销毁，则立即通知
            if (processes[toId].isDestroyed()) {
                this.unregister(toId);
                this._responseNoSerice(params.header);
            } else {
                processes[toId].webContents.send(IPC_NAME, params);
            }
        } else {
            this._responseNoSerice(params.header);
        }
    }

    // 订阅消息
    _subscriber(params = {}) {
        const { fromId, toId, eventName } = params.header;
        // 初始化
        if (!subscriberTasks[toId]) {
            subscriberTasks[toId] = {};
            subscriberTasks[toId][fromId] = {};
            subscriberTasks[toId][fromId][eventName] = [];
        } else if (!subscriberTasks[toId][fromId]) {
            subscriberTasks[toId][fromId] = {};
            subscriberTasks[toId][fromId][eventName] = [];
        } else if (!subscriberTasks[toId][fromId][eventName]) {
            subscriberTasks[toId][fromId][eventName] = [];
        }
        subscriberTasks[toId][fromId][eventName].push(params);
    }

    // 退订消息
    _unsubscriber(params = {}) {
        try {
            const { fromId, toId, eventName, requestId } = params.header;
            if (subscriberTasks[toId][fromId][eventName]) {
                const length = subscriberTasks[toId][fromId][eventName].length;
                for (let i = 0; i < length; i++) {
                    if (subscriberTasks[toId][fromId][eventName][i].header.requestId === requestId) {
                        subscriberTasks[toId][fromId][eventName].splice(i, 1);
                        break;
                    }
                }
            } 
        } catch (error) {
            console.error(error);
        }
    }

    // 发布消息
    _publisher(params = {}) {
        try {
            const { fromId, eventName } = params.header;
            for (let fromKey in subscriberTasks[fromId]) {
                const arr = subscriberTasks[fromId][fromKey][eventName];
                if (arr) {
                    arr.forEach((item = {}) => {
                        const { fromId } = item.header;
                        if (processes[fromId]) {
                            // 如果进程被销毁，则立即通知
                            if (processes[fromId].isDestroyed()) {
                                this.unregister(fromId);
                            } else {
                                processes[fromId].webContents.send(IPC_NAME, {
                                    header: item.header,
                                    body: params.body
                                });
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    // 找不到服务
    _responseNoSerice(header = {}) {
        try {
            const { fromId, toId } = header;
            processes[fromId].webContents.send(IPC_NAME, {
                header: Object.assign(header, {
                    fromId: toId,
                    toId: fromId
                }),
                body: {
                    code: SERVICE_NOT_FOUND,
                    msg: `找不到服务${toId}`
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    // 注册进程服务
    _register(name, process) {
        processes[name] = process;
    }
    // 注销进程服务
    _unregister(name) {
        delete processes[name];
         // 删除进程所有订阅消息
        for (let toKey in subscriberTasks) {
            if (subscriberTasks[toKey]) {
                for (let fromKey in subscriberTasks[toKey]) {
                    if (fromKey === name) {
                        delete subscriberTasks[toKey][fromKey];
                    }
                }
            }
        }
    }
    // 主进程发送消息
    sendToRender(processName, eventName, params = {}) {
        try {
            processes[processName].webContents.send(IPC_NAME, {
                header: {
                    model: MAIN_IPC_NAME,
                    eventName
                },
                body: params
            });  
        } catch (error) {
            console.error(error);
        }
    }
    // 主进程监听绑定
    onFromRender(eventName, cb) {
        if (!callbacks[eventName]) {
            callbacks[eventName] = [];
        }
        callbacks[eventName].push(cb);
    }
    // 主进程监听解绑
    removeListenerFromRender(eventName, cb) {
        const arr = callbacks[eventName] || [];
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === cb) {
                callbacks[eventName].splice(i, 1);
                break;
            }
        }
        if (callbacks[eventName] && callbacks[eventName].length) {
            delete callbacks[eventName];
        }
    }

    removeAllListenerFromRender(eventName) {
        delete callbacks[eventName];
    }
}

module.exports = new MainSDK();