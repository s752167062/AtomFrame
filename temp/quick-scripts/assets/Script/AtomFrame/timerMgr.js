(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/Script/AtomFrame/timerMgr.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, 'a426bFK1/BNb7LEq7baNAPu', 'timerMgr', __filename);
// Script/AtomFrame/timerMgr.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "timerMgr",
        TASK_TYPE_RE: 1,
        TASK_TYPE_ONE: 2
    },

    ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.tasklist = {};
        this.schedule(this.mUpdate, 0);
    },

    onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
        this.unschedule(this.mUpdate);
    },

    mUpdate: function mUpdate(t) {
        // console.log("-mUpdate",t,this.TAG);
        for (var key in this.tasklist) {
            if (this.tasklist.hasOwnProperty(key)) {
                var item = this.tasklist[key];
                if (item != null) {
                    if (item.remove == false) {
                        item.cd_t += t;
                        if (item.cd_t > item.time) {
                            item.cd_t = 0;
                            item.callback();
                            // console.log("update task : ", key, item.taskType);
                            //执行1次
                            if (item.taskType == this.TASK_TYPE_ONE) {
                                item.remove = true;
                                console.log("remove task : ", key);
                            }
                        }
                    } else {
                        this.tasklist[key] = null;
                    }
                }
            }
        };
    },

    registerTask: function registerTask(_taskName, _taskType, _callback, _time) {
        if (this.tasklist[_taskName] != null) {
            console.log(" !!! task already exist :", _taskName);
            return;
        }

        var item = {};
        item.taskName = _taskName;
        item.taskType = _taskType;
        item.callback = _callback;
        item.time = _time;
        item.cd_t = 0;
        item.remove = false;

        this.tasklist[_taskName] = item;
    },

    cleanTask: function cleanTask(_taskName) {
        this.tasklist[_taskName] = null;
    },

    cleanAllTask: function cleanAllTask() {
        this.tasklist = {};
    },

    checkTask: function checkTask(_taskName) {
        return this.tasklist[_taskName] != null;
    }

});

cc._RF.pop();
        }
        if (CC_EDITOR) {
            __define(__module.exports, __require, __module);
        }
        else {
            cc.registerModuleFunc(__filename, function () {
                __define(__module.exports, __require, __module);
            });
        }
        })();
        //# sourceMappingURL=timerMgr.js.map
        