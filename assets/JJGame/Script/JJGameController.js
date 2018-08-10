// Learn cc.Class:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/class/index.html
// Learn Attribute:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/reference/attributes/index.html
// Learn life-cycle callbacks:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/life-cycle-callbacks/index.html

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },

        //砖块的tag基数
        index_tag: 0,
        minterval: 0
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.gameUpdateInterval = cc.Atom.gameConfMgr.getInfo("gameUpdateInterval");
        this.gameSpeed = cc.Atom.gameConfMgr.getInfo("gameSpeed"); //节奏提速
    },

    start () {

    },

    update (dt) {
        this.minterval += dt 
        if(this.minterval * this.gameSpeed >= this.gameUpdateInterval){
            //角色跳
            //地图新增一阶
            //地图移动
        }
    },
});
