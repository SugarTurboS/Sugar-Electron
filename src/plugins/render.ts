import path from "path";
import { SUGAR_OPTION } from "../const";
import cache from '../cache/reader';
import ipc from "../ipc/render";
import store from "../store/render";
import config from "../config/render";
import windowCenter from "../windowCenter/render";
const sugarOption: any = cache.get(SUGAR_OPTION);
const windowName: string = cache.getThreadId();
const configPath = sugarOption.configPath;

// 安装插件
function installPlugins() {
  const plugins = {};
  try {
    const ctx = { ipc, store, config, windowCenter, plugins };
    const pluginsConfig = window.require(path.join(configPath, "plugins"));
    for (let key in pluginsConfig) {
      let item = pluginsConfig[key] || {};
      if (typeof item === "function") {
        item = item(sugarOption);
      }

      // const { include, env, enable, package, params } = item;

      if (
        !(item.env instanceof Array) ||
        item.env.length === 0 ||
        item.env.indexOf("render") > -1
      ) {
        const isInclude =
          !(item.include instanceof Array) ||
          item.include.length === 0 ||
          item.include.indexOf(windowName) > -1;
        if (isInclude && item.enable) {
          const pluginPath =
            item.package || item.path || path.join(getDefaultPath(), key);
          (plugins as any)[key] = (window.require(pluginPath) as any).install(
            ctx,
            item.params
          );
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return plugins;
}

function getDefaultPath() {
  return sugarOption.pluginsPath || path.join(sugarOption.basePath, "plugins");
}

export default installPlugins();
