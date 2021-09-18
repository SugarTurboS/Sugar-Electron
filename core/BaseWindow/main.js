const { BrowserWindow } = require('electron');
const util = require('../util');
const ipc = require('../ipc/main');
const windowCenter = require('../windowCenter/main');
const Events = require('events')
const windowEvents = [
    'close',
    'closed',
    'session-end',
    'unresponsive',
    'responsive',
    'blur',
    'focus',
    'show',
    'hide',
    'ready-to-show',
    'maximize',
    'unmaximize',
    'minimize',
    'restore',
    'will-resize',
    'resize',
    'will-move',
    'move',
    'moved',
    'enter-full-screen',
    'leave-full-screen',
    'enter-html-full-screen',
    'leave-html-full-screen',
    'always-on-top-changed',
    'app-command',
    'scroll-touch-begin',
    'scroll-touch-end',
    'scroll-touch-edge',
    'swipe',
    'rotate-gesture',
    'sheet-begin',
    'sheet-end',
    'new-window-for-tab'
];
// 窗体默认属性
const defaultOption = {};
class BaseWindow extends Events {
    // 设置所有窗口默认属性
    static setDefaultOption(option) {
        Object.assign(defaultOption, option);
    }

    constructor(name, option = {}) {
        super();
        if (util.isBoolean(name) === false) {
            throw new Error('process name cannot be null');
        }
        this.instance = null;
        this.name = name;
        this.option = option;
        // 注册到窗口中心
        windowCenter._register(name, this);
    }
    open(option = {}) {
        try {
            if (this.instance === null) {
                const _option = Object.assign({}, defaultOption, this.option, option);
                this.instance = new BrowserWindow(_option);
                // 窗口ID，必须
                this.instance.windowId = this.name;
                ipc._register(this.name, this.instance);
                windowEvents.forEach(eventName => {
                    this.instance.on(eventName, () => {
                        // 广播窗口消息
                        this.publisher(eventName, { ...arguments });
                        if (eventName === 'closed') {
                            this.instance = null;
                            ipc._unregister(this.name);
                        }
                    });
                });
                this.instance.loadURL(_option.url);
            }
        } catch (error) {
            console.error(error);
        }
        return this.instance;
    }

    // 判断窗口实例是否存在
    isInstanceExist() {
        return !!this.instance;
    }

    getInstance() {
        return this.instance;
    }

    // 发布通知
    publisher(eventName, params = {}) {
        ipc._publisher({ header: { fromId: this.name, eventName }, body: params });
        this.emit(eventName, params);
    }

    request(eventName = '', data = {}, timeout) {
        return ipc.request(this.name, eventName, data, timeout);
    }

    subscribe(eventName = '', callback) {
        return ipc.subscribe(this.name, eventName, callback);
    }

    unsubscribe(eventName, callback) {
        return ipc.unsubscribe(this.name, eventName, callback);
    }
}

module.exports = BaseWindow;
