/* eslint-disable no-undef */
const { BaseWindow } = require('../../../core');
const NAME = 'winA';
const OPTIONS = {
    url: `file://${__dirname}/index.html`,
    width: 800,
    height: 600,
    thickFrame: false
}
const baseWindow = new BaseWindow(NAME, OPTIONS);
baseWindow.on('ready-to-show', () => {
    baseWindow.getInstance().webContents.openDevTools();
});
module.exports = baseWindow;


