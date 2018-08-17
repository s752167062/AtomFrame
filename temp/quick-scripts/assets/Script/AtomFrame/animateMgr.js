(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/Script/AtomFrame/animateMgr.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, '511f1JGezdPq516OYU3i6Yl', 'animateMgr', __filename);
// Script/AtomFrame/animateMgr.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "animateMgr"
    },

    ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.aniBuff = {};
    },

    onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
    },

    addAniClip: function addAniClip(key, obj) {
        if (key == null || !obj instanceof cc.AnimationClip) {
            console.log(" ------ 类型异常 ", key);
            return;
        }
        this.aniBuff[key] = obj;
    },

    getAniClip: function getAniClip(key) {
        if (key == null) {
            return null;
        }
        return this.aniBuff[key];
    },

    cleanAniClip: function cleanAniClip(key) {
        this.aniBuff[key] = null;
    },

    playAni: function playAni(target, key, isloop) {
        if (target == null || key == null) {
            console.log(" ------ 播放动画对象不能为空");
            return;
        }
        var clip = this.aniBuff[key];
        clip.wrapMode = isloop ? cc.WrapMode.Loop : cc.WrapMode.Default;
        if (clip == null || !clip instanceof cc.AnimationClip) {
            console.log(" ------ Clip异常", key);
            return;
        }

        var aniCom = target.getComponent(cc.Animation);
        if (aniCom == null) {
            target.addComponent(cc.Animation);
            aniCom = target.getComponent(cc.Animation);
        }
        aniCom.addClip(clip, "ani");
        aniCom.play("ani");
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
        //# sourceMappingURL=animateMgr.js.map
        