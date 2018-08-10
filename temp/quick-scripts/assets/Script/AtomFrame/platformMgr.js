(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/Script/AtomFrame/platformMgr.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, '4e114Osu1JAqYb04qeaafFz', 'platformMgr', __filename);
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
        }
        if (CC_EDITOR) {
            __define(__module.exports, __require, __module);
        }
        else {
            cc.registerModuleFunc(__filename, function () {
                __define(__module.exports, __require, __module);
            });
        }
        })();
        //# sourceMappingURL=platformMgr.js.map
        