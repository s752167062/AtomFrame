
cc.Class({
    extends: cc.Component,

    properties: {
        //地图层
        mapLayer:{
            default:null,
            type:cc.Node,
        },
    },

    onLoad () {
        const atom = require("AtomFrame/Atom");
        atom.createAtom();

        this.gameUpdateInterval = cc.Atom.gameConfMgr.getInfo("gameUpdateInterval");
        this.gameSpeed = cc.Atom.gameConfMgr.getInfo("gameSpeed"); //节奏提速
        this.maxSteps = cc.Atom.gameConfMgr.getInfo("maxSteps");   //最大层数
        this.indexOffset = cc.Atom.gameConfMgr.getInfo("indexOffset");//阶的偏移index
    },

    start () {    
        // console.log(">>> start")
        this.loadRes();
    },

    loadRes(){
        console.log(">>>> loadres ")
        cc.Atom.resMgr.loadResByKey("JJGameRes" , (index , total , err)=>{
            if(err != null || index == -1){
                console.log("=== 加载资源出现异常： ",err);
                return
            }
            console.log(" 资源加载进度 ： " ,index , total);
            if(index == total){
                console.log("=== 加载完成")
                cc.Atom.prefabMgr.loadAllPrefab([{ key: "brick", path:"JJGameRes/prefabs/item"} ,
                                                 { key: "player_obj", path:"JJGameRes/prefabs/player_obj"}], 
                                                 (index)=>{ 
                                                    console.log(index, "prefabs loadfinish" ) 
                                                    this.addBrick();
                                                });
            }
        }) 
    },

    addBrick(){
        this.indexTag = 0; //
        this.player_indexTag = 0;
        this.minterval = 0;

        this.mapController = this.mapLayer.getComponent('MapController');
        //创建基础地图
        for (var i = this.indexOffset; i <= this.maxSteps; i+= this.maxSteps/this.indexOffset) {
            var bricklist = this.mapController.makeBrickNodes(i)
            for (var j = 0; j < bricklist.length; j++) {
                var node = bricklist[j];
                if(node){
                    var width  = node.width;
                    var height = node.height;
                    var x = (j+1 - ( bricklist.length +1) /2) * width ;
                    var y = i/10  * height + height/2;
                    node.parent = this.mapLayer;
                    node.x = x;
                    node.y = y;
                    console.log(">>>> addBrick position : %d , %d ; %d , %d   / %d" , width , height ,Number(x) , Number(y) , i)
                }
            }
        }
    },

    update (dt) {
        this.minterval += dt 
        if(this.minterval * this.gameSpeed >= this.gameUpdateInterval){
            this.indexTag += this.indexOffset;
            if(this.indexTag > this.maxSteps){
                this.indexTag = this.indexOffset;//一个地图循环
            }

            //删除循环外的


            //获取下一个砖块
            //角色跳
            //地图新增一阶
            //地图移动
        }
    },
});
