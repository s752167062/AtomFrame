"use strict";
cc._RF.push(module, 'c0ef5/1i+BDor8v+Leko1Lm', 'Login');
// Script/GameTownScript/login/Login.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "Login"
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
        console.log("-onLoad" + this.TAG);
    },

    start: function start() {
        console.log("-start" + this.TAG);
    },

    onDestory: function onDestory() {
        console.log("-onDestory" + this.TAG);
    },
    // update (dt) {},

    onBtnLogin: function onBtnLogin() {
        console.log("-Login");
        cc.director.loadScene("Scene/GameTown/lobby");
    }
});

cc._RF.pop();