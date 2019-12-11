const { ipc } = require('../../../core');
window.onload = function () {
    ipc.response('A1', (json, cb) => {
        cb('winA响应请求A1:');
        console.log(json);
    });

    document.querySelector('#btn1').onclick = async function () {
        console.time();
        const r = await ipc.request('winB', 'B1', 'winA发出一条请求B1');
        console.timeEnd();
        console.log('响应', r);
    }

    document.querySelector('#btn2').onclick = async function () {
        ipc.publisher('A3', {
            msg: '你好，我是A3消息'
        });
    }

    ipc.subscriber('winA', 'blur', () => {
        console.log('=====blur')
    });
}

