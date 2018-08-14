"use strict";
cc._RF.push(module, 'b3d3fUWRFtDEpaZLpUvEVQ8', 'uiLoader');
// JJGame/Script/common/uiLoader.js

"use strict";

//加载页面

cc.Class({
    extends: cc.Component,

    properties: {
        // logo_bg: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
    },

    // LIFE-CYCLE CALLBACKS:
    onLoad: function onLoad() {
        var _this = this;

        var logo_bg = this.node.getChildByName("logo_bg");
        var game_bg = this.node.getChildByName("game_bg");
        var press_bar = this.node.getChildByName("progressBar");

        if (cc.Atom == null) {
            //创建 Atom引擎
            console.log(">>> 创建 Atom引擎");
            var atom = require("AtomFrame/Atom");
            atom.createAtom();

            //初始logo状态
            cc.Atom.gameState.setGameInLogo();
        }

        this.press_bar = press_bar;
        var self = this;
        logo_bg.active = cc.Atom.gameState.isGameInLogo(); //
        game_bg.active = cc.Atom.gameState.isGameInRoom(); //

        //加载
        if (cc.Atom.gameState.isGameInLogo()) {
            cc.Atom.timerMgr.registerTask("logo2hall", cc.Atom.timerMgr.TASK_TYPE_ONE, function () {
                console.log(_this.desc, " ---- logo2Game");
                cc.Atom.gameState.setGameInHall();
                cc.director.loadScene("JJGame/Scene/JJHallMain");
            }, 2);
            return;
        }

        //大厅界面
        if (cc.Atom.gameState.isGameInHall()) {
            //正常这里要加载大厅相关的资源
            return;
        }

        //游戏场景
        if (cc.Atom.gameState.isGameInRoom()) {
            console.log(">>> uiloader load JJGameRes");
            cc.Atom.resMgr.loadResByKey("JJGameRes", function (index, total, err) {
                if (err != null || index == -1) {
                    console.log("=== 加载资源出现异常： ", err);
                    //need to fix ,do someting !
                    return;
                }
                console.log(" 资源加载进度 ： ", index, total);
                _this.press_bar.progress = index / total;
                if (index == total) {
                    console.log("=== 加载完成");
                    _this.node.removeFromParent();
                    cc.Atom.eventMgr.notify("onStartGame", null);
                }
            });
            return;
        }
    },
    start: function start() {},
    update: function update(dt) {}
});

cc._RF.pop();