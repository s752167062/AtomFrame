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
    onDestroy: function onDestroy() {
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
        var mSaveStart = cc.Atom.gameDataMgr.getData("mSaveStart");
        cc.Atom.gameDataMgr.setData("mSaveStart", mSaveStart + 1);
        return bricList;
    },
    aiBrickType: function aiBrickType() {
        //ai 运算是什么类型  base , empy , trap , buff
        var ran = Math.round(Math.random() * 100);
        var mSaveStart = cc.Atom.gameDataMgr.getData("mSaveStart");
        var saveStart = cc.Atom.gameConfMgr.getInfo("saveStart"); //过了安全区才可以创建特殊砖块
        console.log(">>>>>>> aiBrickType ran %d", ran);
        if (ran < 20 && mSaveStart > saveStart) {
            return cc.Atom.gameConfMgr.BRICKS.TRAP; //"trap";
        } else if (ran < 22 && mSaveStart > saveStart) {
            return cc.Atom.gameConfMgr.BRICKS.BUFF; //buff;
        }
        return cc.Atom.gameConfMgr.BRICKS.BASE; //"base";
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
                node.name = item.brickType == cc.Atom.gameConfMgr.BRICKS.BASE ? "brick" : "component_brick"; //"" + (index_tag + i);
                node.zIndex = 50;
                //获取预制资源中的js组件，并作出相应操作
                var brickScript = node.getComponent('BrickDelegate');
                brickScript.setBrickData(item);
                brickNodeList[i] = node;
            } else {
                console.log(">>>> ERR makeBrickNodes node not a prefab object !!!");
            }
        }
        return brickNodeList;
    },


    //地图移动
    //target 地图层
    mapUpdate: function mapUpdate(target, dt) {
        var makeNew = false;
        var position_max = 0;
        var move = cc.Atom.gameConfMgr.getInfo("gameUpdateMove") * dt;
        var player = target.getChildByName("player");
        if (cc.Atom.gameDataMgr.getData("isPlayerMove") == true) {
            //移动角色
            if (player) {
                // player.y = player.y + move

                // var brick  = target.getChildByName("brick")
                // var height = brick.height 
                // if(player.y >= height * 3 ){
                //     player.y = height * 3 + height/2
                //     cc.Atom.gameDataMgr.setData("isPlayerMove", false)
                // }

                //跳一个位置
                var brick = target.getChildByName("brick");
                // var moveto = cc.moveTo(cc.Atom.gameConfMgr.getInfo("jumpTime") , cc.p(player.x , player.y + brick.height))
                // moveto.easing(cc.easeInOut(cc.Atom.gameConfMgr.getInfo("jumpTime")));
                var jump = cc.jumpTo(cc.Atom.gameConfMgr.getInfo("jumpTime"), cc.p(player.x, player.y + brick.height), brick.height / 3, 1);
                var callfun = cc.callFunc(function () {
                    console.log("function callback！！");
                    cc.Atom.gameDataMgr.setData("isPlayerMove", false);
                }.bind(this));

                var seqA = cc.sequence([jump, callfun]);
                player.runAction(seqA);
            }
        } else {
            //先检查是否有要删除的
            var bricks = target.getChildren();
            for (var m = bricks.length - 1; m >= 0; m--) {
                var node = bricks[m];
                if (node.name == "brick" || node.name == "component_brick") {
                    if (node.y < -node.height / 2) {
                        //节点出了界面了 删除掉
                        makeNew = true;
                        node.removeFromParent();
                    }

                    if (node.y > position_max) {
                        position_max = node.y;
                    }
                }
            }

            if (makeNew == true) {
                //补上新的一行节点
                var nodelist = this.makeBrickNodes();
                for (var j = 0; j < nodelist.length; j++) {
                    var brick = nodelist[j];
                    if (brick) {
                        var width = brick.width;
                        var height = brick.height;
                        var x = (j + 1 - (nodelist.length + 1) / 2) * width;
                        var y = position_max + height;
                        brick.parent = target;
                        brick.x = x;
                        brick.y = y;
                    }
                }
            }

            //移动砖块
            bricks = target.getChildren();
            console.log(">>>> map brick number : %d", bricks.length);
            for (var i = 0; i < bricks.length; i++) {
                var item = bricks[i];
                // if(item.name == "brick" || item.name == "component_brick"){
                //     item.y = item.y - move;
                // }

                var moveto = cc.moveTo(cc.Atom.gameConfMgr.getInfo("jumpFixTime"), cc.p(item.x, item.y - item.height));
                moveto.easing(cc.easeInOut(cc.Atom.gameConfMgr.getInfo("jumpFixTime")));
                var callfun = cc.callFunc(function () {
                    console.log("function callback！！");
                    cc.Atom.gameDataMgr.setData("isPlayerMove", true);
                }.bind(this));

                var seqB = cc.sequence([moveto, callfun]);
                item.runAction(seqB);
            }
        }
    },
    hitCheck: function hitCheck(target) {
        //碰撞检测
        var player = target.getChildByName("player");
        var nbricks = target.getChildren();
        var px = player.x;
        var py = player.y;
        var hitOffset = cc.Atom.gameConfMgr.getInfo("hitOffset"); //碰撞允许的偏移量
        for (var bi = 0; bi < nbricks.length; bi++) {
            var item = nbricks[bi];
            if (item.name == "component_brick") {
                if (Math.abs(item.x - px) < item.width - hitOffset && Math.abs(item.y - py) < item.height - hitOffset) {
                    console.log(">>>> player hit");
                    var script = item.getComponent("BrickDelegate");
                    var _type = script.getBrickData().brickType;
                    if (_type == cc.Atom.gameConfMgr.BRICKS.TRAP) {
                        console.log(">>>> over");
                        cc.Atom.gameState.setGameOver();
                        cc.Atom.eventMgr.notify("onGameOver", { _type: _type });
                    } else if (_type == cc.Atom.gameConfMgr.BRICKS.BUFF) {
                        console.log(">>>> buff");
                        script.onBuff();
                        cc.Atom.eventMgr.notify("onBuffEnergy");
                    }
                }
            }
        }
    }
});

cc._RF.pop();