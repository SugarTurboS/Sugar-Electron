const { ipcSDK } = require('../../../core');
window.onload = function () {
    ipcSDK.response('A1', (json, cb) => {
        cb('winA响应请求A1:');
        console.log(json);
    });

    document.querySelector('#btn1').onclick = async function () {
        console.time();
        const r = await ipcSDK.request('winB', 'B1', 'winA发出一条请求B1');
        console.timeEnd();
        console.log('响应', r);
    }

    document.querySelector('#btn2').onclick = async function () {
        ipcSDK.publisher('A3', {
            msg: '你好，我是A3消息'
        });
    }

    ipcSDK.onFromMain('main-test', (data) => {
        console.log(data);
    });
}