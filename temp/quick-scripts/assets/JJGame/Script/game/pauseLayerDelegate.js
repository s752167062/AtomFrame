(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/JJGame/Script/game/pauseLayerDelegate.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, 'abaf7W52EJJCbD4dshuwhhT', 'pauseLayerDelegate', __filename);
// JJGame/Script/game/pauseLayerDelegate.js

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

    onLoad: function onLoad() {},
    start: function start() {},
    onResume: function onResume() {
        this.node.removeFromParent();
        cc.Atom.eventMgr.notify("onPause", false);
    },
    onOut: function onOut() {
        this.node.removeFromParent();
        cc.Atom.gameState.setGameInHall();
        cc.director.loadScene("JJGame/Scene/JJHallMain");
    },
    onReStart: function onReStart() {
        this.node.removeFromParent();
        cc.Atom.eventMgr.notify("onReStart", null);
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
        //# sourceMappingURL=pauseLayerDelegate.js.map
        