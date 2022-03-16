import { ipcMain, IpcMainEvent } from "electron";
import { IPC_GET_CACHE, IPC_SET_CACHE, IPC_GET_THREAD_ID, IPC_GET_THREAD_INFO } from "./const";
const cache: any = {};

// 同步获取cache
ipcMain.on(IPC_GET_CACHE, (e: IpcMainEvent, key) => {
  e.returnValue = cache[key] || {};
});

ipcMain.on(IPC_SET_CACHE, (e: IpcMainEvent, key, value) => {
  cache[key] = value;
});

ipcMain.on(IPC_GET_THREAD_ID, (e: IpcMainEvent) => {
  e.returnValue = cache.get(e.processId.toString());
});

ipcMain.on(IPC_GET_THREAD_INFO, (e: IpcMainEvent) => {
  e.returnValue = cache.get(IPC_GET_THREAD_INFO);
});

export default {
  get(key: string): any {
    return cache[key] || {};
  },

  set(key: string, value: any): void {
    cache[key] = value;
  },
};
