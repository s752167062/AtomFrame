
cc.Class({
    extends: cc.Component,

    properties: {
        interval:{
            default:3
        }
    },

    // 针对各自场景加载、卸载各自的资源

    onLoad:function(){
        console.log(">>> logo onLoad");
    },

    start:function(){
        console.log(">>> logo start %d" , this.interval);
        
        //初始化Atom
        const atom = require("AtomFrame/Atom");
        atom.createAtom();

        //logo事件
        cc.Atom.timerMgr.registerTask("runLogo", cc.Atom.timerMgr.TASK_TYPE_ONE, () => { 
            //跳转到登录界面
            console.log(">>> Jump 2 login scene");
            cc.director.loadScene("Scene/GameTown/login");
        }, this.interval)

        //
        var node = this.node;
        node.runAction(cc.fadeTo( this.interval/2 , 255));
    },

    onDestroy:function(){
        console.log(">>> logo onDestroy");
        cc.Atom.timerMgr.cleanAllTask();//切换场景前全部清空之前的计时器-防止操作到空对象   
    },

});
