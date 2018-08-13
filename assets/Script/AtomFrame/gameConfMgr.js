
cc.Class({
    extends: cc.Component,

    properties: {
        TAG : "gameConfMgr",
    },

    ctor:function() {
        console.log("-new:" + this.TAG);

        //游戏基础配置
        this.infoBuff = {};
        this.infoBuff["version"] = "0.0.0";
        this.infoBuff["musicVolume"] = 0.2;
        this.infoBuff["effectVolume"]= 0.2;

        //JJGame的游戏配置
        this.infoBuff["gameUpdateInterval"] = 1 ;
        this.infoBuff["gameSpeed"] = 1;
        this.infoBuff["maxSteps"] = 100;
        this.infoBuff["indexOffset"] = 10;
        this.infoBuff["brickNum"] = 10;
    },

    //初始化存储的数据
    init: function () {
        
    },

    onLoad:function () {
        console.log("-load:" + this.TAG);
    },

    onDestroy:function () {
        console.log("-destory:" + this.TAG);
    },

    setInfo: function (_key, _value) {
        this.infoBuff[_key] = _value;        
    },

    getInfo: function (_key) {
        return this.infoBuff[_key];
    },

    //对数据进行存储
    storageLocalData: function (key, data) {
        if (key == null || data == null) {
            console.log(" ------ 存储的key/数据不能空")
            return
        }
        if (data instanceof Object) {
            cc.sys.localStorage.setItem(key, JSON.stringify(data)); // object 对象转json存储
        } else {
            cc.sys.localStorage.setItem(key, data)
        }
    },

    getLocalData: function (key) {
        var data = cc.sys.localStorage.getItem(key)
        var objdata = JSON.parse(data)
        return objdata ? objdata : data;
    },

    removeLocalData: function (key) {
        cc.sys.localStorage.removeItem(key)
    },


    

});



    // infoBuff: [],
    // this.infoBuff.push({ key: "version"     , value: "1.0.0" });
    // this.infoBuff.push({ key: "musicVaule"  , value: 0.5 });
    // this.infoBuff.push({ key: "effectVaulr" , value: 0.5 });
    // this.infoBuff.push({ key: "code"        , value: "ASUCUWHUWUWU" });
    // this.infoBuff.push({ key: "md5key"      , value: "1245SSSSW" });
    // setInfo:function(_key , _value) {
    //     this.infoBuff.forEach(function(element) {
    //         if (element.key == _key){
    //             element.vaule = _value;
    //             return ;   
    //         }
    //     }, this);

    //     console.log("add conf : key:" + _key  +"  value: " + _value )
    //     var item = { key: _key, value: _value};
    //     this.infoBuff.push(item);
    // },

    // getInfo:function(_key){
    //     var result = null;
    //     this.infoBuff.forEach(function(element) {
    //         if (element.key == _key) {//element.key.localeCompare(_key) == 0
    //             result =  element.value;
    //             return;    
    //         }
    //     }, this);
    //     console.log(" element velue  " + result);
    //     return result;
    // },