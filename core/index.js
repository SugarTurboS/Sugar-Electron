const common = require('./common');
const modules = {
    BaseWindow: require('./BaseWindow'),
    Service: require('./service'),
    ipc: require('./ipc'),
    store: require('./store'),
    config: require('./config'),
    plugins: require('./plugins'),
    windowCenter: require('./windowCenter')
};

module.exports = Object.assign({}, common, modules);