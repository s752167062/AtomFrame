(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/JJGame/Script/BrickDelegate.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, '070a7IN9YFNF60eU/Dl4jjv', 'BrickDelegate', __filename);
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

        this.buffui.active = value.brickType == cc.Atom.gameConfMgr.BRICKS.BUFF;
        this.trapui.active = value.brickType == cc.Atom.gameConfMgr.BRICKS.TRAP;
        this.wallui.active = value.brickType == cc.Atom.gameConfMgr.BRICKS.WALL;
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
        //# sourceMappingURL=BrickDelegate.js.map
        