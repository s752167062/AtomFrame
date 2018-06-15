var crypto = require("crypto")
var fs = require("fs")
cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "md5",
    },

    ctor: function () {
        console.log("-new:" + this.TAG);
        this.md5 = crypto.createHash("md5");
    },

    onLoad: function () {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function () {
        console.log("-destory:" + this.TAG);
    },

    /**
     * 文件的MD5
     */
    md5File: function (path) {
        if(!fs.statSync(path).isFile()){
            return null;
        }
        return this.md5.update(fs.readFileSync(path , "utf-8")).digest("hex");
    },

    /**
     * MD5数据
     */
    md5Str: function (data) {
        return this.md5.update(data).digest("hex");
    },

});
