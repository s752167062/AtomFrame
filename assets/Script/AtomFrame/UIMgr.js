/***
    设计尺寸用 1163*640 , EXACT_FIT 适配方式 （对场景和底部默认的全屏拉伸填充）
    UI 层的管理
    兼容 刘海屏、超长屏2：1防拉伸 适配也是
    游戏分层：scene：
                    BG-Layer
                    Content-layer
                        content-layer
                        btn-layer
                        dialog-layer
    
    Content-layer 的内容会进行fix
    
    1.对layer层进行 fix 修复比例是1.9 ，超过宽高比1.9的进行 1.9的比例修复（小幅度拉伸） ，layer层再居中
    2. 
*/
cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "UIMgr",
    },

    ctor: function () {
        console.log("-new:" + this.TAG);
    },

    onLoad: function () {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function () {
        console.log("-destory:" + this.TAG);
    },

    //通过预设创建UI层
    createLayer: function (name){

    },

    //修复层级的适配，防止过度拉伸
    fixLayer:function(layer){

    },

});
