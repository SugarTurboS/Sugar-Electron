import { ipcMain, IpcMainEvent } from "electron";
import cache from "../cache/main";
import { IPC_GET_THREAD_INFO } from "../cache/const";
import { v4 as uuidv4 } from "uuid";
import {
  SERVICE_NOT_FOUND,
  RESPONSE_OK,
  REQUEST,
  REPONSE,
  PUBLISHER,
  SUBSCRIBER,
  UNSUBSCRIBER,
  IPC_NAME,
  RESPONSE_OVERTIME,
} from "./const";

import { MAIN_PROCESS_NAME } from "../const";
const processes: any = {}; // 进程模块合集
const subscribeTasks: any = {}; // 缓存进程订阅任务
const responseCallbacks: any = {};
const requestCb: any = {};
const subscribeCb: any = {};
let defaultRequestTimeout: number = 20000; // 请求响应超时，默认值


const module = {
    // 请求响应消息转发
    _requestResponseMessageForwarding(params: any = {}) {
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
            this._unregister(toId);
            this._responseNoSerice(params.header);
          } else {
            processes[toId].webContents.send(IPC_NAME, params);
          }
        } else {
          this._responseNoSerice(params.header);
        }
      }
    },
  
    _send(params: any = {}) {
      try {
        const { header = {}, body } = params;
        const { fromId, toId } = header;
        processes[fromId] &&
          processes[fromId].webContents.send(IPC_NAME, {
            header: Object.assign({}, header, {
              fromId: toId,
              toId: fromId,
            }),
            body,
          });
      } catch (error) {
        console.error(error);
      }
    },
  
    // 订阅消息
    _subscribe(params: any = {}) {
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
    },
  
    // 退订消息
    _unsubscribe(params: any = {}) {
      try {
        const { fromId, toId, eventName, requestId } = params.header;
        if (subscribeTasks[toId][fromId][eventName]) {
          const length = subscribeTasks[toId][fromId][eventName].length;
          for (let i = 0; i < length; i++) {
            if (
              subscribeTasks[toId][fromId][eventName][i].header.requestId ===
              requestId
            ) {
              subscribeTasks[toId][fromId][eventName].splice(i, 1);
              break;
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
  
    _getSubscriberTasks() {
      return subscribeTasks;
    },
  
    // 发布消息
    _publisher(params: any = {}) {
      try {
        const { eventName, model, fromId, toId } = params.header;
        for (let fromKey in subscribeTasks[fromId]) {
          const arr = subscribeTasks[fromId][fromKey][eventName];
          if (arr) {
            arr.forEach((item: any = {}) => {
              const { fromId } = item.header;
              if (processes[fromId]) {
                // 如果进程被销毁，则立即通知
                if (processes[fromId].isDestroyed()) {
                  this._unregister(fromId);
                } else {
                  processes[fromId].webContents.send(IPC_NAME, {
                    header: item.header,
                    body: params.body,
                  });
                }
              }
            });
          }
        }
        // 主进程订阅
        if (subscribeCb[`${fromId}${eventName}`]) {
          subscribeCb[`${fromId}${eventName}`].forEach(
            (
              callback: (
                arg0: any,
                arg1: { eventName: any; model: any; fromId: any; toId: any }
              ) => void
            ) => {
              callback(params.body, { eventName, model, fromId, toId });
            }
          );
        }
      } catch (error) {
        console.error(error);
      }
    },
  
    // 找不到服务
    _responseNoSerice(header: any = {}) {
      header.model = REPONSE;
      this._send({
        header,
        body: { code: SERVICE_NOT_FOUND, msg: `找不到服务${header.toId}` },
      });
    },
  
    // 注册进程服务
    _register(name: string, process: any) {
      processes[name] = process;
    },
    // 注销进程服务
    _unregister(name: string) {
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
    },
  
    // 设置默认请求响应超时时间
    setDefaultRequestTimeout(timeout = 20000) {
      defaultRequestTimeout = timeout;
    },
  
    request(
      toId: string,
      eventName: string,
      data: any,
      timeout = defaultRequestTimeout
    ) {
      const threadId = MAIN_PROCESS_NAME;
      return new Promise((resolve, reject) => {
        try {
          let timeoutFlag: any;
          const requestId = uuidv4();
  
          const cb = (json: any = {}) => {
            const { code, data } = json.body || {};
            clearTimeout(timeoutFlag);
            if (code === RESPONSE_OK) {
              resolve(data);
            } else {
              reject(json.body);
            }
            delete requestCb[requestId];
          };
          // 超时处理
          timeoutFlag = setTimeout(() => {
            cb({ body: { code: RESPONSE_OVERTIME, msg: "访问超时" } });
          }, timeout);
  
          requestCb[requestId] = cb;
  
          const param = {
            header: {
              model: REQUEST,
              fromId: toId,
              toId: threadId,
              eventName,
              requestId,
            },
            body: data,
          };
  
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
    },
  
    response(eventName: string, callback?: SugarElectron.IpcResponseCallback) {
      try {
        const createCb = (header: any) => {
          return (result: any) => {
            header.model = REPONSE;
            const param = { header, body: { code: RESPONSE_OK, data: result } };
            if (header.fromId === MAIN_PROCESS_NAME) {
              this._requestResponseMessageForwarding(param);
            } else {
              this._send(param);
            }
          };
        };
        responseCallbacks[eventName] = function (json: any) {
          const cb = createCb(json.header);
          callback && callback(json.body, cb);
        };
      } catch (error) {
        console.error(error);
      }
    },
  
    unresponse(eventName: string) {
      delete responseCallbacks[eventName];
    },
  
    publisher(eventName: string, params: any) {
      this._publisher({
        header: { fromId: MAIN_PROCESS_NAME, eventName },
        body: params,
      });
    },
  
    subscribe(
      toId: string | string[],
      eventName: string | string[] | SugarElectron.IpcCallback,
      callback?: SugarElectron.IpcCallback
    ) {
      let toIds: string[] = [];
      let eventNames: string[] = [];
      const unsubscribes: (() => void)[] = [];
      // 如果第一个参数不传，则默认订阅所有进程事件，包括主进程
      if (arguments.length === 2) {
        toIds = cache.get(IPC_GET_THREAD_INFO).names.concat(["main"]);
        eventNames = typeof toId == "string" ? [toId] : toId;
        callback = eventName as SugarElectron.IpcCallback;
      } else if (arguments.length === 3) {
        toIds = [toId as string];
        eventNames =
          typeof eventName == "string" ? [eventName] : (eventName as string[]);
        callback = arguments[2];
      }
  
      const _subscribe = (
        toId: string,
        eventName: string,
        callback: SugarElectron.IpcCallback
      ) => {
        if (!subscribeCb[`${toId}${eventName}`]) {
          subscribeCb[`${toId}${eventName}`] = [];
        }
        subscribeCb[`${toId}${eventName}`].push(callback);
        return () => {
          this.unsubscribe(toId, eventName, callback);
        };
      };
  
      for (let i = 0; i < toIds.length; i++) {
        for (let j = 0; j < eventNames.length; j++) {
          unsubscribes.push(
            _subscribe(
              toIds[i],
              eventNames[j],
              callback as SugarElectron.IpcCallback
            )
          );
        }
      }
  
      return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    },
  
    unsubscribe(
      toId: string | string[],
      eventName: string | string[] | SugarElectron.IpcCallback,
      callback?: SugarElectron.IpcCallback
    ) {
      let toIds: string[] = [];
      let eventNames: string[] = [];
      const unsubscribes: (() => void)[] = [];
      // 如果第一个参数不传，则默认订阅所有进程事件，包括主进程
      if (arguments.length === 2) {
        toIds = cache.get(IPC_GET_THREAD_INFO).names.concat(["main"]);
        eventNames = typeof toId == "string" ? [toId] : toId;
        callback = eventName as SugarElectron.IpcCallback;
      } else if (arguments.length === 3) {
        toIds = [toId as string];
        eventNames =
          typeof eventName == "string" ? [eventName] : (eventName as string[]);
        callback = arguments[2];
      }
  
      const _unsubscribe = (
        toId: string,
        eventName: string,
        callback: SugarElectron.IpcCallback
      ) => {
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
          _unsubscribe(
            toIds[i],
            eventNames[j],
            callback as SugarElectron.IpcCallback
          );
        }
      }
    },
}

ipcMain.on(IPC_NAME, (e: IpcMainEvent, params: any = {}) => {
  try {
    const { header } = params;
    const { model } = header;
    switch (model) {
      // 请求、响应
      case REQUEST:
      case REPONSE:
        module._requestResponseMessageForwarding(params);
        break;
      // 订阅
      case SUBSCRIBER:
        module._subscribe(params);
        break;
      case UNSUBSCRIBER:
        module._unsubscribe(params);
        break;
      // 发布
      case PUBLISHER:
        module._publisher(params);
        break;
      default:
    }
  } catch (error) {
    console.error(error);
  }
});

export default module;
