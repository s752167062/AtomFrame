"use strict";
cc._RF.push(module, '4eee41AqbNNAYdNqc5+Pvyk', 'JJHallMain');
// JJGame/Script/JJHallMain.js

"use strict";

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
    },

    onLoad: function onLoad() {
        var _this = this;

        cc.Atom.eventMgr.listen("onHallMain", function (obj, data) {
            _this.onHallMain();
        }, this);
    },
    start: function start() {},
    onDestroy: function onDestroy() {
        cc.Atom.eventMgr.unListenByObj(this);
    },


    // update (dt) {

    // },

    onHallMain: function onHallMain() {},


    //按钮事件
    onBtnStart: function onBtnStart() {
        console.log(this.desc, " ---- Hall2Game");
        cc.Atom.gameState.setGameInRoom();
        cc.director.loadScene("JJGame/Scene/JJGameMain");

        //release hall resource 
    },
    onBtnStore: function onBtnStore() {},
    onBtnAbout: function onBtnAbout() {},
    onBtnSet: function onBtnSet() {}
});

cc._RF.pop();