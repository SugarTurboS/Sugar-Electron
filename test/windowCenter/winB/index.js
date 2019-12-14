const { BaseWindow } = require('../../../core');
const NAME = 'winB';
const OPTIONS = {
    url: `file://${__dirname}/index.html`,
    width: 800,
    height: 600,
    thickFrame: false
}
module.exports = new BaseWindow(NAME, OPTIONS);



