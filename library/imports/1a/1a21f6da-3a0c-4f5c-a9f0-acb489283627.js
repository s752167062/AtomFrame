"use strict";
cc._RF.push(module, '1a21fbaOgxPXKnwrLSJKDYn', 'audioMgr');
// Script/AtomFrame/audioMgr.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "audioMgr"
    },

    ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.bgmAudioID = -1; //背景音乐ID
        this.soundSearchPath = "sounds/";
    },

    onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
    },

    //creator 的音频统一是用 cc.audioEngine ,
    setSoundSearchDir: function setSoundSearchDir(dirname) {
        this.soundSearchPath = dirname + "/";
    },

    getUrl: function getUrl(name) {
        var path = "resources/" + this.soundSearchPath + name;
        return cc.url.raw(path);
    },

    //音乐播放
    playMusic: function playMusic(audioName, callback) {
        if (this.bgmAudioID != -1) {
            cc.audioEngine.stop(this.bgmAudioID);
            console.log(" audio : stopMusic");
        }
        var musicVolume = cc.Atom.gameConfMgr.getInfo("musicVolume");
        var _path = this.getUrl(audioName);
        console.log(" audio : ", _path, musicVolume);
        this.bgmAudioID = cc.audioEngine.play(_path, true, musicVolume);
        if (callback) {
            cc.audioEngine.setFinishCallback(this.bgmAudioID, callback);
        }
    },
    //音效的播放
    playEffect: function playEffect(audioName, callback) {
        var effectVolume = cc.Atom.gameConfMgr.getInfo("effectVolume");
        var _path = this.getUrl(audioName);
        console.log(" audio : ", _path, effectVolume);
        var effectid = cc.audioEngine.play(_path, false, effectVolume);
        if (callback) {
            cc.audioEngine.setFinishCallback(this.bgmAudioID, callback);
        }
    },

    setMusicVolume: function setMusicVolume(volume) {
        console.log(" music volume :", volume);
        var musicVolume = cc.Atom.gameConfMgr.getInfo("musicVolume");
        if (musicVolume == volume) {
            return;
        }

        cc.Atom.gameConfMgr.setInfo("musicVolume", volume);
        // if(this.bgmAudioID > 0){
        //     cc.audioEngine.pause(this.bgmAudioID)
        // }

        cc.audioEngine.setVolume(this.bgmAudioID, volume);
        // cc.audioEngine.resume(this.bgmAudioID , volume);
    },

    setEffectVolume: function setEffectVolume(volume) {
        console.log(" effect volume :", volume);
        cc.Atom.gameConfMgr.setInfo("effectVolume", volume);
    },

    //操作某一个音频的 看API
    pauseAll: function pauseAll() {
        cc.audioEngine.pauseAll();
    },

    resumeAll: function resumeAll() {
        cc.audioEngine.resumeAll();
    },

    stopAll: function stopAll() {
        cc.audioEngine.stopAll();
    },

    unCacheAll: function unCacheAll() {
        cc.audioEngine.uncacheAll();
    },

    preload: function preload(path, callback) {
        var call = callback ? callback : function () {
            console.log(" ---- preload call !");
        };
        cc.audioEngine.preload(path, call);
    },

    //音频实例上线
    setMaxAudioInstance: function setMaxAudioInstance(size) {
        cc.audioEngine.setMaxAudioInstance(size);
    },

    //大于 X KB 的音频在加载的时候会强制使用 dom 方式加载
    setMaxWebAudioSize: function setMaxWebAudioSize(size) {
        cc.audioEngine.setMaxWebAudioSize(size);
    }

});

cc._RF.pop();