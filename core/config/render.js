const { CONFIG } = require('../const');
const { remote } = require('electron');
const util = require('../util');
module.exports = Object.assign({ windowName: util.getThreadId() }, remote.getGlobal(CONFIG));
