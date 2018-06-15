(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/__node_modules/browserify-aes/modes/index.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {cc._RF.push(module, '', 'index', __filename);var modeModules = {
  ECB: require('./ecb'),
  CBC: require('./cbc'),
  CFB: require('./cfb'),
  CFB8: require('./cfb8'),
  CFB1: require('./cfb1'),
  OFB: require('./ofb'),
  CTR: require('./ctr'),
  GCM: require('./ctr')
}

var modes = require('./list.json')

for (var key in modes) {
  modes[key].module = modeModules[modes[key].mode]
}

module.exports = modes

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
        
        