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
    },

    checkNativeMethod: function checkNativeMethod() {}
    //JAVA调用JS 在GL线程使用Cocos2dxJavascriptJavaBridge.evalString("") 为管理回调使用event事件回调
    //OC 调用JS
    // getPower: function(callback){
    //     if(cc.sys.os == cc.sys.OS_ANDROID){
    //         var o = jsb.reflection.callStaticMethod(className, methodName, methodSignature, parameters...)
    //     }else if(cc.sys.os == cc.sys.OS_IOS){
    //         var result = jsb.reflection.callStaticMethod(className, methodNmae, arg1, arg2, .....);
    //     }else{

    //     }
    // }

});

cc._RF.pop();