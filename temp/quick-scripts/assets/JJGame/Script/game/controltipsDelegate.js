(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/JJGame/Script/game/controltipsDelegate.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, 'b1e57QpdndJprAKy2UcwJcv', 'controltipsDelegate', __filename);
// JJGame/Script/game/controltipsDelegate.js

"use strict";

// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad: function onLoad() {
        this.mtime = cc.Atom.gameConfMgr.getInfo("readyCount");

        var _label = this.node.getChildByName("count_label");
        this.count_label = _label.getComponent(cc.Label);
        this.count_label.string = this.mtime;
    },
    start: function start() {},
    mUpdate: function mUpdate(dt) {
        this.mtime -= dt;
        this.count_label.string = Math.ceil(this.mtime);
        if (this.mtime <= 0) {
            cc.Atom.gameState.setGameIng();
            this.node.removeFromParent();
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
        //# sourceMappingURL=controltipsDelegate.js.map
        