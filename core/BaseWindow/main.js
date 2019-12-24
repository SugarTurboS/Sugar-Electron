const { BrowserWindow } = require('electron');
const util = require('../util');
const ipc = require('../ipc');
const windowCenter = require('../windowCenter');
const Events = require('events')
const windowEvents = [
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
const defaultOptions = {};
class BaseWindow extends Events {
    // 设置所有窗口默认属性
    static setDefaultOptions(options) {
        Object.assign(defaultOptions, options);
    }

    constructor(name, options = {}) {
        super();
        if (util.isBoolean(name) === false) {
            throw new Error('process name cannot be null');
        }
        this.instance = null;
        this.name = name;
        this.options = options;
        // 注册到窗口中心
        windowCenter._register(name, this);
    }

    // 发布通知
    publisher(eventName) {
        ipc.publisher({ header: { fromId: this.name, eventName } });
        this.emit(eventName);
    }

    open(option = {}) {
        try {
            if (this.instance === null) {
                const options = Object.assign(defaultOptions, this.options, option);
                this.instance = new BrowserWindow(options);
                // 窗口ID，必须
                this.instance.windowId = this.name;
                ipc._register(this.name, this.instance);
                if (options.show !== false) {
                    this.publisher('ready-to-show');
                }
                windowEvents.forEach(eventName => {
                    this.instance.on(eventName, () => {
                        // 广播窗口消息
                        this.publisher(eventName);
                        if (eventName === 'closed') {
                            this.instance = null;
                            ipc._unregister(this.name);
                        }
                    });
                });
    
                this.instance.loadURL(options.url);
            }  
        } catch (error) {
            console.error(error);
        }
  
        return this.instance;
    }

    getInstance() {
        return this.instance;
    }
}

module.exports = BaseWindow;