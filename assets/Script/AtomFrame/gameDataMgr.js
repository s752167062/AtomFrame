
cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "gameDataMgr",
    },

    ctor: function () {
        console.log("-new:" + this.TAG);
        this.dataBuff = {};
    },

    onLoad: function () {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function () {
        console.log("-destory:" + this.TAG);
    },

    setData: function (_key, _value) {
        this.dataBuff[_key] = _value;
    },

    getData: function (_key) {
        return this.dataBuff[_key];
    },

});
