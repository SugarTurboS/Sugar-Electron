const { ipc } = require('../../../core');
window.onload = function () {
    ipc.response('B1', (json, cb) => {
        cb('winB响应请求B1:');
    });

    function cbA3(data) {
        console.log('收到A3订阅消息：', data);
    }

    document.querySelector('#btn1').onclick = async function () {
        console.time();
        const r = await ipc.request('winA', 'A1', 'winB发出一条请求A1');
        console.timeEnd();
        console.log('响应', r);
    }

    document.querySelector('#btn2').onclick = async function () {
        console.time();
        const r = await ipc.request('winA', 'A2', 'winB发出一条请求A2');
        console.timeEnd();
        console.log('响应', r);
    }

    document.querySelector('#btn3').onclick = async function () {
        ipc.subscriber('winA', 'A3', cbA3);
    }

    document.querySelector('#btn4').onclick = async function () {
        ipc.unsubscriber('winA', 'A3', cbA3);
    }

    ipc.subscriber('winA', 'blur', () => {
        console.log('=====blur')
    });

    ipc.subscriber('winA', 'closed', () => {
        console.log('=====closed')
    });
}