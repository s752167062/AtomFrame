"use strict";
cc._RF.push(module, '321d8jUoHZMfYtl4MYSbmjE', 'MapController');
// JJGame/Script/MapController.js

"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

//MapController 只负责数据的生成，不包含节点
/*
    1.地图初始生成 后续在生成点添加新的点
    2.地图向下移动，出地图的部分自动删除
*/
cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "MapController"
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


    //生成砖块数据
    makeBrick: function makeBrick() {
        var brickNum = cc.Atom.gameConfMgr.getInfo("brickNum");
        var bricList = [];
        for (var i = 0; i < brickNum; i++) {
            var item = {};
            item.brickType = this.aiBrickType();
            item.brickNum = brickNum; //本阶的砖块数量
            bricList[i] = item;
        }
        return bricList;
    },
    aiBrickType: function aiBrickType() {
        //ai 运算是什么类型  base , empy , trap , buff
        return "base";
    },


    //生成位置节点
    //index_tag 新一行的起始tag  （循环的 1-50 ）
    makeBrickNodes: function makeBrickNodes(index_tag) {
        var bricList_data = this.makeBrick();
        var brickNodeList = [];
        for (var i = 0; i < bricList_data.length; i++) {
            var item = bricList_data[i];
            var node = cc.Atom.prefabMgr.getPrefabObj("brick"); //创建一个砖块 prefab节点
            //预设对象才处理
            console.log(">>> prefab obj type :" + (typeof node === "undefined" ? "undefined" : _typeof(node)));
            if (node != null) {
                node.name = "" + (index_tag + i);
                //获取预制资源中的js组件，并作出相应操作
                var brickScript = node.getComponent('BrickDelegate');
                brickScript.setBrickData(item);
                brickNodeList[i] = node;
            } else {
                console.log(">>>> ERR makeBrickNodes node not a prefab object !!!");
            }
        }
        return brickNodeList;
    }

    //获取下一个阶

});

cc._RF.pop();