"use strict";
cc._RF.push(module, '8eabfKht7BPfLTFiN0wWOap', 'gameDataMgr');
// Script/AtomFrame/gameDataMgr.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "gameDataMgr"
    },

    ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.dataBuff = {};
    },

    onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
    },

    setData: function setData(_key, _value) {
        this.dataBuff[_key] = _value;
    },

    getData: function getData(_key) {
        return this.dataBuff[_key];
    }

});

cc._RF.pop();