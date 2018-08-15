
cc.Class({
    extends: cc.Component,

    properties: {
        //地图层
        mapLayer:{
            default:null,
            type:cc.Node,
        },
        uiLayer:{
            default:null,
            type:cc.Node,
        },
    },

    onLoad () {
        cc.Atom.gameState.setGameStop();
        cc.Atom.eventMgr.listen("onStartGame", (obj,data)=>{ this.onStartGame()     }, this);
        cc.Atom.eventMgr.listen("onGameOver" , (obj,data)=>{ this.onGameOver(data)  }, this);
        cc.Atom.eventMgr.listen("onPause"    , (obj,data)=>{ this.onPause(data)     }, this);
        cc.Atom.eventMgr.listen("onReStart"  , (obj,data)=>{ this.onReStart(data)   }, this);
    },

    start () {    
        this.addTouchEvent()
    },

    onDestroy(){
        cc.Atom.eventMgr.unListenByObj(this)
    },

    onStartGame(){
        console.log(">>>> onStartGame ")
        this.gameUpdateInterval = cc.Atom.gameConfMgr.getInfo("gameUpdateInterval");
        this.gameSpeed = cc.Atom.gameConfMgr.getInfo("gameSpeed"); //节奏提速
        this.maxSteps = cc.Atom.gameConfMgr.getInfo("maxSteps");   //最大层数
        this.indexOffset = cc.Atom.gameConfMgr.getInfo("indexOffset");//阶的偏移index

        cc.Atom.gameDataMgr.setData("mSaveStart",0)
        //add top bar
        var topbar = cc.Atom.prefabMgr.getPrefabObj("topStatuBar");
        topbar.parent = this.uiLayer;
        this.topbar = topbar;
        this.topbar_delegate = this.topbar.getComponent("topBarDelegate")

        this.addBrick();
        //play ready go
        this.playReadGo();
        cc.Atom.gameState.setGameStart()
    },

    playReadGo(){
        var controltips = cc.Atom.prefabMgr.getPrefabObj("controltips");
        controltips.parent = this.uiLayer;
        this.controltips = controltips;
        this.controltips_delegate = this.controltips.getComponent("controltipsDelegate")
    },

    addTouchEvent(){
        var self = this
        this.node.on(cc.Node.EventType.TOUCH_START, function (event) {
            console.log(">>>>>> TOUCH_START");
            if(!cc.Atom.gameState.isGameIng()){
                return
            }

            var posi = event.touch._point
            //边界
            var width = cc.Atom.gameDataMgr.getData("brickWidth");
            var brickNum = cc.Atom.gameConfMgr.getInfo("brickNum");
            var turnSpeed  = cc.Atom.gameConfMgr.getInfo("turnSpeed");
            var minx = (1 - ( brickNum +1) /2) * width;
            var maxx = (brickNum - ( brickNum +1) /2) * width;

            var action;
            if(posi.x < self.node.width /2){
                var x = self.player.x -width;
                if(x < minx){
                    x = minx;
                }
                action = cc.moveTo(turnSpeed, cc.p(x , self.player.y));
            }else{
                var x = self.player.x +width;
                if(x > maxx){
                    x = maxx;
                }
                action = cc.moveTo(turnSpeed, cc.p(x , self.player.y));
            }
            self.player.runAction(action);
        })

        this.node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
            console.log(">>>>>> TOUCH_MOVE");
        })

        this.node.on(cc.Node.EventType.TOUCH_END, function (event) {
            console.log(">>>>>> TOUCH_END");
        })

        this.node.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
            console.log(">>>>>> TOUCH_CANCEL");
        })
    },

    onGameOver(data){
        this.player.stopAllActions();
        //
        console.log(">>> player over");
        if(data){
            var _type = data._type

        }
        var over_ui = cc.Atom.prefabMgr.getPrefabObj("over_ui");
        over_ui.parent = this.uiLayer
        over_ui.zIndex = 150
    },

    onReStart(){
        cc.Atom.gameState.setGameStop()
        this.mapLayer.removeAllChildren()
        this.topbar.removeFromParent()
        this.onStartGame();
    },

    onPause(_bool){
        if(_bool == true){
            console.log(">>> show pause_ui ")
            var pause_ui = cc.Atom.prefabMgr.getPrefabObj("paruse_ui");
            pause_ui.parent = this.uiLayer
            pause_ui.zIndex = 150
            cc.Atom.gameState.setGamePause()
        }else{
            cc.Atom.gameState.setGameIng()
        }
        
    },

    addBrick(){
        this.indexTag = 0; //砖块的位置
        this.player_indexTag = 0;
        this.minterval = 0;

        this.mapController = this.mapLayer.getComponent('MapController');
        //创建基础地图
        for (var i = 1; i <= this.maxSteps/this.indexOffset; i++) {
            var bricklist = this.mapController.makeBrickNodes(i)
            for (var j = 0; j < bricklist.length; j++) {
                var node = bricklist[j];
                if(node){
                    var width  = node.width;
                    var height = node.height;
                    var x = (j+1 - ( bricklist.length +1) /2) * width ;
                    var y = i  * height - height/2;
                    node.parent = this.mapLayer;
                    node.x = x;
                    node.y = y;

                    cc.Atom.gameDataMgr.setData("brickWidth" , width)
                    cc.Atom.gameDataMgr.setData("brickHeight", height)
                }
            }
        }

        //添加obj
        var player = cc.Atom.prefabMgr.getPrefabObj("player_obj"); //创建一个砖块 prefab节点
        player.name   = "player"; 
        player.parent = this.mapLayer;
        player.y = player.height/2 + player.height*3;
        player.zIndex  = 100
        this.player = player;

        this.player_indexTag = Math.ceil(cc.Atom.gameConfMgr.getInfo("brickNum")/2);
        cc.Atom.gameDataMgr.setData("isPlayerMove" , true);
    },

    update (dt) {
        if(cc.Atom.gameState.isGameIng()){
            this.mapController.mapUpdate(this.mapLayer , dt);
            var score = dt *100
            cc.Atom.eventMgr.notify("onAddScore" , score);

            this.topbar_delegate.mUpdate(dt);
        }else if(cc.Atom.gameState.isGameStart()){
            this.controltips_delegate.mUpdate(dt);
        }
    },
});
