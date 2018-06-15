"use strict";
cc._RF.push(module, '07d22Vx2b9MbomuikVMUX+q', 'gameNetMgr');
// Script/AtomFrame/gameNetMgr.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "gameNetMgr"
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

    obj2HttpParams: function obj2HttpParams(obj) {
        if (typeof obj == "Object") {
            var _str = "?";
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    var element = obj[key];
                    if (_str != "?") {
                        _str += "&";
                    }

                    str += key + "=" + element;
                }
            }
            if (_str == "?") {
                return "";
            } else {
                return _str;
            }
        }
        return "";
    },

    httpGet: function httpGet(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.timeout = 5000; //单位 毫秒
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.setRequestHeader("charset", "UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status < 400) {
                var response = xhr.responseText;
                // console.log(response);
                callback(true, response, xhr.status);
            } else {
                callback(false, "", xhr.status);
            }
        };
        xhr.ontimeout = function (err) {
            console.log("TIME OUT !!!");
            callback(false, err, -1);
        };
        xhr.open("GET", url, true);
        xhr.send();
    },

    httpPost: function httpPost(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.timeout = 5000; //单位 毫秒
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.setRequestHeader("charset", "UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status < 400) {
                var response = xhr.responseText;
                // console.log(response);
                callback(true, response, xhr.status);
            } else {
                callback(false, "", xhr.status);
            }
        };
        xhr.ontimeout = function (err) {
            console.log("TIME OUT !!!");
            callback(false, err, -1);
        };
        xhr.open("POST", url, true);
        xhr.send();
    },

    httpPut: function httpPut(url, data) {
        var xhr = new XMLHttpRequest();
        xhr.timeout = 5000; //单位 毫秒
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.setRequestHeader("charset", "UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status < 400) {
                var response = xhr.responseText;
                console.log(response);
            }
        };
        xhr.ontimeout = function (err) {
            console.log("TIME OUT !!!");
        };
        xhr.open("PUT", url, true);
        xhr.send();
    },

    httpUpload: function httpUpload(url, filepath) {
        var formdata = new FormData();
        formdata.append("file1");
    },

    httpDownloadFile: function httpDownloadFile(url, filename) {}

});

cc._RF.pop();