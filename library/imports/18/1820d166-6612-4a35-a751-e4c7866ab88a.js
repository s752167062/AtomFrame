"use strict";
cc._RF.push(module, '1820dFmZhJKNadR5MeGariK', 'Atom');
// Script/AtomFrame/Atom.js

"use strict";

var Atom = {
    createAtom: function createAtom() {
        console.log("!---- AtomFrame ----!" + cc.sys.os);
        cc.Atom = {};

        // //计时器 timer
        var timerMgr = require("timerMgr");
        cc.Atom.timerMgr = new timerMgr();

        // md5 
        // var md5 = require("md5");
        // cc.Atom.md5 = new md5();

        //状态机 gamestate
        var gameState = require("gameState");
        cc.Atom.gameState = new gameState();

        //游戏配置单例
        var gameConfMgr = require("gameConfMgr");
        cc.Atom.gameConfMgr = new gameConfMgr();

        //事件管理器 event
        var eventMgr = require("eventMgr");
        cc.Atom.eventMgr = new eventMgr();

        //文本信息数据 msgmgr
        var msgMgr = require("msgMgr");
        cc.Atom.msgMgr = new msgMgr();

        //文件管理
        // var fileMgr = require("AtomFrame/fileMgr");
        // cc.Atom.fileMgr = new fileMgr();

        //sprite管理 
        var spriteMgr = require("spriteMgr");
        cc.Atom.spriteMgr = new spriteMgr();

        //音频管理 audio
        var audioMgr = require("audioMgr");
        cc.Atom.audioMgr = new audioMgr();

        //预设管理器 prefab管理器mgr
        var prefabMgr = require("prefabMgr");
        cc.Atom.prefabMgr = new prefabMgr();

        //特效 effect 
        var effectMgr = require("effectMgr");
        cc.Atom.effectMgr = new effectMgr();

        //动画 ani
        var animateMgr = require("animateMgr");
        cc.Atom.animateMgr = new animateMgr();

        //resource 统一管理资源 audioMgr、  prefabMgr 、effectMgr 、animateMgr
        var resMgr = require("resMgr");
        cc.Atom.resMgr = new resMgr();

        //UI管理器 uimgr
        var UIMgr = require("UIMgr");
        cc.Atom.UIMgr = new UIMgr();

        //公共工具函数 comfun
        var comFunMgr = require("comFunMgr");
        cc.Atom.comFunMgr = new comFunMgr();

        //游戏数据 gameData
        var gameDataMgr = require("gameDataMgr");
        cc.Atom.gameDataMgr = new gameDataMgr();

        //平台接口管理 platform
        // var platformMgr = require("AtomFrame/platformMgr");
        // cc.Atom.platformMgr = new platformMgr();

        //网络管理 net
        var gameNetMgr = require("gameNetMgr");
        cc.Atom.gameNetMgr = new gameNetMgr();

        //socekt
        var socketMgr = require("socketMgr");
        cc.Atom.socketMgr = new socketMgr();

        //热更新 hotupdate
        var hotUpdateMgr = require("hotUpdateMgr");
        cc.Atom.hotUpdateMgr = new hotUpdateMgr();

        //内存探测器
        // var memory = require("AtomFrame/memoryDetector");
        // cc.Atom.memory = new memory();

        ///以下补充游戏内容相关的对象///
    }
};

module.exports = Atom;

/**
    1.计时器 
    2.游戏配置管理器  --存储一些全局的只读的游戏配置，如玩家初始速度、游戏初始音量等，扩展的配置。
    3.文本内容管理器  --读取资源中的配置表.通过与配置表键值对调用
    4.游戏运行数据管理器  --将任意类型的数据以树状结构的形式进行保存，用于管理游戏运行时的各种数据，支持指定存储。
    5.加解密管理器 --包含MD5 、AES 、BASE64 等常用的加解密处理

    6.事件管理 --游戏逻辑监听、抛出事件的机制
    7.状态机 -- 提供创建、使用和销毁有限状态机的功能，一些适用于有限状态机机制的游戏逻辑
    7-1.流程 -- 是贯穿游戏运行时整个生命周期的有限状态机。通过流程，将不同的游戏状态进行解耦将是一个非常好的习惯。对于网络游戏，你可能需要如检查资源流程、更新资源流程、检查服务器列表流程、选择服务器流程、登录服务器流程、创建角色流程等流程
    
    8.资源管理 -- 数据表、本地化字典，还是复杂的实体、场景、界面，我们都将使用异步加载
    9.sprite管理
    10.音频管理 -- 提供管理声音和声音组的功能，用户可以自定义一个声音的音量，循环播放或者暂停
    11.预设管理 -- 我们将游戏场景中，动态创建的一切物体定义为实体。此模块提供管理实体和实体组的功能，如显示隐藏实体、挂接实体（如挂接武器、坐骑，或者抓起另一个实体）等。实体使用结束后可以不立刻销毁，从而等待下一次重新使用。
    12.特效管理
    13.动画管理
    14.对象管理 -- 提供对象缓存池的功能，避免频繁地创建和销毁各种游戏对象，提高游戏性能
    14.UI管理   -- 提供管理界面和界面组的功能，如显示隐藏界面、激活界面、改变界面层级等 （用这个处理屏幕适配）
    14.场景管理 -- 提供场景管理的功能
    15.公共工具函数
    16.网络管理 -- 提供使用短连接的功能，可以用 Get 或者 Post 方法向服务器发送请求并获取响应数据，可指定允许几个 Web 请求器进行同时请求
    17.socket --提供使用 Socket 长连接的功能，当前我们支持 TCP 协议，同时兼容 IPv4 和 IPv6 两个版本 。可以同时建立多个连接与多个服务器同时进行通信，比如除了连接常规的游戏服务器，还可以连接语音聊天服务器
    18.热更

    19.titlemap管理
    20.龙骨管理
    21.文件管理
    22.平台管理
    23.本地化 --提供本地化功能，也就是我们平时所说的多语言 参考ios的本地化

    24.内存管理
    25.调试器 --在 编辑器中运行或者以 Development 方式发布运行时，将出现调试器窗口，便于查看运行时日志、调试信息等。还可以方便地将自己的功能注册到调试器窗口上并使用 （支持运行系统指令类似饥荒）
*/

cc._RF.pop();