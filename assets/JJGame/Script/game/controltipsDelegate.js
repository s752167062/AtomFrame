// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {

    },

   

    onLoad () {
        this.mtime = cc.Atom.gameConfMgr.getInfo("readyCount")

        var _label = this.node.getChildByName("count_label")
        this.count_label = _label.getComponent(cc.Label);
        this.count_label.string = this.mtime
    },

    start () {

    },

    mUpdate (dt) {
        this.mtime -= dt
        this.count_label.string = Math.ceil(this.mtime)
        if(this.mtime <=0){
            cc.Atom.gameState.setGameIng()
            this.node.removeFromParent()
        }
    },
});
