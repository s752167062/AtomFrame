(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/Script/AtomFrame/md5.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, 'ec9afjlZq1PWbetv1Lz0C4r', 'md5', __filename);
// Script/AtomFrame/md5.js

"use strict";

/**
    cocos creator 中自带的fs模块为 c++ node.js 
*/

var crypto = require("crypto");
var fs;
if (cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS) {
    fs = require("fs");
}

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "md5"
    },

    ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.md5 = crypto.createHash("md5");
    },

    onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
    },

    /**
     * 文件的MD5
     */
    md5File: function md5File(path) {
        if (cc.sys.os == cc.sys.OS_ANDROID || cc.sys.os == cc.sys.OS_IOS) {
            if (!fs.statSync(path).isFile()) {
                return null;
            }
            return this.md5.update(fs.readFileSync(path, "utf-8")).digest("hex");
        }
        return null;
    },

    /**
     * MD5数据
     */
    md5Str: function md5Str(data) {
        return this.md5.update(data).digest("hex");
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
        //# sourceMappingURL=md5.js.map
        