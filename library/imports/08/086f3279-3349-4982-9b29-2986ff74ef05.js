"use strict";
cc._RF.push(module, '086f3J5M0lJgpspKYb/dO8F', 'msgMgr');
// Script/AtomFrame/msgMgr.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "msgMgr",
        TOAST_LONG: 4,
        TOAST_SHORT: 2
    },

    ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.msgBuff = {};
        this.msgBuff[""] = "";
    },

    onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
    },

    //显示toast
    showToast: function showToast(msg, interval) {},

    //显示弹窗
    showAlert: function showAlert(msg, btnTitle, callback) {},

    //显示有选项的弹窗
    showSelectAlert: function showSelectAlert(msg, leftBtnTitle, leftCallback, rightBtnTitle, rightCallback) {},

    //显示等待提示框
    showLoading: function showLoading(msg) {},

    //隐藏等待提示框
    hidLoading: function hidLoading() {}
});

cc._RF.pop();