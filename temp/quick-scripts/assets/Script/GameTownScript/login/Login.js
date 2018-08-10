(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/Script/GameTownScript/login/Login.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, 'c0ef5/1i+BDor8v+Leko1Lm', 'Login', __filename);
// Script/GameTownScript/login/Login.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "Login"
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
    },

    onLoad: function onLoad() {
        console.log("-onLoad" + this.TAG);
    },

    start: function start() {
        console.log("-start" + this.TAG);
    },

    onDestory: function onDestory() {
        console.log("-onDestory" + this.TAG);
    },
    // update (dt) {},

    onBtnLogin: function onBtnLogin() {
        console.log("-Login");
        cc.director.loadScene("Scene/GameTown/lobby");
    }
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
        //# sourceMappingURL=Login.js.map
        