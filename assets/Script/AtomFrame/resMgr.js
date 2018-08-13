
cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "resMgr",
    },

        //resMgr 需要加载ani 、audio、 files 、 font、 image 、 particle 、 prefabs
        /*  资源结构 —— 用于针对场景进行加载 、释放
            {
                "Hello" :{
                    "ani1":{ "_type":"ani" , "_value":"ani/ani1"}
                },
                "common":{},
                "game"  :{},
            }
        */

    ctor: function () {
        console.log("-new:" + this.TAG);
        //加载资源配置
        var url = cc.url.raw("resources/RESJSON.json");
        cc.loader.loadRes("RESJSON", (err, data)=>{
            if (err) {
                cc.error(err.message || err);
                return;
            }

            this.resData = data;
            console.log(">>>> RESJSON :" + JSON.stringify(this.resData))
            //这里需要有个回调判断资源表是否解析完成
        });
    },

    onLoad: function () {
        console.log("-load:" + this.TAG);        
    },

    onDestroy: function () {
        console.log("-destory:" + this.TAG);
    },

    //通过key加载资源 
    //callfunc function : 进度回调
    //资源提示未找到文件的 查看文件路径 和 资源json配置的路径
    loadResByKey: function (key , callfunc) {
        console.log(">>>> RESJSON :" + JSON.stringify(this.resData))
        console.log(">>>> RESJSON :" + JSON.stringify(this.resData["json"][key]))
        //原本一开始是 this.resData[key] 为对象内容 --升级版本后发现cc.loader.loadRes 返回的数据结构被修改了
        if(key != null && this.resData["json"][key] != null){
            var total  = 0;
            var keyres = this.resData["json"][key]; 
            for (const _value in keyres) {
                if (keyres.hasOwnProperty(_value)) {
                    total ++ ;
                }
            }
            console.log("total res = ", total);
            //开始加载
            var num = 0
            for (const _index in keyres) {
                if (keyres.hasOwnProperty(_index)) {
                    const element = keyres[_index];
                    const _type  = element._type ;
                    const _resValue = element._value;
                    const callback = function (err, obj) {
                        if (err) {
                            console.log(err.message || err);
                            callfunc ?callfunc(-1, total, element._value): null;
                            return;
                        }
                        const _num = ++num;
                        //这里有两个注意点： 1 、 obj.getSpriteFrame("image-common2-lishizhanji") 这SpriteFrame的名字是 creator 加载plist后显示的名字 ， 并不单单一点是打图时的文件名
                        //                2 、 声明 var 、 const 的区别 ： 例如一开始 var _resValue 这么定义后在callback 中 _resValue 固定是第一个赋值内容，之后的赋值都没有效果  而 element._value 是每次都能重新拿到新的值的 。
                        if (obj instanceof cc.SpriteAtlas) {
                            console.log("--SpriteAtlas :", _resValue);
                            cc.Atom.spriteMgr.addSpriteAtlas(_index , obj)
                        
                        } else if (obj instanceof cc.AnimationClip) {
                            console.log("--AnimationClip :", _resValue);
                            cc.Atom.animateMgr.addAniClip(_index, obj);
                            //实际使用上 动画挂载在 prefab 上更加好处理
                        } else if (obj instanceof cc.Prefab) {
                            console.log("--Prefab :", _resValue);
                            cc.Atom.prefabMgr.addPrefabObj(_index, obj);
                        
                        } else if (obj instanceof cc.Texture2D) {
                            console.log("--Texture2D :", _resValue);
                            //在实际使用中 texture 需要进一步封装成 spriteframe 才能使用，若有散图直接使用 sprite 类型
                        
                        } else if (obj instanceof cc.SpriteFrame) {
                            console.log("--SpriteFrame :", _resValue);
                            cc.Atom.spriteMgr.addSpriteFrame(_index , obj)
                        
                        } else if (obj instanceof cc.AudioClip) {
                            console.log("--AudioClip :", _resValue);
                      
                        } else if (obj instanceof cc.ParticleAsset) {
                            console.log("--ParticleAsset :", _resValue);
                        
                        } else if (obj instanceof cc.Font) {
                            console.log("--Font :", _resValue);
                        
                        } else{
                            console.log("--Obj ", _resValue)
                        }

                        callfunc? callfunc(_num , total, null):null;
                    } 

                    //处理
                    if (_type == "plist"){
                        cc.loader.loadRes(key + "/" + _resValue, cc.SpriteAtlas, callback)
                    }else if(_type == "sprite"){
                        cc.loader.loadRes(key + "/" + _resValue, cc.SpriteFrame, callback)
                    }else{
                        cc.loader.loadRes(key + "/" + _resValue, callback)
                    } 
                }
            }

        }else{
            console.log("@@@@ 没有对应的资源 key: ", key);
        }
    },

    //通过key释放资源
    releasResByKey: function (key) {
        if (key != null && this.resData[key] != null) {
            var total = 0;
            var keyres = this.resData[key];
            for (const _value in keyres) {
                if (keyres.hasOwnProperty(_value)) {
                    total++;
                }
            }
            console.log("total res need release= ", total);
            //开始释放
            for (const _index in keyres) {
                if (keyres.hasOwnProperty(_index)) {
                    const element = keyres[_index];
                    const _type = element._type;
                    const _resValue = element._value;
                    
                    if (_type == "plist") {
                        cc.loader.releaseRes(key + "/" + _resValue, cc.SpriteAtlas);
                    } else if (_type == "sprite") {
                        cc.loader.releaseRes(key + "/" + _resValue, cc.SpriteFrame);
                    } else {
                        cc.loader.releaseRes(key + "/" + _resValue);
                    }

                    //清除 mgr保存的对象
                    if (_type == "ani") {
                        
                    } else if (_type == "audio"){
                        CC.Atom.animateMgr.cleanAniClip(_index)
                    } else if (_type == "font") {

                    } else if (_type == "texture") {

                    } else if (_type == "plist") {
                        cc.Atom.spriteMgr.cleanSpriteAtlas(_index)
                    } else if (_type == "sprite") {
                        cc.Atom.spriteMgr.cleanSpriteFrame(_index)
                    } else if (_type == "prefab") {

                    } else if (_type == "particle") {

                    }
                }
            }

        } else {
            console.log("@@@@ 没有对应的资源 key: ", key);
        }
    },

    //释放所有资源
    releasAllRes: function () {
        for (const key in this.resData) {
            if (this.resData.hasOwnProperty(key)) {
                this.releasResByKey(key);
            }
        }
    },

});
