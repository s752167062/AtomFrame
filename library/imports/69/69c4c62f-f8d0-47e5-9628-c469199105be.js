"use strict";
cc._RF.push(module, '69c4cYv+NBH5ZYoxGkZkQW+', 'UIMgr');
// Script/AtomFrame/UIMgr.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "UIMgr"
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