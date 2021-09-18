const remote = window.require('electron').remote;
const runPath = remote.getCurrentWindow().runPath;
window.require(runPath);

