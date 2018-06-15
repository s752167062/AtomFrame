(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/Script/btnController.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, '571cdSsfXdEkoyrfZjAyVZ2', 'btnController', __filename);
// Script/btnController.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        spNode: {
            default: null,
            type: cc.Prefab
        },
        desc: "this is btnController"
    },

    // LIFE-CYCLE CALLBACKS:
    onLoad: function onLoad() {
        var _this = this;

        console.log("LOAD --- ", this.desc);
        cc.Atom.eventMgr.listen("_onHW1", function (obj, data) {
            console.log("########### _onHW1 ", _this.desc, data);
        }, this);

        cc.Atom.eventMgr.listen("_onHW2", function (obj, data) {
            console.log("########### _onHW2 ", _this.desc, data);
        }, this);

        //加载预设资源
        cc.Atom.prefabMgr.loadAllPrefab([{ key: "spNode", path: "prefabs/spNode" }], function (index) {
            console.log(index, "loadfinish");
        });
    },

    //按钮监听事件
    onBtnHttpGet: function onBtnHttpGet() {
        cc.Atom.gameNetMgr.httpGet("http://www.baidu.com", function (_bool, _respone, _status) {
            if (_bool == true) {
                cc.Atom.eventMgr.notify("_showMsg", _respone);
            } else {
                cc.Atom.eventMgr.notify("_showMsg", "HTTP FAILED : STATUS ", _respone, _status);
            }
        });
    },
    onBtnHttpPost: function onBtnHttpPost() {
        cc.Atom.gameNetMgr.httpPost("http://www.baidu.com", function (_bool, _respone, _status) {
            if (_bool == true) {
                cc.Atom.eventMgr.notify("_showMsg", _respone);
            } else {
                cc.Atom.eventMgr.notify("_showMsg", "HTTP FAILED : STATUS ", _respone, _status);
            }
        });
    },
    onBtnHttpTimeOut: function onBtnHttpTimeOut() {
        cc.Atom.gameNetMgr.httpGet("http://www.ba222idu.com", function (_bool, _respone, _status) {
            if (_bool == true) {
                cc.Atom.eventMgr.notify("_showMsg", _respone);
            } else {
                cc.Atom.eventMgr.notify("_showMsg", "HTTP FAILED : STATUS ", _respone, _status);
            }
        });
    },
    onBtnNotify: function onBtnNotify() {
        cc.Atom.eventMgr.notify("_showMsg", this.desc);
    },
    onBtnRemoveObjNotify: function onBtnRemoveObjNotify() {
        cc.Atom.eventMgr.unListenByObj(this);
    },
    onBtnRemoveEventNotify: function onBtnRemoveEventNotify() {
        cc.Atom.eventMgr.unListenAllByKey("_onHW1");
    },
    onBtnCreateTimerRe: function onBtnCreateTimerRe() {
        var _this2 = this;

        cc.Atom.timerMgr.registerTask("task1", cc.Atom.timerMgr.TASK_TYPE_RE, function () {
            console.log(_this2.desc, " ---- task1");
        }, 1);
        cc.Atom.timerMgr.registerTask("task3", cc.Atom.timerMgr.TASK_TYPE_RE, function () {
            console.log(_this2.desc, " ---- task3");
        }, 1);
        cc.Atom.timerMgr.registerTask("task5", cc.Atom.timerMgr.TASK_TYPE_RE, function () {
            console.log(_this2.desc, " ---- task5");
        }, 1);
        cc.Atom.timerMgr.registerTask("task7", cc.Atom.timerMgr.TASK_TYPE_RE, function () {
            console.log(_this2.desc, " ---- task7");
        }, 1);
    },
    onBtnCreateTimerOne: function onBtnCreateTimerOne() {
        var _this3 = this;

        cc.Atom.timerMgr.registerTask("task2", cc.Atom.timerMgr.TASK_TYPE_ONE, function () {
            console.log(_this3.desc, " ---- task2");
        }, 1);
        cc.Atom.timerMgr.registerTask("task4", cc.Atom.timerMgr.TASK_TYPE_ONE, function () {
            console.log(_this3.desc, " ---- task4");
        }, 1);
        cc.Atom.timerMgr.registerTask("task6", cc.Atom.timerMgr.TASK_TYPE_ONE, function () {
            console.log(_this3.desc, " ---- task6");
        }, 1);
    },
    onBtnClearAllTask: function onBtnClearAllTask() {
        cc.Atom.timerMgr.cleanAllTask();
    },
    onBtnCreateNode: function onBtnCreateNode() {
        this.nodelist = [];
        for (var index = 0; index < 1000; index++) {
            var node = cc.Atom.prefabMgr.getPrefabObj("spNode"); //cc.instantiate(this.spNode); //
            node.parent = cc.director.getScene();
            node.setPosition(100, 100);
            var label = node.getChildByName("index_label");
            var text = label.getComponent(cc.Label);
            text.string = index;

            this.nodelist.push(node);
        }
    },
    onBtnRemoveNode: function onBtnRemoveNode() {
        for (var index = 0; index < this.nodelist.length; index++) {
            var element = this.nodelist[index];
            // element.removeFromParent()
            cc.Atom.prefabMgr.holdPrefabObj("spNode", element);
        }
    },
    onBtnShowGameData: function onBtnShowGameData() {
        console.log("gameConfMgr version", cc.Atom.gameConfMgr.getInfo("version"));
        console.log("gameConfMgr gamemode", cc.Atom.gameConfMgr.getInfo("gamemode"));

        console.log("gameDataMgr HP_NUM", cc.Atom.gameDataMgr.getData("HP_NUM"));
        console.log("gameDataMgr MP_NUM", cc.Atom.gameDataMgr.getData("MP_NUM"));
    },
    onBtnOpenGameScene: function onBtnOpenGameScene() {
        cc.director.loadScene("Scene/gameScene");
    }
});

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
        //# sourceMappingURL=btnController.js.map
        