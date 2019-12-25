const { ipc } = require('../../../core');
window.onload = function () {
    const text = document.querySelector('#text');
    ipc.response('B1', (json, cb) => {
        text.innerHTML += `<p>${json}</p>`;
        cb('我是winB');
    });

    ipc.response('B2', (json, cb) => {
        text.innerHTML += `<p>${json}</p>`;
        cb('我是winB，B2B2B2B2B2');
    });
}