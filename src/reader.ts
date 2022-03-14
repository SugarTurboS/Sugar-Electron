import common from "./common/render";
import BaseWindow from "./BaseWindow/render";
import Service from "./service/render";
import ipc from "./ipc/render";
import store from "./store/render";
import config from "./config/render";
import plugins from "./plugins/render";
import windowCenter from "./windowCenter/render";
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
