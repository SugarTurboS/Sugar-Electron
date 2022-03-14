import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import ipc from "../ipc/main";
import windowCenter from "../windowCenter/main";
import Events from "events";
import cache from "../cache/main";
// 窗体默认属性

export interface BaseWindowOption extends BrowserWindowConstructorOptions {
  url?: string;
}

class BaseWindow extends Events {
  static defaultOption: BaseWindowOption = {};
  // 设置所有窗口默认属性
  static setDefaultOption(option: BaseWindowOption) {
    Object.assign(BaseWindow.defaultOption, option);
  }

  _cacheEvents: string[] = [];
  instance?: BrowserWindow;
  name: string;
  option: BaseWindowOption;

  constructor(name: string, option: BaseWindowOption) {
    super();
    if (!name) {
      throw new Error("process name cannot be null");
    }

    this.name = name;
    this.option = option;
    // 注册到窗口中心
    windowCenter._register(name, this);
  }

  open(option: BaseWindowOption = {}): BrowserWindow {
    try {
      if (this.instance === null) {
        const _option: BaseWindowOption = Object.assign(
          {},
          BaseWindow.defaultOption,
          this.option,
          option
        );
        const instance: BrowserWindow = new BrowserWindow(_option);
        ipc._register(this.name, instance);
        cache.set(instance.webContents.getProcessId().toString(), this.name);
        this._cacheEvents.forEach((eventName: any) => {
          instance.on(eventName, (...args) => {
            // 广播窗口消息
            this.publisher(eventName, { ...args });
            if (eventName === "closed") {
              this.instance = undefined;
              ipc._unregister(this.name);
            }
          });
        });
        instance.loadURL(_option.url || "");
        this.instance = instance;
      }
    } catch (error) {
      console.error(error);
    }
    return this.instance!;
  }

  // 判断窗口实例是否存在
  isInstanceExist() {
    return !!this.instance;
  }

  getInstance(): BrowserWindow | undefined {
    return this.instance;
  }

  // 发布通知
  publisher(eventName: string, params: any) {
    ipc._publisher({ header: { fromId: this.name, eventName }, body: params });
    this.emit(eventName, params);
  }

  request(eventName: string, data: any, timeout?: number) {
    return ipc.request(this.name, eventName, data, timeout);
  }

  subscribe(eventName: string, callback: SugarElectron.IpcCallback) {
    return ipc.subscribe(this.name, eventName, callback);
  }

  unsubscribe(eventName: string, callback: SugarElectron.IpcCallback) {
    return ipc.unsubscribe(this.name, eventName, callback);
  }
}

export default BaseWindow;
