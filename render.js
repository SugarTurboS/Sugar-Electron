const common = require('./core/common/render');
const modules = {
    BaseWindow: require('./core/BaseWindow/render'),
    Service: require('./core/service/render'),
    ipc: require('./core/ipc/render'),
    store: require('./core/store/render'),
    config: require('./core/config/render'),
    plugins: require('./core/plugins/render'),
    windowCenter: require('./core/windowCenter/render')
};

module.exports = Object.assign(common, modules);