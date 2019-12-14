const remote = require('electron').remote;
const runPath = remote.getCurrentWindow().runPath;
require(runPath);