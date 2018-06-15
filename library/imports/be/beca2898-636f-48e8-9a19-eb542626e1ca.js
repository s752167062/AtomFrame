"use strict";
cc._RF.push(module, 'beca2iYY29I6JoZ61QmJuHK', 'comFunMgr');
// Script/AtomFrame/comFunMgr.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "comFunMgr"
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

    //一些通用的函数//
});

cc._RF.pop();