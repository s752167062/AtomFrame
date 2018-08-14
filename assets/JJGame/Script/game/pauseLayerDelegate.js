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

    },

    start () {

    },

    onResume(){
        this.node.removeFromParent();
        cc.Atom.eventMgr.notify("onPause",false)
    },

    onOut(){
        this.node.removeFromParent();
        cc.Atom.gameState.setGameInHall()
        cc.director.loadScene("JJGame/Scene/JJHallMain");
    },

    onReStart(){
        this.node.removeFromParent();
        cc.Atom.eventMgr.notify("onReStart",null)
    },
});
