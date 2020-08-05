const { CONFIG_GET } = require('../const');
const { remote } = require('electron');
const util = require('../util');
module.exports = Object.assign({ windowName: util.getThreadId() }, remote.getGlobal(CONFIG_GET)());