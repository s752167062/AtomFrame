"use strict";
cc._RF.push(module, '070a7IN9YFNF60eU/Dl4jjv', 'BrickDelegate');
// JJGame/Script/BrickDelegate.js

"use strict";

//砖块代理
cc.Class({
    extends: cc.Component,

    properties: {
        brickData: null
    },

    onLoad: function onLoad() {},
    start: function start() {},
    update: function update(dt) {},
    getBrickData: function getBrickData() {
        return this.brickData;
    },
    setBrickData: function setBrickData(value) {
        this.brickData = value;
    }
});

cc._RF.pop();