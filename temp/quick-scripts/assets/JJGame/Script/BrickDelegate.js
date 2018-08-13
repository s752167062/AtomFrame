(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/JJGame/Script/BrickDelegate.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, '070a7IN9YFNF60eU/Dl4jjv', 'BrickDelegate', __filename);
// JJGame/Script/BrickDelegate.js

"use strict";

//砖块代理
cc.Class({
    extends: cc.Component,

    properties: {
        brickData: null
    },

    onLoad: function onLoad() {},
    start: function start() {},
    update: function update(dt) {},
    getBrickData: function getBrickData() {
        return this.brickData;
    },
    setBrickData: function setBrickData(value) {
        this.brickData = value;
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
        //# sourceMappingURL=BrickDelegate.js.map
        