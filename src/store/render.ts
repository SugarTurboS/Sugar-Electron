import cache from "../cache/reader";
import { STORE, SET_STATE, STATE_CHANGE } from "./const";
import { MAIN_PROCESS_NAME } from "../const";
import ipc from "../ipc/render";

export default {
  state: cache.get(STORE),
  setState(key: string | any, value: string[] | any, modules: string[]) {
    let type = 0,
      state = {};
    if (typeof key === "object") {
      type = 0;
      state = key;
      modules = value;
    } else {
      type = 1;
    }
    return new Promise(async (resolve, reject) => {
      const r = await ipc.request(MAIN_PROCESS_NAME, SET_STATE, {
        type,
        key,
        value,
        state,
        modules,
      });
      if (r) {
        resolve(r);
      } else {
        reject(
          new Error(
            `找不到store state key => ${modules.join(
              "."
            )}，请在主进程初始化store中声明`
          )
        );
      }
    });
  },
  getModules(modules: string[] = []) {
    const obj: any = {};
    const key = `${STORE}${modules.join("|")}keys`;
    const keys = cache.get(key) || [];
    keys.forEach((key: any) => {
      obj[key] = this.getModule(key, modules);
    });
    return obj;
  },
  subscribe(cb: SugarElectron.IpcCallback, modules: string[] = []) {
    const eventName = `${STATE_CHANGE}${modules.join("|")}`;
    ipc.subscribe(MAIN_PROCESS_NAME, eventName, cb);
    return () => {
      this.unsubscribe(cb, modules);
    };
  },
  unsubscribe(cb: SugarElectron.IpcCallback, modules: string[] = []) {
    const eventName = `${STATE_CHANGE}${modules.join("|")}`;
    ipc.unsubscribe(MAIN_PROCESS_NAME, eventName, cb);
  },
  getModule(moduleName: string, modules: string[] = []) {
    const key = `${STORE}${modules.concat([moduleName]).join("|")}`;
    const _modules: string[] = modules.concat([moduleName]);
    return {
      state: cache.get(key),
      getModule: (moduleName: string) => this.getModule(moduleName, _modules),
      setState: (key: string | any, value: string[] | any) =>
        this.setState(key, value, _modules),
      subscribe: (cb: SugarElectron.IpcCallback) =>
        this.subscribe(cb, _modules),
      unsubscribe: (cb: SugarElectron.IpcCallback) =>
        this.unsubscribe(cb, _modules),
      getModules: (modules: string[]) => this.getModules(modules),
    };
  },
};
