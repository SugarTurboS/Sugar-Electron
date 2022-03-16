import path from "path";
import cache from "../cache/main";
import ipc from "../ipc/main";
import store from "../store/main";
import config from "../config/main";
import windowCenter from "../windowCenter/main";
import { SUGAR_OPTION } from "../const";

export default {
  installPlugins() {
    try {
      const plugins = {};
      const sugarOption = cache.get(SUGAR_OPTION);
      const configPath = sugarOption.configPath;
      const ctx = { ipc, store, config, windowCenter, plugins };
      const pluginsConfig = require(path.join(configPath, "plugins"));
      for (let key in pluginsConfig) {
        let item = pluginsConfig[key] || {};
        if (typeof item === "function") {
          item = item(sugarOption);
        }
        if (
          item.env instanceof Array &&
          item.env.indexOf("main") > -1 &&
          item.enable
        ) {
          const pluginPath =
            item.package ||
            item.path ||
            path.join(sugarOption.pluginsPath, key);
          (this as any)[key] = (require(pluginPath) as any).install(
            ctx,
            item.params
          );
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
};
