"use strict";
cc._RF.push(module, '070a7IN9YFNF60eU/Dl4jjv', 'BrickDelegate');
// JJGame/Script/BrickDelegate.js

"use strict";

var ObjType = cc.Enum({
    baseBrick: 0,
    buffBrick: 1,
    player: 2
});

//砖块代理
cc.Class({
    extends: cc.Component,

    properties: {
        brickData: null,
        objType: {
            default: ObjType.baseBrick,
            type: cc.Enum(ObjType)
        }
    },

    onLoad: function onLoad() {},
    start: function start() {},
    update: function update(dt) {},
    getBrickData: function getBrickData() {
        return this.brickData;
    },
    setBrickData: function setBrickData(value) {
        this.brickData = value;

        this.buffui = this.node.getChildByName("buff");
        this.trapui = this.node.getChildByName("trap");
        this.wallui = this.node.getChildByName("wall");
        this.base = this.node.getChildByName("base");

        this.base.active = value.brickType == cc.Atom.gameConfMgr.BRICKS.BASE || value.brickType == cc.Atom.gameConfMgr.BRICKS.BUFF;
        this.buffui.active = value.brickType == cc.Atom.gameConfMgr.BRICKS.BUFF;
        this.trapui.active = value.brickType == cc.Atom.gameConfMgr.BRICKS.TRAP;
        this.wallui.active = value.brickType == cc.Atom.gameConfMgr.BRICKS.WALL;

        if (this.buffui.active == true) {
            cc.Atom.animateMgr.playAni(this.buffui, "buffAni", true);
        }
    },
    getGameObjType: function getGameObjType() {
        return this.objType;
    },
    onBuff: function onBuff() {
        this.buffui.active = false;
        this.trapui.active = false;
        this.wallui.active = false;
    }
});

cc._RF.pop();