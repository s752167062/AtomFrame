
cc.Class({
    extends: cc.Component,

    properties: {

    },

    // LIFE-CYCLE CALLBACKS:
    onLoad:function() {
        console.log("gameConfMgr version" , cc.Atom.gameConfMgr.getInfo("version"));
        console.log("gameConfMgr gamemode", cc.Atom.gameConfMgr.getInfo("gamemode"));

        var node = cc.Atom.spriteMgr.createSprite("common2","image-common2-zhunbeizhong");
        node.setPosition(100,100);
        node.parent = this.node; // this.node 可以简写为 this

        cc.Atom.audioMgr.setSoundSearchDir("common/audio")
    },

    //按钮事件监听
    obBtnOpenHelloWorld:function () {
        cc.director.loadScene("Scene/helloworld");
    },

    //
    onPlayMusic:function () {
        cc.Atom.audioMgr.playMusic("loginMusic.mp3")
    },
    onPlayEffect: function () {
        cc.Atom.audioMgr.playEffect("1gang.mp3")
    },
    onStopAll: function () {
        cc.Atom.audioMgr.stopAll()
    },
    onSetVolumeEffect: function () {
        cc.Atom.audioMgr.setEffectVolume(1)
    },
    onSetVolumeMusic: function () {
        cc.Atom.audioMgr.setMusicVolume(1)
    },

    onWriteFile: function () {
        cc.Atom.fileMgr.write2File("/Users/yajing/Desktop/websocket_node/##########kfile","/Users/yajing/Desktop/websocket_node/kfile.txt")
    },
    onReadFile: function () {
        cc.Atom.fileMgr.readFile("/Users/yajing/Desktop/websocket_node/kfile.txt", (data)=>{
            console.log(" -- 这是读取出来的文件内容： ", data)
        })

        cc.Atom.fileMgr.readFile("/Users/yajing/Desktop/websocket_node/world.txt", (data) => {
            console.log(" -- 这是读取出来的文件内容world： ", data)
        })
    },
    onWriteObjFile: function () {
        cc.Atom.fileMgr.write2File({ "hello": "world" }, "/Users/yajing/Desktop/websocket_node/world.txt")
    },

    onMd5Str: function () {
        console.log(cc.Atom.md5.md5Str("cocos_creator") ); 
        console.log(cc.Atom.md5.md5Str("cocos_creator_hello")); 
    },

    onFileMd5: function () {
        console.log(cc.Atom.md5.md5File("/Users/yajing/Desktop/websocket_node/world.txt") );
    },
});
