
cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "hotUpdateMgr",
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

    /* 可能涉及搜索路径的问题 参考 jsb.fileUtils 设置搜索路径 相关API */
});
