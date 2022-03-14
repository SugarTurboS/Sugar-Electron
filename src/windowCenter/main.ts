import { BrowserWindow } from "electron";
import ipc from "../ipc/main";
import cache from "../cache/main";
import { IPC_GET_THREAD_INFO } from "../cache/const";
import events from "../events";
import {
  WINDOW_CENTER_IPC_NAME,
  WINDOW_CENTER_REGISTER,
  WINDOW_CENTER_UNREGISTER,
} from "./const";
import BaseWindow from "../BaseWindow/main";

const windowKeys: string[] = ["open"];
const names: string[] = [];
const modules: any = {};

for (let key in BrowserWindow.prototype) {
  windowKeys.push(key);
}

events.on(
  WINDOW_CENTER_REGISTER,
  function (name: string, baseWindow: BaseWindow) {
    modules[name] = baseWindow;
    names.push(name);
  }
);

events.on(
  WINDOW_CENTER_UNREGISTER,
  function (name: string) {
    delete modules[name];
    const index = names.indexOf(name);
    names.splice(index, 1);
  }
);

ipc.response(
  WINDOW_CENTER_IPC_NAME,
  (json: any = {}, cb: (data: any) => void) => {
    const { windowName = "", action = "", args = [] } = json;
    let result;
    try {
      if (modules[windowName][action]) {
        result = modules[windowName][action](...args);
      } else {
        result = modules[windowName].getInstance()[action](...args);
      }
    } catch (error) {
      console.error(error);
    }
    cb(result);
  }
);

cache.set(IPC_GET_THREAD_INFO, {
  keys: windowKeys,
  names: names,
});

export default modules;
