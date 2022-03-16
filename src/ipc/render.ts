import { ipcRenderer } from "electron";
import { v4 as uuidv4 } from "uuid";
import cache from "../cache/reader";
import {
  RESPONSE_OK,
  RESPONSE_OVERTIME,
  RESPONSE_NOT_FOUND,
  PUBLISHER,
  SUBSCRIBER,
  UNSUBSCRIBER,
  IPC_NAME,
  REQUEST,
  REPONSE,
} from "./const";
const requestCb: any = {};
const requestHandler: any = {};
const subscribeCb: any = {};
let defaultRequestTimeout = 20000; // 请求响应超时，默认值
// 发送消息
function send(json: any = {}) {
  ipcRenderer.send(IPC_NAME, json);
}

// 监听
ipcRenderer.on(IPC_NAME, function (e, params = {}) {
  try {
    const { header, body } = params;
    const { model, eventName, requestId, toId, fromId } = header;
    switch (model) {
      // 请求、响应类型
      case REQUEST:
        if (requestHandler[eventName]) {
          //收到了调用请求
          requestHandler[eventName](params);
        } else {
          // 找不到注册服务则原路返回null
          send({
            header: {
              model: REPONSE,
              fromId: toId,
              toId: fromId,
              eventName,
              requestId,
            },
            body: {
              code: RESPONSE_NOT_FOUND,
              msg: `找不到服务响应注册${eventName}`,
            },
          });
        }
        break;
      case REPONSE:
        requestCb[requestId] && requestCb[requestId](params);
        break;
      case SUBSCRIBER:
        subscribeCb[requestId] &&
          subscribeCb[requestId](body, { eventName, model, fromId, toId });
        break;
      default:
    }
  } catch (error) {
    console.error(error);
  }
});

export default {
  // 设置默认请求响应超时时间
  setDefaultRequestTimeout(timeout = 20000) {
    defaultRequestTimeout = timeout;
  },
  // 发出请求
  request(
    toId: string,
    eventName: string,
    data: any,
    timeout = defaultRequestTimeout
  ) {
    const threadId = cache.getThreadId();
    return new Promise(function (resolve, reject) {
      if (!threadId) {
        return reject();
      }
      try {
        let timeoutFlag: any;
        const requestId: string = uuidv4();
        const cb = function (json: any = {}) {
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
        send({
          header: {
            model: REQUEST,
            fromId: threadId,
            toId,
            eventName,
            requestId,
          },
          body: data,
        });
      } catch (error) {
        reject(error);
        console.error(error);
      }
    });
  },
  // 注册响应服务
  response(eventName: string, callback?: SugarElectron.IpcResponseCallback) {
    try {
      const createCb = function (header: any) {
        return function (result: any) {
          send({
            header: {
              model: REPONSE,
              fromId: header.toId,
              toId: header.fromId,
              eventName,
              requestId: header.requestId,
            },
            body: {
              code: RESPONSE_OK,
              data: result,
            },
          });
        };
      };
      requestHandler[eventName] = function (json: any) {
        const cb = createCb(json.header);
        callback && callback(json.body, cb);
      };
    } catch (error) {
      console.error(error);
    }
  },
  unresponse(eventName: string) {
    delete requestHandler[eventName];
  },
  //

  publisher(eventName: string, params: any) {
    const threadId = cache.getThreadId();
    if (threadId) {
      send({
        header: {
          model: PUBLISHER,
          fromId: threadId,
          eventName,
        },
        body: params,
      });
    }
  },
  // 订阅消息
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
      toIds = cache.getThreadInfo().names.concat(["main"]);
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
      const requestId = uuidv4();
      const threadId = cache.getThreadId();
      if (threadId) {
        send({
          header: {
            model: SUBSCRIBER,
            fromId: threadId,
            toId,
            eventName,
            requestId,
          },
        });
        subscribeCb[requestId] = callback;
      }
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
  // 退订
  unsubscribe(
    toId: string | string[],
    eventName: string | string[] | SugarElectron.IpcCallback,
    callback?: SugarElectron.IpcCallback
  ) {
    let toIds: string[] = [];
    let eventNames: string[] = [];
    // 如果第一个参数不传，则默认订阅所有进程事件，包括主进程
    if (arguments.length === 2) {
      toIds = cache.getThreadInfo().names.concat(["main"]);
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
      const threadId = cache.getThreadId();
      if (threadId) {
        for (let requestId in subscribeCb) {
          if (subscribeCb[requestId] === callback) {
            send({
              header: {
                model: UNSUBSCRIBER,
                fromId: threadId,
                toId,
                eventName,
                requestId,
              },
            });
            delete subscribeCb[requestId];
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
};
