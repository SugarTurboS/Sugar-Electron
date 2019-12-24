const { ipcRenderer } = require('electron');
const util = require('../util');
const { 
    RESPONSE_OK,
    RESPONSE_OVERTIME,
    RESPONSE_NOT_FOUND,
    PUBLISHER,
    SUBSCRIBER,
    UNSUBSCRIBER,
    IPC_NAME,
    REQUEST_REPONSE
} = require('./const');
const requestCb = {};
const requestHandler = {};
const subscriberCb = {};
let defaultRequestTimeout = 20000; // 请求响应超时，默认值
// 发送消息
function send(json = {}) {
    ipcRenderer.send(IPC_NAME, json);
}

// 监听
ipcRenderer.on(IPC_NAME, function (e, params = {}) {
    try {
        const { header, body } = params;
        const { model, eventName, requestId, toId, fromId } = header;
        switch (model) {
            // 请求、响应类型
            case REQUEST_REPONSE:
                if (requestCb[requestId]) {  //发起的调用请求响应了
                    requestCb[requestId](params);
                } else if (requestHandler[eventName]) {  //收到了调用请求
                    requestHandler[eventName](params);
                } else {
                    // 找不到注册服务则原路返回null
                    send({
                        header: {
                            model: REQUEST_REPONSE,
                            fromId: toId,
                            toId: fromId,
                            eventName,
                            requestId
                        },
                        body: {
                            code: RESPONSE_NOT_FOUND,
                            msg: `找不到服务响应注册${eventName}`
                        }
                    });
                }
                break;
            case SUBSCRIBER:
                subscriberCb[requestId] && subscriberCb[requestId](body);
                break;
            default:
        }
    } catch (error) {
        console.error(error);
    }
});

module.exports = {
    // 设置默认请求响应超时时间
    setDefaultRequestTimeout(timeout = 20000) {
        defaultRequestTimeout = timeout;
    },
    // 发出请求
    request(toId = '', eventName = '', data = {}, timeout = defaultRequestTimeout) {
        const threadId = util.getThreadId();
        return new Promise(function (resolve, reject) {
            if (!threadId) {
                reject();
            }
            try {
                let timeoutFlag;
                const requestId = util.createUUID();
                const cb = function (json = {}) {
                    const { code, data } = json.body || {};
                    clearTimeout(timeoutFlag);
                    if (code === RESPONSE_OK) {
                        resolve(data);
                    } else {
                        reject(json.body);
                    }
                    delete requestCb[requestId];
                }
                // 超时处理
                timeoutFlag = setTimeout(() => {
                    cb({ body: { code: RESPONSE_OVERTIME, msg: '访问超时' } })
                }, timeout);
                requestCb[requestId] = cb;
                send({
                    header: {
                        model: REQUEST_REPONSE,
                        fromId: threadId,
                        toId,
                        eventName,
                        requestId
                    },
                    body: data
                });
            } catch (error) {
                reject(error);
                console.error(error);
            }
        });
    },
    // 注册响应服务
    response(eventName, callback) {
        try {
            const createCb = function (header) {
                return function (result) {
                    send({
                        header: {
                            model: REQUEST_REPONSE,
                            fromId: header.toId,
                            toId: header.fromId,
                            eventName,
                            requestId: header.requestId
                        },
                        body: {
                            code: RESPONSE_OK,
                            data: result
                        }
                    });
                }
            }
            requestHandler[eventName] = function (json) {
                const cb = createCb(json.header);
                callback && callback(json.body, cb);
            };
        } catch (error) {
            console.error(error);
        }
    },
    // 发布消息
    publisher(eventName = '', params = {}) {
        const threadId = util.getThreadId();
        if (threadId) {
            send({
                header: {
                    model: PUBLISHER,
                    fromId: threadId,
                    eventName
                },
                body: params
            });
        }
    },
    // 订阅消息
    subscriber(toId = '', eventName = '', callback = () => {}) {
        const requestId = util.createUUID();
        const threadId = util.getThreadId();
        if (threadId) {
            send({
                header: {
                    model: SUBSCRIBER,
                    fromId: threadId,
                    toId,
                    eventName,
                    requestId
                }
            });
            subscriberCb[requestId] = callback;
        }
        return () => {
            this.unsubscriber(toId, eventName, callback);
        }
    },
    // 退订
    unsubscriber(toId = '', eventName, callback) {
        const threadId = util.getThreadId();
        if (threadId) {
            for (let requestId in subscriberCb) {
                if (subscriberCb[requestId] === callback) {
                    send({
                        header: {
                            model: UNSUBSCRIBER,
                            fromId: threadId,
                            toId,
                            eventName,
                            requestId
                        }
                    });
                    delete subscriberCb[requestId];
                }
            }
        }
    }
}
