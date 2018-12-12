/*
    扩展 Component 
    1.游戏中的自定义创建的脚本都应该继承此类
    2.继承的对象通过 this.nodeDict["childname"] 获取子节点对象； 需要注意的是获取的是脚本绑定的节点的子对象 。
    3.对象通用的变量 和 方法的扩展都在这里声明和实现 ,（特殊情况的重载函数即可）

    所有的视图脚本都应该继承这个类， 将所有的控件获取和事件绑定和代理类
*/
cc.Class({
    extends: cc.Component,

    properties: {
        
    },

    onLoad: function(){
        //子类对象的绑定
        this.nodeDict = {};
        var linkWidget = function(self, nodeDict) {
            var children = self.children;
            for (var i = 0; i < children.length; i++) {
                var widgetName = children[i].name;
                if (widgetName && widgetName.indexOf("key_") >= 0) {
                    var nodeName = widgetName.substring(4);
                    if (nodeDict[nodeName]) {
                        cc.error("控件名字重复!" + children[i].name);
                    }
                    nodeDict[nodeName] = children[i];
                }
                if (children[i].childrenCount > 0) {
                    linkWidget(children[i], nodeDict);
                }
            }
        }.bind(this);
        linkWidget(this.node, this.nodeDict);
    },
});
