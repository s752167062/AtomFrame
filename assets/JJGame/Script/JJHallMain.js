
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
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
    },

    onLoad () {
        cc.Atom.eventMgr.listen("onHallMain", (obj,data)=>{ this.onHallMain()     }, this) 
    },

    start () {

    },

    onDestroy(){
        cc.Atom.eventMgr.unListenByObj(this)
    },

    // update (dt) {

    // },

    onHallMain(){

    },

    //按钮事件
    onBtnStart(){
        console.log(this.desc, " ---- Hall2Game") 
        cc.Atom.gameState.setGameInRoom()
        cc.director.loadScene("JJGame/Scene/JJGameMain");

        //release hall resource 
    },

    onBtnStore(){

    },

    onBtnAbout(){

    },

    onBtnSet(){

    },
});
