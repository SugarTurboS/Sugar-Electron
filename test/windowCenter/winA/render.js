/* eslint-disable require-atomic-updates */
const { windowCenter, ipc } = require('../../../core');
window.onload = function () {
    const btn1 = document.querySelector('#btn1');
    const btn2 = document.querySelector('#btn2');
    const btn3 = document.querySelector('#btn3');
    const text = document.querySelector('#text');
    // 获取窗口B句柄
    const winB = windowCenter.winB;

    ipc.response('test', (data, cb) => {
        cb('I am winA')
    })

    winB.subscribe('ready-to-show', () => {
        text.innerHTML += '<p>winB初始化完毕</p>';
    });

    winB.subscribe('resize', async () => {
        const size = await winB.getSize();
        text.innerHTML += `<p>winB尺寸变化：${size[0]},${size[1]}</p>`;
    });

    btn1.onclick = async function () {
        await winB.open();
    }

    btn2.onclick = async function () {
        await winB.setSize(400, 400);
    }

    btn3.onclick = async function () {
        const r1 = await winB.request('B1', '我是winA');
        text.innerHTML += `<p>${r1}</p>`;

        const r2 = await winB.request('B2', '我是winA');
        text.innerHTML += `<p>${r2}</p>`;
    }
}

