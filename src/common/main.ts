import path from "path";
import fs from "fs";
import { app } from "electron";
import { SUGAR_OPTION } from "../const";
import cache from "../cache/main";
import config from "../config/main";
import store from "../store/main";
import plugins from "../plugins/main";
cache.set(SUGAR_OPTION, {});

function ready(): Promise<void> {
  return new Promise((resolve) => {
    if (app.isReady()) {
      resolve();
    } else {
      app.on("ready", () => {
        resolve();
      });
    }
  });
}

export interface StartOption {
  useAppPathConfig?: boolean;
  basePath?: string;
  configPath?: string;
  storePath?: string;
  windowCenterPath?: string;
  pluginsPath?: string;
}

export default {
  /**
   * 启动sugar
   * @param option [object] 启动参数
   * @param option.useAppPathConfig [boolean] 是否使用%appData%配置
   * @param option.basePath [string] 启动目录
   * @param option.configPath [string] 配置目录
   * @param option.storePath [string] 进程状态共享目录
   * @param option.windowCenterPath [string] 窗口中心目录
   * @param option.pluginsPath [string] 插件目录
   */
  async start(option: StartOption = {}) {
    await ready();
    const basePath = option.basePath || process.cwd();
    const _option: any = Object.assign(
      {
        basePath: basePath,
        useAppPathConfig: false,
        configPath: path.join(basePath, "/config"),
        storePath: path.join(basePath, "/store"),
        windowCenterPath: path.join(basePath, "/windowCenter"),
        pluginsPath: path.join(basePath, "/plugins"),
      },
      option
    );
    cache.set(SUGAR_OPTION, option);

    try {
      if (fs.existsSync(_option.configPath)) {
        config.getConfig({ configPath: _option.configPath, useAppPathConfig: _option.useAppPathConfig });
      }
    } catch (error) {
      console.log("[sugar-electron] init config fail", error);
    }

    try {
      if (fs.existsSync(_option.storePath)) {
        const storeJson = require(_option.storePath);
        store.createStore(storeJson);
      }
    } catch (error) {
      console.log("[sugar-electron] init store fail", error);
    }

    try {
      if (fs.existsSync(_option.windowCenterPath)) {
        const items = fs.readdirSync(_option.windowCenterPath);
        const dirs = items.filter((item) =>
          fs.statSync(path.join(_option.windowCenterPath, item)).isDirectory()
        );
        dirs.forEach((item) => require(path.join(_option.windowCenterPath, item)));
      }
    } catch (error) {
      console.log("[sugar-electron] init windowCenter fail", error);
    }

    try {
      plugins.installPlugins();
    } catch (error) {
      console.log("[sugar-electron] init plugins fail", error);
    }
  },
};
