
cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "platformMgr",
    },

    ctor: function () {
        console.log("-new:" + this.TAG);
    },

    onLoad: function () {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function () {
        console.log("-destory:" + this.TAG);
    },

    checkNativeMethod: function(){

    }
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
