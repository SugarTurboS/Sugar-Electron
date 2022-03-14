import ipc from "../ipc/render";
import cache from '../cache/reader';
import { IPC_GET_THREAD_INFO } from "../cache/const";
import { WINDOW_CENTER_IPC_NAME } from "./const";
import { MAIN_PROCESS_NAME } from "../const";
const modules: any = {};
async function actionWindow(windowName: string, action: string, args: any) {
  return await ipc.request(MAIN_PROCESS_NAME, WINDOW_CENTER_IPC_NAME, {
    windowName,
    action,
    args,
  });
}

// 初始化
const { names = [], keys = [] } = cache.get(IPC_GET_THREAD_INFO);
names.concat([MAIN_PROCESS_NAME]).forEach((name: string) => {
  modules[name] = {};
  if (name !== MAIN_PROCESS_NAME) {
    keys.concat(["isInstanceExist"]).forEach((key: string) => {
      modules[name][key] = function () {
        const args = [].slice.call(arguments);
        return actionWindow(name, key, args);
      };
    });
  }
  ["request", "subscribe", "unsubscribe"].forEach((key) => {
    modules[name][key] = function () {
      const args = [].slice.call(arguments);
      return (ipc as any)[key].apply(ipc, [name].concat(args));
    };
  });
});

export default modules;
