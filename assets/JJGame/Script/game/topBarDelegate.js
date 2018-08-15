
cc.Class({
    extends: cc.Component,

    properties: {
       // score_label:{
       //      default:null,
       //      type:cc.Node,
       //  },
    },

    onLoad () {
        this.score = 0;
        this._label = this.node.getChildByName("textScore");
        this.score_label = this._label.getComponent(cc.Label);

        this._bar = this.node.getChildByName("energt_bar");
        this.energt_bar = this._bar.getComponent(cc.ProgressBar)

        cc.Atom.gameDataMgr.setData("mEnergy" , 100)
        cc.Atom.gameDataMgr.getData("mEnergy")

        this.energyDeplete = cc.Atom.gameConfMgr.getInfo("energyDeplete")
        this.energyFull    = cc.Atom.gameConfMgr.getInfo("energyFull")
        this.mEnergy       = this.energyFull
    },

    start () {
        cc.Atom.eventMgr.listen("onAddScore"   , (obj,data)=>{ this.onAddScore(data)     }, this) 
        cc.Atom.eventMgr.listen("onBuffEnergy" , (obj,data)=>{ this.onBuffEnergy()       }, this)
    },

    onDestroy(){
        cc.Atom.eventMgr.unListenByObj(this)
    },

    onAddScore(data){
        console.log(">>>>>>>> onAddScore" + data)
        this.score += Math.ceil(data);
        this.score_label.string = "SCORE : " + this.score;
    },

    onBuffEnergy(){
        console.log(">>>>>>> onBuffEnergy")
        var energy = this.mEnergy + cc.Atom.gameConfMgr.getInfo("buffEnergy")
        this.mEnergy = Math.min(energy , this.energyFull)
    },
    
    mUpdate (dt) {
        var deplete = this.energyDeplete * dt
        this.mEnergy -= deplete;
        if(this.mEnergy <=0 ){
            cc.Atom.eventMgr.notify("onGameOver",{ _type: "noEnergy"})
            return;
        }
        console.log(">>>> mEnergy %d" , this.mEnergy/this.energyFull)
        this.energt_bar.progress = this.mEnergy/this.energyFull
    },

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
