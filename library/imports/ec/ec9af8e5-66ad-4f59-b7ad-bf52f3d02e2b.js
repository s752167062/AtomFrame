"use strict";
cc._RF.push(module, 'ec9afjlZq1PWbetv1Lz0C4r', 'md5');
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