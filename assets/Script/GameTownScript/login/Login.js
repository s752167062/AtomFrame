
cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "Login"
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

    onLoad:function(){
        console.log("-onLoad" + this.TAG);
    },

    start:function(){
        console.log("-start" + this.TAG);
    },

    onDestory:function(){
        console.log("-onDestory" + this.TAG);
    },
    // update (dt) {},

    onBtnLogin:function(){
        console.log("-Login");
        cc.director.loadScene("Scene/GameTown/lobby");
    }
});
