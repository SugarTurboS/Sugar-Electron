### 简介
基于Electron封装的进程通信SDK。总共分成两个部分组成，主进程模块、渲染进程模块，SDK能根据不能的进程环境，加载对应的模块。

### 主进程模块接口介绍

#### 发布消息：sendToRender(processName:String, eventName:String, params:Any)
主进程发布消息到指定渲染进程
processName: 进程名
eventName: 事件名
cb: 回调函数

#### 绑定：onFromRender(eventName:String, cb:Function)
绑定渲染进程发送到主进程消息
eventName: 事件名
cb: 回调函数

#### 解绑：removeListenerFromRender(eventName:String, cb:Function)
解绑渲染进程发送到主进程消息
eventName: 事件名
cb: 回调函数

#### 解绑所有：removeListenerFromRender(eventName:String)
解绑渲染进程发送到主进程消息
eventName: 事件名

### 渲染进程模块接口介绍

#### 设置响应超时：setDefaultRequestTimeout(timeout:Number)
timeout: 超时时间，默认20s

#### 请求：request(toId:String, eventName:String, data:Object, timeout:Number)
toId: 请求服务进程ID（注册通信进程模块名）
eventName: 服务进程响应事件名
data: 请求参数
timeout: 超时时间，默认20s
return: 返回Promise对象

#### 注册响应服务：response(eventName:String, callback:Function)
eventName: 响应事件名
callback: 回调函数

#### 发布：publisher(eventName:String, params:Object)
eventName: 消息名
params: 消息参数

#### 订阅：subscribe(toId:String, eventName:String, callback:Function)
toId: 订阅消息进程ID（注册通信进程模块名）
eventName: 消息名
callback: 回调函数

#### 退订：unsubscribe(toId:String, eventName:String, callback:Function)
toId: 订阅消息进程ID（注册通信进程模块名）
eventName: 消息名
callback: 回调函数

#### 发布消息：sendToMain(eventName:String, params:Any)
渲染进程发布消息到主进程
eventName: 事件名
cb: 回调函数

#### 绑定：onFromMain(eventName:String, cb:Function)
绑定主进程发送到渲染进程消息
eventName: 事件名
cb: 回调函数

#### 解绑：removeListenerFromMain(eventName:String, cb:Function)
解绑主进程发送到渲染进程消息
eventName: 事件名
cb: 回调函数

#### 解绑所有：removeAllListenerFromMain(eventName:String)
解绑渲染进程发送到渲染进程消息
eventName: 事件名
