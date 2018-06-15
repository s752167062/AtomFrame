
cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "socketMgr",
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

    /* 这里使用 socket.io 模块 ，websocket 和 实际的 socket 不太一样*/
});
