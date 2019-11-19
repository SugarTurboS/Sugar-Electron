const { CONFIG_GET } = require('../const');
const { remote } = require('electron');
module.exports = remote.getGlobal(CONFIG_GET)();