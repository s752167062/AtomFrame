(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/JJGame/Script/MapController.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, '321d8jUoHZMfYtl4MYSbmjE', 'MapController', __filename);
// JJGame/Script/MapController.js

"use strict";

//MapController 只负责数据的生成，不包含节点
cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "MapController",
        Level: 1, //难度等级
        step: 0, //第几阶
        Map: [], //阶梯地图数据

        BaseStepNum: 8
    },

    ctor: function ctor() {
        console.log("-new:" + this.TAG);
    },

    onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
    },

    onDestory: function onDestory() {
        console.log("-destory:" + this.TAG);
    },

    //生成位置数据
    makeSteps: function makeSteps() {
        step += 1;
        var stepnumber = step % 2 == 0 ? BaseStepNum : BaseStepNum + 1;
        var stepList = [];
        for (var i = 0; i < stepnumber; i++) {
            var item = {};
            item.step_type = aiStepType();
            item.stepnumber = stepnumber; //本阶的砖块数量
            stepList[i] = item;
        }
        return stepList;
    },
    aiStepType: function aiStepType() {
        //ai 运算是什么类型  base , empy , trap , buff
        return "base";
    },

    //生成位置节点
    //index_tag 新一行的起始tag 
    makeStepNodes: function makeStepNodes(index_tag) {
        var stepList_data = makeSteps();
        var stepNodeList = [];
        for (var i = 0; i < stepList_data.length; i++) {
            var item = stepList_data[i];
            var node = cc.Atom.prefMgr.getPrefabObj("brick"); //创建一个砖块 prefab节点
            //预设对象才处理
            if (node instanceof cc.Prefab) {
                node.setTag(index_tag + i);
                //获取预制资源中的js组件，并作出相应操作
                var stepScript = node.getComponent('stepScript');
                stepScript: setStepData(item);
                stepNodeList[i] = item;
            } else {
                console.log(">>>> ERR makeStepNodes node not a prefab object !!!");
            }
        }
        return stepNodeList;
    },

    //寻找安全路径
    //length 安全阶数
    searchSavePath: function searchSavePath(length) {}

    //获取下一个阶
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
        //# sourceMappingURL=MapController.js.map
        