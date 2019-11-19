const ipcSDK = window.ipcSDK;

window.onload = function () {
    ipcSDK.response('B1', (json, cb) => {
        cb('winB响应请求B1:');
    });

    function cbA3(data) {
        console.log('收到A3订阅消息：', data);
    }

    document.querySelector('#btn1').onclick = async function () {
        console.time();
        const r = await ipcSDK.request('winA', 'A1', 'winB发出一条请求A1');
        console.timeEnd();
        console.log('响应', r);
    }

    document.querySelector('#btn2').onclick = async function () {
        console.time();
        const r = await ipcSDK.request('winA', 'A2', 'winB发出一条请求A2');
        console.timeEnd();
        console.log('响应', r);
    }

    document.querySelector('#btn3').onclick = async function () {
        ipcSDK.subscriber('winA', 'A3', cbA3);
    }

    document.querySelector('#btn4').onclick = async function () {
        ipcSDK.unsubscriber('winA', 'A3', cbA3);
    }
}