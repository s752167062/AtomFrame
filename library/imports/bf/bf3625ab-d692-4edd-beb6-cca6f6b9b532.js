"use strict";
cc._RF.push(module, 'bf362Wr1pJO3b62zKb2ubUy', 'effectMgr');
// Script/AtomFrame/effectMgr.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "effectMgr"
    },

    ctor: function ctor() {
        console.log("-new:" + this.TAG);
    },

    onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
    }

});

cc._RF.pop();