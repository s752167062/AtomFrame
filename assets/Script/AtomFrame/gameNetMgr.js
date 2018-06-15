
cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "gameNetMgr",
    },

    ctor: function () {
        console.log("-new:" + this.TAG);
    },

    onLoad: function () {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function () {
        console.log("-destory:" + this.TAG);
    },

    obj2HttpParams: function (obj) {
        if (typeof(obj)== "Object") {
            var _str = "?"
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const element = obj[key];
                    if(_str != "?"){
                        _str += "&";
                    }

                    str += (key + "=" + element)
                }
            } 
            if(_str == "?"){
                return ""
            }else{
                return _str
            }
        }
        return ""
    },

    httpGet: function (url , callback) {
        var xhr = new XMLHttpRequest();
        xhr.timeout = 5000 ;//单位 毫秒
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.setRequestHeader("charset" , "UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status < 400)) {
                var response = xhr.responseText;
                // console.log(response);
                callback(true, response, xhr.status)
            }else{
                callback(false, "" , xhr.status)
            }
        };
        xhr.ontimeout = function (err) {
            console.log("TIME OUT !!!");
            callback(false, err, -1)
        };
        xhr.open("GET", url, true);
        xhr.send();
    },

    httpPost: function (url , callback) {
        var xhr = new XMLHttpRequest();
        xhr.timeout = 5000;//单位 毫秒
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.setRequestHeader("charset", "UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status < 400)) {
                var response = xhr.responseText;
                // console.log(response);
                callback(true, response, xhr.status)
            } else {
                callback(false, "", xhr.status)
            }
        };
        xhr.ontimeout = function (err) {
            console.log("TIME OUT !!!");
            callback(false, err, -1)
        };
        xhr.open("POST", url, true);
        xhr.send();
    },

    httpPut: function (url , data) {
        var xhr = new XMLHttpRequest();
        xhr.timeout = 5000;//单位 毫秒
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.setRequestHeader("charset", "UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status < 400)) {
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

    httpUpload: function (url , filepath) {
        var formdata = new FormData();
        formdata.append("file1" , )
    },

    httpDownloadFile: function (url ,filename){
           
    }

});
