import { ipcRenderer } from "electron";
import {
  IPC_GET_CACHE,
  IPC_SET_CACHE,
  IPC_GET_THREAD_ID,
  IPC_GET_THREAD_INFO,
} from "./const";

export default {
  get(key: string): any {
    return ipcRenderer.sendSync(IPC_GET_CACHE, key);
  },

  set(key: string, value: any): void {
    ipcRenderer.sendSync(IPC_SET_CACHE, key, value);
  },

  getThreadId(): string {
    return ipcRenderer.sendSync(IPC_GET_THREAD_ID);
  },

  getThreadInfo(): any {
    return ipcRenderer.sendSync(IPC_GET_THREAD_INFO);
  },
};
