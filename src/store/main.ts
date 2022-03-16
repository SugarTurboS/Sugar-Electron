import { STORE, SET_STATE, STATE_CHANGE } from "./const";
import { MAIN_PROCESS_NAME } from "../const";
import Event from "events";
import ipc from "../ipc/main";
import cache from "../cache/main";
const event = new Event();

ipc.response(SET_STATE, (json = {}, cb) => {
  setState(json);
  cb(true);
});

function initStore(store: any, modules: any[] = []) {
  try {
    for (let key in store) {
      const item = store[key];
      switch (key) {
        case "state":
          var keyState = `${STORE}${modules.join("|")}`;
          cache.set(keyState, item);
          if (keyState === STORE) {
            moduleExports.state = cache.get(keyState);
          }
          break;
        case "modules":
          var keyModules = `${STORE}${modules.join("|")}keys`;
          if (!cache.get(keyModules)) {
            cache.set(keyModules, []);
          }
          for (let moduleKey in item) {
            const arr = cache.get(keyModules);
            arr.push(moduleKey);
            cache.set(keyModules, arr);
            initStore(item[moduleKey], modules.concat([moduleKey]));
          }
          break;
        default:
      }
    }
  } catch (error) {
    console.error(error);
  }
}

function setState(json: any) {
  const { type, key, value, state = {}, modules = [] } = json;
  try {
    const moduleKey = `${STORE}${modules.join("|")}`;
    const eventName = `${STATE_CHANGE}${modules.join("|")}`;
    let body: any = {};
    if (type === 0) {
      cache.set(moduleKey, Object.assign(cache.get(moduleKey), state));
      body = state;
    } else {
      const module = cache.get(moduleKey);
      module[key] = value;
      cache.set(moduleKey, module);
      body[key] = value;
    }
    ipc._publisher({ header: { fromId: MAIN_PROCESS_NAME, eventName }, body });
    event.emit(eventName, body);
  } catch (error) {
    console.error(error);
  }
  return true;
}

// 初始化
const moduleExports = {
  createStore(store: any = {}) {
    initStore(store);
  },
  state: {},
  setState(key: string | any, value: string[] | any, modules: string[]) {
    // 与渲染进程异步保持一致
    return new Promise((resolve) => {
      let type, state;
      if (typeof key === "object") {
        type = 0;
        state = key;
        modules = value;
      } else {
        type = 1;
      }
      setState({ type, key, value, state, modules });
      resolve(true);
    });
  },
  getModules(modules: string[] = []) {
    const obj: any = {};
    const key = `${STORE}${modules.join("|")}keys`;
    const keys = cache.get(key) || [];
    keys.forEach((key: string) => {
      obj[key] = this.getModule(key, modules);
    });
    return obj;
  },
  subscribe(cb: SugarElectron.IpcCallback, modules: string[] = []) {
    const eventName = `${STATE_CHANGE}${modules.join("|")}`;
    event.on(eventName, cb);
    return () => {
      this.unsubscribe(cb, modules);
    };
  },
  unsubscribe(cb: SugarElectron.IpcCallback, modules: string[] = []) {
    const eventName = `${STATE_CHANGE}${modules.join("|")}`;
    event.off(eventName, cb);
  },
  getModule(moduleName: string, modules: string[] = []) {
    const key = `${STORE}${modules.concat([moduleName]).join("|")}`;
    const _modules = modules.concat([moduleName]);
    return {
      state: cache.get(key),
      getModule: (moduleName: string) => this.getModule(moduleName, _modules),
      setState: (key: string | any, value: string[] | any) => this.setState(key, value, _modules),
      subscribe: (cb: SugarElectron.IpcCallback) => this.subscribe(cb, _modules),
      unsubscribe: (cb: SugarElectron.IpcCallback) => this.unsubscribe(cb, _modules),
      getModules: () => this.getModules(_modules),
    };
  },
};

export default moduleExports;
