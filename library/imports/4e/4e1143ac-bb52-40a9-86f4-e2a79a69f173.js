"use strict";
cc._RF.push(module, '4e114Osu1JAqYb04qeaafFz', 'platformMgr');
// Script/AtomFrame/platformMgr.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "platformMgr"
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