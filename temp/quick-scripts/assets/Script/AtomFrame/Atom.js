(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/Script/AtomFrame/Atom.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, '1820dFmZhJKNadR5MeGariK', 'Atom', __filename);
// Script/AtomFrame/Atom.js

"use strict";

var Atom = {
    createAtom: function createAtom() {
        console.log("!---- AtomFrame ----!");
        cc.Atom = {};

        // //计时器 timer
        var timerMgr = require("AtomFrame/timerMgr");
        cc.Atom.timerMgr = new timerMgr();

        // md5
        var md5 = require("AtomFrame/md5");
        cc.Atom.md5 = new md5();

        //状态机 gamestate
        var gameState = require("AtomFrame/gameState");
        cc.Atom.gameState = new gameState();

        //游戏配置单例
        var gameConfMgr = require("AtomFrame/gameConfMgr");
        cc.Atom.gameConfMgr = new gameConfMgr();

        //事件管理器 event
        var eventMgr = require("AtomFrame/eventMgr");
        cc.Atom.eventMgr = new eventMgr();

        //文本信息数据 msgmgr
        var msgMgr = require("AtomFrame/msgMgr");
        cc.Atom.msgMgr = new msgMgr();

        //文件管理
        // var fileMgr = require("AtomFrame/fileMgr");
        // cc.Atom.fileMgr = new fileMgr();

        //sprite管理 
        var spriteMgr = require("AtomFrame/spriteMgr");
        cc.Atom.spriteMgr = new spriteMgr();

        //音频管理 audio
        var audioMgr = require("AtomFrame/audioMgr");
        cc.Atom.audioMgr = new audioMgr();

        //预设管理器 prefab管理器mgr
        var prefabMgr = require("AtomFrame/prefabMgr");
        cc.Atom.prefabMgr = new prefabMgr();

        //特效 effect 
        var effectMgr = require("AtomFrame/effectMgr");
        cc.Atom.effectMgr = new effectMgr();

        //动画 ani
        var animateMgr = require("AtomFrame/animateMgr");
        cc.Atom.animateMgr = new animateMgr();

        //resource 统一管理资源 audioMgr、  prefabMgr 、effectMgr 、animateMgr
        var resMgr = require("AtomFrame/resMgr");
        cc.Atom.resMgr = new resMgr();

        //UI管理器 uimgr
        var UIMgr = require("AtomFrame/UIMgr");
        cc.Atom.UIMgr = new UIMgr();

        //公共工具函数 comfun
        var comFunMgr = require("AtomFrame/comFunMgr");
        cc.Atom.comFunMgr = new comFunMgr();

        //游戏数据 gameData
        var gameDataMgr = require("AtomFrame/gameDataMgr");
        cc.Atom.gameDataMgr = new gameDataMgr();

        //平台接口管理 platform
        // var platformMgr = require("AtomFrame/platformMgr");
        // cc.Atom.platformMgr = new platformMgr();

        //网络管理 net
        var gameNetMgr = require("AtomFrame/gameNetMgr");
        cc.Atom.gameNetMgr = new gameNetMgr();

        //socekt
        var socketMgr = require("AtomFrame/socketMgr");
        cc.Atom.socketMgr = new socketMgr();

        //热更新 hotupdate
        var hotUpdateMgr = require("AtomFrame/hotUpdateMgr");
        cc.Atom.hotUpdateMgr = new hotUpdateMgr();

        //内存探测器
        // var memory = require("AtomFrame/memoryDetector");
        // cc.Atom.memory = new memory();

        ///以下补充游戏内容相关的对象///
    }
};

module.exports = Atom;

cc._RF.pop();
        }
        if (CC_EDITOR) {
            __define(__module.exports, __require, __module);
        }
        else {
            cc.registerModuleFunc(__filename, function () {
                __define(__module.exports, __require, __module);
            });
        }
        })();
        //# sourceMappingURL=Atom.js.map
        