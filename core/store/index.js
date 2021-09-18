const { remote } = require('electron');
const isRenderProcess = !!remote; // 是否是渲染进程
if (isRenderProcess) {
    module.exports = require('./render');
} else {
    module.exports = require('./main');
}

