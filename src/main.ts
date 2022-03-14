import common from "./common/main";
import BaseWindow from "./BaseWindow/main";
import Service from "./service/main";
import ipc from "./ipc/main";
import store from "./store/main";
import config from "./config/main";
import plugins from "./plugins/main";
import windowCenter from "./windowCenter/main";
import '../types/index';

export default {
  ...common,
  ...{
    BaseWindow,
    Service,
    ipc,
    store,
    config,
    plugins,
    windowCenter,
  },
};
