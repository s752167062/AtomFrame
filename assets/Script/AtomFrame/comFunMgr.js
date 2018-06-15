
cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "comFunMgr",
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

    //一些通用的函数//
});
