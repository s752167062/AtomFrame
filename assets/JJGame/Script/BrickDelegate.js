
const ObjType = cc.Enum({
    baseBrick : 0,
    buffBrick : 1,
    player:2,
});

//砖块代理
cc.Class({
    extends: cc.Component,

    properties: {
        brickData:null,
        objType:{
            default:ObjType.baseBrick,
            type : cc.Enum(ObjType)
        }
    },

    onLoad () {

    },

    start () {

    },

    update (dt) {

    },

    getBrickData () {
        return this.brickData;
    },
    setBrickData (value) {
        this.brickData = value;
        
        this.buffui = this.node.getChildByName("buff");
        this.trapui = this.node.getChildByName("trap");
        this.wallui = this.node.getChildByName("wall");
        this.base   = this.node.getChildByName("base");

        this.base.active   = (value.brickType == cc.Atom.gameConfMgr.BRICKS.BASE || value.brickType == cc.Atom.gameConfMgr.BRICKS.BUFF );
        this.buffui.active = (value.brickType == cc.Atom.gameConfMgr.BRICKS.BUFF);
        this.trapui.active = (value.brickType == cc.Atom.gameConfMgr.BRICKS.TRAP);
        this.wallui.active = (value.brickType == cc.Atom.gameConfMgr.BRICKS.WALL);

        if(this.buffui.active == true){
            cc.Atom.animateMgr.playAni(this.buffui,"buffAni",true);
        }
    },

    getGameObjType(){
        return this.objType;
    },

    onBuff(){
        this.buffui.active = false;
        this.trapui.active = false;
        this.wallui.active = false;
    }
});
