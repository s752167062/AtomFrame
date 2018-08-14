
cc.Class({
    extends: cc.Component,

    properties: {
       
    },

    onLoad () {
        this.score = 0;
        this.score_label = this.node.getChildByName("textScore")
    },

    start () {
        cc.Atom.eventMgr.listen("onAddScore", (obj,data)=>{ this.onAddScore(data)     }, this) 
    },

    onDestroy(){
        cc.Atom.eventMgr.unListenByObj(this)
    },

    onAddScore(data){
        this.score += data;
        this.score_label.string = "SCORE : " + this.score;
    },
    // update (dt) {},

    onPause(){
        cc.Atom.eventMgr.notify("onPause",true)
    },

    onMusic(){
        var isMusicOn = cc.Atom.gameDataMgr.getData("isMusicOn")
        var isEffectOn = cc.Atom.gameDataMgr.getData("isEffectOn")

        cc.Atom.gameDataMgr.getData("isMusicOn",  !(isMusicOn || isEffectOn))
        cc.Atom.gameDataMgr.getData("isEffectOn", !(isMusicOn || isEffectOn))
    }


});
