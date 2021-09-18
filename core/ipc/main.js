const { ipcMain } = require('electron');
const util = require('../util');
const {
  SERVICE_NOT_FOUND,
  RESPONSE_OK,
  REQUEST,
  REPONSE,
  PUBLISHER,
  SUBSCRIBER,
  UNSUBSCRIBER,
  IPC_NAME,
  RESPONSE_OVERTIME
} = require('./const');
const { MAIN_PROCESS_NAME } = require('../const');
const { WINDOW_CENTER_GET_INFO } = require('../windowCenter/const');
const processes = {}; // 进程模块合集
const subscribeTasks = {}; // 缓存进程订阅任务
const responseCallbacks = {};
const requestCb = {};
const subscribeCb = {};
let defaultRequestTimeout = 20000; // 请求响应超时，默认值
class MainSDK {
  constructor() {
    ipcMain.on(IPC_NAME, (e, params = {}) => {
      try {
        const { header } = params;
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
            this._publisher(params);
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
    const { toId, eventName, model, requestId } = params.header;
    // 向主进程请求
    if (toId === MAIN_PROCESS_NAME) {
      if (model === REQUEST) {
        responseCallbacks[eventName] && responseCallbacks[eventName](params);
      } else if (model === REPONSE) {
        requestCb[requestId] && requestCb[requestId](params);
      }
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

  _send(params = {}) {
    try {
      const { header = {}, body } = params;
      const { fromId, toId } = header;
      processes[fromId] && processes[fromId].webContents.send(IPC_NAME, {
        header: Object.assign({}, header, {
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
  _publisher(params = {}) {
    try {
      const { eventName, model, fromId, toId } = params.header;
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
      // 主进程订阅
      if (subscribeCb[`${fromId}${eventName}`]) {
        subscribeCb[`${fromId}${eventName}`].forEach(callback => {
          callback(params.body, { eventName, model, fromId, toId });
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  // 找不到服务
  _responseNoSerice(header = {}) {
    header.model = REPONSE;
    this._send({ header, body: { code: SERVICE_NOT_FOUND, msg: `找不到服务${header.toId}` } });
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

  // 设置默认请求响应超时时间
  setDefaultRequestTimeout(timeout = 20000) {
    defaultRequestTimeout = timeout;
  }

  request(toId = '', eventName = '', data, timeout = defaultRequestTimeout) {
    const threadId = MAIN_PROCESS_NAME;
    return new Promise((resolve, reject) => {
      try {
        let timeoutFlag;
        const requestId = util.createUUID();

        const cb = (json = {}) => {
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

        const param = {
          header: {
            model: REQUEST,
            fromId: toId,
            toId: threadId,
            eventName,
            requestId
          },
          body: data
        }

        if (toId === MAIN_PROCESS_NAME) {
          this._requestResponseMessageForwarding(param);
        } else {
          this._send(param);
        }
      } catch (error) {
        reject(error);
        console.error(error);
      }
    });
  }

  response(eventName, callback) {
    try {
      const createCb = (header) => {
        return (result) => {
          header.model = REPONSE;
          const param = { header, body: { code: RESPONSE_OK, data: result } };
          if (header.fromId === MAIN_PROCESS_NAME) {
            this._requestResponseMessageForwarding(param);
          } else {
            this._send(param);
          }
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

  unresponse(eventName) {
    delete responseCallbacks[eventName];
  }

  publisher(eventName = '', params) {
    this._publisher({ header: { fromId: MAIN_PROCESS_NAME, eventName }, body: params });
  }

  subscribe() {
    let toIds = [];
    let eventNames = [];
    let callback = () => {};
    const unsubscribes = [];
     // 如果第一个参数不传，则默认订阅所有进程事件，包括主进程
    if (arguments.length === 2) {
      toIds = global[WINDOW_CENTER_GET_INFO].names.concat(['main']);
      eventNames = util.isArray(arguments[0]) ? arguments[0] : [arguments[0]];
      callback = arguments[1];
    } else if (arguments.length === 3) {
      toIds = [arguments[0]];
      eventNames = util.isArray(arguments[1]) ? arguments[1] : [arguments[1]];
      callback = arguments[2];
    }

    const _subscribe = (toId, eventName, callback) => {
      if (!subscribeCb[`${toId}${eventName}`]) {
        subscribeCb[`${toId}${eventName}`] = [];
      }
      subscribeCb[`${toId}${eventName}`].push(callback);
      return () => {
        this.unsubscribe(toId, eventName, callback);
      }
    };

    for (let i = 0; i < toIds.length; i++) {
      for (let j = 0; j < eventNames.length; j++) {
        unsubscribes.push(_subscribe(toIds[i], eventNames[j], callback));
      }
    }

    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }

  unsubscribe() {
    let toIds = [];
    let eventNames = [];
    let callback = () => {};
    // 如果第一个参数不传，则默认订阅所有进程事件，包括主进程
    if (arguments.length === 2) {
      toIds = global[WINDOW_CENTER_GET_INFO].names.concat(['main']);
      eventNames = util.isArray(arguments[0]) ? arguments[0] : [arguments[0]];
      callback = arguments[1];
    } else if (arguments.length === 3) {
      toIds = [arguments[0]];
      eventNames = util.isArray(arguments[1]) ? arguments[1] : [arguments[1]];
      callback = arguments[2];
    }

    const _unsubscribe = (toId, eventName, callback) => {
      const callbacks = subscribeCb[`${toId}${eventName}`];
      if (callbacks) {
        for (let i = 0; i < callbacks.length; i++) {
          if (callbacks[i] === callback) {
            callbacks.splice(i, 1);
          }
        }
      }
    };
    
    for (let i = 0; i < toIds.length; i++) {
      for (let j = 0; j < eventNames.length; j++) {
        _unsubscribe(toIds[i], eventNames[j], callback);
      }
    }
  }

  
}

module.exports = new MainSDK();

