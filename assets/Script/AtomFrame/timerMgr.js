
/**
有关Component 组件的计时器 参考 https://github.com/cocos-creator/engine/blob/master/cocos2d/core/components/CCComponent.js#L541
*/
cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "timerMgr",
        TASK_TYPE_RE  : 1,
        TASK_TYPE_ONE : 2,
    },

    ctor: function () {
        console.log("-new:" + this.TAG);
        this.tasklist = {};
        // this.schedule(this.mUpdate, 0);

        var scheduler = cc.director.getScheduler();
        scheduler.schedule(this.mUpdate, this, 0, cc.macro.REPEAT_FOREVER, 0, false);
    },

    onLoad: function () {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function () {
        console.log("-destory:" + this.TAG);
        // this.unschedule(this.mUpdate)

        cc.director.getScheduler().unschedule(this.mUpdate, this);
    },

    mUpdate: function (t) {
        // console.log("-mUpdate",t,this.TAG);
        for (var key in this.tasklist) {
            if (this.tasklist.hasOwnProperty(key)) {
                var item = this.tasklist[key]
                if (item != null) {
                    if (item.remove == false) {
                        item.cd_t += t;
                        if (item.cd_t > item.time) {
                            item.cd_t = 0;
                            item.callback();
                            console.log("update task : ", key, item.taskType);
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

    registerTask: function (_taskName , _taskType , _callback , _time ) {
        if (this.tasklist[_taskName] != null){
            console.log(" !!! task already exist :", _taskName);
            return ;
        }

        var item = {}
        item.taskName = _taskName;
        item.taskType = _taskType;
        item.callback = _callback;
        item.time     = _time;
        item.cd_t     = 0;
        item.remove   = false;

        this.tasklist[_taskName] = item;
    },

    cleanTask: function (_taskName) {
        this.tasklist[_taskName] = null;
    },

    cleanAllTask: function () {
        this.tasklist = {};
    },

    checkTask: function (_taskName) {
        return this.tasklist[_taskName] != null ;
    },

});
