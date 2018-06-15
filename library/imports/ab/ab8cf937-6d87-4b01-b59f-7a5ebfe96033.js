"use strict";
cc._RF.push(module, 'ab8cfk3bYdLAbWfel6/6WAz', 'socketMgr');
// Script/AtomFrame/socketMgr.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "socketMgr"
    },

    ctor: function ctor() {
        console.log("-new:" + this.TAG);
    },

    onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
    }

    /* 这里使用 socket.io 模块 ，websocket 和 实际的 socket 不太一样*/
});

cc._RF.pop();