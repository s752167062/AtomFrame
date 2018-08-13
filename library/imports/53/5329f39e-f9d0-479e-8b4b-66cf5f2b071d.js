"use strict";
cc._RF.push(module, '5329fOe+dBHnotLZs9fKwcd', 'prefabMgr');
// Script/AtomFrame/prefabMgr.js

"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "prefabMgr"
        // nodePool:{ //堆栈的数据结构
        //     default:null,
        //     type: cc.NodePool,
        // }
    },

    ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.prefabPool = {};
        this.resPrefab = {};
    },

    onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
    },

    loadAllPrefab: function loadAllPrefab(resData, callback) {
        var _this = this;

        if (resData != null && (typeof resData === "undefined" ? "undefined" : _typeof(resData)) == "object") {
            for (var index = 0; index < resData.length; index++) {
                var element = resData[index];
                var path = element.path;
                var key = element.key;
                //
                cc.loader.loadRes(path, function (err, prefab) {
                    if (err) {
                        console.log(">>> loadAllPrefab err !!");
                        cc.error(err.message || err);
                        return;
                    }
                    _this.resPrefab[key] = prefab; // (prefab instanceof cc.Prefab ); 检查是否是 prefab object
                    callback(index);
                });
            }
        } else {
            console.log("null resData !!");
        }
    },

    addPrefabObj: function addPrefabObj(prefabKey, prefab) {
        if (prefabKey == null || !prefabKey instanceof cc.Prefab) {
            console.log(" ------- 类型异常 ", prefabKey);
            return;
        }
        this.resPrefab[prefabKey] = prefab; // (prefab instanceof cc.Prefab ); 检查是否是 prefab object
    },

    //获取预设对象
    getPrefabObj: function getPrefabObj(prefabKey) {
        if (typeof prefabKey != "string") {
            console.log(" the prefabMgr need the  prefab path : ", typeof path === "undefined" ? "undefined" : _typeof(path));
            return;
        }
        if (this.resPrefab[prefabKey] == null) {
            console.log(prefabKey, " do not loaded , load the prefab resource frist !!!");
            return;
        }

        if (this.prefabPool[prefabKey] == null) {
            return cc.instantiate(this.resPrefab[prefabKey]);
        }
        //已经缓存过
        var nodepool = this.prefabPool[prefabKey];
        if (nodepool != null) {
            return nodepool.get();
        }

        return null;
    },

    //挂起对象
    holdPrefabObj: function holdPrefabObj(prefabKey, obj) {
        if (this.prefabPool[prefabKey] == null) {
            this.prefabPool[prefabKey] = new cc.NodePool();
        }
        this.prefabPool[prefabKey].put(obj);
    },

    //释放预设对象
    releasePrefabObj: function releasePrefabObj(path) {
        if (this.prefabPool[path] != null) {
            this.prefabPool[path].clear();
        }
    },

    //释放预设对象
    releaseAllPrefabObj: function releaseAllPrefabObj() {
        for (var key in this.prefabPool) {
            if (this.prefabPool.hasOwnProperty(key)) {
                var nodepool = this.prefabPool[key];
                nodepool.clear();
            }
        }
    }

});

cc._RF.pop();