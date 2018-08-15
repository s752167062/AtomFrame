"use strict";
cc._RF.push(module, 'a5f47AiDKRGTI+vfG1km/Pl', 'topBarDelegate');
// JJGame/Script/game/topBarDelegate.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        // score_label:{
        //      default:null,
        //      type:cc.Node,
        //  },
    },

    onLoad: function onLoad() {
        this.score = 0;
        this._label = this.node.getChildByName("textScore");
        this.score_label = this._label.getComponent(cc.Label);

        this._bar = this.node.getChildByName("energt_bar");
        this.energt_bar = this._bar.getComponent(cc.ProgressBar);

        cc.Atom.gameDataMgr.setData("mEnergy", 100);
        cc.Atom.gameDataMgr.getData("mEnergy");

        this.energyDeplete = cc.Atom.gameConfMgr.getInfo("energyDeplete");
        this.energyFull = cc.Atom.gameConfMgr.getInfo("energyFull");
        this.mEnergy = this.energyFull;
    },
    start: function start() {
        var _this = this;

        cc.Atom.eventMgr.listen("onAddScore", function (obj, data) {
            _this.onAddScore(data);
        }, this);
        cc.Atom.eventMgr.listen("onBuffEnergy", function (obj, data) {
            _this.onBuffEnergy();
        }, this);
    },
    onDestroy: function onDestroy() {
        cc.Atom.eventMgr.unListenByObj(this);
    },
    onAddScore: function onAddScore(data) {
        console.log(">>>>>>>> onAddScore" + data);
        this.score += Math.ceil(data);
        this.score_label.string = "SCORE : " + this.score;
    },
    onBuffEnergy: function onBuffEnergy() {
        console.log(">>>>>>> onBuffEnergy");
        var energy = this.mEnergy + cc.Atom.gameConfMgr.getInfo("buffEnergy");
        this.mEnergy = Math.min(energy, this.energyFull);
    },
    mUpdate: function mUpdate(dt) {
        var deplete = this.energyDeplete * dt;
        this.mEnergy -= deplete;
        if (this.mEnergy <= 0) {
            cc.Atom.eventMgr.notify("onGameOver", { _type: "noEnergy" });
            return;
        }
        console.log(">>>> mEnergy %d", this.mEnergy / this.energyFull);
        this.energt_bar.progress = this.mEnergy / this.energyFull;
    },
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