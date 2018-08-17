
cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "animateMgr",
    },

    ctor: function () {
        console.log("-new:" + this.TAG);
        this.aniBuff = {};
    },

    onLoad: function () {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function () {
        console.log("-destory:" + this.TAG);
    },

    addAniClip: function (key ,obj) {
        if (key == null || !obj instanceof cc.AnimationClip){
            console.log(" ------ 类型异常 ",key);
            return 
        }
        this.aniBuff[key] = obj;
    },

    getAniClip: function (key) {
        if(key == null){
            return null;
        }
        return this.aniBuff[key];
    },

    cleanAniClip: function (key) {
        this.aniBuff[key] = null;
    },

    playAni: function (target , key , isloop ) {
        if(target == null || key == null){
            console.log(" ------ 播放动画对象不能为空")
            return 
        }
        var clip = this.aniBuff[key]
        clip.wrapMode = isloop ? cc.WrapMode.Loop : cc.WrapMode.Default
        if(clip ==null || !clip instanceof cc.AnimationClip){
            console.log(" ------ Clip异常",key)
            return 
        }
        
        var aniCom = target.getComponent(cc.Animation)
        if(aniCom == null){
            target.addComponent(cc.Animation)
            aniCom = target.getComponent(cc.Animation)
        }
        aniCom.addClip(clip , "ani");
        aniCom.play("ani");
    }

});
