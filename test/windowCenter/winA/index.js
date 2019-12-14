/* eslint-disable no-undef */
const { BaseWindow } = require('../../../core');
const NAME = 'winA';
const OPTIONS = {
    url: `file://${__dirname}/index.html`,
    width: 800,
    height: 600,
    thickFrame: false
}
module.exports = new BaseWindow(NAME, OPTIONS);


