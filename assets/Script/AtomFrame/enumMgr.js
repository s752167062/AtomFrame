/**
    管理所有的枚举对象
    枚举对象配置在 Enum.json 文件中
*/
cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "enumMgr",
    },

    ctor: function () {
        console.log("-new:" + this.TAG);
        this.loadAllEnums();
    },

    onLoad: function () {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function () {
        console.log("-destory:" + this.TAG);
    },

    loadAllEnums: function(){
        var url = cc.url.raw("resources/Enum.json");
        cc.loader.loadRes("Enum", (err, data)=>{
            if (err) {
                cc.error(err.message || err);
                return;
            }
            //这里需要有个回调判断资源表是否解析完成
            console.log(">>>> Enum data :" + JSON.stringify(data))
            for (var i = 0; i < data.length; i++) {
                var item = data[i]
                if(item){
                    this[item.key] = cc.Enum(item.value)
                }
            }
        });
    },

});
