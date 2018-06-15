(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/Script/AtomFrame/hotUpdateMgr.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, '5d4b44k5zBHl5KZbVdpqQ8E', 'hotUpdateMgr', __filename);
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
        }
        if (CC_EDITOR) {
            __define(__module.exports, __require, __module);
        }
        else {
            cc.registerModuleFunc(__filename, function () {
                __define(__module.exports, __require, __module);
            });
        }
        })();
        //# sourceMappingURL=hotUpdateMgr.js.map
        