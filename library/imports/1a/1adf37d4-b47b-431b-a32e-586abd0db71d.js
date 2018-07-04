"use strict";
cc._RF.push(module, '1adf3fUtHtDG6MuWGq9Dbcd', 'BonesBase');
// Script/AtomFrame/ScriptBase/BonesBase.js

"use strict";

//（龙骨 DragonBones）骨骼动画的基础类，相关骨骼动画对象可以绑定这个基础脚本 / 绑定的基础脚本继承此脚本并扩展单独的接口
// cocos 官网无法查找到相关API 时移步 http://developer.egret.com/cn/apidoc/index/name/dragonBones 参考相关API 或看源码
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
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
        TAG: "BonesBase",
        DefaultAni: null //默认一开始执行的动画
    },

    onLoad: function onLoad() {
        //获取 ArmatureDisplay 组件
        this._armatureDisPlay = this.getComponent(dragonBones.ArmatureDisplay);
        //获取 Armatrue
        this._armature = this._armatureDisPlay.armature();

        //添加动画监听
        this._armatureDisPlay.addEventListener(dragonBones.EventObject.FADE_IN_COMPLETE, this.animationEventHandler, this);
        this._armatureDisPlay.addEventListener(dragonBones.EventObject.FADE_OUT_COMPLETE, this.animationEventHandler, this);
        this._armatureDisPlay.addEventListener(dragonBones.EventObject.COMPLETE, this.animationEventHandler, this);
        this._armatureDisPlay.addEventListener(dragonBones.EventObject.ANIMATION_FRAME_EVENT, this.animationEventHandler, this);
        this._armatureDisPlay.addEventListener(dragonBones.EventObject.BONE_FRAME_EVENT, this.animationEventHandler, this);
        this._armatureDisPlay.addEventListener(dragonBones.EventObject.FRAME_EVENT, this.animationEventHandler, this);
        this._armatureDisPlay.addEventListener(dragonBones.EventObject.LOOP_COMPLETE, this.animationEventHandler, this);
    },

    //动画事件
    animationEventHandler: function animationEventHandler(event) {
        if (events.type == dragonBones.EventObject.FADE_IN_COMPLETE) {
            console.log(" FADE_IN_COMPLETE ", event.detail.animationName);
            this.onFadeInComplete(events);
        } else if (events.type == dragonBones.EventObject.FADE_OUT_COMPLETE) {
            console.log(" FADE_OUT_COMPLETE ", event.detail.animationName);
            this.onFadeOutComplete(events);
        } else if (events.type == dragonBones.EventObject.COMPLETE) {
            console.log(" COMPLETE ", event.detail.animationName);
            this.onAniComplete(events);
        } else if (events.type == dragonBones.EventObject.ANIMATION_FRAME_EVENT) {
            console.log(" ANIMATION_FRAME_EVENT ", event.detail.animationName);
            this.onAniFrameEvent(events);
        } else if (events.type == dragonBones.EventObject.BONE_FRAME_EVENT) {
            console.log(" BONE_FRAME_EVENT ", event.detail.animationName);
            this.onBoneFrameEvent(events);
        } else if (events.type == dragonBones.EventObject.FRAME_EVENT) {
            console.log(" FRAME_EVENT ", event.detail.animationName);
            this.onFrameEvent(events);
        } else if (events.type == dragonBones.EventObject.LOOP_COMPLETE) {
            console.log(" LOOP_COMPLETE ", event.detail.animationName);
            this.onLoopComplete(events);
        }
    },
    onAniComplete: function onAniComplete(events) {},
    onFadeInComplete: function onFadeInComplete(events) {},
    onFadeOutComplete: function onFadeOutComplete(events) {},
    onAniFrameEvent: function onAniFrameEvent(events) {},
    onBoneFrameEvent: function onBoneFrameEvent(events) {},
    onFrameEvent: function onFrameEvent(events) {},
    onLoopComplete: function onLoopComplete(events) {},

    // playAnimationFadeIn:function(name , arg0, arg1, arg2, arg3){
    //     this._armature.animation.fadeIn('attack1', -1, -1, 0, 'hit');
    // },

    //name 指定播放动画的名称。 playtimes 指定播放动画的次数。 -1 为使用配置文件中的次数。 0 为无限循环播放
    playAnimation: function playAnimation(name, playtimes) {
        if (name == null && name.length == 0) {
            console.log(" ### BonesBase playAnimation name null !!!");
            return;
        }
        if (playtimes == null) {
            playtimes = -1;
        }

        this._armatureDisPlay.playAnimation(name, playtimes);
    }

});

cc._RF.pop();