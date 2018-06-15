"use strict";
cc._RF.push(module, '1e384rk/1NNPriDsn0Y9JpK', 'gameScene');
// Script/gameScene.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {},

    // LIFE-CYCLE CALLBACKS:
    onLoad: function onLoad() {
        console.log("gameConfMgr version", cc.Atom.gameConfMgr.getInfo("version"));
        console.log("gameConfMgr gamemode", cc.Atom.gameConfMgr.getInfo("gamemode"));

        var node = cc.Atom.spriteMgr.createSprite("common2", "image-common2-zhunbeizhong");
        node.setPosition(100, 100);
        node.parent = this.node; // this.node 可以简写为 this

        cc.Atom.audioMgr.setSoundSearchDir("common/audio");
    },

    //按钮事件监听
    obBtnOpenHelloWorld: function obBtnOpenHelloWorld() {
        cc.director.loadScene("Scene/helloworld");
    },

    //
    onPlayMusic: function onPlayMusic() {
        cc.Atom.audioMgr.playMusic("loginMusic.mp3");
    },
    onPlayEffect: function onPlayEffect() {
        cc.Atom.audioMgr.playEffect("1gang.mp3");
    },
    onStopAll: function onStopAll() {
        cc.Atom.audioMgr.stopAll();
    },
    onSetVolumeEffect: function onSetVolumeEffect() {
        cc.Atom.audioMgr.setEffectVolume(1);
    },
    onSetVolumeMusic: function onSetVolumeMusic() {
        cc.Atom.audioMgr.setMusicVolume(1);
    },

    onWriteFile: function onWriteFile() {
        cc.Atom.fileMgr.write2File("/Users/yajing/Desktop/websocket_node/##########kfile", "/Users/yajing/Desktop/websocket_node/kfile.txt");
    },
    onReadFile: function onReadFile() {
        cc.Atom.fileMgr.readFile("/Users/yajing/Desktop/websocket_node/kfile.txt", function (data) {
            console.log(" -- 这是读取出来的文件内容： ", data);
        });

        cc.Atom.fileMgr.readFile("/Users/yajing/Desktop/websocket_node/world.txt", function (data) {
            console.log(" -- 这是读取出来的文件内容world： ", data);
        });
    },
    onWriteObjFile: function onWriteObjFile() {
        cc.Atom.fileMgr.write2File({ "hello": "world" }, "/Users/yajing/Desktop/websocket_node/world.txt");
    },

    onMd5Str: function onMd5Str() {
        console.log(cc.Atom.md5.md5Str("cocos_creator"));
        console.log(cc.Atom.md5.md5Str("cocos_creator_hello"));
    },

    onFileMd5: function onFileMd5() {
        console.log(cc.Atom.md5.md5File("/Users/yajing/Desktop/websocket_node/world.txt"));
    }
});

cc._RF.pop();