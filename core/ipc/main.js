const { ipcMain } = require('electron');
const { SERVICE_NOT_FOUND, RESPONSE_OK, REQUEST, REPONSE, PUBLISHER, SUBSCRIBER, UNSUBSCRIBER, IPC_NAME } = require('./const');
const processes = {}; // 进程模块合集
const subscribeTasks = {}; // 缓存进程订阅任务
const responseCallbacks = {};
class MainSDK {
    constructor() {
        ipcMain.on(IPC_NAME, (e, params = {}) => {
            try {
                const { header} = params;
                const { model } = header;
                switch (model) {
                    // 请求、响应
                    case REQUEST:
                    case REPONSE:
                        this._requestResponseMessageForwarding(params);
                        break;
                    // 订阅
                    case SUBSCRIBER:
                        this._subscribe(params);
                        break;
                    case UNSUBSCRIBER:
                        this._unsubscribe(params);
                        break;
                    // 发布
                    case PUBLISHER:
                        this.publisher(params);
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
        const { toId, eventName } = params.header;
        // 向主进程请求
        if (toId === 'main') {
            responseCallbacks[eventName](params);
        } else {
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
    }

    response(eventName, callback) {
        try {
            const createCb = (header) => {
                return (result) => {
                    header.model = REPONSE;
                    this._send({ header, body: { code: RESPONSE_OK, data: result }});
                }
            }
            responseCallbacks[eventName] = function (json) {
                const cb = createCb(json.header);
                callback && callback(json.body, cb);
            };
        } catch (error) {
            console.error(error);
        }
    }

    _send(params = {}) {
        try {
            const { header = {}, body } = params;
            const { fromId, toId } = header;
            processes[fromId] && processes[fromId].webContents.send(IPC_NAME, {
                header: Object.assign(header, {
                    fromId: toId,
                    toId: fromId
                }),
                body
            });
        } catch (error) {
            console.error(error);
        }
    }

    // 订阅消息
    _subscribe(params = {}) {
        const { fromId, toId, eventName } = params.header;
        // 初始化
        if (!subscribeTasks[toId]) {
            subscribeTasks[toId] = {};
            subscribeTasks[toId][fromId] = {};
            subscribeTasks[toId][fromId][eventName] = [];
        } else if (!subscribeTasks[toId][fromId]) {
            subscribeTasks[toId][fromId] = {};
            subscribeTasks[toId][fromId][eventName] = [];
        } else if (!subscribeTasks[toId][fromId][eventName]) {
            subscribeTasks[toId][fromId][eventName] = [];
        }
        subscribeTasks[toId][fromId][eventName].push(params);
    }

    // 退订消息
    _unsubscribe(params = {}) {
        try {
            const { fromId, toId, eventName, requestId } = params.header;
            if (subscribeTasks[toId][fromId][eventName]) {
                const length = subscribeTasks[toId][fromId][eventName].length;
                for (let i = 0; i < length; i++) {
                    if (subscribeTasks[toId][fromId][eventName][i].header.requestId === requestId) {
                        subscribeTasks[toId][fromId][eventName].splice(i, 1);
                        break;
                    }
                }
            } 
        } catch (error) {
            console.error(error);
        }
    }

    _getSubscriberTasks() {
        return subscribeTasks;
    }

    // 发布消息
    publisher(params = {}) {
        try {
            const { fromId, eventName } = params.header;
            for (let fromKey in subscribeTasks[fromId]) {
                const arr = subscribeTasks[fromId][fromKey][eventName];
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
        header.model = REPONSE;
        this._send({ header, body: { code: SERVICE_NOT_FOUND, msg: `找不到服务${header.toId}` }});
    }

    // 注册进程服务
    _register(name, process) {
        processes[name] = process;
    }
    // 注销进程服务
    _unregister(name) {
        delete processes[name];
         // 删除进程所有订阅消息
        for (let toKey in subscribeTasks) {
            if (subscribeTasks[toKey]) {
                for (let fromKey in subscribeTasks[toKey]) {
                    if (fromKey === name) {
                        delete subscribeTasks[toKey][fromKey];
                    }
                }
            }
        }
    }
}

module.exports = new MainSDK();