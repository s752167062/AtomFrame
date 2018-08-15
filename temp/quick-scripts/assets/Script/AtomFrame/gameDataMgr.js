(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/Script/AtomFrame/gameDataMgr.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, '8eabfKht7BPfLTFiN0wWOap', 'gameDataMgr', __filename);
// Script/AtomFrame/gameDataMgr.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "gameDataMgr"
    },

    ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.dataBuff = {};
    },

    onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
    },

    setData: function setData(_key, _value) {
        this.dataBuff[_key] = _value;
    },

    getData: function getData(_key, _default) {
        var _value = this.dataBuff[_key];
        return _value != null ? _value : _default;
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
        //# sourceMappingURL=gameDataMgr.js.map
        