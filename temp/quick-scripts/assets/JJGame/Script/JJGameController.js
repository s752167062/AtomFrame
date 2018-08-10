(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/JJGame/Script/JJGameController.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, 'f2bcfh4j+lBOKEauDOgI0eM', 'JJGameController', __filename);
// JJGame/Script/JJGameController.js

"use strict";

// Learn cc.Class:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/class/index.html
// Learn Attribute:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/reference/attributes/index.html
// Learn life-cycle callbacks:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/life-cycle-callbacks/index.html

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },

        //砖块的tag基数
        index_tag: 0,
        minterval: 0
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad: function onLoad() {
        this.gameUpdateInterval = cc.Atom.gameConfMgr.getInfo("gameUpdateInterval");
        this.gameSpeed = cc.Atom.gameConfMgr.getInfo("gameSpeed"); //节奏提速
    },
    start: function start() {},
    update: function update(dt) {
        this.minterval += dt;
        if (this.minterval * this.gameSpeed >= this.gameUpdateInterval) {
            //角色跳
            //地图新增一阶
            //地图移动
        }
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
        //# sourceMappingURL=JJGameController.js.map
        