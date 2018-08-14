"use strict";
cc._RF.push(module, 'abaf7W52EJJCbD4dshuwhhT', 'pauseLayerDelegate');
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