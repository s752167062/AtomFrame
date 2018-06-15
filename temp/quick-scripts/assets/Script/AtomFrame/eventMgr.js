(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/Script/AtomFrame/eventMgr.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, 'e68becmCV1Et73aUPZ4jp7W', 'eventMgr', __filename);
// Script/AtomFrame/eventMgr.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "eventMgr"
    },

    ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.eventBuff = {};
        this.fezzedEventBuff = {};
    },

    onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
    },

    listen: function listen(_eventName, _callfunc, _target) {
        if (this.eventBuff[_eventName] == null) {
            this.eventBuff[_eventName] = [];
        }

        var item = {};
        item.target = _target;
        item.callfunc = _callfunc;
        this.eventBuff[_eventName].push(item);
    },

    unListenAllByKey: function unListenAllByKey(_eventName) {
        this.eventBuff[_eventName] = null;
    },

    unListenByObj: function unListenByObj(_target) {
        for (var key in this.eventBuff) {
            if (this.eventBuff.hasOwnProperty(key)) {
                var itemlist = this.eventBuff[key];
                //
                if (itemlist != null) {
                    for (var index = itemlist.length - 1; index >= 0; index--) {
                        var element = itemlist[index];
                        if (element != null && element.target === _target) {
                            itemlist.splice(index, 1);
                        }
                    }
                }
            }
        }
    },

    unListen: function unListen(_eventName, _target) {
        var itemlist = this.eventBuff[_eventName];
        if (itemlist != null) {
            for (var index = 0; index < itemlist.length; index++) {
                var element = itemlist[index];
                if (element != null && element.target == _target) {
                    itemlist.splice(index, 1);
                    index--;
                }
            }
        }
    },

    notify: function notify(_eventName, data) {
        var itemlist = this.eventBuff[_eventName];
        if (itemlist != null) {
            for (var index = 0; index < itemlist.length; index++) {
                var element = itemlist[index];
                // console.log(" -- the obj :",element.target);
                element.callfunc(element.target, data);
            }
        } else {
            console.log("_event null : ", _eventName);
        }
    }

    // setInfo: function (_key, _value) {
    //     this.infoBuff.forEach(function (element) {
    //         if (element.key == _key) {
    //             element.vaule = _value;
    //             return;
    //         }
    //     }, this);

    //     console.log("add conf : key:" + _key + "  value: " + _value)
    //     var item = { key: _key, value: _value };
    //     this.infoBuff.push(item);
    // },

    // getInfo: function (_key) {
    //     var result = null;
    //     this.infoBuff.forEach(function (element) {
    //         if (element.key == _key) {//element.key.localeCompare(_key) == 0
    //             result = element.value;
    //             return;
    //         }
    //     }, this);
    //     console.log(" element velue  " + result);
    //     return result;
    // },
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
        //# sourceMappingURL=eventMgr.js.map
        