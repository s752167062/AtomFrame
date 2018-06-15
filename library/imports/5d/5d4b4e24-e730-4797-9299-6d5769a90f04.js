"use strict";
cc._RF.push(module, '5d4b44k5zBHl5KZbVdpqQ8E', 'hotUpdateMgr');
// Script/AtomFrame/hotUpdateMgr.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "hotUpdateMgr"
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

    /* 可能涉及搜索路径的问题 参考 jsb.fileUtils 设置搜索路径 相关API */
});

cc._RF.pop();