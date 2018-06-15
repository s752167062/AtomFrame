cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "spriteMgr",
    },

    ctor: function () {
        console.log("-new:" + this.TAG);
        this.altasBuff = {};
        this.spriteBuff = {};
    },

    onLoad: function () {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function () {
        console.log("-destory:" + this.TAG);
    },

    //加载网络图片
    loadSpriteWithUrl: function ( remoteUrl, callback){
        if (remoteUrl != null){
            const callfunc = function (err , texture) {
                if(err){
                    console.log(err.message || err, remoteUrl);
                    callback ? callback(null, err) :null;
                    return ;
                }
                if(texture instanceof cc.Texture2D){
                    console.log("create spriteframe--");
                    var sprite = new cc.SpriteFrame();
                    sprite.setTexture(texture);
                    callback ? callback(sprite) :null ;
                }else{
                    callback ? callback(null,"not a texture!") :null;
                }

            }
            //
            if (remoteUrl.match(".png") == null){
                cc.loader.load({ url: remoteUrl , type:"png" },callfunc);
            }else{
                cc.loader.load( remoteUrl , callfunc);
            }
        }
    },

    addSpriteFrame:function (key, obj) {
        if (key == null || !obj instanceof cc.SpriteFrame){
            console.log(" -------- 类型异常 ", key)
            return 
        }
        this.spriteBuff[key] = obj;
    },

    addSpriteAtlas: function (key, obj) {
        if (key == null || !obj instanceof cc.SpriteAtlas) {
            console.log(" -------- 类型异常 ", key)
            return
        }
        this.altasBuff[key] = obj;
    },

    cleanSpriteFrame:function (key) {
        this.spriteBuff[key] = null;
    },

    cleanSpriteAtlas: function (key) {
        this.altasBuff[key] = null;
    },

    getSpriteFrame:function (key) {
        if(key == null){
            console.log(" ------  key 不能为空", key)
            return 
        }
        return this.spriteBuff[key];
    },

    getAtlasSpriteFrame: function (altas , key) {
        if (altas ==null || key == null) {
            console.log(" ------ altas key 不能为空", altas, key)
            return 
        }
        if (this.altasBuff[altas]){
            return this.altasBuff[altas].getSpriteFrame(key);
        }
    },

    createSprite: function (key) {
        if(key ==null){
            console.log(" ------ 空的key");
            return 
        }
        var spriteframe = this.spriteBuff[key];
        if(spriteframe){
            var node = new cc.Node();
            var sprite = node.addComponent(cc.Sprite);
            sprite.spriteFrame = spriteframe;
            return node;
        }
    },

    createSprite: function (altas, key) {
        if (altas ==null || key == null) {
            console.log(" ------ 空的altas ,key", altas, key)
            return
        }
        var spriteframe = this.altasBuff[altas].getSpriteFrame(key);
        if (spriteframe) {
            var node = new cc.Node();
            var sprite = node.addComponent(cc.Sprite);
            sprite.spriteFrame = spriteframe;
            return node;
        }
    }



});