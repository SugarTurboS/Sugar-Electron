const createUUID = ((uuidRegEx, uuidReplacer) => {
    return () => {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'
            .replace(uuidRegEx, uuidReplacer)
            .toUpperCase();
    };
})(/[xy]/g, c => {
    let r = (Math.random() * 16) | 0;
    let v = c === 'x' ? r : (r & 3) | 8;
    return v.toString(16);
});

let windowId = '';

module.exports = {
    //创建uuid
    createUUID,
    // 获取窗口进程id
    getThreadId() {
        if (!windowId) {
            const remote = window.require('electron').remote;
            windowId = remote && remote.getCurrentWindow().windowId;
        }
        return windowId;
    },
    isBoolean(value) {
        return !!value;
    },
    isObject(value) {
        return Object.prototype.toString.call(value) === '[object Object]';
    },
    isArray(value) {
        return Object.prototype.toString.call(value) === '[object Array]';
    },
    /**
     * 防抖
     */
    debounce(fn, wait, context) {
        var timer = null;
        return function () {
            let args = [].slice.call(arguments);
            clearTimeout(timer)
            timer = setTimeout(() => {
                fn.apply(context, args)
            }, wait)
        }
    }
}

