const path = require('path');
const util = require('../util');
class Plugins {
  installPlugins() {
    try {
      const plugins = {};
      const ipc = require('../ipc/main');
      const store = require('../store/main');
      const config = require('../config/main');
      const windowCenter = require('../windowCenter/main');
      const { SUGAR_OPTION } = require('../const');
      const sugarOption = global[SUGAR_OPTION];
      const configPath = sugarOption.configPath;
      const ctx = { ipc, store, config, windowCenter, plugins };
      const pluginsConfig = require(path.join(configPath, 'plugins'));
      for (let key in pluginsConfig) {
          let item = pluginsConfig[key] || {};
          if (typeof item === 'function') {
              item = item(sugarOption);
          }
          if (util.isArray(item.env) && item.env.indexOf('main') > -1 && item.enable) {
            const pluginPath = item.package || item.path || path.join(sugarOption.pluginsPath, key);
            this[key] = require(pluginPath).install(ctx, item.params);
          }
      }
    } catch (error) {
        console.error(error);
    }
  }
}

module.exports = new Plugins();

