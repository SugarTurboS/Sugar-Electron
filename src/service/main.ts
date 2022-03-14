import { BrowserWindow } from "electron";
import ipc from "../ipc/main";
import Events from "events";
import BaseWindow from "../BaseWindow/main";
import windowCenter from "../windowCenter/main";
import cache from "../cache/main";

class Service extends Events {
  runPath: string;
  name: string;
  baseWindow?: BaseWindow;
  constructor(name: string, runPath: string, isDebug = false) {
    super();
    this.runPath = runPath;
    this.name = name;
    this.start(isDebug);
  }

  start(isDebug = false) {
    if (this.baseWindow) {
      return false;
    }

    try {
      const URL = `file://${__dirname}/index.html`;

      const baseWindow: BaseWindow = new BaseWindow(this.name, {
        show: false,
        fullscreen: false,
        skipTaskbar: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        },
      });

      const browserWindow: BrowserWindow =  baseWindow.open();

      ipc._register(this.name, browserWindow);

      const processId: string = browserWindow.webContents
        .getProcessId()
        .toString();
      cache.set(processId, this.name);
      cache.set(`${processId}runPath`, this.runPath);

      browserWindow.on("closed", () => {
        this.emit("closed");
        this.baseWindow = undefined;

        windowCenter._unegister(this.name);
        
        ipc._unregister(this.name);
      });

      browserWindow.on("ready-to-show", () => {
        if (isDebug) {
          browserWindow?.show();
          browserWindow?.webContents.openDevTools();
        } else {
          browserWindow?.setFocusable(false);
          browserWindow?.setIgnoreMouseEvents(true);
        }
        this.emit("success");
      });
      browserWindow.loadURL(URL);
      browserWindow.webContents.on("crashed", () => {
        this.emit("crashed");
      });

      windowCenter._register(this.name, this);

      this.baseWindow = baseWindow;
    } catch (error) {
      console.log(error);
      this.emit("fail");
    }
  }

  stop() {
    this.baseWindow?.getInstance()?.close();
    this.baseWindow = undefined;
  }
}

export default Service;
