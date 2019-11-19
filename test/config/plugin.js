const path = require('path');
exports.adpter = {
    path: path.join(__dirname, '../plugins/adpter'),
    // package: 'adpter',
    enable: true,
    include: [],
    params: { timeout: 20000 }
};