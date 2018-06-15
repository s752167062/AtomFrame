(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/__node_modules/browserify-des/modes.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {cc._RF.push(module, '', 'modes', __filename);exports['des-ecb'] = {
  key: 8,
  iv: 0
}
exports['des-cbc'] = exports.des = {
  key: 8,
  iv: 8
}
exports['des-ede3-cbc'] = exports.des3 = {
  key: 24,
  iv: 8
}
exports['des-ede3'] = {
  key: 24,
  iv: 0
}
exports['des-ede-cbc'] = {
  key: 16,
  iv: 8
}
exports['des-ede'] = {
  key: 16,
  iv: 0
}

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
        
        