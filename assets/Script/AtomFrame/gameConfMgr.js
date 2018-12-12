/**
    -存储一些全局的游戏配置，如玩家初始速度、游戏初始音量等
    -扩展的配置表数据
    -运行过程中需要新增字段永久存储使用的数据段。 (运行数据内存存储用 gameDataMgr)

    1. infobuff 数据表
    2. storageKeyBuff 存储数据的键表
    3. exstorageKeyBuff 扩展的存储数据键表
*/
cc.Class({
    extends: cc.Component,

    properties: {
        TAG : "gameConfMgr",
        EX_KEY : "exStorage_keys",
        CONF_FILE : "GameConf",
    },

    ctor:function() {
        console.log("-new:" + this.TAG);
        //1需要做存储的key表
        this.storageKeyBuff = {};
        //2扩展的存储数据键表
        this.ex_storageKeyBuff = {};
        //3游戏配置 基础的常量配置 + 1 + 2 
        this.infoBuff = {};  

        this.infoBuff["version"] = "0.0.0";
        this.infoBuff["musicVolume"] = 0.2;
        this.infoBuff["effectVolume"]= 0.2;

        //JJGame的游戏配置
        this.infoBuff["gameUpdateInterval"] = 1 ;
        this.infoBuff["gameSpeed"] = 1;
        this.infoBuff["gameUpdateMove"] = 240; //一秒移动60个像素单位
        this.infoBuff["saveStart"] = 5; //安全起步
        this.infoBuff["maxSteps"] = 170;
        this.infoBuff["indexOffset"] = 10;
        this.infoBuff["brickNum"]  = 9;  //一开始居中。每行的块数是基数
        this.infoBuff["hitOffset"] = 15; //碰撞偏移
        this.infoBuff["turnSpeed"] = 0.1;//变向时间

        this.infoBuff["energyDeplete"] = 5;//每秒的消耗
        this.infoBuff["energyFull"] = 100; //上限
        this.infoBuff["buffEnergy"] = 50;  //油罐多少油

        this.infoBuff["readyCount"] = 2; //准备计时

        this.infoBuff["jumpTime"] = 0.2
        this.infoBuff["jumpFixTime"] = 0.1 
        this.infoBuff["jumpInterval"]  = 0.4
        //枚举
        //砖块类型
        const bricks = cc.Enum({
            BASE : 100,
            TRAP : 101,
            BUFF : 102,
            WALL : 103,
        });
        this.BRICKS = bricks;

        const over = cc.Enum({
            NO_ENERGY:200,
            HIT:201,
        });
        this.OVER = over;

        //读取本地配置文件
        this.readConfFile()
        //加载所有本地数据
        this.loadAllData();
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

    getInfo: function (_key , _default) {
        var _value = this.infoBuff[_key]
        return _value != null ? _value : _default;
    },

    //添加存储配置
    addStorageKey:function (key){
        if(!this.storageKeyBuff[key]){
            this.storageKeyBuff[key] = {}; //预留扩展用
        }
    },
    //添加扩展存储配置
    addExStorageKey:function (key){
        if(!this.ex_storageKeyBuff[key]){
            this.ex_storageKeyBuff[key] = {}; //预留扩展用
        }
    },
    
    //保存所有数据
    storageAllLocalData:function (){
        //默认需要存储的键
        for( key in this.storageKeyBuff){
            if (this.infoBuff[key]) {
                this.storageLocalData(key , this.infoBuff[key]);
            }
        }

        //扩展需要存储的键
        for( key in this.ex_storageKeyBuff){
            if (this.infoBuff[key]){
                this.storageLocalData(key , this.infoBuff[key]);
            }
        }

        //存储扩展键
        cc.sys.localStorage.setItem(this.EX_KEY, JSON.stringify(this.ex_storageKeyBuff))
    },

    //对数据进行存储
    storageLocalData: function (key, data) {
        if (key == null || data == null) {
            console.log(" ------ 存储的key/数据不能空");
            return;
        }
        if (data instanceof Object) {
            cc.sys.localStorage.setItem(key, JSON.stringify(data)); // object 对象转json存储
        } else {
            cc.sys.localStorage.setItem(key, data);
        }

        if(this.infoBuff[key]){
            //是默认要存储的
        }else{
            //新增的扩展
            this.addExStorageKey(key);
        }
    },

    //获取本地数据
    getLocalData: function (key) {
        var data = cc.sys.localStorage.getItem(key);
        var objdata = JSON.parse(data);
        return objdata ? objdata : data;
    },

    //读取所有本地保存的数据 添加、修改到info中
    loadAllData:function(){
        var ex_keys = this.getLocalData(this.EX_KEY);
        if(ex_keys){
            this.ex_storageKeyBuff = ex_keys;
        }

        //默认存储配置
        for(key in this.storageKeyBuff){
            const item = this.getLocalData(key);
            if(item){
                this.infoBuff[key] = item;
            }else{
                cc.alog(" LOG >>>>> 无存储的内容 " + key);
            }
        }

        //扩展存储配置
        for( key in this.ex_storageKeyBuff){
            const item = this.getLocalData(key)
            if(item){
                this.infoBuff[key] = item;
            }else{
                cc.alog(" LOG >>>>> 无 EX 存储的内容 " + key);
            }
        }

    },

    //删除本地化存储
    removeLocalData: function (key) {
        cc.sys.localStorage.removeItem(key);
    },

    //删除所有本地化存储的数据
    removeAllData: function (){
        //默认存储配置
        for(key in this.storageKeyBuff){
            this.removeLocalData(key);
        }

        //扩展存储配置
        for( key in this.ex_storageKeyBuff){
            this.removeLocalData(key);
        }

        //
        this.removeLocalData(this.EX_KEY);
    },

    //通过obj添加设置配置
    addInfoByObj:function (obj){
        for( key in obj){
            if (this.infoBuff[key]){
                cc.alog(" Warning >>>>> 存在重复的 gameConfMgr key :" + key + " 修改内容 " + this.infoBuff[key] + " to " + obj[key]);
            }

            this.infoBuff[key] = obj[key];
        }
    },

    //读取本地配置表文件
    readConfFile:function(){
        var url = cc.url.raw("resources/GameConf.json");
        cc.loader.loadRes("GameConf", (err, data)=>{
            if (err) {
                cc.error(err.message || err);
                return;
            }
            //这里需要有个回调判断资源表是否解析完成
            console.log(">>>> GameConf data :" + JSON.stringify(data))
            for (var i = 0; i < data.length; i++) {
                var item = data[i]
                if(item.save){
                    this.addStorageKey(item.key);
                }

                this.infoBuff[item.key] = item.value;
            }
        });
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