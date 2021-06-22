const common = require('./core/common/main');
const modules = {
    BaseWindow: require('./core/BaseWindow/main'),
    Service: require('./core/service/main'),
    ipc: require('./core/ipc/main'),
    store: require('./core/store/main'),
    config: require('./core/config/main'),
    plugins: require('./core/plugins/main'),
    windowCenter: require('./core/windowCenter/main')
};

module.exports = Object.assign(common, modules);
