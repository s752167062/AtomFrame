(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/Script/AtomFrame/UIMgr.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, '69c4cYv+NBH5ZYoxGkZkQW+', 'UIMgr', __filename);
// Script/AtomFrame/UIMgr.js

"use strict";

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
        TAG: "UIMgr"
    },

    ctor: function ctor() {
        console.log("-new:" + this.TAG);
    },

    onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
    },

    //通过预设创建UI层
    createLayer: function createLayer(name) {},

    //修复层级的适配，防止过度拉伸
    fixLayer: function fixLayer(layer) {}

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
        //# sourceMappingURL=UIMgr.js.map
        