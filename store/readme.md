#### 主进程模块接口

#### 创建状态共享模块：createStore(store:Store)
store: 初始化申明state
Store: {
    state: Object,
    modules: {
        module:Store
    }
}

#### 渲染进程模块接口

#### 设置state：setState(key:String, value: Any)

#### 获取state：getState(key:String)

#### 获取模块：getModule(moduleName:String)
返回：
setState: 设置当前模块state
getState: 获取当前模块state
getModule: 获取当前模块的子模块








