const { ipc } = require('../../../core');
ipc.response('service-1', (json, cb) => {
    cb('service-1响应');
});
ipc.response('service-2', (json, cb) => {
    cb('service-2响应');
});
