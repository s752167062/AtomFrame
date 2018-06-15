(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/__node_modules/browserify-aes/modes/cfb8.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {cc._RF.push(module, '', 'cfb8', __filename);var Buffer = require('safe-buffer').Buffer

function encryptByte (self, byteParam, decrypt) {
  var pad = self._cipher.encryptBlock(self._prev)
  var out = pad[0] ^ byteParam

  self._prev = Buffer.concat([
    self._prev.slice(1),
    Buffer.from([decrypt ? byteParam : out])
  ])

  return out
}

exports.encrypt = function (self, chunk, decrypt) {
  var len = chunk.length
  var out = Buffer.allocUnsafe(len)
  var i = -1

  while (++i < len) {
    out[i] = encryptByte(self, chunk[i], decrypt)
  }

  return out
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
        
        