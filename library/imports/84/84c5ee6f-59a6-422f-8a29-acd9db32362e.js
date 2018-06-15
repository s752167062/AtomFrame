"use strict";
cc._RF.push(module, '84c5e5vWaZCL4oprNnbMjYu', 'spriteMgr');
// Script/AtomFrame/spriteMgr.js

"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

cc.Class(_defineProperty({
    extends: cc.Component,

    properties: {
        TAG: "spriteMgr"
    },

    ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.altasBuff = {};
        this.spriteBuff = {};
    },

    onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
    },

    //加载网络图片
    loadSpriteWithUrl: function loadSpriteWithUrl(remoteUrl, callback) {
        if (remoteUrl != null) {
            var callfunc = function callfunc(err, texture) {
                if (err) {
                    console.log(err.message || err, remoteUrl);
                    callback ? callback(null, err) : null;
                    return;
                }
                if (texture instanceof cc.Texture2D) {
                    console.log("create spriteframe--");
                    var sprite = new cc.SpriteFrame();
                    sprite.setTexture(texture);
                    callback ? callback(sprite) : null;
                } else {
                    callback ? callback(null, "not a texture!") : null;
                }
            };
            //
            if (remoteUrl.match(".png") == null) {
                cc.loader.load({ url: remoteUrl, type: "png" }, callfunc);
            } else {
                cc.loader.load(remoteUrl, callfunc);
            }
        }
    },

    addSpriteFrame: function addSpriteFrame(key, obj) {
        if (key == null || !obj instanceof cc.SpriteFrame) {
            console.log(" -------- 类型异常 ", key);
            return;
        }
        this.spriteBuff[key] = obj;
    },

    addSpriteAtlas: function addSpriteAtlas(key, obj) {
        if (key == null || !obj instanceof cc.SpriteAtlas) {
            console.log(" -------- 类型异常 ", key);
            return;
        }
        this.altasBuff[key] = obj;
    },

    cleanSpriteFrame: function cleanSpriteFrame(key) {
        this.spriteBuff[key] = null;
    },

    cleanSpriteAtlas: function cleanSpriteAtlas(key) {
        this.altasBuff[key] = null;
    },

    getSpriteFrame: function getSpriteFrame(key) {
        if (key == null) {
            console.log(" ------  key 不能为空", key);
            return;
        }
        return this.spriteBuff[key];
    },

    getAtlasSpriteFrame: function getAtlasSpriteFrame(altas, key) {
        if (altas == null || key == null) {
            console.log(" ------ altas key 不能为空", altas, key);
            return;
        }
        if (this.altasBuff[altas]) {
            return this.altasBuff[altas].getSpriteFrame(key);
        }
    },

    createSprite: function createSprite(key) {
        if (key == null) {
            console.log(" ------ 空的key");
            return;
        }
        var spriteframe = this.spriteBuff[key];
        if (spriteframe) {
            var node = new cc.Node();
            var sprite = node.addComponent(cc.Sprite);
            sprite.spriteFrame = spriteframe;
            return node;
        }
    }

}, "createSprite", function createSprite(altas, key) {
    if (altas == null || key == null) {
        console.log(" ------ 空的altas ,key", altas, key);
        return;
    }
    var spriteframe = this.altasBuff[altas].getSpriteFrame(key);
    if (spriteframe) {
        var node = new cc.Node();
        var sprite = node.addComponent(cc.Sprite);
        sprite.spriteFrame = spriteframe;
        return node;
    }
}));

cc._RF.pop();