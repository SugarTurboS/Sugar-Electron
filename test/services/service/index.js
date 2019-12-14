const { Service } = require('../../../core');
const path = require('path');
module.exports = {
    start(isDebug) {
        const service = new Service('service', path.join(__dirname, 'app.js'), isDebug);
        service.on('success', function () {
            console.log('service进程启动成功');
        });
      
        service.on('fail', function () {
            console.log('service进程启动异常');
        });
        
        return service;
    }
}