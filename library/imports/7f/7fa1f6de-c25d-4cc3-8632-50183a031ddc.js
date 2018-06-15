"use strict";
cc._RF.push(module, '7fa1fbewl1Mw4YyUBg6Ax3c', 'fileMgr');
// Script/AtomFrame/fileMgr.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "fileMgr"
    },

    ctor: function ctor() {
        console.log("-new:" + this.TAG);
    },

    onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
    },

    /*  
        文件的读写只支持native平台
        提示文件不存在 or 下载失败，1 检查报错路径 ，2路径没问题时 检查resources 是不是两个 ，3检查资源的UUID ： 项目/library/uuid-to-mtime.json
    */

    /*  resources 的读写 */
    readFileFromRes: function readFileFromRes(path, callback) {
        if (path == null) {
            console.log(" ------ 读取空的文件路径");
            return;
        }
        cc.loader.loadRes(path, function (err, data) {
            if (err) {
                console.log(err.message || err);
                return callback ? callback(null) : null;
            }

            return callback ? callback(data) : null;
        });
    },
    write2FileRes: function write2FileRes(data, path) {
        if (cc.sys.isNative) {
            if (path == null || data == null) {
                console.log(" ------ 写入的内容路径不能为空");
                return;
            }
            var wpath = cc.url.raw(path);
            jsb.fileUtils.writeStringToFile(data, wpath);
        } else {
            console.log(" ----- 不是原生客户端程序");
        }
    },

    writeObj2FileRes: function writeObj2FileRes(obj, path) {
        if (cc.sys.isNative) {
            if (path == null || obj == null) {
                console.log(" ------ 写入的对象路径不能为空");
                return;
            }
            if (typeof obj != "Object") {
                console.log(" ------ 你写入的不是一个对象。请用 write2FileRes");
            }
            var wpath = cc.url.raw(path);
            var _data = JSON.stringify(obj);
            jsb.fileUtils.writeStringToFile(_data, wpath);
        } else {
            console.log(" ----- 不是原生客户端程序");
        }
    },

    /* 程序自定义目录的读写 更多详细 API : http://cocos2d-x.org/docs/api-ref/js/v3x/symbols/jsb.fileUtils.html  */
    readFile: function readFile(path) {
        if (path == null) {
            console.log(" ------ 读取空的文件路径");
            return;
        }
        if (cc.sys.isNative) {
            var _repath = path;
            if (_repath.match("/") == null) {
                _repath = this.fullPathForFileName(path); //jsb.fileUtils.getWritablePath() + path
                console.log(" ------ 读取文件 ", _repath);
            }
            return jsb.fileUtils.getStringFromFile(_repath);
        } else {
            console.log(" ----- 不是原生客户端程序");
        }
    },

    write2File: function write2File(str_data, path) {
        if (cc.sys.isNative) {
            if (str_data == null || path == null) {
                console.log(" ------ 文件写入内容路径不能为空", str_data, path);
                return false;
            }
            var _path = path;
            if (_path.match("/") == null) {
                _path = jsb.fileUtils.getWritablePath() + path;
                console.log(" ------ 文件被存储到 writablePath ", _path);
            }
            return jsb.fileUtils.writeStringToFile(str_data, _path);
        } else {
            console.log(" ------ 文件写操作需要在 设备上使用");
            return false;
        }
    },

    writeObj2File: function writeObj2File(obj, path) {
        if (cc.sys.isNative) {
            if (obj == null || path == null) {
                console.log(" ------ 文件写入对象路径不能为空", obj, path);
                return false;
            }
            var _path = path;
            if (_path.match("/") == null) {
                _path = jsb.fileUtils.getWritablePath() + path;
                console.log(" ------ 文件被存储到 writablePath ", _path);
                return false;
            }
            return jsb.fileUtils.writeToFile(JSON.stringify(obj), _path);
        } else {
            console.log(" ------ 文件写操作需要在 设备上使用");
            return false;
        }
    },

    fullPathForFileName: function fullPathForFileName(name) {
        if (cc.sys.isNative) {
            return jsb.fileUtils.fullPathForFileName(name);
        } else {
            console.log(" ------ 文件写操作需要在 设备上使用");
            return false;
        }
    },

    fullPathForRelativeFile: function name(path, name) {
        if (cc.sys.isNative) {
            return jsb.fileUtils.fullPathForRelativeFile(path, name);
        } else {
            console.log(" ------ 文件写操作需要在 设备上使用");
            return false;
        }
    },

    getWritablePath: function getWritablePath() {
        if (cc.sys.isNative) {
            return jsb.fileUtils.getWritablePath();
        } else {
            console.log(" ------ 文件写操作需要在 设备上使用");
            return false;
        }
    },

    isFileExist: function isFileExist(path) {
        if (cc.sys.isNative) {
            return jsb.fileUtils.isFileExist(path);
        } else {
            console.log(" ------ 文件写操作需要在 设备上使用");
            return false;
        }
    },

    isDirectoryExist: function isDirectoryExist(path) {
        if (cc.sys.isNative) {
            return jsb.fileUtils.isDirectoryExist(path);
        } else {
            console.log(" ------ 文件写操作需要在 设备上使用");
            return false;
        }
    },

    removeFile: function removeFile(path) {
        if (cc.sys.isNative) {
            return jsb.fileUtils.removeFile(path);
        } else {
            console.log(" ------ 文件写操作需要在 设备上使用");
            return false;
        }
    },

    removeDirectory: function removeDirectory(path) {
        if (cc.sys.isNative) {
            if (this.isDirectoryExist(path)) {
                return jsb.fileUtils.removeDirectory(path);
            } else {
                console.log(" ----- 目录不存在 无需删除");
                return true;
            }
        } else {
            console.log(" ------ 文件写操作需要在 设备上使用");
            return false;
        }
    },

    renameFile: function renameFile(path, oldname, newname) {
        if (cc.sys.isNative) {
            return jsb.fileUtils.renameFile(path, oldname, newname);
        } else {
            console.log(" ------ 文件写操作需要在 设备上使用");
            return false;
        }
    }

});

cc._RF.pop();