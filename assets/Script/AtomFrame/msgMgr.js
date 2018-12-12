
cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "msgMgr",
        TOAST_LONG: 4,
        TOAST_SHORT: 2,
    },

    ctor: function () {
        console.log("-new:" + this.TAG);
        this.msgBuff = {}
        this.msgBuff[""] = "";

        this.loadMsgFile();
    },

    onLoad: function () {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function () {
        console.log("-destory:" + this.TAG);
    },

    //显示toast
    showToast: function (msg, interval) {
        
    },

    //显示弹窗
    showAlert: function (msg, btnTitle ,callback) {
        
    },

    //显示有选项的弹窗
    showSelectAlert: function (msg, leftBtnTitle, leftCallback , rightBtnTitle , rightCallback) {
        
    },

    //显示等待提示框
    showLoading: function (msg) {
        
    },

    //隐藏等待提示框
    hidLoading: function () {
        
    },

    //加载所有的文本内容
    loadMsgFile: function(){
        var url = cc.url.raw("resources/Message.json");
        cc.loader.loadRes("Message", (err, data)=>{
            if (err) {
                cc.error(err.message || err);
                return;
            }
            //这里需要有个回调判断资源表是否解析完成
            console.log(">>>> Message data :" + JSON.stringify(data))
            for(key in data){
                if(data[key]){
                    this.msgBuff[key] = data[key];
                }   
            }
        });
    },
});
