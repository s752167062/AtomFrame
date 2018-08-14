(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/JJGame/Script/game/topBarDelegate.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, 'a5f47AiDKRGTI+vfG1km/Pl', 'topBarDelegate', __filename);
// JJGame/Script/game/topBarDelegate.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad: function onLoad() {
        this.score = 0;
        this.score_label = this.node.getChildByName("textScore");
    },
    start: function start() {
        var _this = this;

        cc.Atom.eventMgr.listen("onAddScore", function (obj, data) {
            _this.onAddScore(data);
        }, this);
    },
    onDestroy: function onDestroy() {
        cc.Atom.eventMgr.unListenByObj(this);
    },
    onAddScore: function onAddScore(data) {
        this.score += data;
        this.score_label.string = "SCORE : " + this.score;
    },

    // update (dt) {},

    onPause: function onPause() {
        cc.Atom.eventMgr.notify("onPause", true);
    },
    onMusic: function onMusic() {
        var isMusicOn = cc.Atom.gameDataMgr.getData("isMusicOn");
        var isEffectOn = cc.Atom.gameDataMgr.getData("isEffectOn");

        cc.Atom.gameDataMgr.getData("isMusicOn", !(isMusicOn || isEffectOn));
        cc.Atom.gameDataMgr.getData("isEffectOn", !(isMusicOn || isEffectOn));
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
        //# sourceMappingURL=topBarDelegate.js.map
        