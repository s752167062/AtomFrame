__require = function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var b = o.split("/");
        b = b[b.length - 1];
        if (!t[b]) {
          var a = "function" == typeof __require && __require;
          if (!u && a) return a(b, !0);
          if (i) return i(b, !0);
          throw new Error("Cannot find module '" + o + "'");
        }
      }
      var f = n[o] = {
        exports: {}
      };
      t[o][0].call(f.exports, function(e) {
        var n = t[o][1][e];
        return s(n || e);
      }, f, f.exports, e, t, n, r);
    }
    return n[o].exports;
  }
  var i = "function" == typeof __require && __require;
  for (var o = 0; o < r.length; o++) s(r[o]);
  return s;
}({
  1: [ function(require, module, exports) {
    var asn1 = exports;
    asn1.bignum = require("bn.js");
    asn1.define = require("./asn1/api").define;
    asn1.base = require("./asn1/base");
    asn1.constants = require("./asn1/constants");
    asn1.decoders = require("./asn1/decoders");
    asn1.encoders = require("./asn1/encoders");
  }, {
    "./asn1/api": 2,
    "./asn1/base": 4,
    "./asn1/constants": 8,
    "./asn1/decoders": 10,
    "./asn1/encoders": 13,
    "bn.js": 16
  } ],
  2: [ function(require, module, exports) {
    var asn1 = require("../asn1");
    var inherits = require("inherits");
    var api = exports;
    api.define = function define(name, body) {
      return new Entity(name, body);
    };
    function Entity(name, body) {
      this.name = name;
      this.body = body;
      this.decoders = {};
      this.encoders = {};
    }
    Entity.prototype._createNamed = function createNamed(base) {
      var named;
      try {
        named = require("vm").runInThisContext("(function " + this.name + "(entity) {\n  this._initNamed(entity);\n})");
      } catch (e) {
        named = function(entity) {
          this._initNamed(entity);
        };
      }
      inherits(named, base);
      named.prototype._initNamed = function initnamed(entity) {
        base.call(this, entity);
      };
      return new named(this);
    };
    Entity.prototype._getDecoder = function _getDecoder(enc) {
      enc = enc || "der";
      this.decoders.hasOwnProperty(enc) || (this.decoders[enc] = this._createNamed(asn1.decoders[enc]));
      return this.decoders[enc];
    };
    Entity.prototype.decode = function decode(data, enc, options) {
      return this._getDecoder(enc).decode(data, options);
    };
    Entity.prototype._getEncoder = function _getEncoder(enc) {
      enc = enc || "der";
      this.encoders.hasOwnProperty(enc) || (this.encoders[enc] = this._createNamed(asn1.encoders[enc]));
      return this.encoders[enc];
    };
    Entity.prototype.encode = function encode(data, enc, reporter) {
      return this._getEncoder(enc).encode(data, reporter);
    };
  }, {
    "../asn1": 1,
    inherits: 101,
    vm: 156
  } ],
  3: [ function(require, module, exports) {
    var inherits = require("inherits");
    var Reporter = require("../base").Reporter;
    var Buffer = require("buffer").Buffer;
    function DecoderBuffer(base, options) {
      Reporter.call(this, options);
      if (!Buffer.isBuffer(base)) {
        this.error("Input not Buffer");
        return;
      }
      this.base = base;
      this.offset = 0;
      this.length = base.length;
    }
    inherits(DecoderBuffer, Reporter);
    exports.DecoderBuffer = DecoderBuffer;
    DecoderBuffer.prototype.save = function save() {
      return {
        offset: this.offset,
        reporter: Reporter.prototype.save.call(this)
      };
    };
    DecoderBuffer.prototype.restore = function restore(save) {
      var res = new DecoderBuffer(this.base);
      res.offset = save.offset;
      res.length = this.offset;
      this.offset = save.offset;
      Reporter.prototype.restore.call(this, save.reporter);
      return res;
    };
    DecoderBuffer.prototype.isEmpty = function isEmpty() {
      return this.offset === this.length;
    };
    DecoderBuffer.prototype.readUInt8 = function readUInt8(fail) {
      return this.offset + 1 <= this.length ? this.base.readUInt8(this.offset++, true) : this.error(fail || "DecoderBuffer overrun");
    };
    DecoderBuffer.prototype.skip = function skip(bytes, fail) {
      if (!(this.offset + bytes <= this.length)) return this.error(fail || "DecoderBuffer overrun");
      var res = new DecoderBuffer(this.base);
      res._reporterState = this._reporterState;
      res.offset = this.offset;
      res.length = this.offset + bytes;
      this.offset += bytes;
      return res;
    };
    DecoderBuffer.prototype.raw = function raw(save) {
      return this.base.slice(save ? save.offset : this.offset, this.length);
    };
    function EncoderBuffer(value, reporter) {
      if (Array.isArray(value)) {
        this.length = 0;
        this.value = value.map(function(item) {
          item instanceof EncoderBuffer || (item = new EncoderBuffer(item, reporter));
          this.length += item.length;
          return item;
        }, this);
      } else if ("number" === typeof value) {
        if (!(0 <= value && value <= 255)) return reporter.error("non-byte EncoderBuffer value");
        this.value = value;
        this.length = 1;
      } else if ("string" === typeof value) {
        this.value = value;
        this.length = Buffer.byteLength(value);
      } else {
        if (!Buffer.isBuffer(value)) return reporter.error("Unsupported type: " + typeof value);
        this.value = value;
        this.length = value.length;
      }
    }
    exports.EncoderBuffer = EncoderBuffer;
    EncoderBuffer.prototype.join = function join(out, offset) {
      out || (out = new Buffer(this.length));
      offset || (offset = 0);
      if (0 === this.length) return out;
      if (Array.isArray(this.value)) this.value.forEach(function(item) {
        item.join(out, offset);
        offset += item.length;
      }); else {
        "number" === typeof this.value ? out[offset] = this.value : "string" === typeof this.value ? out.write(this.value, offset) : Buffer.isBuffer(this.value) && this.value.copy(out, offset);
        offset += this.length;
      }
      return out;
    };
  }, {
    "../base": 4,
    buffer: 47,
    inherits: 101
  } ],
  4: [ function(require, module, exports) {
    var base = exports;
    base.Reporter = require("./reporter").Reporter;
    base.DecoderBuffer = require("./buffer").DecoderBuffer;
    base.EncoderBuffer = require("./buffer").EncoderBuffer;
    base.Node = require("./node");
  }, {
    "./buffer": 3,
    "./node": 5,
    "./reporter": 6
  } ],
  5: [ function(require, module, exports) {
    var Reporter = require("../base").Reporter;
    var EncoderBuffer = require("../base").EncoderBuffer;
    var DecoderBuffer = require("../base").DecoderBuffer;
    var assert = require("minimalistic-assert");
    var tags = [ "seq", "seqof", "set", "setof", "objid", "bool", "gentime", "utctime", "null_", "enum", "int", "objDesc", "bitstr", "bmpstr", "charstr", "genstr", "graphstr", "ia5str", "iso646str", "numstr", "octstr", "printstr", "t61str", "unistr", "utf8str", "videostr" ];
    var methods = [ "key", "obj", "use", "optional", "explicit", "implicit", "def", "choice", "any", "contains" ].concat(tags);
    var overrided = [ "_peekTag", "_decodeTag", "_use", "_decodeStr", "_decodeObjid", "_decodeTime", "_decodeNull", "_decodeInt", "_decodeBool", "_decodeList", "_encodeComposite", "_encodeStr", "_encodeObjid", "_encodeTime", "_encodeNull", "_encodeInt", "_encodeBool" ];
    function Node(enc, parent) {
      var state = {};
      this._baseState = state;
      state.enc = enc;
      state.parent = parent || null;
      state.children = null;
      state.tag = null;
      state.args = null;
      state.reverseArgs = null;
      state.choice = null;
      state.optional = false;
      state.any = false;
      state.obj = false;
      state.use = null;
      state.useDecoder = null;
      state.key = null;
      state["default"] = null;
      state.explicit = null;
      state.implicit = null;
      state.contains = null;
      if (!state.parent) {
        state.children = [];
        this._wrap();
      }
    }
    module.exports = Node;
    var stateProps = [ "enc", "parent", "children", "tag", "args", "reverseArgs", "choice", "optional", "any", "obj", "use", "alteredUse", "key", "default", "explicit", "implicit", "contains" ];
    Node.prototype.clone = function clone() {
      var state = this._baseState;
      var cstate = {};
      stateProps.forEach(function(prop) {
        cstate[prop] = state[prop];
      });
      var res = new this.constructor(cstate.parent);
      res._baseState = cstate;
      return res;
    };
    Node.prototype._wrap = function wrap() {
      var state = this._baseState;
      methods.forEach(function(method) {
        this[method] = function _wrappedMethod() {
          var clone = new this.constructor(this);
          state.children.push(clone);
          return clone[method].apply(clone, arguments);
        };
      }, this);
    };
    Node.prototype._init = function init(body) {
      var state = this._baseState;
      assert(null === state.parent);
      body.call(this);
      state.children = state.children.filter(function(child) {
        return child._baseState.parent === this;
      }, this);
      assert.equal(state.children.length, 1, "Root node can have only one child");
    };
    Node.prototype._useArgs = function useArgs(args) {
      var state = this._baseState;
      var children = args.filter(function(arg) {
        return arg instanceof this.constructor;
      }, this);
      args = args.filter(function(arg) {
        return !(arg instanceof this.constructor);
      }, this);
      if (0 !== children.length) {
        assert(null === state.children);
        state.children = children;
        children.forEach(function(child) {
          child._baseState.parent = this;
        }, this);
      }
      if (0 !== args.length) {
        assert(null === state.args);
        state.args = args;
        state.reverseArgs = args.map(function(arg) {
          if ("object" !== typeof arg || arg.constructor !== Object) return arg;
          var res = {};
          Object.keys(arg).forEach(function(key) {
            key == (0 | key) && (key |= 0);
            var value = arg[key];
            res[value] = key;
          });
          return res;
        });
      }
    };
    overrided.forEach(function(method) {
      Node.prototype[method] = function _overrided() {
        var state = this._baseState;
        throw new Error(method + " not implemented for encoding: " + state.enc);
      };
    });
    tags.forEach(function(tag) {
      Node.prototype[tag] = function _tagMethod() {
        var state = this._baseState;
        var args = Array.prototype.slice.call(arguments);
        assert(null === state.tag);
        state.tag = tag;
        this._useArgs(args);
        return this;
      };
    });
    Node.prototype.use = function use(item) {
      assert(item);
      var state = this._baseState;
      assert(null === state.use);
      state.use = item;
      return this;
    };
    Node.prototype.optional = function optional() {
      var state = this._baseState;
      state.optional = true;
      return this;
    };
    Node.prototype.def = function def(val) {
      var state = this._baseState;
      assert(null === state["default"]);
      state["default"] = val;
      state.optional = true;
      return this;
    };
    Node.prototype.explicit = function explicit(num) {
      var state = this._baseState;
      assert(null === state.explicit && null === state.implicit);
      state.explicit = num;
      return this;
    };
    Node.prototype.implicit = function implicit(num) {
      var state = this._baseState;
      assert(null === state.explicit && null === state.implicit);
      state.implicit = num;
      return this;
    };
    Node.prototype.obj = function obj() {
      var state = this._baseState;
      var args = Array.prototype.slice.call(arguments);
      state.obj = true;
      0 !== args.length && this._useArgs(args);
      return this;
    };
    Node.prototype.key = function key(newKey) {
      var state = this._baseState;
      assert(null === state.key);
      state.key = newKey;
      return this;
    };
    Node.prototype.any = function any() {
      var state = this._baseState;
      state.any = true;
      return this;
    };
    Node.prototype.choice = function choice(obj) {
      var state = this._baseState;
      assert(null === state.choice);
      state.choice = obj;
      this._useArgs(Object.keys(obj).map(function(key) {
        return obj[key];
      }));
      return this;
    };
    Node.prototype.contains = function contains(item) {
      var state = this._baseState;
      assert(null === state.use);
      state.contains = item;
      return this;
    };
    Node.prototype._decode = function decode(input, options) {
      var state = this._baseState;
      if (null === state.parent) return input.wrapResult(state.children[0]._decode(input, options));
      var result = state["default"];
      var present = true;
      var prevKey = null;
      null !== state.key && (prevKey = input.enterKey(state.key));
      if (state.optional) {
        var tag = null;
        null !== state.explicit ? tag = state.explicit : null !== state.implicit ? tag = state.implicit : null !== state.tag && (tag = state.tag);
        if (null !== tag || state.any) {
          present = this._peekTag(input, tag, state.any);
          if (input.isError(present)) return present;
        } else {
          var save = input.save();
          try {
            null === state.choice ? this._decodeGeneric(state.tag, input, options) : this._decodeChoice(input, options);
            present = true;
          } catch (e) {
            present = false;
          }
          input.restore(save);
        }
      }
      var prevObj;
      state.obj && present && (prevObj = input.enterObject());
      if (present) {
        if (null !== state.explicit) {
          var explicit = this._decodeTag(input, state.explicit);
          if (input.isError(explicit)) return explicit;
          input = explicit;
        }
        var start = input.offset;
        if (null === state.use && null === state.choice) {
          if (state.any) var save = input.save();
          var body = this._decodeTag(input, null !== state.implicit ? state.implicit : state.tag, state.any);
          if (input.isError(body)) return body;
          state.any ? result = input.raw(save) : input = body;
        }
        options && options.track && null !== state.tag && options.track(input.path(), start, input.length, "tagged");
        options && options.track && null !== state.tag && options.track(input.path(), input.offset, input.length, "content");
        result = state.any ? result : null === state.choice ? this._decodeGeneric(state.tag, input, options) : this._decodeChoice(input, options);
        if (input.isError(result)) return result;
        state.any || null !== state.choice || null === state.children || state.children.forEach(function decodeChildren(child) {
          child._decode(input, options);
        });
        if (state.contains && ("octstr" === state.tag || "bitstr" === state.tag)) {
          var data = new DecoderBuffer(result);
          result = this._getUse(state.contains, input._reporterState.obj)._decode(data, options);
        }
      }
      state.obj && present && (result = input.leaveObject(prevObj));
      null === state.key || null === result && true !== present ? null !== prevKey && input.exitKey(prevKey) : input.leaveKey(prevKey, state.key, result);
      return result;
    };
    Node.prototype._decodeGeneric = function decodeGeneric(tag, input, options) {
      var state = this._baseState;
      if ("seq" === tag || "set" === tag) return null;
      if ("seqof" === tag || "setof" === tag) return this._decodeList(input, tag, state.args[0], options);
      if (/str$/.test(tag)) return this._decodeStr(input, tag, options);
      if ("objid" === tag && state.args) return this._decodeObjid(input, state.args[0], state.args[1], options);
      if ("objid" === tag) return this._decodeObjid(input, null, null, options);
      if ("gentime" === tag || "utctime" === tag) return this._decodeTime(input, tag, options);
      if ("null_" === tag) return this._decodeNull(input, options);
      if ("bool" === tag) return this._decodeBool(input, options);
      if ("objDesc" === tag) return this._decodeStr(input, tag, options);
      if ("int" === tag || "enum" === tag) return this._decodeInt(input, state.args && state.args[0], options);
      return null !== state.use ? this._getUse(state.use, input._reporterState.obj)._decode(input, options) : input.error("unknown tag: " + tag);
    };
    Node.prototype._getUse = function _getUse(entity, obj) {
      var state = this._baseState;
      state.useDecoder = this._use(entity, obj);
      assert(null === state.useDecoder._baseState.parent);
      state.useDecoder = state.useDecoder._baseState.children[0];
      if (state.implicit !== state.useDecoder._baseState.implicit) {
        state.useDecoder = state.useDecoder.clone();
        state.useDecoder._baseState.implicit = state.implicit;
      }
      return state.useDecoder;
    };
    Node.prototype._decodeChoice = function decodeChoice(input, options) {
      var state = this._baseState;
      var result = null;
      var match = false;
      Object.keys(state.choice).some(function(key) {
        var save = input.save();
        var node = state.choice[key];
        try {
          var value = node._decode(input, options);
          if (input.isError(value)) return false;
          result = {
            type: key,
            value: value
          };
          match = true;
        } catch (e) {
          input.restore(save);
          return false;
        }
        return true;
      }, this);
      if (!match) return input.error("Choice not matched");
      return result;
    };
    Node.prototype._createEncoderBuffer = function createEncoderBuffer(data) {
      return new EncoderBuffer(data, this.reporter);
    };
    Node.prototype._encode = function encode(data, reporter, parent) {
      var state = this._baseState;
      if (null !== state["default"] && state["default"] === data) return;
      var result = this._encodeValue(data, reporter, parent);
      if (void 0 === result) return;
      if (this._skipDefault(result, reporter, parent)) return;
      return result;
    };
    Node.prototype._encodeValue = function encode(data, reporter, parent) {
      var state = this._baseState;
      if (null === state.parent) return state.children[0]._encode(data, reporter || new Reporter());
      var result = null;
      this.reporter = reporter;
      if (state.optional && void 0 === data) {
        if (null === state["default"]) return;
        data = state["default"];
      }
      var content = null;
      var primitive = false;
      if (state.any) result = this._createEncoderBuffer(data); else if (state.choice) result = this._encodeChoice(data, reporter); else if (state.contains) {
        content = this._getUse(state.contains, parent)._encode(data, reporter);
        primitive = true;
      } else if (state.children) {
        content = state.children.map(function(child) {
          if ("null_" === child._baseState.tag) return child._encode(null, reporter, data);
          if (null === child._baseState.key) return reporter.error("Child should have a key");
          var prevKey = reporter.enterKey(child._baseState.key);
          if ("object" !== typeof data) return reporter.error("Child expected, but input is not object");
          var res = child._encode(data[child._baseState.key], reporter, data);
          reporter.leaveKey(prevKey);
          return res;
        }, this).filter(function(child) {
          return child;
        });
        content = this._createEncoderBuffer(content);
      } else if ("seqof" === state.tag || "setof" === state.tag) {
        if (!(state.args && 1 === state.args.length)) return reporter.error("Too many args for : " + state.tag);
        if (!Array.isArray(data)) return reporter.error("seqof/setof, but data is not Array");
        var child = this.clone();
        child._baseState.implicit = null;
        content = this._createEncoderBuffer(data.map(function(item) {
          var state = this._baseState;
          return this._getUse(state.args[0], data)._encode(item, reporter);
        }, child));
      } else if (null !== state.use) result = this._getUse(state.use, parent)._encode(data, reporter); else {
        content = this._encodePrimitive(state.tag, data);
        primitive = true;
      }
      var result;
      if (!state.any && null === state.choice) {
        var tag = null !== state.implicit ? state.implicit : state.tag;
        var cls = null === state.implicit ? "universal" : "context";
        null === tag ? null === state.use && reporter.error("Tag could be omitted only for .use()") : null === state.use && (result = this._encodeComposite(tag, primitive, cls, content));
      }
      null !== state.explicit && (result = this._encodeComposite(state.explicit, false, "context", result));
      return result;
    };
    Node.prototype._encodeChoice = function encodeChoice(data, reporter) {
      var state = this._baseState;
      var node = state.choice[data.type];
      node || assert(false, data.type + " not found in " + JSON.stringify(Object.keys(state.choice)));
      return node._encode(data.value, reporter);
    };
    Node.prototype._encodePrimitive = function encodePrimitive(tag, data) {
      var state = this._baseState;
      if (/str$/.test(tag)) return this._encodeStr(data, tag);
      if ("objid" === tag && state.args) return this._encodeObjid(data, state.reverseArgs[0], state.args[1]);
      if ("objid" === tag) return this._encodeObjid(data, null, null);
      if ("gentime" === tag || "utctime" === tag) return this._encodeTime(data, tag);
      if ("null_" === tag) return this._encodeNull();
      if ("int" === tag || "enum" === tag) return this._encodeInt(data, state.args && state.reverseArgs[0]);
      if ("bool" === tag) return this._encodeBool(data);
      if ("objDesc" === tag) return this._encodeStr(data, tag);
      throw new Error("Unsupported tag: " + tag);
    };
    Node.prototype._isNumstr = function isNumstr(str) {
      return /^[0-9 ]*$/.test(str);
    };
    Node.prototype._isPrintstr = function isPrintstr(str) {
      return /^[A-Za-z0-9 '\(\)\+,\-\.\/:=\?]*$/.test(str);
    };
  }, {
    "../base": 4,
    "minimalistic-assert": 105
  } ],
  6: [ function(require, module, exports) {
    var inherits = require("inherits");
    function Reporter(options) {
      this._reporterState = {
        obj: null,
        path: [],
        options: options || {},
        errors: []
      };
    }
    exports.Reporter = Reporter;
    Reporter.prototype.isError = function isError(obj) {
      return obj instanceof ReporterError;
    };
    Reporter.prototype.save = function save() {
      var state = this._reporterState;
      return {
        obj: state.obj,
        pathLen: state.path.length
      };
    };
    Reporter.prototype.restore = function restore(data) {
      var state = this._reporterState;
      state.obj = data.obj;
      state.path = state.path.slice(0, data.pathLen);
    };
    Reporter.prototype.enterKey = function enterKey(key) {
      return this._reporterState.path.push(key);
    };
    Reporter.prototype.exitKey = function exitKey(index) {
      var state = this._reporterState;
      state.path = state.path.slice(0, index - 1);
    };
    Reporter.prototype.leaveKey = function leaveKey(index, key, value) {
      var state = this._reporterState;
      this.exitKey(index);
      null !== state.obj && (state.obj[key] = value);
    };
    Reporter.prototype.path = function path() {
      return this._reporterState.path.join("/");
    };
    Reporter.prototype.enterObject = function enterObject() {
      var state = this._reporterState;
      var prev = state.obj;
      state.obj = {};
      return prev;
    };
    Reporter.prototype.leaveObject = function leaveObject(prev) {
      var state = this._reporterState;
      var now = state.obj;
      state.obj = prev;
      return now;
    };
    Reporter.prototype.error = function error(msg) {
      var err;
      var state = this._reporterState;
      var inherited = msg instanceof ReporterError;
      err = inherited ? msg : new ReporterError(state.path.map(function(elem) {
        return "[" + JSON.stringify(elem) + "]";
      }).join(""), msg.message || msg, msg.stack);
      if (!state.options.partial) throw err;
      inherited || state.errors.push(err);
      return err;
    };
    Reporter.prototype.wrapResult = function wrapResult(result) {
      var state = this._reporterState;
      if (!state.options.partial) return result;
      return {
        result: this.isError(result) ? null : result,
        errors: state.errors
      };
    };
    function ReporterError(path, msg) {
      this.path = path;
      this.rethrow(msg);
    }
    inherits(ReporterError, Error);
    ReporterError.prototype.rethrow = function rethrow(msg) {
      this.message = msg + " at: " + (this.path || "(shallow)");
      Error.captureStackTrace && Error.captureStackTrace(this, ReporterError);
      if (!this.stack) try {
        throw new Error(this.message);
      } catch (e) {
        this.stack = e.stack;
      }
      return this;
    };
  }, {
    inherits: 101
  } ],
  7: [ function(require, module, exports) {
    var constants = require("../constants");
    exports.tagClass = {
      0: "universal",
      1: "application",
      2: "context",
      3: "private"
    };
    exports.tagClassByName = constants._reverse(exports.tagClass);
    exports.tag = {
      0: "end",
      1: "bool",
      2: "int",
      3: "bitstr",
      4: "octstr",
      5: "null_",
      6: "objid",
      7: "objDesc",
      8: "external",
      9: "real",
      10: "enum",
      11: "embed",
      12: "utf8str",
      13: "relativeOid",
      16: "seq",
      17: "set",
      18: "numstr",
      19: "printstr",
      20: "t61str",
      21: "videostr",
      22: "ia5str",
      23: "utctime",
      24: "gentime",
      25: "graphstr",
      26: "iso646str",
      27: "genstr",
      28: "unistr",
      29: "charstr",
      30: "bmpstr"
    };
    exports.tagByName = constants._reverse(exports.tag);
  }, {
    "../constants": 8
  } ],
  8: [ function(require, module, exports) {
    var constants = exports;
    constants._reverse = function reverse(map) {
      var res = {};
      Object.keys(map).forEach(function(key) {
        (0 | key) == key && (key |= 0);
        var value = map[key];
        res[value] = key;
      });
      return res;
    };
    constants.der = require("./der");
  }, {
    "./der": 7
  } ],
  9: [ function(require, module, exports) {
    var inherits = require("inherits");
    var asn1 = require("../../asn1");
    var base = asn1.base;
    var bignum = asn1.bignum;
    var der = asn1.constants.der;
    function DERDecoder(entity) {
      this.enc = "der";
      this.name = entity.name;
      this.entity = entity;
      this.tree = new DERNode();
      this.tree._init(entity.body);
    }
    module.exports = DERDecoder;
    DERDecoder.prototype.decode = function decode(data, options) {
      data instanceof base.DecoderBuffer || (data = new base.DecoderBuffer(data, options));
      return this.tree._decode(data, options);
    };
    function DERNode(parent) {
      base.Node.call(this, "der", parent);
    }
    inherits(DERNode, base.Node);
    DERNode.prototype._peekTag = function peekTag(buffer, tag, any) {
      if (buffer.isEmpty()) return false;
      var state = buffer.save();
      var decodedTag = derDecodeTag(buffer, 'Failed to peek tag: "' + tag + '"');
      if (buffer.isError(decodedTag)) return decodedTag;
      buffer.restore(state);
      return decodedTag.tag === tag || decodedTag.tagStr === tag || decodedTag.tagStr + "of" === tag || any;
    };
    DERNode.prototype._decodeTag = function decodeTag(buffer, tag, any) {
      var decodedTag = derDecodeTag(buffer, 'Failed to decode tag of "' + tag + '"');
      if (buffer.isError(decodedTag)) return decodedTag;
      var len = derDecodeLen(buffer, decodedTag.primitive, 'Failed to get length of "' + tag + '"');
      if (buffer.isError(len)) return len;
      if (!any && decodedTag.tag !== tag && decodedTag.tagStr !== tag && decodedTag.tagStr + "of" !== tag) return buffer.error('Failed to match tag: "' + tag + '"');
      if (decodedTag.primitive || null !== len) return buffer.skip(len, 'Failed to match body of: "' + tag + '"');
      var state = buffer.save();
      var res = this._skipUntilEnd(buffer, 'Failed to skip indefinite length body: "' + this.tag + '"');
      if (buffer.isError(res)) return res;
      len = buffer.offset - state.offset;
      buffer.restore(state);
      return buffer.skip(len, 'Failed to match body of: "' + tag + '"');
    };
    DERNode.prototype._skipUntilEnd = function skipUntilEnd(buffer, fail) {
      while (true) {
        var tag = derDecodeTag(buffer, fail);
        if (buffer.isError(tag)) return tag;
        var len = derDecodeLen(buffer, tag.primitive, fail);
        if (buffer.isError(len)) return len;
        var res;
        res = tag.primitive || null !== len ? buffer.skip(len) : this._skipUntilEnd(buffer, fail);
        if (buffer.isError(res)) return res;
        if ("end" === tag.tagStr) break;
      }
    };
    DERNode.prototype._decodeList = function decodeList(buffer, tag, decoder, options) {
      var result = [];
      while (!buffer.isEmpty()) {
        var possibleEnd = this._peekTag(buffer, "end");
        if (buffer.isError(possibleEnd)) return possibleEnd;
        var res = decoder.decode(buffer, "der", options);
        if (buffer.isError(res) && possibleEnd) break;
        result.push(res);
      }
      return result;
    };
    DERNode.prototype._decodeStr = function decodeStr(buffer, tag) {
      if ("bitstr" === tag) {
        var unused = buffer.readUInt8();
        if (buffer.isError(unused)) return unused;
        return {
          unused: unused,
          data: buffer.raw()
        };
      }
      if ("bmpstr" === tag) {
        var raw = buffer.raw();
        if (raw.length % 2 === 1) return buffer.error("Decoding of string type: bmpstr length mismatch");
        var str = "";
        for (var i = 0; i < raw.length / 2; i++) str += String.fromCharCode(raw.readUInt16BE(2 * i));
        return str;
      }
      if ("numstr" === tag) {
        var numstr = buffer.raw().toString("ascii");
        if (!this._isNumstr(numstr)) return buffer.error("Decoding of string type: numstr unsupported characters");
        return numstr;
      }
      if ("octstr" === tag) return buffer.raw();
      if ("objDesc" === tag) return buffer.raw();
      if ("printstr" === tag) {
        var printstr = buffer.raw().toString("ascii");
        if (!this._isPrintstr(printstr)) return buffer.error("Decoding of string type: printstr unsupported characters");
        return printstr;
      }
      return /str$/.test(tag) ? buffer.raw().toString() : buffer.error("Decoding of string type: " + tag + " unsupported");
    };
    DERNode.prototype._decodeObjid = function decodeObjid(buffer, values, relative) {
      var result;
      var identifiers = [];
      var ident = 0;
      while (!buffer.isEmpty()) {
        var subident = buffer.readUInt8();
        ident <<= 7;
        ident |= 127 & subident;
        if (0 === (128 & subident)) {
          identifiers.push(ident);
          ident = 0;
        }
      }
      128 & subident && identifiers.push(ident);
      var first = identifiers[0] / 40 | 0;
      var second = identifiers[0] % 40;
      result = relative ? identifiers : [ first, second ].concat(identifiers.slice(1));
      if (values) {
        var tmp = values[result.join(" ")];
        void 0 === tmp && (tmp = values[result.join(".")]);
        void 0 !== tmp && (result = tmp);
      }
      return result;
    };
    DERNode.prototype._decodeTime = function decodeTime(buffer, tag) {
      var str = buffer.raw().toString();
      if ("gentime" === tag) {
        var year = 0 | str.slice(0, 4);
        var mon = 0 | str.slice(4, 6);
        var day = 0 | str.slice(6, 8);
        var hour = 0 | str.slice(8, 10);
        var min = 0 | str.slice(10, 12);
        var sec = 0 | str.slice(12, 14);
      } else {
        if ("utctime" !== tag) return buffer.error("Decoding " + tag + " time is not supported yet");
        var year = 0 | str.slice(0, 2);
        var mon = 0 | str.slice(2, 4);
        var day = 0 | str.slice(4, 6);
        var hour = 0 | str.slice(6, 8);
        var min = 0 | str.slice(8, 10);
        var sec = 0 | str.slice(10, 12);
        year = year < 70 ? 2e3 + year : 1900 + year;
      }
      return Date.UTC(year, mon - 1, day, hour, min, sec, 0);
    };
    DERNode.prototype._decodeNull = function decodeNull(buffer) {
      return null;
    };
    DERNode.prototype._decodeBool = function decodeBool(buffer) {
      var res = buffer.readUInt8();
      return buffer.isError(res) ? res : 0 !== res;
    };
    DERNode.prototype._decodeInt = function decodeInt(buffer, values) {
      var raw = buffer.raw();
      var res = new bignum(raw);
      values && (res = values[res.toString(10)] || res);
      return res;
    };
    DERNode.prototype._use = function use(entity, obj) {
      "function" === typeof entity && (entity = entity(obj));
      return entity._getDecoder("der").tree;
    };
    function derDecodeTag(buf, fail) {
      var tag = buf.readUInt8(fail);
      if (buf.isError(tag)) return tag;
      var cls = der.tagClass[tag >> 6];
      var primitive = 0 === (32 & tag);
      if (31 === (31 & tag)) {
        var oct = tag;
        tag = 0;
        while (128 === (128 & oct)) {
          oct = buf.readUInt8(fail);
          if (buf.isError(oct)) return oct;
          tag <<= 7;
          tag |= 127 & oct;
        }
      } else tag &= 31;
      var tagStr = der.tag[tag];
      return {
        cls: cls,
        primitive: primitive,
        tag: tag,
        tagStr: tagStr
      };
    }
    function derDecodeLen(buf, primitive, fail) {
      var len = buf.readUInt8(fail);
      if (buf.isError(len)) return len;
      if (!primitive && 128 === len) return null;
      if (0 === (128 & len)) return len;
      var num = 127 & len;
      if (num > 4) return buf.error("length octect is too long");
      len = 0;
      for (var i = 0; i < num; i++) {
        len <<= 8;
        var j = buf.readUInt8(fail);
        if (buf.isError(j)) return j;
        len |= j;
      }
      return len;
    }
  }, {
    "../../asn1": 1,
    inherits: 101
  } ],
  10: [ function(require, module, exports) {
    var decoders = exports;
    decoders.der = require("./der");
    decoders.pem = require("./pem");
  }, {
    "./der": 9,
    "./pem": 11
  } ],
  11: [ function(require, module, exports) {
    var inherits = require("inherits");
    var Buffer = require("buffer").Buffer;
    var DERDecoder = require("./der");
    function PEMDecoder(entity) {
      DERDecoder.call(this, entity);
      this.enc = "pem";
    }
    inherits(PEMDecoder, DERDecoder);
    module.exports = PEMDecoder;
    PEMDecoder.prototype.decode = function decode(data, options) {
      var lines = data.toString().split(/[\r\n]+/g);
      var label = options.label.toUpperCase();
      var re = /^-----(BEGIN|END) ([^-]+)-----$/;
      var start = -1;
      var end = -1;
      for (var i = 0; i < lines.length; i++) {
        var match = lines[i].match(re);
        if (null === match) continue;
        if (match[2] !== label) continue;
        if (-1 !== start) {
          if ("END" !== match[1]) break;
          end = i;
          break;
        }
        if ("BEGIN" !== match[1]) break;
        start = i;
      }
      if (-1 === start || -1 === end) throw new Error("PEM section not found for: " + label);
      var base64 = lines.slice(start + 1, end).join("");
      base64.replace(/[^a-z0-9\+\/=]+/gi, "");
      var input = new Buffer(base64, "base64");
      return DERDecoder.prototype.decode.call(this, input, options);
    };
  }, {
    "./der": 9,
    buffer: 47,
    inherits: 101
  } ],
  12: [ function(require, module, exports) {
    var inherits = require("inherits");
    var Buffer = require("buffer").Buffer;
    var asn1 = require("../../asn1");
    var base = asn1.base;
    var der = asn1.constants.der;
    function DEREncoder(entity) {
      this.enc = "der";
      this.name = entity.name;
      this.entity = entity;
      this.tree = new DERNode();
      this.tree._init(entity.body);
    }
    module.exports = DEREncoder;
    DEREncoder.prototype.encode = function encode(data, reporter) {
      return this.tree._encode(data, reporter).join();
    };
    function DERNode(parent) {
      base.Node.call(this, "der", parent);
    }
    inherits(DERNode, base.Node);
    DERNode.prototype._encodeComposite = function encodeComposite(tag, primitive, cls, content) {
      var encodedTag = encodeTag(tag, primitive, cls, this.reporter);
      if (content.length < 128) {
        var header = new Buffer(2);
        header[0] = encodedTag;
        header[1] = content.length;
        return this._createEncoderBuffer([ header, content ]);
      }
      var lenOctets = 1;
      for (var i = content.length; i >= 256; i >>= 8) lenOctets++;
      var header = new Buffer(2 + lenOctets);
      header[0] = encodedTag;
      header[1] = 128 | lenOctets;
      for (var i = 1 + lenOctets, j = content.length; j > 0; i--, j >>= 8) header[i] = 255 & j;
      return this._createEncoderBuffer([ header, content ]);
    };
    DERNode.prototype._encodeStr = function encodeStr(str, tag) {
      if ("bitstr" === tag) return this._createEncoderBuffer([ 0 | str.unused, str.data ]);
      if ("bmpstr" === tag) {
        var buf = new Buffer(2 * str.length);
        for (var i = 0; i < str.length; i++) buf.writeUInt16BE(str.charCodeAt(i), 2 * i);
        return this._createEncoderBuffer(buf);
      }
      if ("numstr" === tag) {
        if (!this._isNumstr(str)) return this.reporter.error("Encoding of string type: numstr supports only digits and space");
        return this._createEncoderBuffer(str);
      }
      if ("printstr" === tag) {
        if (!this._isPrintstr(str)) return this.reporter.error("Encoding of string type: printstr supports only latin upper and lower case letters, digits, space, apostrophe, left and rigth parenthesis, plus sign, comma, hyphen, dot, slash, colon, equal sign, question mark");
        return this._createEncoderBuffer(str);
      }
      return /str$/.test(tag) ? this._createEncoderBuffer(str) : "objDesc" === tag ? this._createEncoderBuffer(str) : this.reporter.error("Encoding of string type: " + tag + " unsupported");
    };
    DERNode.prototype._encodeObjid = function encodeObjid(id, values, relative) {
      if ("string" === typeof id) {
        if (!values) return this.reporter.error("string objid given, but no values map found");
        if (!values.hasOwnProperty(id)) return this.reporter.error("objid not found in values map");
        id = values[id].split(/[\s\.]+/g);
        for (var i = 0; i < id.length; i++) id[i] |= 0;
      } else if (Array.isArray(id)) {
        id = id.slice();
        for (var i = 0; i < id.length; i++) id[i] |= 0;
      }
      if (!Array.isArray(id)) return this.reporter.error("objid() should be either array or string, got: " + JSON.stringify(id));
      if (!relative) {
        if (id[1] >= 40) return this.reporter.error("Second objid identifier OOB");
        id.splice(0, 2, 40 * id[0] + id[1]);
      }
      var size = 0;
      for (var i = 0; i < id.length; i++) {
        var ident = id[i];
        for (size++; ident >= 128; ident >>= 7) size++;
      }
      var objid = new Buffer(size);
      var offset = objid.length - 1;
      for (var i = id.length - 1; i >= 0; i--) {
        var ident = id[i];
        objid[offset--] = 127 & ident;
        while ((ident >>= 7) > 0) objid[offset--] = 128 | 127 & ident;
      }
      return this._createEncoderBuffer(objid);
    };
    function two(num) {
      return num < 10 ? "0" + num : num;
    }
    DERNode.prototype._encodeTime = function encodeTime(time, tag) {
      var str;
      var date = new Date(time);
      "gentime" === tag ? str = [ two(date.getFullYear()), two(date.getUTCMonth() + 1), two(date.getUTCDate()), two(date.getUTCHours()), two(date.getUTCMinutes()), two(date.getUTCSeconds()), "Z" ].join("") : "utctime" === tag ? str = [ two(date.getFullYear() % 100), two(date.getUTCMonth() + 1), two(date.getUTCDate()), two(date.getUTCHours()), two(date.getUTCMinutes()), two(date.getUTCSeconds()), "Z" ].join("") : this.reporter.error("Encoding " + tag + " time is not supported yet");
      return this._encodeStr(str, "octstr");
    };
    DERNode.prototype._encodeNull = function encodeNull() {
      return this._createEncoderBuffer("");
    };
    DERNode.prototype._encodeInt = function encodeInt(num, values) {
      if ("string" === typeof num) {
        if (!values) return this.reporter.error("String int or enum given, but no values map");
        if (!values.hasOwnProperty(num)) return this.reporter.error("Values map doesn't contain: " + JSON.stringify(num));
        num = values[num];
      }
      if ("number" !== typeof num && !Buffer.isBuffer(num)) {
        var numArray = num.toArray();
        !num.sign && 128 & numArray[0] && numArray.unshift(0);
        num = new Buffer(numArray);
      }
      if (Buffer.isBuffer(num)) {
        var size = num.length;
        0 === num.length && size++;
        var out = new Buffer(size);
        num.copy(out);
        0 === num.length && (out[0] = 0);
        return this._createEncoderBuffer(out);
      }
      if (num < 128) return this._createEncoderBuffer(num);
      if (num < 256) return this._createEncoderBuffer([ 0, num ]);
      var size = 1;
      for (var i = num; i >= 256; i >>= 8) size++;
      var out = new Array(size);
      for (var i = out.length - 1; i >= 0; i--) {
        out[i] = 255 & num;
        num >>= 8;
      }
      128 & out[0] && out.unshift(0);
      return this._createEncoderBuffer(new Buffer(out));
    };
    DERNode.prototype._encodeBool = function encodeBool(value) {
      return this._createEncoderBuffer(value ? 255 : 0);
    };
    DERNode.prototype._use = function use(entity, obj) {
      "function" === typeof entity && (entity = entity(obj));
      return entity._getEncoder("der").tree;
    };
    DERNode.prototype._skipDefault = function skipDefault(dataBuffer, reporter, parent) {
      var state = this._baseState;
      var i;
      if (null === state["default"]) return false;
      var data = dataBuffer.join();
      void 0 === state.defaultBuffer && (state.defaultBuffer = this._encodeValue(state["default"], reporter, parent).join());
      if (data.length !== state.defaultBuffer.length) return false;
      for (i = 0; i < data.length; i++) if (data[i] !== state.defaultBuffer[i]) return false;
      return true;
    };
    function encodeTag(tag, primitive, cls, reporter) {
      var res;
      "seqof" === tag ? tag = "seq" : "setof" === tag && (tag = "set");
      if (der.tagByName.hasOwnProperty(tag)) res = der.tagByName[tag]; else {
        if ("number" !== typeof tag || (0 | tag) !== tag) return reporter.error("Unknown tag: " + tag);
        res = tag;
      }
      if (res >= 31) return reporter.error("Multi-octet tag encoding unsupported");
      primitive || (res |= 32);
      res |= der.tagClassByName[cls || "universal"] << 6;
      return res;
    }
  }, {
    "../../asn1": 1,
    buffer: 47,
    inherits: 101
  } ],
  13: [ function(require, module, exports) {
    var encoders = exports;
    encoders.der = require("./der");
    encoders.pem = require("./pem");
  }, {
    "./der": 12,
    "./pem": 14
  } ],
  14: [ function(require, module, exports) {
    var inherits = require("inherits");
    var DEREncoder = require("./der");
    function PEMEncoder(entity) {
      DEREncoder.call(this, entity);
      this.enc = "pem";
    }
    inherits(PEMEncoder, DEREncoder);
    module.exports = PEMEncoder;
    PEMEncoder.prototype.encode = function encode(data, options) {
      var buf = DEREncoder.prototype.encode.call(this, data);
      var p = buf.toString("base64");
      var out = [ "-----BEGIN " + options.label + "-----" ];
      for (var i = 0; i < p.length; i += 64) out.push(p.slice(i, i + 64));
      out.push("-----END " + options.label + "-----");
      return out.join("\n");
    };
  }, {
    "./der": 12,
    inherits: 101
  } ],
  15: [ function(require, module, exports) {
    "use strict";
    exports.byteLength = byteLength;
    exports.toByteArray = toByteArray;
    exports.fromByteArray = fromByteArray;
    var lookup = [];
    var revLookup = [];
    var Arr = "undefined" !== typeof Uint8Array ? Uint8Array : Array;
    var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (var i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }
    revLookup["-".charCodeAt(0)] = 62;
    revLookup["_".charCodeAt(0)] = 63;
    function getLens(b64) {
      var len = b64.length;
      if (len % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
      var validLen = b64.indexOf("=");
      -1 === validLen && (validLen = len);
      var placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
      return [ validLen, placeHoldersLen ];
    }
    function byteLength(b64) {
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      return 3 * (validLen + placeHoldersLen) / 4 - placeHoldersLen;
    }
    function _byteLength(b64, validLen, placeHoldersLen) {
      return 3 * (validLen + placeHoldersLen) / 4 - placeHoldersLen;
    }
    function toByteArray(b64) {
      var tmp;
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
      var curByte = 0;
      var len = placeHoldersLen > 0 ? validLen - 4 : validLen;
      for (var i = 0; i < len; i += 4) {
        tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
        arr[curByte++] = tmp >> 16 & 255;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = 255 & tmp;
      }
      if (2 === placeHoldersLen) {
        tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
        arr[curByte++] = 255 & tmp;
      }
      if (1 === placeHoldersLen) {
        tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = 255 & tmp;
      }
      return arr;
    }
    function tripletToBase64(num) {
      return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[63 & num];
    }
    function encodeChunk(uint8, start, end) {
      var tmp;
      var output = [];
      for (var i = start; i < end; i += 3) {
        tmp = (uint8[i] << 16 & 16711680) + (uint8[i + 1] << 8 & 65280) + (255 & uint8[i + 2]);
        output.push(tripletToBase64(tmp));
      }
      return output.join("");
    }
    function fromByteArray(uint8) {
      var tmp;
      var len = uint8.length;
      var extraBytes = len % 3;
      var parts = [];
      var maxChunkLength = 16383;
      for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
      if (1 === extraBytes) {
        tmp = uint8[len - 1];
        parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "==");
      } else if (2 === extraBytes) {
        tmp = (uint8[len - 2] << 8) + uint8[len - 1];
        parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "=");
      }
      return parts.join("");
    }
  }, {} ],
  16: [ function(require, module, exports) {
    (function(module, exports) {
      "use strict";
      function assert(val, msg) {
        if (!val) throw new Error(msg || "Assertion failed");
      }
      function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        var TempCtor = function() {};
        TempCtor.prototype = superCtor.prototype;
        ctor.prototype = new TempCtor();
        ctor.prototype.constructor = ctor;
      }
      function BN(number, base, endian) {
        if (BN.isBN(number)) return number;
        this.negative = 0;
        this.words = null;
        this.length = 0;
        this.red = null;
        if (null !== number) {
          if ("le" === base || "be" === base) {
            endian = base;
            base = 10;
          }
          this._init(number || 0, base || 10, endian || "be");
        }
      }
      "object" === typeof module ? module.exports = BN : exports.BN = BN;
      BN.BN = BN;
      BN.wordSize = 26;
      var Buffer;
      try {
        Buffer = require("buffer").Buffer;
      } catch (e) {}
      BN.isBN = function isBN(num) {
        if (num instanceof BN) return true;
        return null !== num && "object" === typeof num && num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
      };
      BN.max = function max(left, right) {
        if (left.cmp(right) > 0) return left;
        return right;
      };
      BN.min = function min(left, right) {
        if (left.cmp(right) < 0) return left;
        return right;
      };
      BN.prototype._init = function init(number, base, endian) {
        if ("number" === typeof number) return this._initNumber(number, base, endian);
        if ("object" === typeof number) return this._initArray(number, base, endian);
        "hex" === base && (base = 16);
        assert(base === (0 | base) && base >= 2 && base <= 36);
        number = number.toString().replace(/\s+/g, "");
        var start = 0;
        "-" === number[0] && start++;
        16 === base ? this._parseHex(number, start) : this._parseBase(number, base, start);
        "-" === number[0] && (this.negative = 1);
        this.strip();
        if ("le" !== endian) return;
        this._initArray(this.toArray(), base, endian);
      };
      BN.prototype._initNumber = function _initNumber(number, base, endian) {
        if (number < 0) {
          this.negative = 1;
          number = -number;
        }
        if (number < 67108864) {
          this.words = [ 67108863 & number ];
          this.length = 1;
        } else if (number < 4503599627370496) {
          this.words = [ 67108863 & number, number / 67108864 & 67108863 ];
          this.length = 2;
        } else {
          assert(number < 9007199254740992);
          this.words = [ 67108863 & number, number / 67108864 & 67108863, 1 ];
          this.length = 3;
        }
        if ("le" !== endian) return;
        this._initArray(this.toArray(), base, endian);
      };
      BN.prototype._initArray = function _initArray(number, base, endian) {
        assert("number" === typeof number.length);
        if (number.length <= 0) {
          this.words = [ 0 ];
          this.length = 1;
          return this;
        }
        this.length = Math.ceil(number.length / 3);
        this.words = new Array(this.length);
        for (var i = 0; i < this.length; i++) this.words[i] = 0;
        var j, w;
        var off = 0;
        if ("be" === endian) for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
          w = number[i] | number[i - 1] << 8 | number[i - 2] << 16;
          this.words[j] |= w << off & 67108863;
          this.words[j + 1] = w >>> 26 - off & 67108863;
          off += 24;
          if (off >= 26) {
            off -= 26;
            j++;
          }
        } else if ("le" === endian) for (i = 0, j = 0; i < number.length; i += 3) {
          w = number[i] | number[i + 1] << 8 | number[i + 2] << 16;
          this.words[j] |= w << off & 67108863;
          this.words[j + 1] = w >>> 26 - off & 67108863;
          off += 24;
          if (off >= 26) {
            off -= 26;
            j++;
          }
        }
        return this.strip();
      };
      function parseHex(str, start, end) {
        var r = 0;
        var len = Math.min(str.length, end);
        for (var i = start; i < len; i++) {
          var c = str.charCodeAt(i) - 48;
          r <<= 4;
          r |= c >= 49 && c <= 54 ? c - 49 + 10 : c >= 17 && c <= 22 ? c - 17 + 10 : 15 & c;
        }
        return r;
      }
      BN.prototype._parseHex = function _parseHex(number, start) {
        this.length = Math.ceil((number.length - start) / 6);
        this.words = new Array(this.length);
        for (var i = 0; i < this.length; i++) this.words[i] = 0;
        var j, w;
        var off = 0;
        for (i = number.length - 6, j = 0; i >= start; i -= 6) {
          w = parseHex(number, i, i + 6);
          this.words[j] |= w << off & 67108863;
          this.words[j + 1] |= w >>> 26 - off & 4194303;
          off += 24;
          if (off >= 26) {
            off -= 26;
            j++;
          }
        }
        if (i + 6 !== start) {
          w = parseHex(number, start, i + 6);
          this.words[j] |= w << off & 67108863;
          this.words[j + 1] |= w >>> 26 - off & 4194303;
        }
        this.strip();
      };
      function parseBase(str, start, end, mul) {
        var r = 0;
        var len = Math.min(str.length, end);
        for (var i = start; i < len; i++) {
          var c = str.charCodeAt(i) - 48;
          r *= mul;
          r += c >= 49 ? c - 49 + 10 : c >= 17 ? c - 17 + 10 : c;
        }
        return r;
      }
      BN.prototype._parseBase = function _parseBase(number, base, start) {
        this.words = [ 0 ];
        this.length = 1;
        for (var limbLen = 0, limbPow = 1; limbPow <= 67108863; limbPow *= base) limbLen++;
        limbLen--;
        limbPow = limbPow / base | 0;
        var total = number.length - start;
        var mod = total % limbLen;
        var end = Math.min(total, total - mod) + start;
        var word = 0;
        for (var i = start; i < end; i += limbLen) {
          word = parseBase(number, i, i + limbLen, base);
          this.imuln(limbPow);
          this.words[0] + word < 67108864 ? this.words[0] += word : this._iaddn(word);
        }
        if (0 !== mod) {
          var pow = 1;
          word = parseBase(number, i, number.length, base);
          for (i = 0; i < mod; i++) pow *= base;
          this.imuln(pow);
          this.words[0] + word < 67108864 ? this.words[0] += word : this._iaddn(word);
        }
      };
      BN.prototype.copy = function copy(dest) {
        dest.words = new Array(this.length);
        for (var i = 0; i < this.length; i++) dest.words[i] = this.words[i];
        dest.length = this.length;
        dest.negative = this.negative;
        dest.red = this.red;
      };
      BN.prototype.clone = function clone() {
        var r = new BN(null);
        this.copy(r);
        return r;
      };
      BN.prototype._expand = function _expand(size) {
        while (this.length < size) this.words[this.length++] = 0;
        return this;
      };
      BN.prototype.strip = function strip() {
        while (this.length > 1 && 0 === this.words[this.length - 1]) this.length--;
        return this._normSign();
      };
      BN.prototype._normSign = function _normSign() {
        1 === this.length && 0 === this.words[0] && (this.negative = 0);
        return this;
      };
      BN.prototype.inspect = function inspect() {
        return (this.red ? "<BN-R: " : "<BN: ") + this.toString(16) + ">";
      };
      var zeros = [ "", "0", "00", "000", "0000", "00000", "000000", "0000000", "00000000", "000000000", "0000000000", "00000000000", "000000000000", "0000000000000", "00000000000000", "000000000000000", "0000000000000000", "00000000000000000", "000000000000000000", "0000000000000000000", "00000000000000000000", "000000000000000000000", "0000000000000000000000", "00000000000000000000000", "000000000000000000000000", "0000000000000000000000000" ];
      var groupSizes = [ 0, 0, 25, 16, 12, 11, 10, 9, 8, 8, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5 ];
      var groupBases = [ 0, 0, 33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216, 43046721, 1e7, 19487171, 35831808, 62748517, 7529536, 11390625, 16777216, 24137569, 34012224, 47045881, 64e6, 4084101, 5153632, 6436343, 7962624, 9765625, 11881376, 14348907, 17210368, 20511149, 243e5, 28629151, 33554432, 39135393, 45435424, 52521875, 60466176 ];
      BN.prototype.toString = function toString(base, padding) {
        base = base || 10;
        padding = 0 | padding || 1;
        var out;
        if (16 === base || "hex" === base) {
          out = "";
          var off = 0;
          var carry = 0;
          for (var i = 0; i < this.length; i++) {
            var w = this.words[i];
            var word = (16777215 & (w << off | carry)).toString(16);
            carry = w >>> 24 - off & 16777215;
            out = 0 !== carry || i !== this.length - 1 ? zeros[6 - word.length] + word + out : word + out;
            off += 2;
            if (off >= 26) {
              off -= 26;
              i--;
            }
          }
          0 !== carry && (out = carry.toString(16) + out);
          while (out.length % padding !== 0) out = "0" + out;
          0 !== this.negative && (out = "-" + out);
          return out;
        }
        if (base === (0 | base) && base >= 2 && base <= 36) {
          var groupSize = groupSizes[base];
          var groupBase = groupBases[base];
          out = "";
          var c = this.clone();
          c.negative = 0;
          while (!c.isZero()) {
            var r = c.modn(groupBase).toString(base);
            c = c.idivn(groupBase);
            out = c.isZero() ? r + out : zeros[groupSize - r.length] + r + out;
          }
          this.isZero() && (out = "0" + out);
          while (out.length % padding !== 0) out = "0" + out;
          0 !== this.negative && (out = "-" + out);
          return out;
        }
        assert(false, "Base should be between 2 and 36");
      };
      BN.prototype.toNumber = function toNumber() {
        var ret = this.words[0];
        2 === this.length ? ret += 67108864 * this.words[1] : 3 === this.length && 1 === this.words[2] ? ret += 4503599627370496 + 67108864 * this.words[1] : this.length > 2 && assert(false, "Number can only safely store up to 53 bits");
        return 0 !== this.negative ? -ret : ret;
      };
      BN.prototype.toJSON = function toJSON() {
        return this.toString(16);
      };
      BN.prototype.toBuffer = function toBuffer(endian, length) {
        assert("undefined" !== typeof Buffer);
        return this.toArrayLike(Buffer, endian, length);
      };
      BN.prototype.toArray = function toArray(endian, length) {
        return this.toArrayLike(Array, endian, length);
      };
      BN.prototype.toArrayLike = function toArrayLike(ArrayType, endian, length) {
        var byteLength = this.byteLength();
        var reqLength = length || Math.max(1, byteLength);
        assert(byteLength <= reqLength, "byte array longer than desired length");
        assert(reqLength > 0, "Requested array length <= 0");
        this.strip();
        var littleEndian = "le" === endian;
        var res = new ArrayType(reqLength);
        var b, i;
        var q = this.clone();
        if (littleEndian) {
          for (i = 0; !q.isZero(); i++) {
            b = q.andln(255);
            q.iushrn(8);
            res[i] = b;
          }
          for (;i < reqLength; i++) res[i] = 0;
        } else {
          for (i = 0; i < reqLength - byteLength; i++) res[i] = 0;
          for (i = 0; !q.isZero(); i++) {
            b = q.andln(255);
            q.iushrn(8);
            res[reqLength - i - 1] = b;
          }
        }
        return res;
      };
      Math.clz32 ? BN.prototype._countBits = function _countBits(w) {
        return 32 - Math.clz32(w);
      } : BN.prototype._countBits = function _countBits(w) {
        var t = w;
        var r = 0;
        if (t >= 4096) {
          r += 13;
          t >>>= 13;
        }
        if (t >= 64) {
          r += 7;
          t >>>= 7;
        }
        if (t >= 8) {
          r += 4;
          t >>>= 4;
        }
        if (t >= 2) {
          r += 2;
          t >>>= 2;
        }
        return r + t;
      };
      BN.prototype._zeroBits = function _zeroBits(w) {
        if (0 === w) return 26;
        var t = w;
        var r = 0;
        if (0 === (8191 & t)) {
          r += 13;
          t >>>= 13;
        }
        if (0 === (127 & t)) {
          r += 7;
          t >>>= 7;
        }
        if (0 === (15 & t)) {
          r += 4;
          t >>>= 4;
        }
        if (0 === (3 & t)) {
          r += 2;
          t >>>= 2;
        }
        0 === (1 & t) && r++;
        return r;
      };
      BN.prototype.bitLength = function bitLength() {
        var w = this.words[this.length - 1];
        var hi = this._countBits(w);
        return 26 * (this.length - 1) + hi;
      };
      function toBitArray(num) {
        var w = new Array(num.bitLength());
        for (var bit = 0; bit < w.length; bit++) {
          var off = bit / 26 | 0;
          var wbit = bit % 26;
          w[bit] = (num.words[off] & 1 << wbit) >>> wbit;
        }
        return w;
      }
      BN.prototype.zeroBits = function zeroBits() {
        if (this.isZero()) return 0;
        var r = 0;
        for (var i = 0; i < this.length; i++) {
          var b = this._zeroBits(this.words[i]);
          r += b;
          if (26 !== b) break;
        }
        return r;
      };
      BN.prototype.byteLength = function byteLength() {
        return Math.ceil(this.bitLength() / 8);
      };
      BN.prototype.toTwos = function toTwos(width) {
        if (0 !== this.negative) return this.abs().inotn(width).iaddn(1);
        return this.clone();
      };
      BN.prototype.fromTwos = function fromTwos(width) {
        if (this.testn(width - 1)) return this.notn(width).iaddn(1).ineg();
        return this.clone();
      };
      BN.prototype.isNeg = function isNeg() {
        return 0 !== this.negative;
      };
      BN.prototype.neg = function neg() {
        return this.clone().ineg();
      };
      BN.prototype.ineg = function ineg() {
        this.isZero() || (this.negative ^= 1);
        return this;
      };
      BN.prototype.iuor = function iuor(num) {
        while (this.length < num.length) this.words[this.length++] = 0;
        for (var i = 0; i < num.length; i++) this.words[i] = this.words[i] | num.words[i];
        return this.strip();
      };
      BN.prototype.ior = function ior(num) {
        assert(0 === (this.negative | num.negative));
        return this.iuor(num);
      };
      BN.prototype.or = function or(num) {
        if (this.length > num.length) return this.clone().ior(num);
        return num.clone().ior(this);
      };
      BN.prototype.uor = function uor(num) {
        if (this.length > num.length) return this.clone().iuor(num);
        return num.clone().iuor(this);
      };
      BN.prototype.iuand = function iuand(num) {
        var b;
        b = this.length > num.length ? num : this;
        for (var i = 0; i < b.length; i++) this.words[i] = this.words[i] & num.words[i];
        this.length = b.length;
        return this.strip();
      };
      BN.prototype.iand = function iand(num) {
        assert(0 === (this.negative | num.negative));
        return this.iuand(num);
      };
      BN.prototype.and = function and(num) {
        if (this.length > num.length) return this.clone().iand(num);
        return num.clone().iand(this);
      };
      BN.prototype.uand = function uand(num) {
        if (this.length > num.length) return this.clone().iuand(num);
        return num.clone().iuand(this);
      };
      BN.prototype.iuxor = function iuxor(num) {
        var a;
        var b;
        if (this.length > num.length) {
          a = this;
          b = num;
        } else {
          a = num;
          b = this;
        }
        for (var i = 0; i < b.length; i++) this.words[i] = a.words[i] ^ b.words[i];
        if (this !== a) for (;i < a.length; i++) this.words[i] = a.words[i];
        this.length = a.length;
        return this.strip();
      };
      BN.prototype.ixor = function ixor(num) {
        assert(0 === (this.negative | num.negative));
        return this.iuxor(num);
      };
      BN.prototype.xor = function xor(num) {
        if (this.length > num.length) return this.clone().ixor(num);
        return num.clone().ixor(this);
      };
      BN.prototype.uxor = function uxor(num) {
        if (this.length > num.length) return this.clone().iuxor(num);
        return num.clone().iuxor(this);
      };
      BN.prototype.inotn = function inotn(width) {
        assert("number" === typeof width && width >= 0);
        var bytesNeeded = 0 | Math.ceil(width / 26);
        var bitsLeft = width % 26;
        this._expand(bytesNeeded);
        bitsLeft > 0 && bytesNeeded--;
        for (var i = 0; i < bytesNeeded; i++) this.words[i] = 67108863 & ~this.words[i];
        bitsLeft > 0 && (this.words[i] = ~this.words[i] & 67108863 >> 26 - bitsLeft);
        return this.strip();
      };
      BN.prototype.notn = function notn(width) {
        return this.clone().inotn(width);
      };
      BN.prototype.setn = function setn(bit, val) {
        assert("number" === typeof bit && bit >= 0);
        var off = bit / 26 | 0;
        var wbit = bit % 26;
        this._expand(off + 1);
        this.words[off] = val ? this.words[off] | 1 << wbit : this.words[off] & ~(1 << wbit);
        return this.strip();
      };
      BN.prototype.iadd = function iadd(num) {
        var r;
        if (0 !== this.negative && 0 === num.negative) {
          this.negative = 0;
          r = this.isub(num);
          this.negative ^= 1;
          return this._normSign();
        }
        if (0 === this.negative && 0 !== num.negative) {
          num.negative = 0;
          r = this.isub(num);
          num.negative = 1;
          return r._normSign();
        }
        var a, b;
        if (this.length > num.length) {
          a = this;
          b = num;
        } else {
          a = num;
          b = this;
        }
        var carry = 0;
        for (var i = 0; i < b.length; i++) {
          r = (0 | a.words[i]) + (0 | b.words[i]) + carry;
          this.words[i] = 67108863 & r;
          carry = r >>> 26;
        }
        for (;0 !== carry && i < a.length; i++) {
          r = (0 | a.words[i]) + carry;
          this.words[i] = 67108863 & r;
          carry = r >>> 26;
        }
        this.length = a.length;
        if (0 !== carry) {
          this.words[this.length] = carry;
          this.length++;
        } else if (a !== this) for (;i < a.length; i++) this.words[i] = a.words[i];
        return this;
      };
      BN.prototype.add = function add(num) {
        var res;
        if (0 !== num.negative && 0 === this.negative) {
          num.negative = 0;
          res = this.sub(num);
          num.negative ^= 1;
          return res;
        }
        if (0 === num.negative && 0 !== this.negative) {
          this.negative = 0;
          res = num.sub(this);
          this.negative = 1;
          return res;
        }
        if (this.length > num.length) return this.clone().iadd(num);
        return num.clone().iadd(this);
      };
      BN.prototype.isub = function isub(num) {
        if (0 !== num.negative) {
          num.negative = 0;
          var r = this.iadd(num);
          num.negative = 1;
          return r._normSign();
        }
        if (0 !== this.negative) {
          this.negative = 0;
          this.iadd(num);
          this.negative = 1;
          return this._normSign();
        }
        var cmp = this.cmp(num);
        if (0 === cmp) {
          this.negative = 0;
          this.length = 1;
          this.words[0] = 0;
          return this;
        }
        var a, b;
        if (cmp > 0) {
          a = this;
          b = num;
        } else {
          a = num;
          b = this;
        }
        var carry = 0;
        for (var i = 0; i < b.length; i++) {
          r = (0 | a.words[i]) - (0 | b.words[i]) + carry;
          carry = r >> 26;
          this.words[i] = 67108863 & r;
        }
        for (;0 !== carry && i < a.length; i++) {
          r = (0 | a.words[i]) + carry;
          carry = r >> 26;
          this.words[i] = 67108863 & r;
        }
        if (0 === carry && i < a.length && a !== this) for (;i < a.length; i++) this.words[i] = a.words[i];
        this.length = Math.max(this.length, i);
        a !== this && (this.negative = 1);
        return this.strip();
      };
      BN.prototype.sub = function sub(num) {
        return this.clone().isub(num);
      };
      function smallMulTo(self, num, out) {
        out.negative = num.negative ^ self.negative;
        var len = self.length + num.length | 0;
        out.length = len;
        len = len - 1 | 0;
        var a = 0 | self.words[0];
        var b = 0 | num.words[0];
        var r = a * b;
        var lo = 67108863 & r;
        var carry = r / 67108864 | 0;
        out.words[0] = lo;
        for (var k = 1; k < len; k++) {
          var ncarry = carry >>> 26;
          var rword = 67108863 & carry;
          var maxJ = Math.min(k, num.length - 1);
          for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
            var i = k - j | 0;
            a = 0 | self.words[i];
            b = 0 | num.words[j];
            r = a * b + rword;
            ncarry += r / 67108864 | 0;
            rword = 67108863 & r;
          }
          out.words[k] = 0 | rword;
          carry = 0 | ncarry;
        }
        0 !== carry ? out.words[k] = 0 | carry : out.length--;
        return out.strip();
      }
      var comb10MulTo = function comb10MulTo(self, num, out) {
        var a = self.words;
        var b = num.words;
        var o = out.words;
        var c = 0;
        var lo;
        var mid;
        var hi;
        var a0 = 0 | a[0];
        var al0 = 8191 & a0;
        var ah0 = a0 >>> 13;
        var a1 = 0 | a[1];
        var al1 = 8191 & a1;
        var ah1 = a1 >>> 13;
        var a2 = 0 | a[2];
        var al2 = 8191 & a2;
        var ah2 = a2 >>> 13;
        var a3 = 0 | a[3];
        var al3 = 8191 & a3;
        var ah3 = a3 >>> 13;
        var a4 = 0 | a[4];
        var al4 = 8191 & a4;
        var ah4 = a4 >>> 13;
        var a5 = 0 | a[5];
        var al5 = 8191 & a5;
        var ah5 = a5 >>> 13;
        var a6 = 0 | a[6];
        var al6 = 8191 & a6;
        var ah6 = a6 >>> 13;
        var a7 = 0 | a[7];
        var al7 = 8191 & a7;
        var ah7 = a7 >>> 13;
        var a8 = 0 | a[8];
        var al8 = 8191 & a8;
        var ah8 = a8 >>> 13;
        var a9 = 0 | a[9];
        var al9 = 8191 & a9;
        var ah9 = a9 >>> 13;
        var b0 = 0 | b[0];
        var bl0 = 8191 & b0;
        var bh0 = b0 >>> 13;
        var b1 = 0 | b[1];
        var bl1 = 8191 & b1;
        var bh1 = b1 >>> 13;
        var b2 = 0 | b[2];
        var bl2 = 8191 & b2;
        var bh2 = b2 >>> 13;
        var b3 = 0 | b[3];
        var bl3 = 8191 & b3;
        var bh3 = b3 >>> 13;
        var b4 = 0 | b[4];
        var bl4 = 8191 & b4;
        var bh4 = b4 >>> 13;
        var b5 = 0 | b[5];
        var bl5 = 8191 & b5;
        var bh5 = b5 >>> 13;
        var b6 = 0 | b[6];
        var bl6 = 8191 & b6;
        var bh6 = b6 >>> 13;
        var b7 = 0 | b[7];
        var bl7 = 8191 & b7;
        var bh7 = b7 >>> 13;
        var b8 = 0 | b[8];
        var bl8 = 8191 & b8;
        var bh8 = b8 >>> 13;
        var b9 = 0 | b[9];
        var bl9 = 8191 & b9;
        var bh9 = b9 >>> 13;
        out.negative = self.negative ^ num.negative;
        out.length = 19;
        lo = Math.imul(al0, bl0);
        mid = Math.imul(al0, bh0);
        mid = mid + Math.imul(ah0, bl0) | 0;
        hi = Math.imul(ah0, bh0);
        var w0 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w0 >>> 26) | 0;
        w0 &= 67108863;
        lo = Math.imul(al1, bl0);
        mid = Math.imul(al1, bh0);
        mid = mid + Math.imul(ah1, bl0) | 0;
        hi = Math.imul(ah1, bh0);
        lo = lo + Math.imul(al0, bl1) | 0;
        mid = mid + Math.imul(al0, bh1) | 0;
        mid = mid + Math.imul(ah0, bl1) | 0;
        hi = hi + Math.imul(ah0, bh1) | 0;
        var w1 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w1 >>> 26) | 0;
        w1 &= 67108863;
        lo = Math.imul(al2, bl0);
        mid = Math.imul(al2, bh0);
        mid = mid + Math.imul(ah2, bl0) | 0;
        hi = Math.imul(ah2, bh0);
        lo = lo + Math.imul(al1, bl1) | 0;
        mid = mid + Math.imul(al1, bh1) | 0;
        mid = mid + Math.imul(ah1, bl1) | 0;
        hi = hi + Math.imul(ah1, bh1) | 0;
        lo = lo + Math.imul(al0, bl2) | 0;
        mid = mid + Math.imul(al0, bh2) | 0;
        mid = mid + Math.imul(ah0, bl2) | 0;
        hi = hi + Math.imul(ah0, bh2) | 0;
        var w2 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w2 >>> 26) | 0;
        w2 &= 67108863;
        lo = Math.imul(al3, bl0);
        mid = Math.imul(al3, bh0);
        mid = mid + Math.imul(ah3, bl0) | 0;
        hi = Math.imul(ah3, bh0);
        lo = lo + Math.imul(al2, bl1) | 0;
        mid = mid + Math.imul(al2, bh1) | 0;
        mid = mid + Math.imul(ah2, bl1) | 0;
        hi = hi + Math.imul(ah2, bh1) | 0;
        lo = lo + Math.imul(al1, bl2) | 0;
        mid = mid + Math.imul(al1, bh2) | 0;
        mid = mid + Math.imul(ah1, bl2) | 0;
        hi = hi + Math.imul(ah1, bh2) | 0;
        lo = lo + Math.imul(al0, bl3) | 0;
        mid = mid + Math.imul(al0, bh3) | 0;
        mid = mid + Math.imul(ah0, bl3) | 0;
        hi = hi + Math.imul(ah0, bh3) | 0;
        var w3 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w3 >>> 26) | 0;
        w3 &= 67108863;
        lo = Math.imul(al4, bl0);
        mid = Math.imul(al4, bh0);
        mid = mid + Math.imul(ah4, bl0) | 0;
        hi = Math.imul(ah4, bh0);
        lo = lo + Math.imul(al3, bl1) | 0;
        mid = mid + Math.imul(al3, bh1) | 0;
        mid = mid + Math.imul(ah3, bl1) | 0;
        hi = hi + Math.imul(ah3, bh1) | 0;
        lo = lo + Math.imul(al2, bl2) | 0;
        mid = mid + Math.imul(al2, bh2) | 0;
        mid = mid + Math.imul(ah2, bl2) | 0;
        hi = hi + Math.imul(ah2, bh2) | 0;
        lo = lo + Math.imul(al1, bl3) | 0;
        mid = mid + Math.imul(al1, bh3) | 0;
        mid = mid + Math.imul(ah1, bl3) | 0;
        hi = hi + Math.imul(ah1, bh3) | 0;
        lo = lo + Math.imul(al0, bl4) | 0;
        mid = mid + Math.imul(al0, bh4) | 0;
        mid = mid + Math.imul(ah0, bl4) | 0;
        hi = hi + Math.imul(ah0, bh4) | 0;
        var w4 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w4 >>> 26) | 0;
        w4 &= 67108863;
        lo = Math.imul(al5, bl0);
        mid = Math.imul(al5, bh0);
        mid = mid + Math.imul(ah5, bl0) | 0;
        hi = Math.imul(ah5, bh0);
        lo = lo + Math.imul(al4, bl1) | 0;
        mid = mid + Math.imul(al4, bh1) | 0;
        mid = mid + Math.imul(ah4, bl1) | 0;
        hi = hi + Math.imul(ah4, bh1) | 0;
        lo = lo + Math.imul(al3, bl2) | 0;
        mid = mid + Math.imul(al3, bh2) | 0;
        mid = mid + Math.imul(ah3, bl2) | 0;
        hi = hi + Math.imul(ah3, bh2) | 0;
        lo = lo + Math.imul(al2, bl3) | 0;
        mid = mid + Math.imul(al2, bh3) | 0;
        mid = mid + Math.imul(ah2, bl3) | 0;
        hi = hi + Math.imul(ah2, bh3) | 0;
        lo = lo + Math.imul(al1, bl4) | 0;
        mid = mid + Math.imul(al1, bh4) | 0;
        mid = mid + Math.imul(ah1, bl4) | 0;
        hi = hi + Math.imul(ah1, bh4) | 0;
        lo = lo + Math.imul(al0, bl5) | 0;
        mid = mid + Math.imul(al0, bh5) | 0;
        mid = mid + Math.imul(ah0, bl5) | 0;
        hi = hi + Math.imul(ah0, bh5) | 0;
        var w5 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w5 >>> 26) | 0;
        w5 &= 67108863;
        lo = Math.imul(al6, bl0);
        mid = Math.imul(al6, bh0);
        mid = mid + Math.imul(ah6, bl0) | 0;
        hi = Math.imul(ah6, bh0);
        lo = lo + Math.imul(al5, bl1) | 0;
        mid = mid + Math.imul(al5, bh1) | 0;
        mid = mid + Math.imul(ah5, bl1) | 0;
        hi = hi + Math.imul(ah5, bh1) | 0;
        lo = lo + Math.imul(al4, bl2) | 0;
        mid = mid + Math.imul(al4, bh2) | 0;
        mid = mid + Math.imul(ah4, bl2) | 0;
        hi = hi + Math.imul(ah4, bh2) | 0;
        lo = lo + Math.imul(al3, bl3) | 0;
        mid = mid + Math.imul(al3, bh3) | 0;
        mid = mid + Math.imul(ah3, bl3) | 0;
        hi = hi + Math.imul(ah3, bh3) | 0;
        lo = lo + Math.imul(al2, bl4) | 0;
        mid = mid + Math.imul(al2, bh4) | 0;
        mid = mid + Math.imul(ah2, bl4) | 0;
        hi = hi + Math.imul(ah2, bh4) | 0;
        lo = lo + Math.imul(al1, bl5) | 0;
        mid = mid + Math.imul(al1, bh5) | 0;
        mid = mid + Math.imul(ah1, bl5) | 0;
        hi = hi + Math.imul(ah1, bh5) | 0;
        lo = lo + Math.imul(al0, bl6) | 0;
        mid = mid + Math.imul(al0, bh6) | 0;
        mid = mid + Math.imul(ah0, bl6) | 0;
        hi = hi + Math.imul(ah0, bh6) | 0;
        var w6 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w6 >>> 26) | 0;
        w6 &= 67108863;
        lo = Math.imul(al7, bl0);
        mid = Math.imul(al7, bh0);
        mid = mid + Math.imul(ah7, bl0) | 0;
        hi = Math.imul(ah7, bh0);
        lo = lo + Math.imul(al6, bl1) | 0;
        mid = mid + Math.imul(al6, bh1) | 0;
        mid = mid + Math.imul(ah6, bl1) | 0;
        hi = hi + Math.imul(ah6, bh1) | 0;
        lo = lo + Math.imul(al5, bl2) | 0;
        mid = mid + Math.imul(al5, bh2) | 0;
        mid = mid + Math.imul(ah5, bl2) | 0;
        hi = hi + Math.imul(ah5, bh2) | 0;
        lo = lo + Math.imul(al4, bl3) | 0;
        mid = mid + Math.imul(al4, bh3) | 0;
        mid = mid + Math.imul(ah4, bl3) | 0;
        hi = hi + Math.imul(ah4, bh3) | 0;
        lo = lo + Math.imul(al3, bl4) | 0;
        mid = mid + Math.imul(al3, bh4) | 0;
        mid = mid + Math.imul(ah3, bl4) | 0;
        hi = hi + Math.imul(ah3, bh4) | 0;
        lo = lo + Math.imul(al2, bl5) | 0;
        mid = mid + Math.imul(al2, bh5) | 0;
        mid = mid + Math.imul(ah2, bl5) | 0;
        hi = hi + Math.imul(ah2, bh5) | 0;
        lo = lo + Math.imul(al1, bl6) | 0;
        mid = mid + Math.imul(al1, bh6) | 0;
        mid = mid + Math.imul(ah1, bl6) | 0;
        hi = hi + Math.imul(ah1, bh6) | 0;
        lo = lo + Math.imul(al0, bl7) | 0;
        mid = mid + Math.imul(al0, bh7) | 0;
        mid = mid + Math.imul(ah0, bl7) | 0;
        hi = hi + Math.imul(ah0, bh7) | 0;
        var w7 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w7 >>> 26) | 0;
        w7 &= 67108863;
        lo = Math.imul(al8, bl0);
        mid = Math.imul(al8, bh0);
        mid = mid + Math.imul(ah8, bl0) | 0;
        hi = Math.imul(ah8, bh0);
        lo = lo + Math.imul(al7, bl1) | 0;
        mid = mid + Math.imul(al7, bh1) | 0;
        mid = mid + Math.imul(ah7, bl1) | 0;
        hi = hi + Math.imul(ah7, bh1) | 0;
        lo = lo + Math.imul(al6, bl2) | 0;
        mid = mid + Math.imul(al6, bh2) | 0;
        mid = mid + Math.imul(ah6, bl2) | 0;
        hi = hi + Math.imul(ah6, bh2) | 0;
        lo = lo + Math.imul(al5, bl3) | 0;
        mid = mid + Math.imul(al5, bh3) | 0;
        mid = mid + Math.imul(ah5, bl3) | 0;
        hi = hi + Math.imul(ah5, bh3) | 0;
        lo = lo + Math.imul(al4, bl4) | 0;
        mid = mid + Math.imul(al4, bh4) | 0;
        mid = mid + Math.imul(ah4, bl4) | 0;
        hi = hi + Math.imul(ah4, bh4) | 0;
        lo = lo + Math.imul(al3, bl5) | 0;
        mid = mid + Math.imul(al3, bh5) | 0;
        mid = mid + Math.imul(ah3, bl5) | 0;
        hi = hi + Math.imul(ah3, bh5) | 0;
        lo = lo + Math.imul(al2, bl6) | 0;
        mid = mid + Math.imul(al2, bh6) | 0;
        mid = mid + Math.imul(ah2, bl6) | 0;
        hi = hi + Math.imul(ah2, bh6) | 0;
        lo = lo + Math.imul(al1, bl7) | 0;
        mid = mid + Math.imul(al1, bh7) | 0;
        mid = mid + Math.imul(ah1, bl7) | 0;
        hi = hi + Math.imul(ah1, bh7) | 0;
        lo = lo + Math.imul(al0, bl8) | 0;
        mid = mid + Math.imul(al0, bh8) | 0;
        mid = mid + Math.imul(ah0, bl8) | 0;
        hi = hi + Math.imul(ah0, bh8) | 0;
        var w8 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w8 >>> 26) | 0;
        w8 &= 67108863;
        lo = Math.imul(al9, bl0);
        mid = Math.imul(al9, bh0);
        mid = mid + Math.imul(ah9, bl0) | 0;
        hi = Math.imul(ah9, bh0);
        lo = lo + Math.imul(al8, bl1) | 0;
        mid = mid + Math.imul(al8, bh1) | 0;
        mid = mid + Math.imul(ah8, bl1) | 0;
        hi = hi + Math.imul(ah8, bh1) | 0;
        lo = lo + Math.imul(al7, bl2) | 0;
        mid = mid + Math.imul(al7, bh2) | 0;
        mid = mid + Math.imul(ah7, bl2) | 0;
        hi = hi + Math.imul(ah7, bh2) | 0;
        lo = lo + Math.imul(al6, bl3) | 0;
        mid = mid + Math.imul(al6, bh3) | 0;
        mid = mid + Math.imul(ah6, bl3) | 0;
        hi = hi + Math.imul(ah6, bh3) | 0;
        lo = lo + Math.imul(al5, bl4) | 0;
        mid = mid + Math.imul(al5, bh4) | 0;
        mid = mid + Math.imul(ah5, bl4) | 0;
        hi = hi + Math.imul(ah5, bh4) | 0;
        lo = lo + Math.imul(al4, bl5) | 0;
        mid = mid + Math.imul(al4, bh5) | 0;
        mid = mid + Math.imul(ah4, bl5) | 0;
        hi = hi + Math.imul(ah4, bh5) | 0;
        lo = lo + Math.imul(al3, bl6) | 0;
        mid = mid + Math.imul(al3, bh6) | 0;
        mid = mid + Math.imul(ah3, bl6) | 0;
        hi = hi + Math.imul(ah3, bh6) | 0;
        lo = lo + Math.imul(al2, bl7) | 0;
        mid = mid + Math.imul(al2, bh7) | 0;
        mid = mid + Math.imul(ah2, bl7) | 0;
        hi = hi + Math.imul(ah2, bh7) | 0;
        lo = lo + Math.imul(al1, bl8) | 0;
        mid = mid + Math.imul(al1, bh8) | 0;
        mid = mid + Math.imul(ah1, bl8) | 0;
        hi = hi + Math.imul(ah1, bh8) | 0;
        lo = lo + Math.imul(al0, bl9) | 0;
        mid = mid + Math.imul(al0, bh9) | 0;
        mid = mid + Math.imul(ah0, bl9) | 0;
        hi = hi + Math.imul(ah0, bh9) | 0;
        var w9 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w9 >>> 26) | 0;
        w9 &= 67108863;
        lo = Math.imul(al9, bl1);
        mid = Math.imul(al9, bh1);
        mid = mid + Math.imul(ah9, bl1) | 0;
        hi = Math.imul(ah9, bh1);
        lo = lo + Math.imul(al8, bl2) | 0;
        mid = mid + Math.imul(al8, bh2) | 0;
        mid = mid + Math.imul(ah8, bl2) | 0;
        hi = hi + Math.imul(ah8, bh2) | 0;
        lo = lo + Math.imul(al7, bl3) | 0;
        mid = mid + Math.imul(al7, bh3) | 0;
        mid = mid + Math.imul(ah7, bl3) | 0;
        hi = hi + Math.imul(ah7, bh3) | 0;
        lo = lo + Math.imul(al6, bl4) | 0;
        mid = mid + Math.imul(al6, bh4) | 0;
        mid = mid + Math.imul(ah6, bl4) | 0;
        hi = hi + Math.imul(ah6, bh4) | 0;
        lo = lo + Math.imul(al5, bl5) | 0;
        mid = mid + Math.imul(al5, bh5) | 0;
        mid = mid + Math.imul(ah5, bl5) | 0;
        hi = hi + Math.imul(ah5, bh5) | 0;
        lo = lo + Math.imul(al4, bl6) | 0;
        mid = mid + Math.imul(al4, bh6) | 0;
        mid = mid + Math.imul(ah4, bl6) | 0;
        hi = hi + Math.imul(ah4, bh6) | 0;
        lo = lo + Math.imul(al3, bl7) | 0;
        mid = mid + Math.imul(al3, bh7) | 0;
        mid = mid + Math.imul(ah3, bl7) | 0;
        hi = hi + Math.imul(ah3, bh7) | 0;
        lo = lo + Math.imul(al2, bl8) | 0;
        mid = mid + Math.imul(al2, bh8) | 0;
        mid = mid + Math.imul(ah2, bl8) | 0;
        hi = hi + Math.imul(ah2, bh8) | 0;
        lo = lo + Math.imul(al1, bl9) | 0;
        mid = mid + Math.imul(al1, bh9) | 0;
        mid = mid + Math.imul(ah1, bl9) | 0;
        hi = hi + Math.imul(ah1, bh9) | 0;
        var w10 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w10 >>> 26) | 0;
        w10 &= 67108863;
        lo = Math.imul(al9, bl2);
        mid = Math.imul(al9, bh2);
        mid = mid + Math.imul(ah9, bl2) | 0;
        hi = Math.imul(ah9, bh2);
        lo = lo + Math.imul(al8, bl3) | 0;
        mid = mid + Math.imul(al8, bh3) | 0;
        mid = mid + Math.imul(ah8, bl3) | 0;
        hi = hi + Math.imul(ah8, bh3) | 0;
        lo = lo + Math.imul(al7, bl4) | 0;
        mid = mid + Math.imul(al7, bh4) | 0;
        mid = mid + Math.imul(ah7, bl4) | 0;
        hi = hi + Math.imul(ah7, bh4) | 0;
        lo = lo + Math.imul(al6, bl5) | 0;
        mid = mid + Math.imul(al6, bh5) | 0;
        mid = mid + Math.imul(ah6, bl5) | 0;
        hi = hi + Math.imul(ah6, bh5) | 0;
        lo = lo + Math.imul(al5, bl6) | 0;
        mid = mid + Math.imul(al5, bh6) | 0;
        mid = mid + Math.imul(ah5, bl6) | 0;
        hi = hi + Math.imul(ah5, bh6) | 0;
        lo = lo + Math.imul(al4, bl7) | 0;
        mid = mid + Math.imul(al4, bh7) | 0;
        mid = mid + Math.imul(ah4, bl7) | 0;
        hi = hi + Math.imul(ah4, bh7) | 0;
        lo = lo + Math.imul(al3, bl8) | 0;
        mid = mid + Math.imul(al3, bh8) | 0;
        mid = mid + Math.imul(ah3, bl8) | 0;
        hi = hi + Math.imul(ah3, bh8) | 0;
        lo = lo + Math.imul(al2, bl9) | 0;
        mid = mid + Math.imul(al2, bh9) | 0;
        mid = mid + Math.imul(ah2, bl9) | 0;
        hi = hi + Math.imul(ah2, bh9) | 0;
        var w11 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w11 >>> 26) | 0;
        w11 &= 67108863;
        lo = Math.imul(al9, bl3);
        mid = Math.imul(al9, bh3);
        mid = mid + Math.imul(ah9, bl3) | 0;
        hi = Math.imul(ah9, bh3);
        lo = lo + Math.imul(al8, bl4) | 0;
        mid = mid + Math.imul(al8, bh4) | 0;
        mid = mid + Math.imul(ah8, bl4) | 0;
        hi = hi + Math.imul(ah8, bh4) | 0;
        lo = lo + Math.imul(al7, bl5) | 0;
        mid = mid + Math.imul(al7, bh5) | 0;
        mid = mid + Math.imul(ah7, bl5) | 0;
        hi = hi + Math.imul(ah7, bh5) | 0;
        lo = lo + Math.imul(al6, bl6) | 0;
        mid = mid + Math.imul(al6, bh6) | 0;
        mid = mid + Math.imul(ah6, bl6) | 0;
        hi = hi + Math.imul(ah6, bh6) | 0;
        lo = lo + Math.imul(al5, bl7) | 0;
        mid = mid + Math.imul(al5, bh7) | 0;
        mid = mid + Math.imul(ah5, bl7) | 0;
        hi = hi + Math.imul(ah5, bh7) | 0;
        lo = lo + Math.imul(al4, bl8) | 0;
        mid = mid + Math.imul(al4, bh8) | 0;
        mid = mid + Math.imul(ah4, bl8) | 0;
        hi = hi + Math.imul(ah4, bh8) | 0;
        lo = lo + Math.imul(al3, bl9) | 0;
        mid = mid + Math.imul(al3, bh9) | 0;
        mid = mid + Math.imul(ah3, bl9) | 0;
        hi = hi + Math.imul(ah3, bh9) | 0;
        var w12 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w12 >>> 26) | 0;
        w12 &= 67108863;
        lo = Math.imul(al9, bl4);
        mid = Math.imul(al9, bh4);
        mid = mid + Math.imul(ah9, bl4) | 0;
        hi = Math.imul(ah9, bh4);
        lo = lo + Math.imul(al8, bl5) | 0;
        mid = mid + Math.imul(al8, bh5) | 0;
        mid = mid + Math.imul(ah8, bl5) | 0;
        hi = hi + Math.imul(ah8, bh5) | 0;
        lo = lo + Math.imul(al7, bl6) | 0;
        mid = mid + Math.imul(al7, bh6) | 0;
        mid = mid + Math.imul(ah7, bl6) | 0;
        hi = hi + Math.imul(ah7, bh6) | 0;
        lo = lo + Math.imul(al6, bl7) | 0;
        mid = mid + Math.imul(al6, bh7) | 0;
        mid = mid + Math.imul(ah6, bl7) | 0;
        hi = hi + Math.imul(ah6, bh7) | 0;
        lo = lo + Math.imul(al5, bl8) | 0;
        mid = mid + Math.imul(al5, bh8) | 0;
        mid = mid + Math.imul(ah5, bl8) | 0;
        hi = hi + Math.imul(ah5, bh8) | 0;
        lo = lo + Math.imul(al4, bl9) | 0;
        mid = mid + Math.imul(al4, bh9) | 0;
        mid = mid + Math.imul(ah4, bl9) | 0;
        hi = hi + Math.imul(ah4, bh9) | 0;
        var w13 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w13 >>> 26) | 0;
        w13 &= 67108863;
        lo = Math.imul(al9, bl5);
        mid = Math.imul(al9, bh5);
        mid = mid + Math.imul(ah9, bl5) | 0;
        hi = Math.imul(ah9, bh5);
        lo = lo + Math.imul(al8, bl6) | 0;
        mid = mid + Math.imul(al8, bh6) | 0;
        mid = mid + Math.imul(ah8, bl6) | 0;
        hi = hi + Math.imul(ah8, bh6) | 0;
        lo = lo + Math.imul(al7, bl7) | 0;
        mid = mid + Math.imul(al7, bh7) | 0;
        mid = mid + Math.imul(ah7, bl7) | 0;
        hi = hi + Math.imul(ah7, bh7) | 0;
        lo = lo + Math.imul(al6, bl8) | 0;
        mid = mid + Math.imul(al6, bh8) | 0;
        mid = mid + Math.imul(ah6, bl8) | 0;
        hi = hi + Math.imul(ah6, bh8) | 0;
        lo = lo + Math.imul(al5, bl9) | 0;
        mid = mid + Math.imul(al5, bh9) | 0;
        mid = mid + Math.imul(ah5, bl9) | 0;
        hi = hi + Math.imul(ah5, bh9) | 0;
        var w14 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w14 >>> 26) | 0;
        w14 &= 67108863;
        lo = Math.imul(al9, bl6);
        mid = Math.imul(al9, bh6);
        mid = mid + Math.imul(ah9, bl6) | 0;
        hi = Math.imul(ah9, bh6);
        lo = lo + Math.imul(al8, bl7) | 0;
        mid = mid + Math.imul(al8, bh7) | 0;
        mid = mid + Math.imul(ah8, bl7) | 0;
        hi = hi + Math.imul(ah8, bh7) | 0;
        lo = lo + Math.imul(al7, bl8) | 0;
        mid = mid + Math.imul(al7, bh8) | 0;
        mid = mid + Math.imul(ah7, bl8) | 0;
        hi = hi + Math.imul(ah7, bh8) | 0;
        lo = lo + Math.imul(al6, bl9) | 0;
        mid = mid + Math.imul(al6, bh9) | 0;
        mid = mid + Math.imul(ah6, bl9) | 0;
        hi = hi + Math.imul(ah6, bh9) | 0;
        var w15 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w15 >>> 26) | 0;
        w15 &= 67108863;
        lo = Math.imul(al9, bl7);
        mid = Math.imul(al9, bh7);
        mid = mid + Math.imul(ah9, bl7) | 0;
        hi = Math.imul(ah9, bh7);
        lo = lo + Math.imul(al8, bl8) | 0;
        mid = mid + Math.imul(al8, bh8) | 0;
        mid = mid + Math.imul(ah8, bl8) | 0;
        hi = hi + Math.imul(ah8, bh8) | 0;
        lo = lo + Math.imul(al7, bl9) | 0;
        mid = mid + Math.imul(al7, bh9) | 0;
        mid = mid + Math.imul(ah7, bl9) | 0;
        hi = hi + Math.imul(ah7, bh9) | 0;
        var w16 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w16 >>> 26) | 0;
        w16 &= 67108863;
        lo = Math.imul(al9, bl8);
        mid = Math.imul(al9, bh8);
        mid = mid + Math.imul(ah9, bl8) | 0;
        hi = Math.imul(ah9, bh8);
        lo = lo + Math.imul(al8, bl9) | 0;
        mid = mid + Math.imul(al8, bh9) | 0;
        mid = mid + Math.imul(ah8, bl9) | 0;
        hi = hi + Math.imul(ah8, bh9) | 0;
        var w17 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w17 >>> 26) | 0;
        w17 &= 67108863;
        lo = Math.imul(al9, bl9);
        mid = Math.imul(al9, bh9);
        mid = mid + Math.imul(ah9, bl9) | 0;
        hi = Math.imul(ah9, bh9);
        var w18 = (c + lo | 0) + ((8191 & mid) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w18 >>> 26) | 0;
        w18 &= 67108863;
        o[0] = w0;
        o[1] = w1;
        o[2] = w2;
        o[3] = w3;
        o[4] = w4;
        o[5] = w5;
        o[6] = w6;
        o[7] = w7;
        o[8] = w8;
        o[9] = w9;
        o[10] = w10;
        o[11] = w11;
        o[12] = w12;
        o[13] = w13;
        o[14] = w14;
        o[15] = w15;
        o[16] = w16;
        o[17] = w17;
        o[18] = w18;
        if (0 !== c) {
          o[19] = c;
          out.length++;
        }
        return out;
      };
      Math.imul || (comb10MulTo = smallMulTo);
      function bigMulTo(self, num, out) {
        out.negative = num.negative ^ self.negative;
        out.length = self.length + num.length;
        var carry = 0;
        var hncarry = 0;
        for (var k = 0; k < out.length - 1; k++) {
          var ncarry = hncarry;
          hncarry = 0;
          var rword = 67108863 & carry;
          var maxJ = Math.min(k, num.length - 1);
          for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
            var i = k - j;
            var a = 0 | self.words[i];
            var b = 0 | num.words[j];
            var r = a * b;
            var lo = 67108863 & r;
            ncarry = ncarry + (r / 67108864 | 0) | 0;
            lo = lo + rword | 0;
            rword = 67108863 & lo;
            ncarry = ncarry + (lo >>> 26) | 0;
            hncarry += ncarry >>> 26;
            ncarry &= 67108863;
          }
          out.words[k] = rword;
          carry = ncarry;
          ncarry = hncarry;
        }
        0 !== carry ? out.words[k] = carry : out.length--;
        return out.strip();
      }
      function jumboMulTo(self, num, out) {
        var fftm = new FFTM();
        return fftm.mulp(self, num, out);
      }
      BN.prototype.mulTo = function mulTo(num, out) {
        var res;
        var len = this.length + num.length;
        res = 10 === this.length && 10 === num.length ? comb10MulTo(this, num, out) : len < 63 ? smallMulTo(this, num, out) : len < 1024 ? bigMulTo(this, num, out) : jumboMulTo(this, num, out);
        return res;
      };
      function FFTM(x, y) {
        this.x = x;
        this.y = y;
      }
      FFTM.prototype.makeRBT = function makeRBT(N) {
        var t = new Array(N);
        var l = BN.prototype._countBits(N) - 1;
        for (var i = 0; i < N; i++) t[i] = this.revBin(i, l, N);
        return t;
      };
      FFTM.prototype.revBin = function revBin(x, l, N) {
        if (0 === x || x === N - 1) return x;
        var rb = 0;
        for (var i = 0; i < l; i++) {
          rb |= (1 & x) << l - i - 1;
          x >>= 1;
        }
        return rb;
      };
      FFTM.prototype.permute = function permute(rbt, rws, iws, rtws, itws, N) {
        for (var i = 0; i < N; i++) {
          rtws[i] = rws[rbt[i]];
          itws[i] = iws[rbt[i]];
        }
      };
      FFTM.prototype.transform = function transform(rws, iws, rtws, itws, N, rbt) {
        this.permute(rbt, rws, iws, rtws, itws, N);
        for (var s = 1; s < N; s <<= 1) {
          var l = s << 1;
          var rtwdf = Math.cos(2 * Math.PI / l);
          var itwdf = Math.sin(2 * Math.PI / l);
          for (var p = 0; p < N; p += l) {
            var rtwdf_ = rtwdf;
            var itwdf_ = itwdf;
            for (var j = 0; j < s; j++) {
              var re = rtws[p + j];
              var ie = itws[p + j];
              var ro = rtws[p + j + s];
              var io = itws[p + j + s];
              var rx = rtwdf_ * ro - itwdf_ * io;
              io = rtwdf_ * io + itwdf_ * ro;
              ro = rx;
              rtws[p + j] = re + ro;
              itws[p + j] = ie + io;
              rtws[p + j + s] = re - ro;
              itws[p + j + s] = ie - io;
              if (j !== l) {
                rx = rtwdf * rtwdf_ - itwdf * itwdf_;
                itwdf_ = rtwdf * itwdf_ + itwdf * rtwdf_;
                rtwdf_ = rx;
              }
            }
          }
        }
      };
      FFTM.prototype.guessLen13b = function guessLen13b(n, m) {
        var N = 1 | Math.max(m, n);
        var odd = 1 & N;
        var i = 0;
        for (N = N / 2 | 0; N; N >>>= 1) i++;
        return 1 << i + 1 + odd;
      };
      FFTM.prototype.conjugate = function conjugate(rws, iws, N) {
        if (N <= 1) return;
        for (var i = 0; i < N / 2; i++) {
          var t = rws[i];
          rws[i] = rws[N - i - 1];
          rws[N - i - 1] = t;
          t = iws[i];
          iws[i] = -iws[N - i - 1];
          iws[N - i - 1] = -t;
        }
      };
      FFTM.prototype.normalize13b = function normalize13b(ws, N) {
        var carry = 0;
        for (var i = 0; i < N / 2; i++) {
          var w = 8192 * Math.round(ws[2 * i + 1] / N) + Math.round(ws[2 * i] / N) + carry;
          ws[i] = 67108863 & w;
          carry = w < 67108864 ? 0 : w / 67108864 | 0;
        }
        return ws;
      };
      FFTM.prototype.convert13b = function convert13b(ws, len, rws, N) {
        var carry = 0;
        for (var i = 0; i < len; i++) {
          carry += 0 | ws[i];
          rws[2 * i] = 8191 & carry;
          carry >>>= 13;
          rws[2 * i + 1] = 8191 & carry;
          carry >>>= 13;
        }
        for (i = 2 * len; i < N; ++i) rws[i] = 0;
        assert(0 === carry);
        assert(0 === (-8192 & carry));
      };
      FFTM.prototype.stub = function stub(N) {
        var ph = new Array(N);
        for (var i = 0; i < N; i++) ph[i] = 0;
        return ph;
      };
      FFTM.prototype.mulp = function mulp(x, y, out) {
        var N = 2 * this.guessLen13b(x.length, y.length);
        var rbt = this.makeRBT(N);
        var _ = this.stub(N);
        var rws = new Array(N);
        var rwst = new Array(N);
        var iwst = new Array(N);
        var nrws = new Array(N);
        var nrwst = new Array(N);
        var niwst = new Array(N);
        var rmws = out.words;
        rmws.length = N;
        this.convert13b(x.words, x.length, rws, N);
        this.convert13b(y.words, y.length, nrws, N);
        this.transform(rws, _, rwst, iwst, N, rbt);
        this.transform(nrws, _, nrwst, niwst, N, rbt);
        for (var i = 0; i < N; i++) {
          var rx = rwst[i] * nrwst[i] - iwst[i] * niwst[i];
          iwst[i] = rwst[i] * niwst[i] + iwst[i] * nrwst[i];
          rwst[i] = rx;
        }
        this.conjugate(rwst, iwst, N);
        this.transform(rwst, iwst, rmws, _, N, rbt);
        this.conjugate(rmws, _, N);
        this.normalize13b(rmws, N);
        out.negative = x.negative ^ y.negative;
        out.length = x.length + y.length;
        return out.strip();
      };
      BN.prototype.mul = function mul(num) {
        var out = new BN(null);
        out.words = new Array(this.length + num.length);
        return this.mulTo(num, out);
      };
      BN.prototype.mulf = function mulf(num) {
        var out = new BN(null);
        out.words = new Array(this.length + num.length);
        return jumboMulTo(this, num, out);
      };
      BN.prototype.imul = function imul(num) {
        return this.clone().mulTo(num, this);
      };
      BN.prototype.imuln = function imuln(num) {
        assert("number" === typeof num);
        assert(num < 67108864);
        var carry = 0;
        for (var i = 0; i < this.length; i++) {
          var w = (0 | this.words[i]) * num;
          var lo = (67108863 & w) + (67108863 & carry);
          carry >>= 26;
          carry += w / 67108864 | 0;
          carry += lo >>> 26;
          this.words[i] = 67108863 & lo;
        }
        if (0 !== carry) {
          this.words[i] = carry;
          this.length++;
        }
        return this;
      };
      BN.prototype.muln = function muln(num) {
        return this.clone().imuln(num);
      };
      BN.prototype.sqr = function sqr() {
        return this.mul(this);
      };
      BN.prototype.isqr = function isqr() {
        return this.imul(this.clone());
      };
      BN.prototype.pow = function pow(num) {
        var w = toBitArray(num);
        if (0 === w.length) return new BN(1);
        var res = this;
        for (var i = 0; i < w.length; i++, res = res.sqr()) if (0 !== w[i]) break;
        if (++i < w.length) for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
          if (0 === w[i]) continue;
          res = res.mul(q);
        }
        return res;
      };
      BN.prototype.iushln = function iushln(bits) {
        assert("number" === typeof bits && bits >= 0);
        var r = bits % 26;
        var s = (bits - r) / 26;
        var carryMask = 67108863 >>> 26 - r << 26 - r;
        var i;
        if (0 !== r) {
          var carry = 0;
          for (i = 0; i < this.length; i++) {
            var newCarry = this.words[i] & carryMask;
            var c = (0 | this.words[i]) - newCarry << r;
            this.words[i] = c | carry;
            carry = newCarry >>> 26 - r;
          }
          if (carry) {
            this.words[i] = carry;
            this.length++;
          }
        }
        if (0 !== s) {
          for (i = this.length - 1; i >= 0; i--) this.words[i + s] = this.words[i];
          for (i = 0; i < s; i++) this.words[i] = 0;
          this.length += s;
        }
        return this.strip();
      };
      BN.prototype.ishln = function ishln(bits) {
        assert(0 === this.negative);
        return this.iushln(bits);
      };
      BN.prototype.iushrn = function iushrn(bits, hint, extended) {
        assert("number" === typeof bits && bits >= 0);
        var h;
        h = hint ? (hint - hint % 26) / 26 : 0;
        var r = bits % 26;
        var s = Math.min((bits - r) / 26, this.length);
        var mask = 67108863 ^ 67108863 >>> r << r;
        var maskedWords = extended;
        h -= s;
        h = Math.max(0, h);
        if (maskedWords) {
          for (var i = 0; i < s; i++) maskedWords.words[i] = this.words[i];
          maskedWords.length = s;
        }
        if (0 === s) ; else if (this.length > s) {
          this.length -= s;
          for (i = 0; i < this.length; i++) this.words[i] = this.words[i + s];
        } else {
          this.words[0] = 0;
          this.length = 1;
        }
        var carry = 0;
        for (i = this.length - 1; i >= 0 && (0 !== carry || i >= h); i--) {
          var word = 0 | this.words[i];
          this.words[i] = carry << 26 - r | word >>> r;
          carry = word & mask;
        }
        maskedWords && 0 !== carry && (maskedWords.words[maskedWords.length++] = carry);
        if (0 === this.length) {
          this.words[0] = 0;
          this.length = 1;
        }
        return this.strip();
      };
      BN.prototype.ishrn = function ishrn(bits, hint, extended) {
        assert(0 === this.negative);
        return this.iushrn(bits, hint, extended);
      };
      BN.prototype.shln = function shln(bits) {
        return this.clone().ishln(bits);
      };
      BN.prototype.ushln = function ushln(bits) {
        return this.clone().iushln(bits);
      };
      BN.prototype.shrn = function shrn(bits) {
        return this.clone().ishrn(bits);
      };
      BN.prototype.ushrn = function ushrn(bits) {
        return this.clone().iushrn(bits);
      };
      BN.prototype.testn = function testn(bit) {
        assert("number" === typeof bit && bit >= 0);
        var r = bit % 26;
        var s = (bit - r) / 26;
        var q = 1 << r;
        if (this.length <= s) return false;
        var w = this.words[s];
        return !!(w & q);
      };
      BN.prototype.imaskn = function imaskn(bits) {
        assert("number" === typeof bits && bits >= 0);
        var r = bits % 26;
        var s = (bits - r) / 26;
        assert(0 === this.negative, "imaskn works only with positive numbers");
        if (this.length <= s) return this;
        0 !== r && s++;
        this.length = Math.min(s, this.length);
        if (0 !== r) {
          var mask = 67108863 ^ 67108863 >>> r << r;
          this.words[this.length - 1] &= mask;
        }
        return this.strip();
      };
      BN.prototype.maskn = function maskn(bits) {
        return this.clone().imaskn(bits);
      };
      BN.prototype.iaddn = function iaddn(num) {
        assert("number" === typeof num);
        assert(num < 67108864);
        if (num < 0) return this.isubn(-num);
        if (0 !== this.negative) {
          if (1 === this.length && (0 | this.words[0]) < num) {
            this.words[0] = num - (0 | this.words[0]);
            this.negative = 0;
            return this;
          }
          this.negative = 0;
          this.isubn(num);
          this.negative = 1;
          return this;
        }
        return this._iaddn(num);
      };
      BN.prototype._iaddn = function _iaddn(num) {
        this.words[0] += num;
        for (var i = 0; i < this.length && this.words[i] >= 67108864; i++) {
          this.words[i] -= 67108864;
          i === this.length - 1 ? this.words[i + 1] = 1 : this.words[i + 1]++;
        }
        this.length = Math.max(this.length, i + 1);
        return this;
      };
      BN.prototype.isubn = function isubn(num) {
        assert("number" === typeof num);
        assert(num < 67108864);
        if (num < 0) return this.iaddn(-num);
        if (0 !== this.negative) {
          this.negative = 0;
          this.iaddn(num);
          this.negative = 1;
          return this;
        }
        this.words[0] -= num;
        if (1 === this.length && this.words[0] < 0) {
          this.words[0] = -this.words[0];
          this.negative = 1;
        } else for (var i = 0; i < this.length && this.words[i] < 0; i++) {
          this.words[i] += 67108864;
          this.words[i + 1] -= 1;
        }
        return this.strip();
      };
      BN.prototype.addn = function addn(num) {
        return this.clone().iaddn(num);
      };
      BN.prototype.subn = function subn(num) {
        return this.clone().isubn(num);
      };
      BN.prototype.iabs = function iabs() {
        this.negative = 0;
        return this;
      };
      BN.prototype.abs = function abs() {
        return this.clone().iabs();
      };
      BN.prototype._ishlnsubmul = function _ishlnsubmul(num, mul, shift) {
        var len = num.length + shift;
        var i;
        this._expand(len);
        var w;
        var carry = 0;
        for (i = 0; i < num.length; i++) {
          w = (0 | this.words[i + shift]) + carry;
          var right = (0 | num.words[i]) * mul;
          w -= 67108863 & right;
          carry = (w >> 26) - (right / 67108864 | 0);
          this.words[i + shift] = 67108863 & w;
        }
        for (;i < this.length - shift; i++) {
          w = (0 | this.words[i + shift]) + carry;
          carry = w >> 26;
          this.words[i + shift] = 67108863 & w;
        }
        if (0 === carry) return this.strip();
        assert(-1 === carry);
        carry = 0;
        for (i = 0; i < this.length; i++) {
          w = -(0 | this.words[i]) + carry;
          carry = w >> 26;
          this.words[i] = 67108863 & w;
        }
        this.negative = 1;
        return this.strip();
      };
      BN.prototype._wordDiv = function _wordDiv(num, mode) {
        var shift = this.length - num.length;
        var a = this.clone();
        var b = num;
        var bhi = 0 | b.words[b.length - 1];
        var bhiBits = this._countBits(bhi);
        shift = 26 - bhiBits;
        if (0 !== shift) {
          b = b.ushln(shift);
          a.iushln(shift);
          bhi = 0 | b.words[b.length - 1];
        }
        var m = a.length - b.length;
        var q;
        if ("mod" !== mode) {
          q = new BN(null);
          q.length = m + 1;
          q.words = new Array(q.length);
          for (var i = 0; i < q.length; i++) q.words[i] = 0;
        }
        var diff = a.clone()._ishlnsubmul(b, 1, m);
        if (0 === diff.negative) {
          a = diff;
          q && (q.words[m] = 1);
        }
        for (var j = m - 1; j >= 0; j--) {
          var qj = 67108864 * (0 | a.words[b.length + j]) + (0 | a.words[b.length + j - 1]);
          qj = Math.min(qj / bhi | 0, 67108863);
          a._ishlnsubmul(b, qj, j);
          while (0 !== a.negative) {
            qj--;
            a.negative = 0;
            a._ishlnsubmul(b, 1, j);
            a.isZero() || (a.negative ^= 1);
          }
          q && (q.words[j] = qj);
        }
        q && q.strip();
        a.strip();
        "div" !== mode && 0 !== shift && a.iushrn(shift);
        return {
          div: q || null,
          mod: a
        };
      };
      BN.prototype.divmod = function divmod(num, mode, positive) {
        assert(!num.isZero());
        if (this.isZero()) return {
          div: new BN(0),
          mod: new BN(0)
        };
        var div, mod, res;
        if (0 !== this.negative && 0 === num.negative) {
          res = this.neg().divmod(num, mode);
          "mod" !== mode && (div = res.div.neg());
          if ("div" !== mode) {
            mod = res.mod.neg();
            positive && 0 !== mod.negative && mod.iadd(num);
          }
          return {
            div: div,
            mod: mod
          };
        }
        if (0 === this.negative && 0 !== num.negative) {
          res = this.divmod(num.neg(), mode);
          "mod" !== mode && (div = res.div.neg());
          return {
            div: div,
            mod: res.mod
          };
        }
        if (0 !== (this.negative & num.negative)) {
          res = this.neg().divmod(num.neg(), mode);
          if ("div" !== mode) {
            mod = res.mod.neg();
            positive && 0 !== mod.negative && mod.isub(num);
          }
          return {
            div: res.div,
            mod: mod
          };
        }
        if (num.length > this.length || this.cmp(num) < 0) return {
          div: new BN(0),
          mod: this
        };
        if (1 === num.length) {
          if ("div" === mode) return {
            div: this.divn(num.words[0]),
            mod: null
          };
          if ("mod" === mode) return {
            div: null,
            mod: new BN(this.modn(num.words[0]))
          };
          return {
            div: this.divn(num.words[0]),
            mod: new BN(this.modn(num.words[0]))
          };
        }
        return this._wordDiv(num, mode);
      };
      BN.prototype.div = function div(num) {
        return this.divmod(num, "div", false).div;
      };
      BN.prototype.mod = function mod(num) {
        return this.divmod(num, "mod", false).mod;
      };
      BN.prototype.umod = function umod(num) {
        return this.divmod(num, "mod", true).mod;
      };
      BN.prototype.divRound = function divRound(num) {
        var dm = this.divmod(num);
        if (dm.mod.isZero()) return dm.div;
        var mod = 0 !== dm.div.negative ? dm.mod.isub(num) : dm.mod;
        var half = num.ushrn(1);
        var r2 = num.andln(1);
        var cmp = mod.cmp(half);
        if (cmp < 0 || 1 === r2 && 0 === cmp) return dm.div;
        return 0 !== dm.div.negative ? dm.div.isubn(1) : dm.div.iaddn(1);
      };
      BN.prototype.modn = function modn(num) {
        assert(num <= 67108863);
        var p = (1 << 26) % num;
        var acc = 0;
        for (var i = this.length - 1; i >= 0; i--) acc = (p * acc + (0 | this.words[i])) % num;
        return acc;
      };
      BN.prototype.idivn = function idivn(num) {
        assert(num <= 67108863);
        var carry = 0;
        for (var i = this.length - 1; i >= 0; i--) {
          var w = (0 | this.words[i]) + 67108864 * carry;
          this.words[i] = w / num | 0;
          carry = w % num;
        }
        return this.strip();
      };
      BN.prototype.divn = function divn(num) {
        return this.clone().idivn(num);
      };
      BN.prototype.egcd = function egcd(p) {
        assert(0 === p.negative);
        assert(!p.isZero());
        var x = this;
        var y = p.clone();
        x = 0 !== x.negative ? x.umod(p) : x.clone();
        var A = new BN(1);
        var B = new BN(0);
        var C = new BN(0);
        var D = new BN(1);
        var g = 0;
        while (x.isEven() && y.isEven()) {
          x.iushrn(1);
          y.iushrn(1);
          ++g;
        }
        var yp = y.clone();
        var xp = x.clone();
        while (!x.isZero()) {
          for (var i = 0, im = 1; 0 === (x.words[0] & im) && i < 26; ++i, im <<= 1) ;
          if (i > 0) {
            x.iushrn(i);
            while (i-- > 0) {
              if (A.isOdd() || B.isOdd()) {
                A.iadd(yp);
                B.isub(xp);
              }
              A.iushrn(1);
              B.iushrn(1);
            }
          }
          for (var j = 0, jm = 1; 0 === (y.words[0] & jm) && j < 26; ++j, jm <<= 1) ;
          if (j > 0) {
            y.iushrn(j);
            while (j-- > 0) {
              if (C.isOdd() || D.isOdd()) {
                C.iadd(yp);
                D.isub(xp);
              }
              C.iushrn(1);
              D.iushrn(1);
            }
          }
          if (x.cmp(y) >= 0) {
            x.isub(y);
            A.isub(C);
            B.isub(D);
          } else {
            y.isub(x);
            C.isub(A);
            D.isub(B);
          }
        }
        return {
          a: C,
          b: D,
          gcd: y.iushln(g)
        };
      };
      BN.prototype._invmp = function _invmp(p) {
        assert(0 === p.negative);
        assert(!p.isZero());
        var a = this;
        var b = p.clone();
        a = 0 !== a.negative ? a.umod(p) : a.clone();
        var x1 = new BN(1);
        var x2 = new BN(0);
        var delta = b.clone();
        while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
          for (var i = 0, im = 1; 0 === (a.words[0] & im) && i < 26; ++i, im <<= 1) ;
          if (i > 0) {
            a.iushrn(i);
            while (i-- > 0) {
              x1.isOdd() && x1.iadd(delta);
              x1.iushrn(1);
            }
          }
          for (var j = 0, jm = 1; 0 === (b.words[0] & jm) && j < 26; ++j, jm <<= 1) ;
          if (j > 0) {
            b.iushrn(j);
            while (j-- > 0) {
              x2.isOdd() && x2.iadd(delta);
              x2.iushrn(1);
            }
          }
          if (a.cmp(b) >= 0) {
            a.isub(b);
            x1.isub(x2);
          } else {
            b.isub(a);
            x2.isub(x1);
          }
        }
        var res;
        res = 0 === a.cmpn(1) ? x1 : x2;
        res.cmpn(0) < 0 && res.iadd(p);
        return res;
      };
      BN.prototype.gcd = function gcd(num) {
        if (this.isZero()) return num.abs();
        if (num.isZero()) return this.abs();
        var a = this.clone();
        var b = num.clone();
        a.negative = 0;
        b.negative = 0;
        for (var shift = 0; a.isEven() && b.isEven(); shift++) {
          a.iushrn(1);
          b.iushrn(1);
        }
        do {
          while (a.isEven()) a.iushrn(1);
          while (b.isEven()) b.iushrn(1);
          var r = a.cmp(b);
          if (r < 0) {
            var t = a;
            a = b;
            b = t;
          } else if (0 === r || 0 === b.cmpn(1)) break;
          a.isub(b);
        } while (true);
        return b.iushln(shift);
      };
      BN.prototype.invm = function invm(num) {
        return this.egcd(num).a.umod(num);
      };
      BN.prototype.isEven = function isEven() {
        return 0 === (1 & this.words[0]);
      };
      BN.prototype.isOdd = function isOdd() {
        return 1 === (1 & this.words[0]);
      };
      BN.prototype.andln = function andln(num) {
        return this.words[0] & num;
      };
      BN.prototype.bincn = function bincn(bit) {
        assert("number" === typeof bit);
        var r = bit % 26;
        var s = (bit - r) / 26;
        var q = 1 << r;
        if (this.length <= s) {
          this._expand(s + 1);
          this.words[s] |= q;
          return this;
        }
        var carry = q;
        for (var i = s; 0 !== carry && i < this.length; i++) {
          var w = 0 | this.words[i];
          w += carry;
          carry = w >>> 26;
          w &= 67108863;
          this.words[i] = w;
        }
        if (0 !== carry) {
          this.words[i] = carry;
          this.length++;
        }
        return this;
      };
      BN.prototype.isZero = function isZero() {
        return 1 === this.length && 0 === this.words[0];
      };
      BN.prototype.cmpn = function cmpn(num) {
        var negative = num < 0;
        if (0 !== this.negative && !negative) return -1;
        if (0 === this.negative && negative) return 1;
        this.strip();
        var res;
        if (this.length > 1) res = 1; else {
          negative && (num = -num);
          assert(num <= 67108863, "Number is too big");
          var w = 0 | this.words[0];
          res = w === num ? 0 : w < num ? -1 : 1;
        }
        if (0 !== this.negative) return 0 | -res;
        return res;
      };
      BN.prototype.cmp = function cmp(num) {
        if (0 !== this.negative && 0 === num.negative) return -1;
        if (0 === this.negative && 0 !== num.negative) return 1;
        var res = this.ucmp(num);
        if (0 !== this.negative) return 0 | -res;
        return res;
      };
      BN.prototype.ucmp = function ucmp(num) {
        if (this.length > num.length) return 1;
        if (this.length < num.length) return -1;
        var res = 0;
        for (var i = this.length - 1; i >= 0; i--) {
          var a = 0 | this.words[i];
          var b = 0 | num.words[i];
          if (a === b) continue;
          a < b ? res = -1 : a > b && (res = 1);
          break;
        }
        return res;
      };
      BN.prototype.gtn = function gtn(num) {
        return 1 === this.cmpn(num);
      };
      BN.prototype.gt = function gt(num) {
        return 1 === this.cmp(num);
      };
      BN.prototype.gten = function gten(num) {
        return this.cmpn(num) >= 0;
      };
      BN.prototype.gte = function gte(num) {
        return this.cmp(num) >= 0;
      };
      BN.prototype.ltn = function ltn(num) {
        return -1 === this.cmpn(num);
      };
      BN.prototype.lt = function lt(num) {
        return -1 === this.cmp(num);
      };
      BN.prototype.lten = function lten(num) {
        return this.cmpn(num) <= 0;
      };
      BN.prototype.lte = function lte(num) {
        return this.cmp(num) <= 0;
      };
      BN.prototype.eqn = function eqn(num) {
        return 0 === this.cmpn(num);
      };
      BN.prototype.eq = function eq(num) {
        return 0 === this.cmp(num);
      };
      BN.red = function red(num) {
        return new Red(num);
      };
      BN.prototype.toRed = function toRed(ctx) {
        assert(!this.red, "Already a number in reduction context");
        assert(0 === this.negative, "red works only with positives");
        return ctx.convertTo(this)._forceRed(ctx);
      };
      BN.prototype.fromRed = function fromRed() {
        assert(this.red, "fromRed works only with numbers in reduction context");
        return this.red.convertFrom(this);
      };
      BN.prototype._forceRed = function _forceRed(ctx) {
        this.red = ctx;
        return this;
      };
      BN.prototype.forceRed = function forceRed(ctx) {
        assert(!this.red, "Already a number in reduction context");
        return this._forceRed(ctx);
      };
      BN.prototype.redAdd = function redAdd(num) {
        assert(this.red, "redAdd works only with red numbers");
        return this.red.add(this, num);
      };
      BN.prototype.redIAdd = function redIAdd(num) {
        assert(this.red, "redIAdd works only with red numbers");
        return this.red.iadd(this, num);
      };
      BN.prototype.redSub = function redSub(num) {
        assert(this.red, "redSub works only with red numbers");
        return this.red.sub(this, num);
      };
      BN.prototype.redISub = function redISub(num) {
        assert(this.red, "redISub works only with red numbers");
        return this.red.isub(this, num);
      };
      BN.prototype.redShl = function redShl(num) {
        assert(this.red, "redShl works only with red numbers");
        return this.red.shl(this, num);
      };
      BN.prototype.redMul = function redMul(num) {
        assert(this.red, "redMul works only with red numbers");
        this.red._verify2(this, num);
        return this.red.mul(this, num);
      };
      BN.prototype.redIMul = function redIMul(num) {
        assert(this.red, "redMul works only with red numbers");
        this.red._verify2(this, num);
        return this.red.imul(this, num);
      };
      BN.prototype.redSqr = function redSqr() {
        assert(this.red, "redSqr works only with red numbers");
        this.red._verify1(this);
        return this.red.sqr(this);
      };
      BN.prototype.redISqr = function redISqr() {
        assert(this.red, "redISqr works only with red numbers");
        this.red._verify1(this);
        return this.red.isqr(this);
      };
      BN.prototype.redSqrt = function redSqrt() {
        assert(this.red, "redSqrt works only with red numbers");
        this.red._verify1(this);
        return this.red.sqrt(this);
      };
      BN.prototype.redInvm = function redInvm() {
        assert(this.red, "redInvm works only with red numbers");
        this.red._verify1(this);
        return this.red.invm(this);
      };
      BN.prototype.redNeg = function redNeg() {
        assert(this.red, "redNeg works only with red numbers");
        this.red._verify1(this);
        return this.red.neg(this);
      };
      BN.prototype.redPow = function redPow(num) {
        assert(this.red && !num.red, "redPow(normalNum)");
        this.red._verify1(this);
        return this.red.pow(this, num);
      };
      var primes = {
        k256: null,
        p224: null,
        p192: null,
        p25519: null
      };
      function MPrime(name, p) {
        this.name = name;
        this.p = new BN(p, 16);
        this.n = this.p.bitLength();
        this.k = new BN(1).iushln(this.n).isub(this.p);
        this.tmp = this._tmp();
      }
      MPrime.prototype._tmp = function _tmp() {
        var tmp = new BN(null);
        tmp.words = new Array(Math.ceil(this.n / 13));
        return tmp;
      };
      MPrime.prototype.ireduce = function ireduce(num) {
        var r = num;
        var rlen;
        do {
          this.split(r, this.tmp);
          r = this.imulK(r);
          r = r.iadd(this.tmp);
          rlen = r.bitLength();
        } while (rlen > this.n);
        var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
        if (0 === cmp) {
          r.words[0] = 0;
          r.length = 1;
        } else cmp > 0 ? r.isub(this.p) : r.strip();
        return r;
      };
      MPrime.prototype.split = function split(input, out) {
        input.iushrn(this.n, 0, out);
      };
      MPrime.prototype.imulK = function imulK(num) {
        return num.imul(this.k);
      };
      function K256() {
        MPrime.call(this, "k256", "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f");
      }
      inherits(K256, MPrime);
      K256.prototype.split = function split(input, output) {
        var mask = 4194303;
        var outLen = Math.min(input.length, 9);
        for (var i = 0; i < outLen; i++) output.words[i] = input.words[i];
        output.length = outLen;
        if (input.length <= 9) {
          input.words[0] = 0;
          input.length = 1;
          return;
        }
        var prev = input.words[9];
        output.words[output.length++] = prev & mask;
        for (i = 10; i < input.length; i++) {
          var next = 0 | input.words[i];
          input.words[i - 10] = (next & mask) << 4 | prev >>> 22;
          prev = next;
        }
        prev >>>= 22;
        input.words[i - 10] = prev;
        0 === prev && input.length > 10 ? input.length -= 10 : input.length -= 9;
      };
      K256.prototype.imulK = function imulK(num) {
        num.words[num.length] = 0;
        num.words[num.length + 1] = 0;
        num.length += 2;
        var lo = 0;
        for (var i = 0; i < num.length; i++) {
          var w = 0 | num.words[i];
          lo += 977 * w;
          num.words[i] = 67108863 & lo;
          lo = 64 * w + (lo / 67108864 | 0);
        }
        if (0 === num.words[num.length - 1]) {
          num.length--;
          0 === num.words[num.length - 1] && num.length--;
        }
        return num;
      };
      function P224() {
        MPrime.call(this, "p224", "ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001");
      }
      inherits(P224, MPrime);
      function P192() {
        MPrime.call(this, "p192", "ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff");
      }
      inherits(P192, MPrime);
      function P25519() {
        MPrime.call(this, "25519", "7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed");
      }
      inherits(P25519, MPrime);
      P25519.prototype.imulK = function imulK(num) {
        var carry = 0;
        for (var i = 0; i < num.length; i++) {
          var hi = 19 * (0 | num.words[i]) + carry;
          var lo = 67108863 & hi;
          hi >>>= 26;
          num.words[i] = lo;
          carry = hi;
        }
        0 !== carry && (num.words[num.length++] = carry);
        return num;
      };
      BN._prime = function prime(name) {
        if (primes[name]) return primes[name];
        var prime;
        if ("k256" === name) prime = new K256(); else if ("p224" === name) prime = new P224(); else if ("p192" === name) prime = new P192(); else {
          if ("p25519" !== name) throw new Error("Unknown prime " + name);
          prime = new P25519();
        }
        primes[name] = prime;
        return prime;
      };
      function Red(m) {
        if ("string" === typeof m) {
          var prime = BN._prime(m);
          this.m = prime.p;
          this.prime = prime;
        } else {
          assert(m.gtn(1), "modulus must be greater than 1");
          this.m = m;
          this.prime = null;
        }
      }
      Red.prototype._verify1 = function _verify1(a) {
        assert(0 === a.negative, "red works only with positives");
        assert(a.red, "red works only with red numbers");
      };
      Red.prototype._verify2 = function _verify2(a, b) {
        assert(0 === (a.negative | b.negative), "red works only with positives");
        assert(a.red && a.red === b.red, "red works only with red numbers");
      };
      Red.prototype.imod = function imod(a) {
        if (this.prime) return this.prime.ireduce(a)._forceRed(this);
        return a.umod(this.m)._forceRed(this);
      };
      Red.prototype.neg = function neg(a) {
        if (a.isZero()) return a.clone();
        return this.m.sub(a)._forceRed(this);
      };
      Red.prototype.add = function add(a, b) {
        this._verify2(a, b);
        var res = a.add(b);
        res.cmp(this.m) >= 0 && res.isub(this.m);
        return res._forceRed(this);
      };
      Red.prototype.iadd = function iadd(a, b) {
        this._verify2(a, b);
        var res = a.iadd(b);
        res.cmp(this.m) >= 0 && res.isub(this.m);
        return res;
      };
      Red.prototype.sub = function sub(a, b) {
        this._verify2(a, b);
        var res = a.sub(b);
        res.cmpn(0) < 0 && res.iadd(this.m);
        return res._forceRed(this);
      };
      Red.prototype.isub = function isub(a, b) {
        this._verify2(a, b);
        var res = a.isub(b);
        res.cmpn(0) < 0 && res.iadd(this.m);
        return res;
      };
      Red.prototype.shl = function shl(a, num) {
        this._verify1(a);
        return this.imod(a.ushln(num));
      };
      Red.prototype.imul = function imul(a, b) {
        this._verify2(a, b);
        return this.imod(a.imul(b));
      };
      Red.prototype.mul = function mul(a, b) {
        this._verify2(a, b);
        return this.imod(a.mul(b));
      };
      Red.prototype.isqr = function isqr(a) {
        return this.imul(a, a.clone());
      };
      Red.prototype.sqr = function sqr(a) {
        return this.mul(a, a);
      };
      Red.prototype.sqrt = function sqrt(a) {
        if (a.isZero()) return a.clone();
        var mod3 = this.m.andln(3);
        assert(mod3 % 2 === 1);
        if (3 === mod3) {
          var pow = this.m.add(new BN(1)).iushrn(2);
          return this.pow(a, pow);
        }
        var q = this.m.subn(1);
        var s = 0;
        while (!q.isZero() && 0 === q.andln(1)) {
          s++;
          q.iushrn(1);
        }
        assert(!q.isZero());
        var one = new BN(1).toRed(this);
        var nOne = one.redNeg();
        var lpow = this.m.subn(1).iushrn(1);
        var z = this.m.bitLength();
        z = new BN(2 * z * z).toRed(this);
        while (0 !== this.pow(z, lpow).cmp(nOne)) z.redIAdd(nOne);
        var c = this.pow(z, q);
        var r = this.pow(a, q.addn(1).iushrn(1));
        var t = this.pow(a, q);
        var m = s;
        while (0 !== t.cmp(one)) {
          var tmp = t;
          for (var i = 0; 0 !== tmp.cmp(one); i++) tmp = tmp.redSqr();
          assert(i < m);
          var b = this.pow(c, new BN(1).iushln(m - i - 1));
          r = r.redMul(b);
          c = b.redSqr();
          t = t.redMul(c);
          m = i;
        }
        return r;
      };
      Red.prototype.invm = function invm(a) {
        var inv = a._invmp(this.m);
        if (0 !== inv.negative) {
          inv.negative = 0;
          return this.imod(inv).redNeg();
        }
        return this.imod(inv);
      };
      Red.prototype.pow = function pow(a, num) {
        if (num.isZero()) return new BN(1).toRed(this);
        if (0 === num.cmpn(1)) return a.clone();
        var windowSize = 4;
        var wnd = new Array(1 << windowSize);
        wnd[0] = new BN(1).toRed(this);
        wnd[1] = a;
        for (var i = 2; i < wnd.length; i++) wnd[i] = this.mul(wnd[i - 1], a);
        var res = wnd[0];
        var current = 0;
        var currentLen = 0;
        var start = num.bitLength() % 26;
        0 === start && (start = 26);
        for (i = num.length - 1; i >= 0; i--) {
          var word = num.words[i];
          for (var j = start - 1; j >= 0; j--) {
            var bit = word >> j & 1;
            res !== wnd[0] && (res = this.sqr(res));
            if (0 === bit && 0 === current) {
              currentLen = 0;
              continue;
            }
            current <<= 1;
            current |= bit;
            currentLen++;
            if (currentLen !== windowSize && (0 !== i || 0 !== j)) continue;
            res = this.mul(res, wnd[current]);
            currentLen = 0;
            current = 0;
          }
          start = 26;
        }
        return res;
      };
      Red.prototype.convertTo = function convertTo(num) {
        var r = num.umod(this.m);
        return r === num ? r.clone() : r;
      };
      Red.prototype.convertFrom = function convertFrom(num) {
        var res = num.clone();
        res.red = null;
        return res;
      };
      BN.mont = function mont(num) {
        return new Mont(num);
      };
      function Mont(m) {
        Red.call(this, m);
        this.shift = this.m.bitLength();
        this.shift % 26 !== 0 && (this.shift += 26 - this.shift % 26);
        this.r = new BN(1).iushln(this.shift);
        this.r2 = this.imod(this.r.sqr());
        this.rinv = this.r._invmp(this.m);
        this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
        this.minv = this.minv.umod(this.r);
        this.minv = this.r.sub(this.minv);
      }
      inherits(Mont, Red);
      Mont.prototype.convertTo = function convertTo(num) {
        return this.imod(num.ushln(this.shift));
      };
      Mont.prototype.convertFrom = function convertFrom(num) {
        var r = this.imod(num.mul(this.rinv));
        r.red = null;
        return r;
      };
      Mont.prototype.imul = function imul(a, b) {
        if (a.isZero() || b.isZero()) {
          a.words[0] = 0;
          a.length = 1;
          return a;
        }
        var t = a.imul(b);
        var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
        var u = t.isub(c).iushrn(this.shift);
        var res = u;
        u.cmp(this.m) >= 0 ? res = u.isub(this.m) : u.cmpn(0) < 0 && (res = u.iadd(this.m));
        return res._forceRed(this);
      };
      Mont.prototype.mul = function mul(a, b) {
        if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);
        var t = a.mul(b);
        var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
        var u = t.isub(c).iushrn(this.shift);
        var res = u;
        u.cmp(this.m) >= 0 ? res = u.isub(this.m) : u.cmpn(0) < 0 && (res = u.iadd(this.m));
        return res._forceRed(this);
      };
      Mont.prototype.invm = function invm(a) {
        var res = this.imod(a._invmp(this.m).mul(this.r2));
        return res._forceRed(this);
      };
    })("undefined" === typeof module || module, this);
  }, {
    buffer: 18
  } ],
  17: [ function(require, module, exports) {
    var r;
    module.exports = function rand(len) {
      r || (r = new Rand(null));
      return r.generate(len);
    };
    function Rand(rand) {
      this.rand = rand;
    }
    module.exports.Rand = Rand;
    Rand.prototype.generate = function generate(len) {
      return this._rand(len);
    };
    Rand.prototype._rand = function _rand(n) {
      if (this.rand.getBytes) return this.rand.getBytes(n);
      var res = new Uint8Array(n);
      for (var i = 0; i < res.length; i++) res[i] = this.rand.getByte();
      return res;
    };
    if ("object" === typeof self) self.crypto && self.crypto.getRandomValues ? Rand.prototype._rand = function _rand(n) {
      var arr = new Uint8Array(n);
      self.crypto.getRandomValues(arr);
      return arr;
    } : self.msCrypto && self.msCrypto.getRandomValues ? Rand.prototype._rand = function _rand(n) {
      var arr = new Uint8Array(n);
      self.msCrypto.getRandomValues(arr);
      return arr;
    } : "object" === typeof window && (Rand.prototype._rand = function() {
      throw new Error("Not implemented yet");
    }); else try {
      var crypto = require("crypto");
      if ("function" !== typeof crypto.randomBytes) throw new Error("Not supported");
      Rand.prototype._rand = function _rand(n) {
        return crypto.randomBytes(n);
      };
    } catch (e) {}
  }, {
    crypto: 18
  } ],
  18: [ function(require, module, exports) {}, {} ],
  19: [ function(require, module, exports) {
    var Buffer = require("safe-buffer").Buffer;
    function asUInt32Array(buf) {
      Buffer.isBuffer(buf) || (buf = Buffer.from(buf));
      var len = buf.length / 4 | 0;
      var out = new Array(len);
      for (var i = 0; i < len; i++) out[i] = buf.readUInt32BE(4 * i);
      return out;
    }
    function scrubVec(v) {
      for (var i = 0; i < v.length; v++) v[i] = 0;
    }
    function cryptBlock(M, keySchedule, SUB_MIX, SBOX, nRounds) {
      var SUB_MIX0 = SUB_MIX[0];
      var SUB_MIX1 = SUB_MIX[1];
      var SUB_MIX2 = SUB_MIX[2];
      var SUB_MIX3 = SUB_MIX[3];
      var s0 = M[0] ^ keySchedule[0];
      var s1 = M[1] ^ keySchedule[1];
      var s2 = M[2] ^ keySchedule[2];
      var s3 = M[3] ^ keySchedule[3];
      var t0, t1, t2, t3;
      var ksRow = 4;
      for (var round = 1; round < nRounds; round++) {
        t0 = SUB_MIX0[s0 >>> 24] ^ SUB_MIX1[s1 >>> 16 & 255] ^ SUB_MIX2[s2 >>> 8 & 255] ^ SUB_MIX3[255 & s3] ^ keySchedule[ksRow++];
        t1 = SUB_MIX0[s1 >>> 24] ^ SUB_MIX1[s2 >>> 16 & 255] ^ SUB_MIX2[s3 >>> 8 & 255] ^ SUB_MIX3[255 & s0] ^ keySchedule[ksRow++];
        t2 = SUB_MIX0[s2 >>> 24] ^ SUB_MIX1[s3 >>> 16 & 255] ^ SUB_MIX2[s0 >>> 8 & 255] ^ SUB_MIX3[255 & s1] ^ keySchedule[ksRow++];
        t3 = SUB_MIX0[s3 >>> 24] ^ SUB_MIX1[s0 >>> 16 & 255] ^ SUB_MIX2[s1 >>> 8 & 255] ^ SUB_MIX3[255 & s2] ^ keySchedule[ksRow++];
        s0 = t0;
        s1 = t1;
        s2 = t2;
        s3 = t3;
      }
      t0 = (SBOX[s0 >>> 24] << 24 | SBOX[s1 >>> 16 & 255] << 16 | SBOX[s2 >>> 8 & 255] << 8 | SBOX[255 & s3]) ^ keySchedule[ksRow++];
      t1 = (SBOX[s1 >>> 24] << 24 | SBOX[s2 >>> 16 & 255] << 16 | SBOX[s3 >>> 8 & 255] << 8 | SBOX[255 & s0]) ^ keySchedule[ksRow++];
      t2 = (SBOX[s2 >>> 24] << 24 | SBOX[s3 >>> 16 & 255] << 16 | SBOX[s0 >>> 8 & 255] << 8 | SBOX[255 & s1]) ^ keySchedule[ksRow++];
      t3 = (SBOX[s3 >>> 24] << 24 | SBOX[s0 >>> 16 & 255] << 16 | SBOX[s1 >>> 8 & 255] << 8 | SBOX[255 & s2]) ^ keySchedule[ksRow++];
      t0 >>>= 0;
      t1 >>>= 0;
      t2 >>>= 0;
      t3 >>>= 0;
      return [ t0, t1, t2, t3 ];
    }
    var RCON = [ 0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54 ];
    var G = function() {
      var d = new Array(256);
      for (var j = 0; j < 256; j++) d[j] = j < 128 ? j << 1 : j << 1 ^ 283;
      var SBOX = [];
      var INV_SBOX = [];
      var SUB_MIX = [ [], [], [], [] ];
      var INV_SUB_MIX = [ [], [], [], [] ];
      var x = 0;
      var xi = 0;
      for (var i = 0; i < 256; ++i) {
        var sx = xi ^ xi << 1 ^ xi << 2 ^ xi << 3 ^ xi << 4;
        sx = sx >>> 8 ^ 255 & sx ^ 99;
        SBOX[x] = sx;
        INV_SBOX[sx] = x;
        var x2 = d[x];
        var x4 = d[x2];
        var x8 = d[x4];
        var t = 257 * d[sx] ^ 16843008 * sx;
        SUB_MIX[0][x] = t << 24 | t >>> 8;
        SUB_MIX[1][x] = t << 16 | t >>> 16;
        SUB_MIX[2][x] = t << 8 | t >>> 24;
        SUB_MIX[3][x] = t;
        t = 16843009 * x8 ^ 65537 * x4 ^ 257 * x2 ^ 16843008 * x;
        INV_SUB_MIX[0][sx] = t << 24 | t >>> 8;
        INV_SUB_MIX[1][sx] = t << 16 | t >>> 16;
        INV_SUB_MIX[2][sx] = t << 8 | t >>> 24;
        INV_SUB_MIX[3][sx] = t;
        if (0 === x) x = xi = 1; else {
          x = x2 ^ d[d[d[x8 ^ x2]]];
          xi ^= d[d[xi]];
        }
      }
      return {
        SBOX: SBOX,
        INV_SBOX: INV_SBOX,
        SUB_MIX: SUB_MIX,
        INV_SUB_MIX: INV_SUB_MIX
      };
    }();
    function AES(key) {
      this._key = asUInt32Array(key);
      this._reset();
    }
    AES.blockSize = 16;
    AES.keySize = 32;
    AES.prototype.blockSize = AES.blockSize;
    AES.prototype.keySize = AES.keySize;
    AES.prototype._reset = function() {
      var keyWords = this._key;
      var keySize = keyWords.length;
      var nRounds = keySize + 6;
      var ksRows = 4 * (nRounds + 1);
      var keySchedule = [];
      for (var k = 0; k < keySize; k++) keySchedule[k] = keyWords[k];
      for (k = keySize; k < ksRows; k++) {
        var t = keySchedule[k - 1];
        if (k % keySize === 0) {
          t = t << 8 | t >>> 24;
          t = G.SBOX[t >>> 24] << 24 | G.SBOX[t >>> 16 & 255] << 16 | G.SBOX[t >>> 8 & 255] << 8 | G.SBOX[255 & t];
          t ^= RCON[k / keySize | 0] << 24;
        } else keySize > 6 && k % keySize === 4 && (t = G.SBOX[t >>> 24] << 24 | G.SBOX[t >>> 16 & 255] << 16 | G.SBOX[t >>> 8 & 255] << 8 | G.SBOX[255 & t]);
        keySchedule[k] = keySchedule[k - keySize] ^ t;
      }
      var invKeySchedule = [];
      for (var ik = 0; ik < ksRows; ik++) {
        var ksR = ksRows - ik;
        var tt = keySchedule[ksR - (ik % 4 ? 0 : 4)];
        invKeySchedule[ik] = ik < 4 || ksR <= 4 ? tt : G.INV_SUB_MIX[0][G.SBOX[tt >>> 24]] ^ G.INV_SUB_MIX[1][G.SBOX[tt >>> 16 & 255]] ^ G.INV_SUB_MIX[2][G.SBOX[tt >>> 8 & 255]] ^ G.INV_SUB_MIX[3][G.SBOX[255 & tt]];
      }
      this._nRounds = nRounds;
      this._keySchedule = keySchedule;
      this._invKeySchedule = invKeySchedule;
    };
    AES.prototype.encryptBlockRaw = function(M) {
      M = asUInt32Array(M);
      return cryptBlock(M, this._keySchedule, G.SUB_MIX, G.SBOX, this._nRounds);
    };
    AES.prototype.encryptBlock = function(M) {
      var out = this.encryptBlockRaw(M);
      var buf = Buffer.allocUnsafe(16);
      buf.writeUInt32BE(out[0], 0);
      buf.writeUInt32BE(out[1], 4);
      buf.writeUInt32BE(out[2], 8);
      buf.writeUInt32BE(out[3], 12);
      return buf;
    };
    AES.prototype.decryptBlock = function(M) {
      M = asUInt32Array(M);
      var m1 = M[1];
      M[1] = M[3];
      M[3] = m1;
      var out = cryptBlock(M, this._invKeySchedule, G.INV_SUB_MIX, G.INV_SBOX, this._nRounds);
      var buf = Buffer.allocUnsafe(16);
      buf.writeUInt32BE(out[0], 0);
      buf.writeUInt32BE(out[3], 4);
      buf.writeUInt32BE(out[2], 8);
      buf.writeUInt32BE(out[1], 12);
      return buf;
    };
    AES.prototype.scrub = function() {
      scrubVec(this._keySchedule);
      scrubVec(this._invKeySchedule);
      scrubVec(this._key);
    };
    module.exports.AES = AES;
  }, {
    "safe-buffer": 144
  } ],
  20: [ function(require, module, exports) {
    var aes = require("./aes");
    var Buffer = require("safe-buffer").Buffer;
    var Transform = require("cipher-base");
    var inherits = require("inherits");
    var GHASH = require("./ghash");
    var xor = require("buffer-xor");
    var incr32 = require("./incr32");
    function xorTest(a, b) {
      var out = 0;
      a.length !== b.length && out++;
      var len = Math.min(a.length, b.length);
      for (var i = 0; i < len; ++i) out += a[i] ^ b[i];
      return out;
    }
    function calcIv(self, iv, ck) {
      if (12 === iv.length) {
        self._finID = Buffer.concat([ iv, Buffer.from([ 0, 0, 0, 1 ]) ]);
        return Buffer.concat([ iv, Buffer.from([ 0, 0, 0, 2 ]) ]);
      }
      var ghash = new GHASH(ck);
      var len = iv.length;
      var toPad = len % 16;
      ghash.update(iv);
      if (toPad) {
        toPad = 16 - toPad;
        ghash.update(Buffer.alloc(toPad, 0));
      }
      ghash.update(Buffer.alloc(8, 0));
      var ivBits = 8 * len;
      var tail = Buffer.alloc(8);
      tail.writeUIntBE(ivBits, 0, 8);
      ghash.update(tail);
      self._finID = ghash.state;
      var out = Buffer.from(self._finID);
      incr32(out);
      return out;
    }
    function StreamCipher(mode, key, iv, decrypt) {
      Transform.call(this);
      var h = Buffer.alloc(4, 0);
      this._cipher = new aes.AES(key);
      var ck = this._cipher.encryptBlock(h);
      this._ghash = new GHASH(ck);
      iv = calcIv(this, iv, ck);
      this._prev = Buffer.from(iv);
      this._cache = Buffer.allocUnsafe(0);
      this._secCache = Buffer.allocUnsafe(0);
      this._decrypt = decrypt;
      this._alen = 0;
      this._len = 0;
      this._mode = mode;
      this._authTag = null;
      this._called = false;
    }
    inherits(StreamCipher, Transform);
    StreamCipher.prototype._update = function(chunk) {
      if (!this._called && this._alen) {
        var rump = 16 - this._alen % 16;
        if (rump < 16) {
          rump = Buffer.alloc(rump, 0);
          this._ghash.update(rump);
        }
      }
      this._called = true;
      var out = this._mode.encrypt(this, chunk);
      this._decrypt ? this._ghash.update(chunk) : this._ghash.update(out);
      this._len += chunk.length;
      return out;
    };
    StreamCipher.prototype._final = function() {
      if (this._decrypt && !this._authTag) throw new Error("Unsupported state or unable to authenticate data");
      var tag = xor(this._ghash.final(8 * this._alen, 8 * this._len), this._cipher.encryptBlock(this._finID));
      if (this._decrypt && xorTest(tag, this._authTag)) throw new Error("Unsupported state or unable to authenticate data");
      this._authTag = tag;
      this._cipher.scrub();
    };
    StreamCipher.prototype.getAuthTag = function getAuthTag() {
      if (this._decrypt || !Buffer.isBuffer(this._authTag)) throw new Error("Attempting to get auth tag in unsupported state");
      return this._authTag;
    };
    StreamCipher.prototype.setAuthTag = function setAuthTag(tag) {
      if (!this._decrypt) throw new Error("Attempting to set auth tag in unsupported state");
      this._authTag = tag;
    };
    StreamCipher.prototype.setAAD = function setAAD(buf) {
      if (this._called) throw new Error("Attempting to set AAD in unsupported state");
      this._ghash.update(buf);
      this._alen += buf.length;
    };
    module.exports = StreamCipher;
  }, {
    "./aes": 19,
    "./ghash": 24,
    "./incr32": 25,
    "buffer-xor": 46,
    "cipher-base": 49,
    inherits: 101,
    "safe-buffer": 144
  } ],
  21: [ function(require, module, exports) {
    var ciphers = require("./encrypter");
    var deciphers = require("./decrypter");
    var modes = require("./modes/list.json");
    function getCiphers() {
      return Object.keys(modes);
    }
    exports.createCipher = exports.Cipher = ciphers.createCipher;
    exports.createCipheriv = exports.Cipheriv = ciphers.createCipheriv;
    exports.createDecipher = exports.Decipher = deciphers.createDecipher;
    exports.createDecipheriv = exports.Decipheriv = deciphers.createDecipheriv;
    exports.listCiphers = exports.getCiphers = getCiphers;
  }, {
    "./decrypter": 22,
    "./encrypter": 23,
    "./modes/list.json": 33
  } ],
  22: [ function(require, module, exports) {
    var AuthCipher = require("./authCipher");
    var Buffer = require("safe-buffer").Buffer;
    var MODES = require("./modes");
    var StreamCipher = require("./streamCipher");
    var Transform = require("cipher-base");
    var aes = require("./aes");
    var ebtk = require("evp_bytestokey");
    var inherits = require("inherits");
    function Decipher(mode, key, iv) {
      Transform.call(this);
      this._cache = new Splitter();
      this._last = void 0;
      this._cipher = new aes.AES(key);
      this._prev = Buffer.from(iv);
      this._mode = mode;
      this._autopadding = true;
    }
    inherits(Decipher, Transform);
    Decipher.prototype._update = function(data) {
      this._cache.add(data);
      var chunk;
      var thing;
      var out = [];
      while (chunk = this._cache.get(this._autopadding)) {
        thing = this._mode.decrypt(this, chunk);
        out.push(thing);
      }
      return Buffer.concat(out);
    };
    Decipher.prototype._final = function() {
      var chunk = this._cache.flush();
      if (this._autopadding) return unpad(this._mode.decrypt(this, chunk));
      if (chunk) throw new Error("data not multiple of block length");
    };
    Decipher.prototype.setAutoPadding = function(setTo) {
      this._autopadding = !!setTo;
      return this;
    };
    function Splitter() {
      this.cache = Buffer.allocUnsafe(0);
    }
    Splitter.prototype.add = function(data) {
      this.cache = Buffer.concat([ this.cache, data ]);
    };
    Splitter.prototype.get = function(autoPadding) {
      var out;
      if (autoPadding) {
        if (this.cache.length > 16) {
          out = this.cache.slice(0, 16);
          this.cache = this.cache.slice(16);
          return out;
        }
      } else if (this.cache.length >= 16) {
        out = this.cache.slice(0, 16);
        this.cache = this.cache.slice(16);
        return out;
      }
      return null;
    };
    Splitter.prototype.flush = function() {
      if (this.cache.length) return this.cache;
    };
    function unpad(last) {
      var padded = last[15];
      if (padded < 1 || padded > 16) throw new Error("unable to decrypt data");
      var i = -1;
      while (++i < padded) if (last[i + (16 - padded)] !== padded) throw new Error("unable to decrypt data");
      if (16 === padded) return;
      return last.slice(0, 16 - padded);
    }
    function createDecipheriv(suite, password, iv) {
      var config = MODES[suite.toLowerCase()];
      if (!config) throw new TypeError("invalid suite type");
      "string" === typeof iv && (iv = Buffer.from(iv));
      if ("GCM" !== config.mode && iv.length !== config.iv) throw new TypeError("invalid iv length " + iv.length);
      "string" === typeof password && (password = Buffer.from(password));
      if (password.length !== config.key / 8) throw new TypeError("invalid key length " + password.length);
      if ("stream" === config.type) return new StreamCipher(config.module, password, iv, true);
      if ("auth" === config.type) return new AuthCipher(config.module, password, iv, true);
      return new Decipher(config.module, password, iv);
    }
    function createDecipher(suite, password) {
      var config = MODES[suite.toLowerCase()];
      if (!config) throw new TypeError("invalid suite type");
      var keys = ebtk(password, false, config.key, config.iv);
      return createDecipheriv(suite, keys.key, keys.iv);
    }
    exports.createDecipher = createDecipher;
    exports.createDecipheriv = createDecipheriv;
  }, {
    "./aes": 19,
    "./authCipher": 20,
    "./modes": 32,
    "./streamCipher": 35,
    "cipher-base": 49,
    evp_bytestokey: 84,
    inherits: 101,
    "safe-buffer": 144
  } ],
  23: [ function(require, module, exports) {
    var MODES = require("./modes");
    var AuthCipher = require("./authCipher");
    var Buffer = require("safe-buffer").Buffer;
    var StreamCipher = require("./streamCipher");
    var Transform = require("cipher-base");
    var aes = require("./aes");
    var ebtk = require("evp_bytestokey");
    var inherits = require("inherits");
    function Cipher(mode, key, iv) {
      Transform.call(this);
      this._cache = new Splitter();
      this._cipher = new aes.AES(key);
      this._prev = Buffer.from(iv);
      this._mode = mode;
      this._autopadding = true;
    }
    inherits(Cipher, Transform);
    Cipher.prototype._update = function(data) {
      this._cache.add(data);
      var chunk;
      var thing;
      var out = [];
      while (chunk = this._cache.get()) {
        thing = this._mode.encrypt(this, chunk);
        out.push(thing);
      }
      return Buffer.concat(out);
    };
    var PADDING = Buffer.alloc(16, 16);
    Cipher.prototype._final = function() {
      var chunk = this._cache.flush();
      if (this._autopadding) {
        chunk = this._mode.encrypt(this, chunk);
        this._cipher.scrub();
        return chunk;
      }
      if (!chunk.equals(PADDING)) {
        this._cipher.scrub();
        throw new Error("data not multiple of block length");
      }
    };
    Cipher.prototype.setAutoPadding = function(setTo) {
      this._autopadding = !!setTo;
      return this;
    };
    function Splitter() {
      this.cache = Buffer.allocUnsafe(0);
    }
    Splitter.prototype.add = function(data) {
      this.cache = Buffer.concat([ this.cache, data ]);
    };
    Splitter.prototype.get = function() {
      if (this.cache.length > 15) {
        var out = this.cache.slice(0, 16);
        this.cache = this.cache.slice(16);
        return out;
      }
      return null;
    };
    Splitter.prototype.flush = function() {
      var len = 16 - this.cache.length;
      var padBuff = Buffer.allocUnsafe(len);
      var i = -1;
      while (++i < len) padBuff.writeUInt8(len, i);
      return Buffer.concat([ this.cache, padBuff ]);
    };
    function createCipheriv(suite, password, iv) {
      var config = MODES[suite.toLowerCase()];
      if (!config) throw new TypeError("invalid suite type");
      "string" === typeof password && (password = Buffer.from(password));
      if (password.length !== config.key / 8) throw new TypeError("invalid key length " + password.length);
      "string" === typeof iv && (iv = Buffer.from(iv));
      if ("GCM" !== config.mode && iv.length !== config.iv) throw new TypeError("invalid iv length " + iv.length);
      if ("stream" === config.type) return new StreamCipher(config.module, password, iv);
      if ("auth" === config.type) return new AuthCipher(config.module, password, iv);
      return new Cipher(config.module, password, iv);
    }
    function createCipher(suite, password) {
      var config = MODES[suite.toLowerCase()];
      if (!config) throw new TypeError("invalid suite type");
      var keys = ebtk(password, false, config.key, config.iv);
      return createCipheriv(suite, keys.key, keys.iv);
    }
    exports.createCipheriv = createCipheriv;
    exports.createCipher = createCipher;
  }, {
    "./aes": 19,
    "./authCipher": 20,
    "./modes": 32,
    "./streamCipher": 35,
    "cipher-base": 49,
    evp_bytestokey: 84,
    inherits: 101,
    "safe-buffer": 144
  } ],
  24: [ function(require, module, exports) {
    var Buffer = require("safe-buffer").Buffer;
    var ZEROES = Buffer.alloc(16, 0);
    function toArray(buf) {
      return [ buf.readUInt32BE(0), buf.readUInt32BE(4), buf.readUInt32BE(8), buf.readUInt32BE(12) ];
    }
    function fromArray(out) {
      var buf = Buffer.allocUnsafe(16);
      buf.writeUInt32BE(out[0] >>> 0, 0);
      buf.writeUInt32BE(out[1] >>> 0, 4);
      buf.writeUInt32BE(out[2] >>> 0, 8);
      buf.writeUInt32BE(out[3] >>> 0, 12);
      return buf;
    }
    function GHASH(key) {
      this.h = key;
      this.state = Buffer.alloc(16, 0);
      this.cache = Buffer.allocUnsafe(0);
    }
    GHASH.prototype.ghash = function(block) {
      var i = -1;
      while (++i < block.length) this.state[i] ^= block[i];
      this._multiply();
    };
    GHASH.prototype._multiply = function() {
      var Vi = toArray(this.h);
      var Zi = [ 0, 0, 0, 0 ];
      var j, xi, lsbVi;
      var i = -1;
      while (++i < 128) {
        xi = 0 !== (this.state[~~(i / 8)] & 1 << 7 - i % 8);
        if (xi) {
          Zi[0] ^= Vi[0];
          Zi[1] ^= Vi[1];
          Zi[2] ^= Vi[2];
          Zi[3] ^= Vi[3];
        }
        lsbVi = 0 !== (1 & Vi[3]);
        for (j = 3; j > 0; j--) Vi[j] = Vi[j] >>> 1 | (1 & Vi[j - 1]) << 31;
        Vi[0] = Vi[0] >>> 1;
        lsbVi && (Vi[0] = Vi[0] ^ 225 << 24);
      }
      this.state = fromArray(Zi);
    };
    GHASH.prototype.update = function(buf) {
      this.cache = Buffer.concat([ this.cache, buf ]);
      var chunk;
      while (this.cache.length >= 16) {
        chunk = this.cache.slice(0, 16);
        this.cache = this.cache.slice(16);
        this.ghash(chunk);
      }
    };
    GHASH.prototype.final = function(abl, bl) {
      this.cache.length && this.ghash(Buffer.concat([ this.cache, ZEROES ], 16));
      this.ghash(fromArray([ 0, abl, 0, bl ]));
      return this.state;
    };
    module.exports = GHASH;
  }, {
    "safe-buffer": 144
  } ],
  25: [ function(require, module, exports) {
    function incr32(iv) {
      var len = iv.length;
      var item;
      while (len--) {
        item = iv.readUInt8(len);
        if (255 !== item) {
          item++;
          iv.writeUInt8(item, len);
          break;
        }
        iv.writeUInt8(0, len);
      }
    }
    module.exports = incr32;
  }, {} ],
  26: [ function(require, module, exports) {
    var xor = require("buffer-xor");
    exports.encrypt = function(self, block) {
      var data = xor(block, self._prev);
      self._prev = self._cipher.encryptBlock(data);
      return self._prev;
    };
    exports.decrypt = function(self, block) {
      var pad = self._prev;
      self._prev = block;
      var out = self._cipher.decryptBlock(block);
      return xor(out, pad);
    };
  }, {
    "buffer-xor": 46
  } ],
  27: [ function(require, module, exports) {
    var Buffer = require("safe-buffer").Buffer;
    var xor = require("buffer-xor");
    function encryptStart(self, data, decrypt) {
      var len = data.length;
      var out = xor(data, self._cache);
      self._cache = self._cache.slice(len);
      self._prev = Buffer.concat([ self._prev, decrypt ? data : out ]);
      return out;
    }
    exports.encrypt = function(self, data, decrypt) {
      var out = Buffer.allocUnsafe(0);
      var len;
      while (data.length) {
        if (0 === self._cache.length) {
          self._cache = self._cipher.encryptBlock(self._prev);
          self._prev = Buffer.allocUnsafe(0);
        }
        if (!(self._cache.length <= data.length)) {
          out = Buffer.concat([ out, encryptStart(self, data, decrypt) ]);
          break;
        }
        len = self._cache.length;
        out = Buffer.concat([ out, encryptStart(self, data.slice(0, len), decrypt) ]);
        data = data.slice(len);
      }
      return out;
    };
  }, {
    "buffer-xor": 46,
    "safe-buffer": 144
  } ],
  28: [ function(require, module, exports) {
    var Buffer = require("safe-buffer").Buffer;
    function encryptByte(self, byteParam, decrypt) {
      var pad;
      var i = -1;
      var len = 8;
      var out = 0;
      var bit, value;
      while (++i < len) {
        pad = self._cipher.encryptBlock(self._prev);
        bit = byteParam & 1 << 7 - i ? 128 : 0;
        value = pad[0] ^ bit;
        out += (128 & value) >> i % 8;
        self._prev = shiftIn(self._prev, decrypt ? bit : value);
      }
      return out;
    }
    function shiftIn(buffer, value) {
      var len = buffer.length;
      var i = -1;
      var out = Buffer.allocUnsafe(buffer.length);
      buffer = Buffer.concat([ buffer, Buffer.from([ value ]) ]);
      while (++i < len) out[i] = buffer[i] << 1 | buffer[i + 1] >> 7;
      return out;
    }
    exports.encrypt = function(self, chunk, decrypt) {
      var len = chunk.length;
      var out = Buffer.allocUnsafe(len);
      var i = -1;
      while (++i < len) out[i] = encryptByte(self, chunk[i], decrypt);
      return out;
    };
  }, {
    "safe-buffer": 144
  } ],
  29: [ function(require, module, exports) {
    var Buffer = require("safe-buffer").Buffer;
    function encryptByte(self, byteParam, decrypt) {
      var pad = self._cipher.encryptBlock(self._prev);
      var out = pad[0] ^ byteParam;
      self._prev = Buffer.concat([ self._prev.slice(1), Buffer.from([ decrypt ? byteParam : out ]) ]);
      return out;
    }
    exports.encrypt = function(self, chunk, decrypt) {
      var len = chunk.length;
      var out = Buffer.allocUnsafe(len);
      var i = -1;
      while (++i < len) out[i] = encryptByte(self, chunk[i], decrypt);
      return out;
    };
  }, {
    "safe-buffer": 144
  } ],
  30: [ function(require, module, exports) {
    var xor = require("buffer-xor");
    var Buffer = require("safe-buffer").Buffer;
    var incr32 = require("../incr32");
    function getBlock(self) {
      var out = self._cipher.encryptBlockRaw(self._prev);
      incr32(self._prev);
      return out;
    }
    var blockSize = 16;
    exports.encrypt = function(self, chunk) {
      var chunkNum = Math.ceil(chunk.length / blockSize);
      var start = self._cache.length;
      self._cache = Buffer.concat([ self._cache, Buffer.allocUnsafe(chunkNum * blockSize) ]);
      for (var i = 0; i < chunkNum; i++) {
        var out = getBlock(self);
        var offset = start + i * blockSize;
        self._cache.writeUInt32BE(out[0], offset + 0);
        self._cache.writeUInt32BE(out[1], offset + 4);
        self._cache.writeUInt32BE(out[2], offset + 8);
        self._cache.writeUInt32BE(out[3], offset + 12);
      }
      var pad = self._cache.slice(0, chunk.length);
      self._cache = self._cache.slice(chunk.length);
      return xor(chunk, pad);
    };
  }, {
    "../incr32": 25,
    "buffer-xor": 46,
    "safe-buffer": 144
  } ],
  31: [ function(require, module, exports) {
    exports.encrypt = function(self, block) {
      return self._cipher.encryptBlock(block);
    };
    exports.decrypt = function(self, block) {
      return self._cipher.decryptBlock(block);
    };
  }, {} ],
  32: [ function(require, module, exports) {
    var modeModules = {
      ECB: require("./ecb"),
      CBC: require("./cbc"),
      CFB: require("./cfb"),
      CFB8: require("./cfb8"),
      CFB1: require("./cfb1"),
      OFB: require("./ofb"),
      CTR: require("./ctr"),
      GCM: require("./ctr")
    };
    var modes = require("./list.json");
    for (var key in modes) modes[key].module = modeModules[modes[key].mode];
    module.exports = modes;
  }, {
    "./cbc": 26,
    "./cfb": 27,
    "./cfb1": 28,
    "./cfb8": 29,
    "./ctr": 30,
    "./ecb": 31,
    "./list.json": 33,
    "./ofb": 34
  } ],
  33: [ function(require, module, exports) {
    module.exports = {
      "aes-128-ecb": {
        cipher: "AES",
        key: 128,
        iv: 0,
        mode: "ECB",
        type: "block"
      },
      "aes-192-ecb": {
        cipher: "AES",
        key: 192,
        iv: 0,
        mode: "ECB",
        type: "block"
      },
      "aes-256-ecb": {
        cipher: "AES",
        key: 256,
        iv: 0,
        mode: "ECB",
        type: "block"
      },
      "aes-128-cbc": {
        cipher: "AES",
        key: 128,
        iv: 16,
        mode: "CBC",
        type: "block"
      },
      "aes-192-cbc": {
        cipher: "AES",
        key: 192,
        iv: 16,
        mode: "CBC",
        type: "block"
      },
      "aes-256-cbc": {
        cipher: "AES",
        key: 256,
        iv: 16,
        mode: "CBC",
        type: "block"
      },
      aes128: {
        cipher: "AES",
        key: 128,
        iv: 16,
        mode: "CBC",
        type: "block"
      },
      aes192: {
        cipher: "AES",
        key: 192,
        iv: 16,
        mode: "CBC",
        type: "block"
      },
      aes256: {
        cipher: "AES",
        key: 256,
        iv: 16,
        mode: "CBC",
        type: "block"
      },
      "aes-128-cfb": {
        cipher: "AES",
        key: 128,
        iv: 16,
        mode: "CFB",
        type: "stream"
      },
      "aes-192-cfb": {
        cipher: "AES",
        key: 192,
        iv: 16,
        mode: "CFB",
        type: "stream"
      },
      "aes-256-cfb": {
        cipher: "AES",
        key: 256,
        iv: 16,
        mode: "CFB",
        type: "stream"
      },
      "aes-128-cfb8": {
        cipher: "AES",
        key: 128,
        iv: 16,
        mode: "CFB8",
        type: "stream"
      },
      "aes-192-cfb8": {
        cipher: "AES",
        key: 192,
        iv: 16,
        mode: "CFB8",
        type: "stream"
      },
      "aes-256-cfb8": {
        cipher: "AES",
        key: 256,
        iv: 16,
        mode: "CFB8",
        type: "stream"
      },
      "aes-128-cfb1": {
        cipher: "AES",
        key: 128,
        iv: 16,
        mode: "CFB1",
        type: "stream"
      },
      "aes-192-cfb1": {
        cipher: "AES",
        key: 192,
        iv: 16,
        mode: "CFB1",
        type: "stream"
      },
      "aes-256-cfb1": {
        cipher: "AES",
        key: 256,
        iv: 16,
        mode: "CFB1",
        type: "stream"
      },
      "aes-128-ofb": {
        cipher: "AES",
        key: 128,
        iv: 16,
        mode: "OFB",
        type: "stream"
      },
      "aes-192-ofb": {
        cipher: "AES",
        key: 192,
        iv: 16,
        mode: "OFB",
        type: "stream"
      },
      "aes-256-ofb": {
        cipher: "AES",
        key: 256,
        iv: 16,
        mode: "OFB",
        type: "stream"
      },
      "aes-128-ctr": {
        cipher: "AES",
        key: 128,
        iv: 16,
        mode: "CTR",
        type: "stream"
      },
      "aes-192-ctr": {
        cipher: "AES",
        key: 192,
        iv: 16,
        mode: "CTR",
        type: "stream"
      },
      "aes-256-ctr": {
        cipher: "AES",
        key: 256,
        iv: 16,
        mode: "CTR",
        type: "stream"
      },
      "aes-128-gcm": {
        cipher: "AES",
        key: 128,
        iv: 12,
        mode: "GCM",
        type: "auth"
      },
      "aes-192-gcm": {
        cipher: "AES",
        key: 192,
        iv: 12,
        mode: "GCM",
        type: "auth"
      },
      "aes-256-gcm": {
        cipher: "AES",
        key: 256,
        iv: 12,
        mode: "GCM",
        type: "auth"
      }
    };
  }, {} ],
  34: [ function(require, module, exports) {
    (function(Buffer) {
      var xor = require("buffer-xor");
      function getBlock(self) {
        self._prev = self._cipher.encryptBlock(self._prev);
        return self._prev;
      }
      exports.encrypt = function(self, chunk) {
        while (self._cache.length < chunk.length) self._cache = Buffer.concat([ self._cache, getBlock(self) ]);
        var pad = self._cache.slice(0, chunk.length);
        self._cache = self._cache.slice(chunk.length);
        return xor(chunk, pad);
      };
    }).call(this, require("buffer").Buffer);
  }, {
    buffer: 47,
    "buffer-xor": 46
  } ],
  35: [ function(require, module, exports) {
    var aes = require("./aes");
    var Buffer = require("safe-buffer").Buffer;
    var Transform = require("cipher-base");
    var inherits = require("inherits");
    function StreamCipher(mode, key, iv, decrypt) {
      Transform.call(this);
      this._cipher = new aes.AES(key);
      this._prev = Buffer.from(iv);
      this._cache = Buffer.allocUnsafe(0);
      this._secCache = Buffer.allocUnsafe(0);
      this._decrypt = decrypt;
      this._mode = mode;
    }
    inherits(StreamCipher, Transform);
    StreamCipher.prototype._update = function(chunk) {
      return this._mode.encrypt(this, chunk, this._decrypt);
    };
    StreamCipher.prototype._final = function() {
      this._cipher.scrub();
    };
    module.exports = StreamCipher;
  }, {
    "./aes": 19,
    "cipher-base": 49,
    inherits: 101,
    "safe-buffer": 144
  } ],
  36: [ function(require, module, exports) {
    var DES = require("browserify-des");
    var aes = require("browserify-aes/browser");
    var aesModes = require("browserify-aes/modes");
    var desModes = require("browserify-des/modes");
    var ebtk = require("evp_bytestokey");
    function createCipher(suite, password) {
      suite = suite.toLowerCase();
      var keyLen, ivLen;
      if (aesModes[suite]) {
        keyLen = aesModes[suite].key;
        ivLen = aesModes[suite].iv;
      } else {
        if (!desModes[suite]) throw new TypeError("invalid suite type");
        keyLen = 8 * desModes[suite].key;
        ivLen = desModes[suite].iv;
      }
      var keys = ebtk(password, false, keyLen, ivLen);
      return createCipheriv(suite, keys.key, keys.iv);
    }
    function createDecipher(suite, password) {
      suite = suite.toLowerCase();
      var keyLen, ivLen;
      if (aesModes[suite]) {
        keyLen = aesModes[suite].key;
        ivLen = aesModes[suite].iv;
      } else {
        if (!desModes[suite]) throw new TypeError("invalid suite type");
        keyLen = 8 * desModes[suite].key;
        ivLen = desModes[suite].iv;
      }
      var keys = ebtk(password, false, keyLen, ivLen);
      return createDecipheriv(suite, keys.key, keys.iv);
    }
    function createCipheriv(suite, key, iv) {
      suite = suite.toLowerCase();
      if (aesModes[suite]) return aes.createCipheriv(suite, key, iv);
      if (desModes[suite]) return new DES({
        key: key,
        iv: iv,
        mode: suite
      });
      throw new TypeError("invalid suite type");
    }
    function createDecipheriv(suite, key, iv) {
      suite = suite.toLowerCase();
      if (aesModes[suite]) return aes.createDecipheriv(suite, key, iv);
      if (desModes[suite]) return new DES({
        key: key,
        iv: iv,
        mode: suite,
        decrypt: true
      });
      throw new TypeError("invalid suite type");
    }
    function getCiphers() {
      return Object.keys(desModes).concat(aes.getCiphers());
    }
    exports.createCipher = exports.Cipher = createCipher;
    exports.createCipheriv = exports.Cipheriv = createCipheriv;
    exports.createDecipher = exports.Decipher = createDecipher;
    exports.createDecipheriv = exports.Decipheriv = createDecipheriv;
    exports.listCiphers = exports.getCiphers = getCiphers;
  }, {
    "browserify-aes/browser": 21,
    "browserify-aes/modes": 32,
    "browserify-des": 37,
    "browserify-des/modes": 38,
    evp_bytestokey: 84
  } ],
  37: [ function(require, module, exports) {
    var CipherBase = require("cipher-base");
    var des = require("des.js");
    var inherits = require("inherits");
    var Buffer = require("safe-buffer").Buffer;
    var modes = {
      "des-ede3-cbc": des.CBC.instantiate(des.EDE),
      "des-ede3": des.EDE,
      "des-ede-cbc": des.CBC.instantiate(des.EDE),
      "des-ede": des.EDE,
      "des-cbc": des.CBC.instantiate(des.DES),
      "des-ecb": des.DES
    };
    modes.des = modes["des-cbc"];
    modes.des3 = modes["des-ede3-cbc"];
    module.exports = DES;
    inherits(DES, CipherBase);
    function DES(opts) {
      CipherBase.call(this);
      var modeName = opts.mode.toLowerCase();
      var mode = modes[modeName];
      var type;
      type = opts.decrypt ? "decrypt" : "encrypt";
      var key = opts.key;
      Buffer.isBuffer(key) || (key = Buffer.from(key));
      "des-ede" !== modeName && "des-ede-cbc" !== modeName || (key = Buffer.concat([ key, key.slice(0, 8) ]));
      var iv = opts.iv;
      Buffer.isBuffer(iv) || (iv = Buffer.from(iv));
      this._des = mode.create({
        key: key,
        iv: iv,
        type: type
      });
    }
    DES.prototype._update = function(data) {
      return Buffer.from(this._des.update(data));
    };
    DES.prototype._final = function() {
      return Buffer.from(this._des.final());
    };
  }, {
    "cipher-base": 49,
    "des.js": 57,
    inherits: 101,
    "safe-buffer": 144
  } ],
  38: [ function(require, module, exports) {
    exports["des-ecb"] = {
      key: 8,
      iv: 0
    };
    exports["des-cbc"] = exports.des = {
      key: 8,
      iv: 8
    };
    exports["des-ede3-cbc"] = exports.des3 = {
      key: 24,
      iv: 8
    };
    exports["des-ede3"] = {
      key: 24,
      iv: 0
    };
    exports["des-ede-cbc"] = {
      key: 16,
      iv: 8
    };
    exports["des-ede"] = {
      key: 16,
      iv: 0
    };
  }, {} ],
  39: [ function(require, module, exports) {
    (function(Buffer) {
      var bn = require("bn.js");
      var randomBytes = require("randombytes");
      module.exports = crt;
      function blind(priv) {
        var r = getr(priv);
        var blinder = r.toRed(bn.mont(priv.modulus)).redPow(new bn(priv.publicExponent)).fromRed();
        return {
          blinder: blinder,
          unblinder: r.invm(priv.modulus)
        };
      }
      function crt(msg, priv) {
        var blinds = blind(priv);
        var len = priv.modulus.byteLength();
        var mod = bn.mont(priv.modulus);
        var blinded = new bn(msg).mul(blinds.blinder).umod(priv.modulus);
        var c1 = blinded.toRed(bn.mont(priv.prime1));
        var c2 = blinded.toRed(bn.mont(priv.prime2));
        var qinv = priv.coefficient;
        var p = priv.prime1;
        var q = priv.prime2;
        var m1 = c1.redPow(priv.exponent1);
        var m2 = c2.redPow(priv.exponent2);
        m1 = m1.fromRed();
        m2 = m2.fromRed();
        var h = m1.isub(m2).imul(qinv).umod(p);
        h.imul(q);
        m2.iadd(h);
        return new Buffer(m2.imul(blinds.unblinder).umod(priv.modulus).toArray(false, len));
      }
      crt.getr = getr;
      function getr(priv) {
        var len = priv.modulus.byteLength();
        var r = new bn(randomBytes(len));
        while (r.cmp(priv.modulus) >= 0 || !r.umod(priv.prime1) || !r.umod(priv.prime2)) r = new bn(randomBytes(len));
        return r;
      }
    }).call(this, require("buffer").Buffer);
  }, {
    "bn.js": 16,
    buffer: 47,
    randombytes: 126
  } ],
  40: [ function(require, module, exports) {
    module.exports = require("./browser/algorithms.json");
  }, {
    "./browser/algorithms.json": 41
  } ],
  41: [ function(require, module, exports) {
    module.exports = {
      sha224WithRSAEncryption: {
        sign: "rsa",
        hash: "sha224",
        id: "302d300d06096086480165030402040500041c"
      },
      "RSA-SHA224": {
        sign: "ecdsa/rsa",
        hash: "sha224",
        id: "302d300d06096086480165030402040500041c"
      },
      sha256WithRSAEncryption: {
        sign: "rsa",
        hash: "sha256",
        id: "3031300d060960864801650304020105000420"
      },
      "RSA-SHA256": {
        sign: "ecdsa/rsa",
        hash: "sha256",
        id: "3031300d060960864801650304020105000420"
      },
      sha384WithRSAEncryption: {
        sign: "rsa",
        hash: "sha384",
        id: "3041300d060960864801650304020205000430"
      },
      "RSA-SHA384": {
        sign: "ecdsa/rsa",
        hash: "sha384",
        id: "3041300d060960864801650304020205000430"
      },
      sha512WithRSAEncryption: {
        sign: "rsa",
        hash: "sha512",
        id: "3051300d060960864801650304020305000440"
      },
      "RSA-SHA512": {
        sign: "ecdsa/rsa",
        hash: "sha512",
        id: "3051300d060960864801650304020305000440"
      },
      "RSA-SHA1": {
        sign: "rsa",
        hash: "sha1",
        id: "3021300906052b0e03021a05000414"
      },
      "ecdsa-with-SHA1": {
        sign: "ecdsa",
        hash: "sha1",
        id: ""
      },
      sha256: {
        sign: "ecdsa",
        hash: "sha256",
        id: ""
      },
      sha224: {
        sign: "ecdsa",
        hash: "sha224",
        id: ""
      },
      sha384: {
        sign: "ecdsa",
        hash: "sha384",
        id: ""
      },
      sha512: {
        sign: "ecdsa",
        hash: "sha512",
        id: ""
      },
      "DSA-SHA": {
        sign: "dsa",
        hash: "sha1",
        id: ""
      },
      "DSA-SHA1": {
        sign: "dsa",
        hash: "sha1",
        id: ""
      },
      DSA: {
        sign: "dsa",
        hash: "sha1",
        id: ""
      },
      "DSA-WITH-SHA224": {
        sign: "dsa",
        hash: "sha224",
        id: ""
      },
      "DSA-SHA224": {
        sign: "dsa",
        hash: "sha224",
        id: ""
      },
      "DSA-WITH-SHA256": {
        sign: "dsa",
        hash: "sha256",
        id: ""
      },
      "DSA-SHA256": {
        sign: "dsa",
        hash: "sha256",
        id: ""
      },
      "DSA-WITH-SHA384": {
        sign: "dsa",
        hash: "sha384",
        id: ""
      },
      "DSA-SHA384": {
        sign: "dsa",
        hash: "sha384",
        id: ""
      },
      "DSA-WITH-SHA512": {
        sign: "dsa",
        hash: "sha512",
        id: ""
      },
      "DSA-SHA512": {
        sign: "dsa",
        hash: "sha512",
        id: ""
      },
      "DSA-RIPEMD160": {
        sign: "dsa",
        hash: "rmd160",
        id: ""
      },
      ripemd160WithRSA: {
        sign: "rsa",
        hash: "rmd160",
        id: "3021300906052b2403020105000414"
      },
      "RSA-RIPEMD160": {
        sign: "rsa",
        hash: "rmd160",
        id: "3021300906052b2403020105000414"
      },
      md5WithRSAEncryption: {
        sign: "rsa",
        hash: "md5",
        id: "3020300c06082a864886f70d020505000410"
      },
      "RSA-MD5": {
        sign: "rsa",
        hash: "md5",
        id: "3020300c06082a864886f70d020505000410"
      }
    };
  }, {} ],
  42: [ function(require, module, exports) {
    module.exports = {
      "1.3.132.0.10": "secp256k1",
      "1.3.132.0.33": "p224",
      "1.2.840.10045.3.1.1": "p192",
      "1.2.840.10045.3.1.7": "p256",
      "1.3.132.0.34": "p384",
      "1.3.132.0.35": "p521"
    };
  }, {} ],
  43: [ function(require, module, exports) {
    (function(Buffer) {
      var createHash = require("create-hash");
      var stream = require("stream");
      var inherits = require("inherits");
      var sign = require("./sign");
      var verify = require("./verify");
      var algorithms = require("./algorithms.json");
      Object.keys(algorithms).forEach(function(key) {
        algorithms[key].id = new Buffer(algorithms[key].id, "hex");
        algorithms[key.toLowerCase()] = algorithms[key];
      });
      function Sign(algorithm) {
        stream.Writable.call(this);
        var data = algorithms[algorithm];
        if (!data) throw new Error("Unknown message digest");
        this._hashType = data.hash;
        this._hash = createHash(data.hash);
        this._tag = data.id;
        this._signType = data.sign;
      }
      inherits(Sign, stream.Writable);
      Sign.prototype._write = function _write(data, _, done) {
        this._hash.update(data);
        done();
      };
      Sign.prototype.update = function update(data, enc) {
        "string" === typeof data && (data = new Buffer(data, enc));
        this._hash.update(data);
        return this;
      };
      Sign.prototype.sign = function signMethod(key, enc) {
        this.end();
        var hash = this._hash.digest();
        var sig = sign(hash, key, this._hashType, this._signType, this._tag);
        return enc ? sig.toString(enc) : sig;
      };
      function Verify(algorithm) {
        stream.Writable.call(this);
        var data = algorithms[algorithm];
        if (!data) throw new Error("Unknown message digest");
        this._hash = createHash(data.hash);
        this._tag = data.id;
        this._signType = data.sign;
      }
      inherits(Verify, stream.Writable);
      Verify.prototype._write = function _write(data, _, done) {
        this._hash.update(data);
        done();
      };
      Verify.prototype.update = function update(data, enc) {
        "string" === typeof data && (data = new Buffer(data, enc));
        this._hash.update(data);
        return this;
      };
      Verify.prototype.verify = function verifyMethod(key, sig, enc) {
        "string" === typeof sig && (sig = new Buffer(sig, enc));
        this.end();
        var hash = this._hash.digest();
        return verify(sig, hash, key, this._signType, this._tag);
      };
      function createSign(algorithm) {
        return new Sign(algorithm);
      }
      function createVerify(algorithm) {
        return new Verify(algorithm);
      }
      module.exports = {
        Sign: createSign,
        Verify: createVerify,
        createSign: createSign,
        createVerify: createVerify
      };
    }).call(this, require("buffer").Buffer);
  }, {
    "./algorithms.json": 41,
    "./sign": 44,
    "./verify": 45,
    buffer: 47,
    "create-hash": 52,
    inherits: 101,
    stream: 153
  } ],
  44: [ function(require, module, exports) {
    (function(Buffer) {
      var createHmac = require("create-hmac");
      var crt = require("browserify-rsa");
      var EC = require("elliptic").ec;
      var BN = require("bn.js");
      var parseKeys = require("parse-asn1");
      var curves = require("./curves.json");
      function sign(hash, key, hashType, signType, tag) {
        var priv = parseKeys(key);
        if (priv.curve) {
          if ("ecdsa" !== signType && "ecdsa/rsa" !== signType) throw new Error("wrong private key type");
          return ecSign(hash, priv);
        }
        if ("dsa" === priv.type) {
          if ("dsa" !== signType) throw new Error("wrong private key type");
          return dsaSign(hash, priv, hashType);
        }
        if ("rsa" !== signType && "ecdsa/rsa" !== signType) throw new Error("wrong private key type");
        hash = Buffer.concat([ tag, hash ]);
        var len = priv.modulus.byteLength();
        var pad = [ 0, 1 ];
        while (hash.length + pad.length + 1 < len) pad.push(255);
        pad.push(0);
        var i = -1;
        while (++i < hash.length) pad.push(hash[i]);
        var out = crt(pad, priv);
        return out;
      }
      function ecSign(hash, priv) {
        var curveId = curves[priv.curve.join(".")];
        if (!curveId) throw new Error("unknown curve " + priv.curve.join("."));
        var curve = new EC(curveId);
        var key = curve.keyFromPrivate(priv.privateKey);
        var out = key.sign(hash);
        return new Buffer(out.toDER());
      }
      function dsaSign(hash, priv, algo) {
        var x = priv.params.priv_key;
        var p = priv.params.p;
        var q = priv.params.q;
        var g = priv.params.g;
        var r = new BN(0);
        var k;
        var H = bits2int(hash, q).mod(q);
        var s = false;
        var kv = getKey(x, q, hash, algo);
        while (false === s) {
          k = makeKey(q, kv, algo);
          r = makeR(g, k, p, q);
          s = k.invm(q).imul(H.add(x.mul(r))).mod(q);
          if (0 === s.cmpn(0)) {
            s = false;
            r = new BN(0);
          }
        }
        return toDER(r, s);
      }
      function toDER(r, s) {
        r = r.toArray();
        s = s.toArray();
        128 & r[0] && (r = [ 0 ].concat(r));
        128 & s[0] && (s = [ 0 ].concat(s));
        var total = r.length + s.length + 4;
        var res = [ 48, total, 2, r.length ];
        res = res.concat(r, [ 2, s.length ], s);
        return new Buffer(res);
      }
      function getKey(x, q, hash, algo) {
        x = new Buffer(x.toArray());
        if (x.length < q.byteLength()) {
          var zeros = new Buffer(q.byteLength() - x.length);
          zeros.fill(0);
          x = Buffer.concat([ zeros, x ]);
        }
        var hlen = hash.length;
        var hbits = bits2octets(hash, q);
        var v = new Buffer(hlen);
        v.fill(1);
        var k = new Buffer(hlen);
        k.fill(0);
        k = createHmac(algo, k).update(v).update(new Buffer([ 0 ])).update(x).update(hbits).digest();
        v = createHmac(algo, k).update(v).digest();
        k = createHmac(algo, k).update(v).update(new Buffer([ 1 ])).update(x).update(hbits).digest();
        v = createHmac(algo, k).update(v).digest();
        return {
          k: k,
          v: v
        };
      }
      function bits2int(obits, q) {
        var bits = new BN(obits);
        var shift = (obits.length << 3) - q.bitLength();
        shift > 0 && bits.ishrn(shift);
        return bits;
      }
      function bits2octets(bits, q) {
        bits = bits2int(bits, q);
        bits = bits.mod(q);
        var out = new Buffer(bits.toArray());
        if (out.length < q.byteLength()) {
          var zeros = new Buffer(q.byteLength() - out.length);
          zeros.fill(0);
          out = Buffer.concat([ zeros, out ]);
        }
        return out;
      }
      function makeKey(q, kv, algo) {
        var t;
        var k;
        do {
          t = new Buffer(0);
          while (8 * t.length < q.bitLength()) {
            kv.v = createHmac(algo, kv.k).update(kv.v).digest();
            t = Buffer.concat([ t, kv.v ]);
          }
          k = bits2int(t, q);
          kv.k = createHmac(algo, kv.k).update(kv.v).update(new Buffer([ 0 ])).digest();
          kv.v = createHmac(algo, kv.k).update(kv.v).digest();
        } while (-1 !== k.cmp(q));
        return k;
      }
      function makeR(g, k, p, q) {
        return g.toRed(BN.mont(p)).redPow(k).fromRed().mod(q);
      }
      module.exports = sign;
      module.exports.getKey = getKey;
      module.exports.makeKey = makeKey;
    }).call(this, require("buffer").Buffer);
  }, {
    "./curves.json": 42,
    "bn.js": 16,
    "browserify-rsa": 39,
    buffer: 47,
    "create-hmac": 54,
    elliptic: 67,
    "parse-asn1": 111
  } ],
  45: [ function(require, module, exports) {
    (function(Buffer) {
      var BN = require("bn.js");
      var EC = require("elliptic").ec;
      var parseKeys = require("parse-asn1");
      var curves = require("./curves.json");
      function verify(sig, hash, key, signType, tag) {
        var pub = parseKeys(key);
        if ("ec" === pub.type) {
          if ("ecdsa" !== signType && "ecdsa/rsa" !== signType) throw new Error("wrong public key type");
          return ecVerify(sig, hash, pub);
        }
        if ("dsa" === pub.type) {
          if ("dsa" !== signType) throw new Error("wrong public key type");
          return dsaVerify(sig, hash, pub);
        }
        if ("rsa" !== signType && "ecdsa/rsa" !== signType) throw new Error("wrong public key type");
        hash = Buffer.concat([ tag, hash ]);
        var len = pub.modulus.byteLength();
        var pad = [ 1 ];
        var padNum = 0;
        while (hash.length + pad.length + 2 < len) {
          pad.push(255);
          padNum++;
        }
        pad.push(0);
        var i = -1;
        while (++i < hash.length) pad.push(hash[i]);
        pad = new Buffer(pad);
        var red = BN.mont(pub.modulus);
        sig = new BN(sig).toRed(red);
        sig = sig.redPow(new BN(pub.publicExponent));
        sig = new Buffer(sig.fromRed().toArray());
        var out = padNum < 8 ? 1 : 0;
        len = Math.min(sig.length, pad.length);
        sig.length !== pad.length && (out = 1);
        i = -1;
        while (++i < len) out |= sig[i] ^ pad[i];
        return 0 === out;
      }
      function ecVerify(sig, hash, pub) {
        var curveId = curves[pub.data.algorithm.curve.join(".")];
        if (!curveId) throw new Error("unknown curve " + pub.data.algorithm.curve.join("."));
        var curve = new EC(curveId);
        var pubkey = pub.data.subjectPrivateKey.data;
        return curve.verify(hash, sig, pubkey);
      }
      function dsaVerify(sig, hash, pub) {
        var p = pub.data.p;
        var q = pub.data.q;
        var g = pub.data.g;
        var y = pub.data.pub_key;
        var unpacked = parseKeys.signature.decode(sig, "der");
        var s = unpacked.s;
        var r = unpacked.r;
        checkValue(s, q);
        checkValue(r, q);
        var montp = BN.mont(p);
        var w = s.invm(q);
        var v = g.toRed(montp).redPow(new BN(hash).mul(w).mod(q)).fromRed().mul(y.toRed(montp).redPow(r.mul(w).mod(q)).fromRed()).mod(p).mod(q);
        return 0 === v.cmp(r);
      }
      function checkValue(b, q) {
        if (b.cmpn(0) <= 0) throw new Error("invalid sig");
        if (b.cmp(q) >= q) throw new Error("invalid sig");
      }
      module.exports = verify;
    }).call(this, require("buffer").Buffer);
  }, {
    "./curves.json": 42,
    "bn.js": 16,
    buffer: 47,
    elliptic: 67,
    "parse-asn1": 111
  } ],
  46: [ function(require, module, exports) {
    (function(Buffer) {
      module.exports = function xor(a, b) {
        var length = Math.min(a.length, b.length);
        var buffer = new Buffer(length);
        for (var i = 0; i < length; ++i) buffer[i] = a[i] ^ b[i];
        return buffer;
      };
    }).call(this, require("buffer").Buffer);
  }, {
    buffer: 47
  } ],
  47: [ function(require, module, exports) {
    (function(global) {
      "use strict";
      var base64 = require("base64-js");
      var ieee754 = require("ieee754");
      var isArray = require("isarray");
      exports.Buffer = Buffer;
      exports.SlowBuffer = SlowBuffer;
      exports.INSPECT_MAX_BYTES = 50;
      Buffer.TYPED_ARRAY_SUPPORT = void 0 !== global.TYPED_ARRAY_SUPPORT ? global.TYPED_ARRAY_SUPPORT : typedArraySupport();
      exports.kMaxLength = kMaxLength();
      function typedArraySupport() {
        try {
          var arr = new Uint8Array(1);
          arr.__proto__ = {
            __proto__: Uint8Array.prototype,
            foo: function() {
              return 42;
            }
          };
          return 42 === arr.foo() && "function" === typeof arr.subarray && 0 === arr.subarray(1, 1).byteLength;
        } catch (e) {
          return false;
        }
      }
      function kMaxLength() {
        return Buffer.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
      }
      function createBuffer(that, length) {
        if (kMaxLength() < length) throw new RangeError("Invalid typed array length");
        if (Buffer.TYPED_ARRAY_SUPPORT) {
          that = new Uint8Array(length);
          that.__proto__ = Buffer.prototype;
        } else {
          null === that && (that = new Buffer(length));
          that.length = length;
        }
        return that;
      }
      function Buffer(arg, encodingOrOffset, length) {
        if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) return new Buffer(arg, encodingOrOffset, length);
        if ("number" === typeof arg) {
          if ("string" === typeof encodingOrOffset) throw new Error("If encoding is specified then the first argument must be a string");
          return allocUnsafe(this, arg);
        }
        return from(this, arg, encodingOrOffset, length);
      }
      Buffer.poolSize = 8192;
      Buffer._augment = function(arr) {
        arr.__proto__ = Buffer.prototype;
        return arr;
      };
      function from(that, value, encodingOrOffset, length) {
        if ("number" === typeof value) throw new TypeError('"value" argument must not be a number');
        if ("undefined" !== typeof ArrayBuffer && value instanceof ArrayBuffer) return fromArrayBuffer(that, value, encodingOrOffset, length);
        if ("string" === typeof value) return fromString(that, value, encodingOrOffset);
        return fromObject(that, value);
      }
      Buffer.from = function(value, encodingOrOffset, length) {
        return from(null, value, encodingOrOffset, length);
      };
      if (Buffer.TYPED_ARRAY_SUPPORT) {
        Buffer.prototype.__proto__ = Uint8Array.prototype;
        Buffer.__proto__ = Uint8Array;
        "undefined" !== typeof Symbol && Symbol.species && Buffer[Symbol.species] === Buffer && Object.defineProperty(Buffer, Symbol.species, {
          value: null,
          configurable: true
        });
      }
      function assertSize(size) {
        if ("number" !== typeof size) throw new TypeError('"size" argument must be a number');
        if (size < 0) throw new RangeError('"size" argument must not be negative');
      }
      function alloc(that, size, fill, encoding) {
        assertSize(size);
        if (size <= 0) return createBuffer(that, size);
        if (void 0 !== fill) return "string" === typeof encoding ? createBuffer(that, size).fill(fill, encoding) : createBuffer(that, size).fill(fill);
        return createBuffer(that, size);
      }
      Buffer.alloc = function(size, fill, encoding) {
        return alloc(null, size, fill, encoding);
      };
      function allocUnsafe(that, size) {
        assertSize(size);
        that = createBuffer(that, size < 0 ? 0 : 0 | checked(size));
        if (!Buffer.TYPED_ARRAY_SUPPORT) for (var i = 0; i < size; ++i) that[i] = 0;
        return that;
      }
      Buffer.allocUnsafe = function(size) {
        return allocUnsafe(null, size);
      };
      Buffer.allocUnsafeSlow = function(size) {
        return allocUnsafe(null, size);
      };
      function fromString(that, string, encoding) {
        "string" === typeof encoding && "" !== encoding || (encoding = "utf8");
        if (!Buffer.isEncoding(encoding)) throw new TypeError('"encoding" must be a valid string encoding');
        var length = 0 | byteLength(string, encoding);
        that = createBuffer(that, length);
        var actual = that.write(string, encoding);
        actual !== length && (that = that.slice(0, actual));
        return that;
      }
      function fromArrayLike(that, array) {
        var length = array.length < 0 ? 0 : 0 | checked(array.length);
        that = createBuffer(that, length);
        for (var i = 0; i < length; i += 1) that[i] = 255 & array[i];
        return that;
      }
      function fromArrayBuffer(that, array, byteOffset, length) {
        array.byteLength;
        if (byteOffset < 0 || array.byteLength < byteOffset) throw new RangeError("'offset' is out of bounds");
        if (array.byteLength < byteOffset + (length || 0)) throw new RangeError("'length' is out of bounds");
        array = void 0 === byteOffset && void 0 === length ? new Uint8Array(array) : void 0 === length ? new Uint8Array(array, byteOffset) : new Uint8Array(array, byteOffset, length);
        if (Buffer.TYPED_ARRAY_SUPPORT) {
          that = array;
          that.__proto__ = Buffer.prototype;
        } else that = fromArrayLike(that, array);
        return that;
      }
      function fromObject(that, obj) {
        if (Buffer.isBuffer(obj)) {
          var len = 0 | checked(obj.length);
          that = createBuffer(that, len);
          if (0 === that.length) return that;
          obj.copy(that, 0, 0, len);
          return that;
        }
        if (obj) {
          if ("undefined" !== typeof ArrayBuffer && obj.buffer instanceof ArrayBuffer || "length" in obj) {
            if ("number" !== typeof obj.length || isnan(obj.length)) return createBuffer(that, 0);
            return fromArrayLike(that, obj);
          }
          if ("Buffer" === obj.type && isArray(obj.data)) return fromArrayLike(that, obj.data);
        }
        throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
      }
      function checked(length) {
        if (length >= kMaxLength()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + kMaxLength().toString(16) + " bytes");
        return 0 | length;
      }
      function SlowBuffer(length) {
        +length != length && (length = 0);
        return Buffer.alloc(+length);
      }
      Buffer.isBuffer = function isBuffer(b) {
        return !!(null != b && b._isBuffer);
      };
      Buffer.compare = function compare(a, b) {
        if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) throw new TypeError("Arguments must be Buffers");
        if (a === b) return 0;
        var x = a.length;
        var y = b.length;
        for (var i = 0, len = Math.min(x, y); i < len; ++i) if (a[i] !== b[i]) {
          x = a[i];
          y = b[i];
          break;
        }
        if (x < y) return -1;
        if (y < x) return 1;
        return 0;
      };
      Buffer.isEncoding = function isEncoding(encoding) {
        switch (String(encoding).toLowerCase()) {
         case "hex":
         case "utf8":
         case "utf-8":
         case "ascii":
         case "latin1":
         case "binary":
         case "base64":
         case "ucs2":
         case "ucs-2":
         case "utf16le":
         case "utf-16le":
          return true;

         default:
          return false;
        }
      };
      Buffer.concat = function concat(list, length) {
        if (!isArray(list)) throw new TypeError('"list" argument must be an Array of Buffers');
        if (0 === list.length) return Buffer.alloc(0);
        var i;
        if (void 0 === length) {
          length = 0;
          for (i = 0; i < list.length; ++i) length += list[i].length;
        }
        var buffer = Buffer.allocUnsafe(length);
        var pos = 0;
        for (i = 0; i < list.length; ++i) {
          var buf = list[i];
          if (!Buffer.isBuffer(buf)) throw new TypeError('"list" argument must be an Array of Buffers');
          buf.copy(buffer, pos);
          pos += buf.length;
        }
        return buffer;
      };
      function byteLength(string, encoding) {
        if (Buffer.isBuffer(string)) return string.length;
        if ("undefined" !== typeof ArrayBuffer && "function" === typeof ArrayBuffer.isView && (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) return string.byteLength;
        "string" !== typeof string && (string = "" + string);
        var len = string.length;
        if (0 === len) return 0;
        var loweredCase = false;
        for (;;) switch (encoding) {
         case "ascii":
         case "latin1":
         case "binary":
          return len;

         case "utf8":
         case "utf-8":
         case void 0:
          return utf8ToBytes(string).length;

         case "ucs2":
         case "ucs-2":
         case "utf16le":
         case "utf-16le":
          return 2 * len;

         case "hex":
          return len >>> 1;

         case "base64":
          return base64ToBytes(string).length;

         default:
          if (loweredCase) return utf8ToBytes(string).length;
          encoding = ("" + encoding).toLowerCase();
          loweredCase = true;
        }
      }
      Buffer.byteLength = byteLength;
      function slowToString(encoding, start, end) {
        var loweredCase = false;
        (void 0 === start || start < 0) && (start = 0);
        if (start > this.length) return "";
        (void 0 === end || end > this.length) && (end = this.length);
        if (end <= 0) return "";
        end >>>= 0;
        start >>>= 0;
        if (end <= start) return "";
        encoding || (encoding = "utf8");
        while (true) switch (encoding) {
         case "hex":
          return hexSlice(this, start, end);

         case "utf8":
         case "utf-8":
          return utf8Slice(this, start, end);

         case "ascii":
          return asciiSlice(this, start, end);

         case "latin1":
         case "binary":
          return latin1Slice(this, start, end);

         case "base64":
          return base64Slice(this, start, end);

         case "ucs2":
         case "ucs-2":
         case "utf16le":
         case "utf-16le":
          return utf16leSlice(this, start, end);

         default:
          if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
          encoding = (encoding + "").toLowerCase();
          loweredCase = true;
        }
      }
      Buffer.prototype._isBuffer = true;
      function swap(b, n, m) {
        var i = b[n];
        b[n] = b[m];
        b[m] = i;
      }
      Buffer.prototype.swap16 = function swap16() {
        var len = this.length;
        if (len % 2 !== 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
        for (var i = 0; i < len; i += 2) swap(this, i, i + 1);
        return this;
      };
      Buffer.prototype.swap32 = function swap32() {
        var len = this.length;
        if (len % 4 !== 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
        for (var i = 0; i < len; i += 4) {
          swap(this, i, i + 3);
          swap(this, i + 1, i + 2);
        }
        return this;
      };
      Buffer.prototype.swap64 = function swap64() {
        var len = this.length;
        if (len % 8 !== 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
        for (var i = 0; i < len; i += 8) {
          swap(this, i, i + 7);
          swap(this, i + 1, i + 6);
          swap(this, i + 2, i + 5);
          swap(this, i + 3, i + 4);
        }
        return this;
      };
      Buffer.prototype.toString = function toString() {
        var length = 0 | this.length;
        if (0 === length) return "";
        if (0 === arguments.length) return utf8Slice(this, 0, length);
        return slowToString.apply(this, arguments);
      };
      Buffer.prototype.equals = function equals(b) {
        if (!Buffer.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
        if (this === b) return true;
        return 0 === Buffer.compare(this, b);
      };
      Buffer.prototype.inspect = function inspect() {
        var str = "";
        var max = exports.INSPECT_MAX_BYTES;
        if (this.length > 0) {
          str = this.toString("hex", 0, max).match(/.{2}/g).join(" ");
          this.length > max && (str += " ... ");
        }
        return "<Buffer " + str + ">";
      };
      Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
        if (!Buffer.isBuffer(target)) throw new TypeError("Argument must be a Buffer");
        void 0 === start && (start = 0);
        void 0 === end && (end = target ? target.length : 0);
        void 0 === thisStart && (thisStart = 0);
        void 0 === thisEnd && (thisEnd = this.length);
        if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) throw new RangeError("out of range index");
        if (thisStart >= thisEnd && start >= end) return 0;
        if (thisStart >= thisEnd) return -1;
        if (start >= end) return 1;
        start >>>= 0;
        end >>>= 0;
        thisStart >>>= 0;
        thisEnd >>>= 0;
        if (this === target) return 0;
        var x = thisEnd - thisStart;
        var y = end - start;
        var len = Math.min(x, y);
        var thisCopy = this.slice(thisStart, thisEnd);
        var targetCopy = target.slice(start, end);
        for (var i = 0; i < len; ++i) if (thisCopy[i] !== targetCopy[i]) {
          x = thisCopy[i];
          y = targetCopy[i];
          break;
        }
        if (x < y) return -1;
        if (y < x) return 1;
        return 0;
      };
      function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
        if (0 === buffer.length) return -1;
        if ("string" === typeof byteOffset) {
          encoding = byteOffset;
          byteOffset = 0;
        } else byteOffset > 2147483647 ? byteOffset = 2147483647 : byteOffset < -2147483648 && (byteOffset = -2147483648);
        byteOffset = +byteOffset;
        isNaN(byteOffset) && (byteOffset = dir ? 0 : buffer.length - 1);
        byteOffset < 0 && (byteOffset = buffer.length + byteOffset);
        if (byteOffset >= buffer.length) {
          if (dir) return -1;
          byteOffset = buffer.length - 1;
        } else if (byteOffset < 0) {
          if (!dir) return -1;
          byteOffset = 0;
        }
        "string" === typeof val && (val = Buffer.from(val, encoding));
        if (Buffer.isBuffer(val)) {
          if (0 === val.length) return -1;
          return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
        }
        if ("number" === typeof val) {
          val &= 255;
          if (Buffer.TYPED_ARRAY_SUPPORT && "function" === typeof Uint8Array.prototype.indexOf) return dir ? Uint8Array.prototype.indexOf.call(buffer, val, byteOffset) : Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
          return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir);
        }
        throw new TypeError("val must be string, number or Buffer");
      }
      function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
        var indexSize = 1;
        var arrLength = arr.length;
        var valLength = val.length;
        if (void 0 !== encoding) {
          encoding = String(encoding).toLowerCase();
          if ("ucs2" === encoding || "ucs-2" === encoding || "utf16le" === encoding || "utf-16le" === encoding) {
            if (arr.length < 2 || val.length < 2) return -1;
            indexSize = 2;
            arrLength /= 2;
            valLength /= 2;
            byteOffset /= 2;
          }
        }
        function read(buf, i) {
          return 1 === indexSize ? buf[i] : buf.readUInt16BE(i * indexSize);
        }
        var i;
        if (dir) {
          var foundIndex = -1;
          for (i = byteOffset; i < arrLength; i++) if (read(arr, i) === read(val, -1 === foundIndex ? 0 : i - foundIndex)) {
            -1 === foundIndex && (foundIndex = i);
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
          } else {
            -1 !== foundIndex && (i -= i - foundIndex);
            foundIndex = -1;
          }
        } else {
          byteOffset + valLength > arrLength && (byteOffset = arrLength - valLength);
          for (i = byteOffset; i >= 0; i--) {
            var found = true;
            for (var j = 0; j < valLength; j++) if (read(arr, i + j) !== read(val, j)) {
              found = false;
              break;
            }
            if (found) return i;
          }
        }
        return -1;
      }
      Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
        return -1 !== this.indexOf(val, byteOffset, encoding);
      };
      Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
      };
      Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
      };
      function hexWrite(buf, string, offset, length) {
        offset = Number(offset) || 0;
        var remaining = buf.length - offset;
        if (length) {
          length = Number(length);
          length > remaining && (length = remaining);
        } else length = remaining;
        var strLen = string.length;
        if (strLen % 2 !== 0) throw new TypeError("Invalid hex string");
        length > strLen / 2 && (length = strLen / 2);
        for (var i = 0; i < length; ++i) {
          var parsed = parseInt(string.substr(2 * i, 2), 16);
          if (isNaN(parsed)) return i;
          buf[offset + i] = parsed;
        }
        return i;
      }
      function utf8Write(buf, string, offset, length) {
        return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
      }
      function asciiWrite(buf, string, offset, length) {
        return blitBuffer(asciiToBytes(string), buf, offset, length);
      }
      function latin1Write(buf, string, offset, length) {
        return asciiWrite(buf, string, offset, length);
      }
      function base64Write(buf, string, offset, length) {
        return blitBuffer(base64ToBytes(string), buf, offset, length);
      }
      function ucs2Write(buf, string, offset, length) {
        return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
      }
      Buffer.prototype.write = function write(string, offset, length, encoding) {
        if (void 0 === offset) {
          encoding = "utf8";
          length = this.length;
          offset = 0;
        } else if (void 0 === length && "string" === typeof offset) {
          encoding = offset;
          length = this.length;
          offset = 0;
        } else {
          if (!isFinite(offset)) throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
          offset |= 0;
          if (isFinite(length)) {
            length |= 0;
            void 0 === encoding && (encoding = "utf8");
          } else {
            encoding = length;
            length = void 0;
          }
        }
        var remaining = this.length - offset;
        (void 0 === length || length > remaining) && (length = remaining);
        if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) throw new RangeError("Attempt to write outside buffer bounds");
        encoding || (encoding = "utf8");
        var loweredCase = false;
        for (;;) switch (encoding) {
         case "hex":
          return hexWrite(this, string, offset, length);

         case "utf8":
         case "utf-8":
          return utf8Write(this, string, offset, length);

         case "ascii":
          return asciiWrite(this, string, offset, length);

         case "latin1":
         case "binary":
          return latin1Write(this, string, offset, length);

         case "base64":
          return base64Write(this, string, offset, length);

         case "ucs2":
         case "ucs-2":
         case "utf16le":
         case "utf-16le":
          return ucs2Write(this, string, offset, length);

         default:
          if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
          encoding = ("" + encoding).toLowerCase();
          loweredCase = true;
        }
      };
      Buffer.prototype.toJSON = function toJSON() {
        return {
          type: "Buffer",
          data: Array.prototype.slice.call(this._arr || this, 0)
        };
      };
      function base64Slice(buf, start, end) {
        return 0 === start && end === buf.length ? base64.fromByteArray(buf) : base64.fromByteArray(buf.slice(start, end));
      }
      function utf8Slice(buf, start, end) {
        end = Math.min(buf.length, end);
        var res = [];
        var i = start;
        while (i < end) {
          var firstByte = buf[i];
          var codePoint = null;
          var bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
          if (i + bytesPerSequence <= end) {
            var secondByte, thirdByte, fourthByte, tempCodePoint;
            switch (bytesPerSequence) {
             case 1:
              firstByte < 128 && (codePoint = firstByte);
              break;

             case 2:
              secondByte = buf[i + 1];
              if (128 === (192 & secondByte)) {
                tempCodePoint = (31 & firstByte) << 6 | 63 & secondByte;
                tempCodePoint > 127 && (codePoint = tempCodePoint);
              }
              break;

             case 3:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              if (128 === (192 & secondByte) && 128 === (192 & thirdByte)) {
                tempCodePoint = (15 & firstByte) << 12 | (63 & secondByte) << 6 | 63 & thirdByte;
                tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343) && (codePoint = tempCodePoint);
              }
              break;

             case 4:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              fourthByte = buf[i + 3];
              if (128 === (192 & secondByte) && 128 === (192 & thirdByte) && 128 === (192 & fourthByte)) {
                tempCodePoint = (15 & firstByte) << 18 | (63 & secondByte) << 12 | (63 & thirdByte) << 6 | 63 & fourthByte;
                tempCodePoint > 65535 && tempCodePoint < 1114112 && (codePoint = tempCodePoint);
              }
            }
          }
          if (null === codePoint) {
            codePoint = 65533;
            bytesPerSequence = 1;
          } else if (codePoint > 65535) {
            codePoint -= 65536;
            res.push(codePoint >>> 10 & 1023 | 55296);
            codePoint = 56320 | 1023 & codePoint;
          }
          res.push(codePoint);
          i += bytesPerSequence;
        }
        return decodeCodePointsArray(res);
      }
      var MAX_ARGUMENTS_LENGTH = 4096;
      function decodeCodePointsArray(codePoints) {
        var len = codePoints.length;
        if (len <= MAX_ARGUMENTS_LENGTH) return String.fromCharCode.apply(String, codePoints);
        var res = "";
        var i = 0;
        while (i < len) res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
        return res;
      }
      function asciiSlice(buf, start, end) {
        var ret = "";
        end = Math.min(buf.length, end);
        for (var i = start; i < end; ++i) ret += String.fromCharCode(127 & buf[i]);
        return ret;
      }
      function latin1Slice(buf, start, end) {
        var ret = "";
        end = Math.min(buf.length, end);
        for (var i = start; i < end; ++i) ret += String.fromCharCode(buf[i]);
        return ret;
      }
      function hexSlice(buf, start, end) {
        var len = buf.length;
        (!start || start < 0) && (start = 0);
        (!end || end < 0 || end > len) && (end = len);
        var out = "";
        for (var i = start; i < end; ++i) out += toHex(buf[i]);
        return out;
      }
      function utf16leSlice(buf, start, end) {
        var bytes = buf.slice(start, end);
        var res = "";
        for (var i = 0; i < bytes.length; i += 2) res += String.fromCharCode(bytes[i] + 256 * bytes[i + 1]);
        return res;
      }
      Buffer.prototype.slice = function slice(start, end) {
        var len = this.length;
        start = ~~start;
        end = void 0 === end ? len : ~~end;
        if (start < 0) {
          start += len;
          start < 0 && (start = 0);
        } else start > len && (start = len);
        if (end < 0) {
          end += len;
          end < 0 && (end = 0);
        } else end > len && (end = len);
        end < start && (end = start);
        var newBuf;
        if (Buffer.TYPED_ARRAY_SUPPORT) {
          newBuf = this.subarray(start, end);
          newBuf.__proto__ = Buffer.prototype;
        } else {
          var sliceLen = end - start;
          newBuf = new Buffer(sliceLen, void 0);
          for (var i = 0; i < sliceLen; ++i) newBuf[i] = this[i + start];
        }
        return newBuf;
      };
      function checkOffset(offset, ext, length) {
        if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
        if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
      }
      Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
        offset |= 0;
        byteLength |= 0;
        noAssert || checkOffset(offset, byteLength, this.length);
        var val = this[offset];
        var mul = 1;
        var i = 0;
        while (++i < byteLength && (mul *= 256)) val += this[offset + i] * mul;
        return val;
      };
      Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
        offset |= 0;
        byteLength |= 0;
        noAssert || checkOffset(offset, byteLength, this.length);
        var val = this[offset + --byteLength];
        var mul = 1;
        while (byteLength > 0 && (mul *= 256)) val += this[offset + --byteLength] * mul;
        return val;
      };
      Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
        noAssert || checkOffset(offset, 1, this.length);
        return this[offset];
      };
      Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
        noAssert || checkOffset(offset, 2, this.length);
        return this[offset] | this[offset + 1] << 8;
      };
      Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
        noAssert || checkOffset(offset, 2, this.length);
        return this[offset] << 8 | this[offset + 1];
      };
      Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
        noAssert || checkOffset(offset, 4, this.length);
        return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + 16777216 * this[offset + 3];
      };
      Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
        noAssert || checkOffset(offset, 4, this.length);
        return 16777216 * this[offset] + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
      };
      Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
        offset |= 0;
        byteLength |= 0;
        noAssert || checkOffset(offset, byteLength, this.length);
        var val = this[offset];
        var mul = 1;
        var i = 0;
        while (++i < byteLength && (mul *= 256)) val += this[offset + i] * mul;
        mul *= 128;
        val >= mul && (val -= Math.pow(2, 8 * byteLength));
        return val;
      };
      Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
        offset |= 0;
        byteLength |= 0;
        noAssert || checkOffset(offset, byteLength, this.length);
        var i = byteLength;
        var mul = 1;
        var val = this[offset + --i];
        while (i > 0 && (mul *= 256)) val += this[offset + --i] * mul;
        mul *= 128;
        val >= mul && (val -= Math.pow(2, 8 * byteLength));
        return val;
      };
      Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
        noAssert || checkOffset(offset, 1, this.length);
        if (!(128 & this[offset])) return this[offset];
        return -1 * (255 - this[offset] + 1);
      };
      Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
        noAssert || checkOffset(offset, 2, this.length);
        var val = this[offset] | this[offset + 1] << 8;
        return 32768 & val ? 4294901760 | val : val;
      };
      Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
        noAssert || checkOffset(offset, 2, this.length);
        var val = this[offset + 1] | this[offset] << 8;
        return 32768 & val ? 4294901760 | val : val;
      };
      Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
        noAssert || checkOffset(offset, 4, this.length);
        return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
      };
      Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
        noAssert || checkOffset(offset, 4, this.length);
        return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
      };
      Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
        noAssert || checkOffset(offset, 4, this.length);
        return ieee754.read(this, offset, true, 23, 4);
      };
      Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
        noAssert || checkOffset(offset, 4, this.length);
        return ieee754.read(this, offset, false, 23, 4);
      };
      Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
        noAssert || checkOffset(offset, 8, this.length);
        return ieee754.read(this, offset, true, 52, 8);
      };
      Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
        noAssert || checkOffset(offset, 8, this.length);
        return ieee754.read(this, offset, false, 52, 8);
      };
      function checkInt(buf, value, offset, ext, max, min) {
        if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
        if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
        if (offset + ext > buf.length) throw new RangeError("Index out of range");
      }
      Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
        value = +value;
        offset |= 0;
        byteLength |= 0;
        if (!noAssert) {
          var maxBytes = Math.pow(2, 8 * byteLength) - 1;
          checkInt(this, value, offset, byteLength, maxBytes, 0);
        }
        var mul = 1;
        var i = 0;
        this[offset] = 255 & value;
        while (++i < byteLength && (mul *= 256)) this[offset + i] = value / mul & 255;
        return offset + byteLength;
      };
      Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
        value = +value;
        offset |= 0;
        byteLength |= 0;
        if (!noAssert) {
          var maxBytes = Math.pow(2, 8 * byteLength) - 1;
          checkInt(this, value, offset, byteLength, maxBytes, 0);
        }
        var i = byteLength - 1;
        var mul = 1;
        this[offset + i] = 255 & value;
        while (--i >= 0 && (mul *= 256)) this[offset + i] = value / mul & 255;
        return offset + byteLength;
      };
      Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
        value = +value;
        offset |= 0;
        noAssert || checkInt(this, value, offset, 1, 255, 0);
        Buffer.TYPED_ARRAY_SUPPORT || (value = Math.floor(value));
        this[offset] = 255 & value;
        return offset + 1;
      };
      function objectWriteUInt16(buf, value, offset, littleEndian) {
        value < 0 && (value = 65535 + value + 1);
        for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) buf[offset + i] = (value & 255 << 8 * (littleEndian ? i : 1 - i)) >>> 8 * (littleEndian ? i : 1 - i);
      }
      Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
        value = +value;
        offset |= 0;
        noAssert || checkInt(this, value, offset, 2, 65535, 0);
        if (Buffer.TYPED_ARRAY_SUPPORT) {
          this[offset] = 255 & value;
          this[offset + 1] = value >>> 8;
        } else objectWriteUInt16(this, value, offset, true);
        return offset + 2;
      };
      Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
        value = +value;
        offset |= 0;
        noAssert || checkInt(this, value, offset, 2, 65535, 0);
        if (Buffer.TYPED_ARRAY_SUPPORT) {
          this[offset] = value >>> 8;
          this[offset + 1] = 255 & value;
        } else objectWriteUInt16(this, value, offset, false);
        return offset + 2;
      };
      function objectWriteUInt32(buf, value, offset, littleEndian) {
        value < 0 && (value = 4294967295 + value + 1);
        for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) buf[offset + i] = value >>> 8 * (littleEndian ? i : 3 - i) & 255;
      }
      Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
        value = +value;
        offset |= 0;
        noAssert || checkInt(this, value, offset, 4, 4294967295, 0);
        if (Buffer.TYPED_ARRAY_SUPPORT) {
          this[offset + 3] = value >>> 24;
          this[offset + 2] = value >>> 16;
          this[offset + 1] = value >>> 8;
          this[offset] = 255 & value;
        } else objectWriteUInt32(this, value, offset, true);
        return offset + 4;
      };
      Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
        value = +value;
        offset |= 0;
        noAssert || checkInt(this, value, offset, 4, 4294967295, 0);
        if (Buffer.TYPED_ARRAY_SUPPORT) {
          this[offset] = value >>> 24;
          this[offset + 1] = value >>> 16;
          this[offset + 2] = value >>> 8;
          this[offset + 3] = 255 & value;
        } else objectWriteUInt32(this, value, offset, false);
        return offset + 4;
      };
      Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
        value = +value;
        offset |= 0;
        if (!noAssert) {
          var limit = Math.pow(2, 8 * byteLength - 1);
          checkInt(this, value, offset, byteLength, limit - 1, -limit);
        }
        var i = 0;
        var mul = 1;
        var sub = 0;
        this[offset] = 255 & value;
        while (++i < byteLength && (mul *= 256)) {
          value < 0 && 0 === sub && 0 !== this[offset + i - 1] && (sub = 1);
          this[offset + i] = (value / mul >> 0) - sub & 255;
        }
        return offset + byteLength;
      };
      Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
        value = +value;
        offset |= 0;
        if (!noAssert) {
          var limit = Math.pow(2, 8 * byteLength - 1);
          checkInt(this, value, offset, byteLength, limit - 1, -limit);
        }
        var i = byteLength - 1;
        var mul = 1;
        var sub = 0;
        this[offset + i] = 255 & value;
        while (--i >= 0 && (mul *= 256)) {
          value < 0 && 0 === sub && 0 !== this[offset + i + 1] && (sub = 1);
          this[offset + i] = (value / mul >> 0) - sub & 255;
        }
        return offset + byteLength;
      };
      Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
        value = +value;
        offset |= 0;
        noAssert || checkInt(this, value, offset, 1, 127, -128);
        Buffer.TYPED_ARRAY_SUPPORT || (value = Math.floor(value));
        value < 0 && (value = 255 + value + 1);
        this[offset] = 255 & value;
        return offset + 1;
      };
      Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
        value = +value;
        offset |= 0;
        noAssert || checkInt(this, value, offset, 2, 32767, -32768);
        if (Buffer.TYPED_ARRAY_SUPPORT) {
          this[offset] = 255 & value;
          this[offset + 1] = value >>> 8;
        } else objectWriteUInt16(this, value, offset, true);
        return offset + 2;
      };
      Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
        value = +value;
        offset |= 0;
        noAssert || checkInt(this, value, offset, 2, 32767, -32768);
        if (Buffer.TYPED_ARRAY_SUPPORT) {
          this[offset] = value >>> 8;
          this[offset + 1] = 255 & value;
        } else objectWriteUInt16(this, value, offset, false);
        return offset + 2;
      };
      Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
        value = +value;
        offset |= 0;
        noAssert || checkInt(this, value, offset, 4, 2147483647, -2147483648);
        if (Buffer.TYPED_ARRAY_SUPPORT) {
          this[offset] = 255 & value;
          this[offset + 1] = value >>> 8;
          this[offset + 2] = value >>> 16;
          this[offset + 3] = value >>> 24;
        } else objectWriteUInt32(this, value, offset, true);
        return offset + 4;
      };
      Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
        value = +value;
        offset |= 0;
        noAssert || checkInt(this, value, offset, 4, 2147483647, -2147483648);
        value < 0 && (value = 4294967295 + value + 1);
        if (Buffer.TYPED_ARRAY_SUPPORT) {
          this[offset] = value >>> 24;
          this[offset + 1] = value >>> 16;
          this[offset + 2] = value >>> 8;
          this[offset + 3] = 255 & value;
        } else objectWriteUInt32(this, value, offset, false);
        return offset + 4;
      };
      function checkIEEE754(buf, value, offset, ext, max, min) {
        if (offset + ext > buf.length) throw new RangeError("Index out of range");
        if (offset < 0) throw new RangeError("Index out of range");
      }
      function writeFloat(buf, value, offset, littleEndian, noAssert) {
        noAssert || checkIEEE754(buf, value, offset, 4, 3.4028234663852886e38, -3.4028234663852886e38);
        ieee754.write(buf, value, offset, littleEndian, 23, 4);
        return offset + 4;
      }
      Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
        return writeFloat(this, value, offset, true, noAssert);
      };
      Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
        return writeFloat(this, value, offset, false, noAssert);
      };
      function writeDouble(buf, value, offset, littleEndian, noAssert) {
        noAssert || checkIEEE754(buf, value, offset, 8, 1.7976931348623157e308, -1.7976931348623157e308);
        ieee754.write(buf, value, offset, littleEndian, 52, 8);
        return offset + 8;
      }
      Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
        return writeDouble(this, value, offset, true, noAssert);
      };
      Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
        return writeDouble(this, value, offset, false, noAssert);
      };
      Buffer.prototype.copy = function copy(target, targetStart, start, end) {
        start || (start = 0);
        end || 0 === end || (end = this.length);
        targetStart >= target.length && (targetStart = target.length);
        targetStart || (targetStart = 0);
        end > 0 && end < start && (end = start);
        if (end === start) return 0;
        if (0 === target.length || 0 === this.length) return 0;
        if (targetStart < 0) throw new RangeError("targetStart out of bounds");
        if (start < 0 || start >= this.length) throw new RangeError("sourceStart out of bounds");
        if (end < 0) throw new RangeError("sourceEnd out of bounds");
        end > this.length && (end = this.length);
        target.length - targetStart < end - start && (end = target.length - targetStart + start);
        var len = end - start;
        var i;
        if (this === target && start < targetStart && targetStart < end) for (i = len - 1; i >= 0; --i) target[i + targetStart] = this[i + start]; else if (len < 1e3 || !Buffer.TYPED_ARRAY_SUPPORT) for (i = 0; i < len; ++i) target[i + targetStart] = this[i + start]; else Uint8Array.prototype.set.call(target, this.subarray(start, start + len), targetStart);
        return len;
      };
      Buffer.prototype.fill = function fill(val, start, end, encoding) {
        if ("string" === typeof val) {
          if ("string" === typeof start) {
            encoding = start;
            start = 0;
            end = this.length;
          } else if ("string" === typeof end) {
            encoding = end;
            end = this.length;
          }
          if (1 === val.length) {
            var code = val.charCodeAt(0);
            code < 256 && (val = code);
          }
          if (void 0 !== encoding && "string" !== typeof encoding) throw new TypeError("encoding must be a string");
          if ("string" === typeof encoding && !Buffer.isEncoding(encoding)) throw new TypeError("Unknown encoding: " + encoding);
        } else "number" === typeof val && (val &= 255);
        if (start < 0 || this.length < start || this.length < end) throw new RangeError("Out of range index");
        if (end <= start) return this;
        start >>>= 0;
        end = void 0 === end ? this.length : end >>> 0;
        val || (val = 0);
        var i;
        if ("number" === typeof val) for (i = start; i < end; ++i) this[i] = val; else {
          var bytes = Buffer.isBuffer(val) ? val : utf8ToBytes(new Buffer(val, encoding).toString());
          var len = bytes.length;
          for (i = 0; i < end - start; ++i) this[i + start] = bytes[i % len];
        }
        return this;
      };
      var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;
      function base64clean(str) {
        str = stringtrim(str).replace(INVALID_BASE64_RE, "");
        if (str.length < 2) return "";
        while (str.length % 4 !== 0) str += "=";
        return str;
      }
      function stringtrim(str) {
        if (str.trim) return str.trim();
        return str.replace(/^\s+|\s+$/g, "");
      }
      function toHex(n) {
        if (n < 16) return "0" + n.toString(16);
        return n.toString(16);
      }
      function utf8ToBytes(string, units) {
        units = units || Infinity;
        var codePoint;
        var length = string.length;
        var leadSurrogate = null;
        var bytes = [];
        for (var i = 0; i < length; ++i) {
          codePoint = string.charCodeAt(i);
          if (codePoint > 55295 && codePoint < 57344) {
            if (!leadSurrogate) {
              if (codePoint > 56319) {
                (units -= 3) > -1 && bytes.push(239, 191, 189);
                continue;
              }
              if (i + 1 === length) {
                (units -= 3) > -1 && bytes.push(239, 191, 189);
                continue;
              }
              leadSurrogate = codePoint;
              continue;
            }
            if (codePoint < 56320) {
              (units -= 3) > -1 && bytes.push(239, 191, 189);
              leadSurrogate = codePoint;
              continue;
            }
            codePoint = 65536 + (leadSurrogate - 55296 << 10 | codePoint - 56320);
          } else leadSurrogate && (units -= 3) > -1 && bytes.push(239, 191, 189);
          leadSurrogate = null;
          if (codePoint < 128) {
            if ((units -= 1) < 0) break;
            bytes.push(codePoint);
          } else if (codePoint < 2048) {
            if ((units -= 2) < 0) break;
            bytes.push(codePoint >> 6 | 192, 63 & codePoint | 128);
          } else if (codePoint < 65536) {
            if ((units -= 3) < 0) break;
            bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, 63 & codePoint | 128);
          } else {
            if (!(codePoint < 1114112)) throw new Error("Invalid code point");
            if ((units -= 4) < 0) break;
            bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, 63 & codePoint | 128);
          }
        }
        return bytes;
      }
      function asciiToBytes(str) {
        var byteArray = [];
        for (var i = 0; i < str.length; ++i) byteArray.push(255 & str.charCodeAt(i));
        return byteArray;
      }
      function utf16leToBytes(str, units) {
        var c, hi, lo;
        var byteArray = [];
        for (var i = 0; i < str.length; ++i) {
          if ((units -= 2) < 0) break;
          c = str.charCodeAt(i);
          hi = c >> 8;
          lo = c % 256;
          byteArray.push(lo);
          byteArray.push(hi);
        }
        return byteArray;
      }
      function base64ToBytes(str) {
        return base64.toByteArray(base64clean(str));
      }
      function blitBuffer(src, dst, offset, length) {
        for (var i = 0; i < length; ++i) {
          if (i + offset >= dst.length || i >= src.length) break;
          dst[i + offset] = src[i];
        }
        return i;
      }
      function isnan(val) {
        return val !== val;
      }
    }).call(this, "undefined" !== typeof global ? global : "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : {});
  }, {
    "base64-js": 15,
    ieee754: 99,
    isarray: 48
  } ],
  48: [ function(require, module, exports) {
    var toString = {}.toString;
    module.exports = Array.isArray || function(arr) {
      return "[object Array]" == toString.call(arr);
    };
  }, {} ],
  49: [ function(require, module, exports) {
    var Buffer = require("safe-buffer").Buffer;
    var Transform = require("stream").Transform;
    var StringDecoder = require("string_decoder").StringDecoder;
    var inherits = require("inherits");
    function CipherBase(hashMode) {
      Transform.call(this);
      this.hashMode = "string" === typeof hashMode;
      this.hashMode ? this[hashMode] = this._finalOrDigest : this.final = this._finalOrDigest;
      if (this._final) {
        this.__final = this._final;
        this._final = null;
      }
      this._decoder = null;
      this._encoding = null;
    }
    inherits(CipherBase, Transform);
    CipherBase.prototype.update = function(data, inputEnc, outputEnc) {
      "string" === typeof data && (data = Buffer.from(data, inputEnc));
      var outData = this._update(data);
      if (this.hashMode) return this;
      outputEnc && (outData = this._toString(outData, outputEnc));
      return outData;
    };
    CipherBase.prototype.setAutoPadding = function() {};
    CipherBase.prototype.getAuthTag = function() {
      throw new Error("trying to get auth tag in unsupported state");
    };
    CipherBase.prototype.setAuthTag = function() {
      throw new Error("trying to set auth tag in unsupported state");
    };
    CipherBase.prototype.setAAD = function() {
      throw new Error("trying to set aad in unsupported state");
    };
    CipherBase.prototype._transform = function(data, _, next) {
      var err;
      try {
        this.hashMode ? this._update(data) : this.push(this._update(data));
      } catch (e) {
        err = e;
      } finally {
        next(err);
      }
    };
    CipherBase.prototype._flush = function(done) {
      var err;
      try {
        this.push(this.__final());
      } catch (e) {
        err = e;
      }
      done(err);
    };
    CipherBase.prototype._finalOrDigest = function(outputEnc) {
      var outData = this.__final() || Buffer.alloc(0);
      outputEnc && (outData = this._toString(outData, outputEnc, true));
      return outData;
    };
    CipherBase.prototype._toString = function(value, enc, fin) {
      if (!this._decoder) {
        this._decoder = new StringDecoder(enc);
        this._encoding = enc;
      }
      if (this._encoding !== enc) throw new Error("can't switch encodings");
      var out = this._decoder.write(value);
      fin && (out += this._decoder.end());
      return out;
    };
    module.exports = CipherBase;
  }, {
    inherits: 101,
    "safe-buffer": 144,
    stream: 153,
    string_decoder: 154
  } ],
  50: [ function(require, module, exports) {
    (function(Buffer) {
      function isArray(arg) {
        if (Array.isArray) return Array.isArray(arg);
        return "[object Array]" === objectToString(arg);
      }
      exports.isArray = isArray;
      function isBoolean(arg) {
        return "boolean" === typeof arg;
      }
      exports.isBoolean = isBoolean;
      function isNull(arg) {
        return null === arg;
      }
      exports.isNull = isNull;
      function isNullOrUndefined(arg) {
        return null == arg;
      }
      exports.isNullOrUndefined = isNullOrUndefined;
      function isNumber(arg) {
        return "number" === typeof arg;
      }
      exports.isNumber = isNumber;
      function isString(arg) {
        return "string" === typeof arg;
      }
      exports.isString = isString;
      function isSymbol(arg) {
        return "symbol" === typeof arg;
      }
      exports.isSymbol = isSymbol;
      function isUndefined(arg) {
        return void 0 === arg;
      }
      exports.isUndefined = isUndefined;
      function isRegExp(re) {
        return "[object RegExp]" === objectToString(re);
      }
      exports.isRegExp = isRegExp;
      function isObject(arg) {
        return "object" === typeof arg && null !== arg;
      }
      exports.isObject = isObject;
      function isDate(d) {
        return "[object Date]" === objectToString(d);
      }
      exports.isDate = isDate;
      function isError(e) {
        return "[object Error]" === objectToString(e) || e instanceof Error;
      }
      exports.isError = isError;
      function isFunction(arg) {
        return "function" === typeof arg;
      }
      exports.isFunction = isFunction;
      function isPrimitive(arg) {
        return null === arg || "boolean" === typeof arg || "number" === typeof arg || "string" === typeof arg || "symbol" === typeof arg || "undefined" === typeof arg;
      }
      exports.isPrimitive = isPrimitive;
      exports.isBuffer = Buffer.isBuffer;
      function objectToString(o) {
        return Object.prototype.toString.call(o);
      }
    }).call(this, {
      isBuffer: require("../../is-buffer/index.js")
    });
  }, {
    "../../is-buffer/index.js": 102
  } ],
  51: [ function(require, module, exports) {
    (function(Buffer) {
      var elliptic = require("elliptic");
      var BN = require("bn.js");
      module.exports = function createECDH(curve) {
        return new ECDH(curve);
      };
      var aliases = {
        secp256k1: {
          name: "secp256k1",
          byteLength: 32
        },
        secp224r1: {
          name: "p224",
          byteLength: 28
        },
        prime256v1: {
          name: "p256",
          byteLength: 32
        },
        prime192v1: {
          name: "p192",
          byteLength: 24
        },
        ed25519: {
          name: "ed25519",
          byteLength: 32
        },
        secp384r1: {
          name: "p384",
          byteLength: 48
        },
        secp521r1: {
          name: "p521",
          byteLength: 66
        }
      };
      aliases.p224 = aliases.secp224r1;
      aliases.p256 = aliases.secp256r1 = aliases.prime256v1;
      aliases.p192 = aliases.secp192r1 = aliases.prime192v1;
      aliases.p384 = aliases.secp384r1;
      aliases.p521 = aliases.secp521r1;
      function ECDH(curve) {
        this.curveType = aliases[curve];
        this.curveType || (this.curveType = {
          name: curve
        });
        this.curve = new elliptic.ec(this.curveType.name);
        this.keys = void 0;
      }
      ECDH.prototype.generateKeys = function(enc, format) {
        this.keys = this.curve.genKeyPair();
        return this.getPublicKey(enc, format);
      };
      ECDH.prototype.computeSecret = function(other, inenc, enc) {
        inenc = inenc || "utf8";
        Buffer.isBuffer(other) || (other = new Buffer(other, inenc));
        var otherPub = this.curve.keyFromPublic(other).getPublic();
        var out = otherPub.mul(this.keys.getPrivate()).getX();
        return formatReturnValue(out, enc, this.curveType.byteLength);
      };
      ECDH.prototype.getPublicKey = function(enc, format) {
        var key = this.keys.getPublic("compressed" === format, true);
        "hybrid" === format && (key[key.length - 1] % 2 ? key[0] = 7 : key[0] = 6);
        return formatReturnValue(key, enc);
      };
      ECDH.prototype.getPrivateKey = function(enc) {
        return formatReturnValue(this.keys.getPrivate(), enc);
      };
      ECDH.prototype.setPublicKey = function(pub, enc) {
        enc = enc || "utf8";
        Buffer.isBuffer(pub) || (pub = new Buffer(pub, enc));
        this.keys._importPublic(pub);
        return this;
      };
      ECDH.prototype.setPrivateKey = function(priv, enc) {
        enc = enc || "utf8";
        Buffer.isBuffer(priv) || (priv = new Buffer(priv, enc));
        var _priv = new BN(priv);
        _priv = _priv.toString(16);
        this.keys = this.curve.genKeyPair();
        this.keys._importPrivate(_priv);
        return this;
      };
      function formatReturnValue(bn, enc, len) {
        Array.isArray(bn) || (bn = bn.toArray());
        var buf = new Buffer(bn);
        if (len && buf.length < len) {
          var zeros = new Buffer(len - buf.length);
          zeros.fill(0);
          buf = Buffer.concat([ zeros, buf ]);
        }
        return enc ? buf.toString(enc) : buf;
      }
    }).call(this, require("buffer").Buffer);
  }, {
    "bn.js": 16,
    buffer: 47,
    elliptic: 67
  } ],
  52: [ function(require, module, exports) {
    "use strict";
    var inherits = require("inherits");
    var MD5 = require("md5.js");
    var RIPEMD160 = require("ripemd160");
    var sha = require("sha.js");
    var Base = require("cipher-base");
    function Hash(hash) {
      Base.call(this, "digest");
      this._hash = hash;
    }
    inherits(Hash, Base);
    Hash.prototype._update = function(data) {
      this._hash.update(data);
    };
    Hash.prototype._final = function() {
      return this._hash.digest();
    };
    module.exports = function createHash(alg) {
      alg = alg.toLowerCase();
      if ("md5" === alg) return new MD5();
      if ("rmd160" === alg || "ripemd160" === alg) return new RIPEMD160();
      return new Hash(sha(alg));
    };
  }, {
    "cipher-base": 49,
    inherits: 101,
    "md5.js": 103,
    ripemd160: 143,
    "sha.js": 146
  } ],
  53: [ function(require, module, exports) {
    var MD5 = require("md5.js");
    module.exports = function(buffer) {
      return new MD5().update(buffer).digest();
    };
  }, {
    "md5.js": 103
  } ],
  54: [ function(require, module, exports) {
    "use strict";
    var inherits = require("inherits");
    var Legacy = require("./legacy");
    var Base = require("cipher-base");
    var Buffer = require("safe-buffer").Buffer;
    var md5 = require("create-hash/md5");
    var RIPEMD160 = require("ripemd160");
    var sha = require("sha.js");
    var ZEROS = Buffer.alloc(128);
    function Hmac(alg, key) {
      Base.call(this, "digest");
      "string" === typeof key && (key = Buffer.from(key));
      var blocksize = "sha512" === alg || "sha384" === alg ? 128 : 64;
      this._alg = alg;
      this._key = key;
      if (key.length > blocksize) {
        var hash = "rmd160" === alg ? new RIPEMD160() : sha(alg);
        key = hash.update(key).digest();
      } else key.length < blocksize && (key = Buffer.concat([ key, ZEROS ], blocksize));
      var ipad = this._ipad = Buffer.allocUnsafe(blocksize);
      var opad = this._opad = Buffer.allocUnsafe(blocksize);
      for (var i = 0; i < blocksize; i++) {
        ipad[i] = 54 ^ key[i];
        opad[i] = 92 ^ key[i];
      }
      this._hash = "rmd160" === alg ? new RIPEMD160() : sha(alg);
      this._hash.update(ipad);
    }
    inherits(Hmac, Base);
    Hmac.prototype._update = function(data) {
      this._hash.update(data);
    };
    Hmac.prototype._final = function() {
      var h = this._hash.digest();
      var hash = "rmd160" === this._alg ? new RIPEMD160() : sha(this._alg);
      return hash.update(this._opad).update(h).digest();
    };
    module.exports = function createHmac(alg, key) {
      alg = alg.toLowerCase();
      if ("rmd160" === alg || "ripemd160" === alg) return new Hmac("rmd160", key);
      if ("md5" === alg) return new Legacy(md5, key);
      return new Hmac(alg, key);
    };
  }, {
    "./legacy": 55,
    "cipher-base": 49,
    "create-hash/md5": 53,
    inherits: 101,
    ripemd160: 143,
    "safe-buffer": 144,
    "sha.js": 146
  } ],
  55: [ function(require, module, exports) {
    "use strict";
    var inherits = require("inherits");
    var Buffer = require("safe-buffer").Buffer;
    var Base = require("cipher-base");
    var ZEROS = Buffer.alloc(128);
    var blocksize = 64;
    function Hmac(alg, key) {
      Base.call(this, "digest");
      "string" === typeof key && (key = Buffer.from(key));
      this._alg = alg;
      this._key = key;
      key.length > blocksize ? key = alg(key) : key.length < blocksize && (key = Buffer.concat([ key, ZEROS ], blocksize));
      var ipad = this._ipad = Buffer.allocUnsafe(blocksize);
      var opad = this._opad = Buffer.allocUnsafe(blocksize);
      for (var i = 0; i < blocksize; i++) {
        ipad[i] = 54 ^ key[i];
        opad[i] = 92 ^ key[i];
      }
      this._hash = [ ipad ];
    }
    inherits(Hmac, Base);
    Hmac.prototype._update = function(data) {
      this._hash.push(data);
    };
    Hmac.prototype._final = function() {
      var h = this._alg(Buffer.concat(this._hash));
      return this._alg(Buffer.concat([ this._opad, h ]));
    };
    module.exports = Hmac;
  }, {
    "cipher-base": 49,
    inherits: 101,
    "safe-buffer": 144
  } ],
  56: [ function(require, module, exports) {
    "use strict";
    exports.randomBytes = exports.rng = exports.pseudoRandomBytes = exports.prng = require("randombytes");
    exports.createHash = exports.Hash = require("create-hash");
    exports.createHmac = exports.Hmac = require("create-hmac");
    var algos = require("browserify-sign/algos");
    var algoKeys = Object.keys(algos);
    var hashes = [ "sha1", "sha224", "sha256", "sha384", "sha512", "md5", "rmd160" ].concat(algoKeys);
    exports.getHashes = function() {
      return hashes;
    };
    var p = require("pbkdf2");
    exports.pbkdf2 = p.pbkdf2;
    exports.pbkdf2Sync = p.pbkdf2Sync;
    var aes = require("browserify-cipher");
    exports.Cipher = aes.Cipher;
    exports.createCipher = aes.createCipher;
    exports.Cipheriv = aes.Cipheriv;
    exports.createCipheriv = aes.createCipheriv;
    exports.Decipher = aes.Decipher;
    exports.createDecipher = aes.createDecipher;
    exports.Decipheriv = aes.Decipheriv;
    exports.createDecipheriv = aes.createDecipheriv;
    exports.getCiphers = aes.getCiphers;
    exports.listCiphers = aes.listCiphers;
    var dh = require("diffie-hellman");
    exports.DiffieHellmanGroup = dh.DiffieHellmanGroup;
    exports.createDiffieHellmanGroup = dh.createDiffieHellmanGroup;
    exports.getDiffieHellman = dh.getDiffieHellman;
    exports.createDiffieHellman = dh.createDiffieHellman;
    exports.DiffieHellman = dh.DiffieHellman;
    var sign = require("browserify-sign");
    exports.createSign = sign.createSign;
    exports.Sign = sign.Sign;
    exports.createVerify = sign.createVerify;
    exports.Verify = sign.Verify;
    exports.createECDH = require("create-ecdh");
    var publicEncrypt = require("public-encrypt");
    exports.publicEncrypt = publicEncrypt.publicEncrypt;
    exports.privateEncrypt = publicEncrypt.privateEncrypt;
    exports.publicDecrypt = publicEncrypt.publicDecrypt;
    exports.privateDecrypt = publicEncrypt.privateDecrypt;
    var rf = require("randomfill");
    exports.randomFill = rf.randomFill;
    exports.randomFillSync = rf.randomFillSync;
    exports.createCredentials = function() {
      throw new Error([ "sorry, createCredentials is not implemented yet", "we accept pull requests", "https://github.com/crypto-browserify/crypto-browserify" ].join("\n"));
    };
    exports.constants = {
      DH_CHECK_P_NOT_SAFE_PRIME: 2,
      DH_CHECK_P_NOT_PRIME: 1,
      DH_UNABLE_TO_CHECK_GENERATOR: 4,
      DH_NOT_SUITABLE_GENERATOR: 8,
      NPN_ENABLED: 1,
      ALPN_ENABLED: 1,
      RSA_PKCS1_PADDING: 1,
      RSA_SSLV23_PADDING: 2,
      RSA_NO_PADDING: 3,
      RSA_PKCS1_OAEP_PADDING: 4,
      RSA_X931_PADDING: 5,
      RSA_PKCS1_PSS_PADDING: 6,
      POINT_CONVERSION_COMPRESSED: 2,
      POINT_CONVERSION_UNCOMPRESSED: 4,
      POINT_CONVERSION_HYBRID: 6
    };
  }, {
    "browserify-cipher": 36,
    "browserify-sign": 43,
    "browserify-sign/algos": 40,
    "create-ecdh": 51,
    "create-hash": 52,
    "create-hmac": 54,
    "diffie-hellman": 63,
    pbkdf2: 113,
    "public-encrypt": 120,
    randombytes: 126,
    randomfill: 127
  } ],
  57: [ function(require, module, exports) {
    "use strict";
    exports.utils = require("./des/utils");
    exports.Cipher = require("./des/cipher");
    exports.DES = require("./des/des");
    exports.CBC = require("./des/cbc");
    exports.EDE = require("./des/ede");
  }, {
    "./des/cbc": 58,
    "./des/cipher": 59,
    "./des/des": 60,
    "./des/ede": 61,
    "./des/utils": 62
  } ],
  58: [ function(require, module, exports) {
    "use strict";
    var assert = require("minimalistic-assert");
    var inherits = require("inherits");
    var proto = {};
    function CBCState(iv) {
      assert.equal(iv.length, 8, "Invalid IV length");
      this.iv = new Array(8);
      for (var i = 0; i < this.iv.length; i++) this.iv[i] = iv[i];
    }
    function instantiate(Base) {
      function CBC(options) {
        Base.call(this, options);
        this._cbcInit();
      }
      inherits(CBC, Base);
      var keys = Object.keys(proto);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        CBC.prototype[key] = proto[key];
      }
      CBC.create = function create(options) {
        return new CBC(options);
      };
      return CBC;
    }
    exports.instantiate = instantiate;
    proto._cbcInit = function _cbcInit() {
      var state = new CBCState(this.options.iv);
      this._cbcState = state;
    };
    proto._update = function _update(inp, inOff, out, outOff) {
      var state = this._cbcState;
      var superProto = this.constructor.super_.prototype;
      var iv = state.iv;
      if ("encrypt" === this.type) {
        for (var i = 0; i < this.blockSize; i++) iv[i] ^= inp[inOff + i];
        superProto._update.call(this, iv, 0, out, outOff);
        for (var i = 0; i < this.blockSize; i++) iv[i] = out[outOff + i];
      } else {
        superProto._update.call(this, inp, inOff, out, outOff);
        for (var i = 0; i < this.blockSize; i++) out[outOff + i] ^= iv[i];
        for (var i = 0; i < this.blockSize; i++) iv[i] = inp[inOff + i];
      }
    };
  }, {
    inherits: 101,
    "minimalistic-assert": 105
  } ],
  59: [ function(require, module, exports) {
    "use strict";
    var assert = require("minimalistic-assert");
    function Cipher(options) {
      this.options = options;
      this.type = this.options.type;
      this.blockSize = 8;
      this._init();
      this.buffer = new Array(this.blockSize);
      this.bufferOff = 0;
    }
    module.exports = Cipher;
    Cipher.prototype._init = function _init() {};
    Cipher.prototype.update = function update(data) {
      if (0 === data.length) return [];
      return "decrypt" === this.type ? this._updateDecrypt(data) : this._updateEncrypt(data);
    };
    Cipher.prototype._buffer = function _buffer(data, off) {
      var min = Math.min(this.buffer.length - this.bufferOff, data.length - off);
      for (var i = 0; i < min; i++) this.buffer[this.bufferOff + i] = data[off + i];
      this.bufferOff += min;
      return min;
    };
    Cipher.prototype._flushBuffer = function _flushBuffer(out, off) {
      this._update(this.buffer, 0, out, off);
      this.bufferOff = 0;
      return this.blockSize;
    };
    Cipher.prototype._updateEncrypt = function _updateEncrypt(data) {
      var inputOff = 0;
      var outputOff = 0;
      var count = (this.bufferOff + data.length) / this.blockSize | 0;
      var out = new Array(count * this.blockSize);
      if (0 !== this.bufferOff) {
        inputOff += this._buffer(data, inputOff);
        this.bufferOff === this.buffer.length && (outputOff += this._flushBuffer(out, outputOff));
      }
      var max = data.length - (data.length - inputOff) % this.blockSize;
      for (;inputOff < max; inputOff += this.blockSize) {
        this._update(data, inputOff, out, outputOff);
        outputOff += this.blockSize;
      }
      for (;inputOff < data.length; inputOff++, this.bufferOff++) this.buffer[this.bufferOff] = data[inputOff];
      return out;
    };
    Cipher.prototype._updateDecrypt = function _updateDecrypt(data) {
      var inputOff = 0;
      var outputOff = 0;
      var count = Math.ceil((this.bufferOff + data.length) / this.blockSize) - 1;
      var out = new Array(count * this.blockSize);
      for (;count > 0; count--) {
        inputOff += this._buffer(data, inputOff);
        outputOff += this._flushBuffer(out, outputOff);
      }
      inputOff += this._buffer(data, inputOff);
      return out;
    };
    Cipher.prototype.final = function final(buffer) {
      var first;
      buffer && (first = this.update(buffer));
      var last;
      last = "encrypt" === this.type ? this._finalEncrypt() : this._finalDecrypt();
      return first ? first.concat(last) : last;
    };
    Cipher.prototype._pad = function _pad(buffer, off) {
      if (0 === off) return false;
      while (off < buffer.length) buffer[off++] = 0;
      return true;
    };
    Cipher.prototype._finalEncrypt = function _finalEncrypt() {
      if (!this._pad(this.buffer, this.bufferOff)) return [];
      var out = new Array(this.blockSize);
      this._update(this.buffer, 0, out, 0);
      return out;
    };
    Cipher.prototype._unpad = function _unpad(buffer) {
      return buffer;
    };
    Cipher.prototype._finalDecrypt = function _finalDecrypt() {
      assert.equal(this.bufferOff, this.blockSize, "Not enough data to decrypt");
      var out = new Array(this.blockSize);
      this._flushBuffer(out, 0);
      return this._unpad(out);
    };
  }, {
    "minimalistic-assert": 105
  } ],
  60: [ function(require, module, exports) {
    "use strict";
    var assert = require("minimalistic-assert");
    var inherits = require("inherits");
    var des = require("../des");
    var utils = des.utils;
    var Cipher = des.Cipher;
    function DESState() {
      this.tmp = new Array(2);
      this.keys = null;
    }
    function DES(options) {
      Cipher.call(this, options);
      var state = new DESState();
      this._desState = state;
      this.deriveKeys(state, options.key);
    }
    inherits(DES, Cipher);
    module.exports = DES;
    DES.create = function create(options) {
      return new DES(options);
    };
    var shiftTable = [ 1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1 ];
    DES.prototype.deriveKeys = function deriveKeys(state, key) {
      state.keys = new Array(32);
      assert.equal(key.length, this.blockSize, "Invalid key length");
      var kL = utils.readUInt32BE(key, 0);
      var kR = utils.readUInt32BE(key, 4);
      utils.pc1(kL, kR, state.tmp, 0);
      kL = state.tmp[0];
      kR = state.tmp[1];
      for (var i = 0; i < state.keys.length; i += 2) {
        var shift = shiftTable[i >>> 1];
        kL = utils.r28shl(kL, shift);
        kR = utils.r28shl(kR, shift);
        utils.pc2(kL, kR, state.keys, i);
      }
    };
    DES.prototype._update = function _update(inp, inOff, out, outOff) {
      var state = this._desState;
      var l = utils.readUInt32BE(inp, inOff);
      var r = utils.readUInt32BE(inp, inOff + 4);
      utils.ip(l, r, state.tmp, 0);
      l = state.tmp[0];
      r = state.tmp[1];
      "encrypt" === this.type ? this._encrypt(state, l, r, state.tmp, 0) : this._decrypt(state, l, r, state.tmp, 0);
      l = state.tmp[0];
      r = state.tmp[1];
      utils.writeUInt32BE(out, l, outOff);
      utils.writeUInt32BE(out, r, outOff + 4);
    };
    DES.prototype._pad = function _pad(buffer, off) {
      var value = buffer.length - off;
      for (var i = off; i < buffer.length; i++) buffer[i] = value;
      return true;
    };
    DES.prototype._unpad = function _unpad(buffer) {
      var pad = buffer[buffer.length - 1];
      for (var i = buffer.length - pad; i < buffer.length; i++) assert.equal(buffer[i], pad);
      return buffer.slice(0, buffer.length - pad);
    };
    DES.prototype._encrypt = function _encrypt(state, lStart, rStart, out, off) {
      var l = lStart;
      var r = rStart;
      for (var i = 0; i < state.keys.length; i += 2) {
        var keyL = state.keys[i];
        var keyR = state.keys[i + 1];
        utils.expand(r, state.tmp, 0);
        keyL ^= state.tmp[0];
        keyR ^= state.tmp[1];
        var s = utils.substitute(keyL, keyR);
        var f = utils.permute(s);
        var t = r;
        r = (l ^ f) >>> 0;
        l = t;
      }
      utils.rip(r, l, out, off);
    };
    DES.prototype._decrypt = function _decrypt(state, lStart, rStart, out, off) {
      var l = rStart;
      var r = lStart;
      for (var i = state.keys.length - 2; i >= 0; i -= 2) {
        var keyL = state.keys[i];
        var keyR = state.keys[i + 1];
        utils.expand(l, state.tmp, 0);
        keyL ^= state.tmp[0];
        keyR ^= state.tmp[1];
        var s = utils.substitute(keyL, keyR);
        var f = utils.permute(s);
        var t = l;
        l = (r ^ f) >>> 0;
        r = t;
      }
      utils.rip(l, r, out, off);
    };
  }, {
    "../des": 57,
    inherits: 101,
    "minimalistic-assert": 105
  } ],
  61: [ function(require, module, exports) {
    "use strict";
    var assert = require("minimalistic-assert");
    var inherits = require("inherits");
    var des = require("../des");
    var Cipher = des.Cipher;
    var DES = des.DES;
    function EDEState(type, key) {
      assert.equal(key.length, 24, "Invalid key length");
      var k1 = key.slice(0, 8);
      var k2 = key.slice(8, 16);
      var k3 = key.slice(16, 24);
      this.ciphers = "encrypt" === type ? [ DES.create({
        type: "encrypt",
        key: k1
      }), DES.create({
        type: "decrypt",
        key: k2
      }), DES.create({
        type: "encrypt",
        key: k3
      }) ] : [ DES.create({
        type: "decrypt",
        key: k3
      }), DES.create({
        type: "encrypt",
        key: k2
      }), DES.create({
        type: "decrypt",
        key: k1
      }) ];
    }
    function EDE(options) {
      Cipher.call(this, options);
      var state = new EDEState(this.type, this.options.key);
      this._edeState = state;
    }
    inherits(EDE, Cipher);
    module.exports = EDE;
    EDE.create = function create(options) {
      return new EDE(options);
    };
    EDE.prototype._update = function _update(inp, inOff, out, outOff) {
      var state = this._edeState;
      state.ciphers[0]._update(inp, inOff, out, outOff);
      state.ciphers[1]._update(out, outOff, out, outOff);
      state.ciphers[2]._update(out, outOff, out, outOff);
    };
    EDE.prototype._pad = DES.prototype._pad;
    EDE.prototype._unpad = DES.prototype._unpad;
  }, {
    "../des": 57,
    inherits: 101,
    "minimalistic-assert": 105
  } ],
  62: [ function(require, module, exports) {
    "use strict";
    exports.readUInt32BE = function readUInt32BE(bytes, off) {
      var res = bytes[0 + off] << 24 | bytes[1 + off] << 16 | bytes[2 + off] << 8 | bytes[3 + off];
      return res >>> 0;
    };
    exports.writeUInt32BE = function writeUInt32BE(bytes, value, off) {
      bytes[0 + off] = value >>> 24;
      bytes[1 + off] = value >>> 16 & 255;
      bytes[2 + off] = value >>> 8 & 255;
      bytes[3 + off] = 255 & value;
    };
    exports.ip = function ip(inL, inR, out, off) {
      var outL = 0;
      var outR = 0;
      for (var i = 6; i >= 0; i -= 2) {
        for (var j = 0; j <= 24; j += 8) {
          outL <<= 1;
          outL |= inR >>> j + i & 1;
        }
        for (var j = 0; j <= 24; j += 8) {
          outL <<= 1;
          outL |= inL >>> j + i & 1;
        }
      }
      for (var i = 6; i >= 0; i -= 2) {
        for (var j = 1; j <= 25; j += 8) {
          outR <<= 1;
          outR |= inR >>> j + i & 1;
        }
        for (var j = 1; j <= 25; j += 8) {
          outR <<= 1;
          outR |= inL >>> j + i & 1;
        }
      }
      out[off + 0] = outL >>> 0;
      out[off + 1] = outR >>> 0;
    };
    exports.rip = function rip(inL, inR, out, off) {
      var outL = 0;
      var outR = 0;
      for (var i = 0; i < 4; i++) for (var j = 24; j >= 0; j -= 8) {
        outL <<= 1;
        outL |= inR >>> j + i & 1;
        outL <<= 1;
        outL |= inL >>> j + i & 1;
      }
      for (var i = 4; i < 8; i++) for (var j = 24; j >= 0; j -= 8) {
        outR <<= 1;
        outR |= inR >>> j + i & 1;
        outR <<= 1;
        outR |= inL >>> j + i & 1;
      }
      out[off + 0] = outL >>> 0;
      out[off + 1] = outR >>> 0;
    };
    exports.pc1 = function pc1(inL, inR, out, off) {
      var outL = 0;
      var outR = 0;
      for (var i = 7; i >= 5; i--) {
        for (var j = 0; j <= 24; j += 8) {
          outL <<= 1;
          outL |= inR >> j + i & 1;
        }
        for (var j = 0; j <= 24; j += 8) {
          outL <<= 1;
          outL |= inL >> j + i & 1;
        }
      }
      for (var j = 0; j <= 24; j += 8) {
        outL <<= 1;
        outL |= inR >> j + i & 1;
      }
      for (var i = 1; i <= 3; i++) {
        for (var j = 0; j <= 24; j += 8) {
          outR <<= 1;
          outR |= inR >> j + i & 1;
        }
        for (var j = 0; j <= 24; j += 8) {
          outR <<= 1;
          outR |= inL >> j + i & 1;
        }
      }
      for (var j = 0; j <= 24; j += 8) {
        outR <<= 1;
        outR |= inL >> j + i & 1;
      }
      out[off + 0] = outL >>> 0;
      out[off + 1] = outR >>> 0;
    };
    exports.r28shl = function r28shl(num, shift) {
      return num << shift & 268435455 | num >>> 28 - shift;
    };
    var pc2table = [ 14, 11, 17, 4, 27, 23, 25, 0, 13, 22, 7, 18, 5, 9, 16, 24, 2, 20, 12, 21, 1, 8, 15, 26, 15, 4, 25, 19, 9, 1, 26, 16, 5, 11, 23, 8, 12, 7, 17, 0, 22, 3, 10, 14, 6, 20, 27, 24 ];
    exports.pc2 = function pc2(inL, inR, out, off) {
      var outL = 0;
      var outR = 0;
      var len = pc2table.length >>> 1;
      for (var i = 0; i < len; i++) {
        outL <<= 1;
        outL |= inL >>> pc2table[i] & 1;
      }
      for (var i = len; i < pc2table.length; i++) {
        outR <<= 1;
        outR |= inR >>> pc2table[i] & 1;
      }
      out[off + 0] = outL >>> 0;
      out[off + 1] = outR >>> 0;
    };
    exports.expand = function expand(r, out, off) {
      var outL = 0;
      var outR = 0;
      outL = (1 & r) << 5 | r >>> 27;
      for (var i = 23; i >= 15; i -= 4) {
        outL <<= 6;
        outL |= r >>> i & 63;
      }
      for (var i = 11; i >= 3; i -= 4) {
        outR |= r >>> i & 63;
        outR <<= 6;
      }
      outR |= (31 & r) << 1 | r >>> 31;
      out[off + 0] = outL >>> 0;
      out[off + 1] = outR >>> 0;
    };
    var sTable = [ 14, 0, 4, 15, 13, 7, 1, 4, 2, 14, 15, 2, 11, 13, 8, 1, 3, 10, 10, 6, 6, 12, 12, 11, 5, 9, 9, 5, 0, 3, 7, 8, 4, 15, 1, 12, 14, 8, 8, 2, 13, 4, 6, 9, 2, 1, 11, 7, 15, 5, 12, 11, 9, 3, 7, 14, 3, 10, 10, 0, 5, 6, 0, 13, 15, 3, 1, 13, 8, 4, 14, 7, 6, 15, 11, 2, 3, 8, 4, 14, 9, 12, 7, 0, 2, 1, 13, 10, 12, 6, 0, 9, 5, 11, 10, 5, 0, 13, 14, 8, 7, 10, 11, 1, 10, 3, 4, 15, 13, 4, 1, 2, 5, 11, 8, 6, 12, 7, 6, 12, 9, 0, 3, 5, 2, 14, 15, 9, 10, 13, 0, 7, 9, 0, 14, 9, 6, 3, 3, 4, 15, 6, 5, 10, 1, 2, 13, 8, 12, 5, 7, 14, 11, 12, 4, 11, 2, 15, 8, 1, 13, 1, 6, 10, 4, 13, 9, 0, 8, 6, 15, 9, 3, 8, 0, 7, 11, 4, 1, 15, 2, 14, 12, 3, 5, 11, 10, 5, 14, 2, 7, 12, 7, 13, 13, 8, 14, 11, 3, 5, 0, 6, 6, 15, 9, 0, 10, 3, 1, 4, 2, 7, 8, 2, 5, 12, 11, 1, 12, 10, 4, 14, 15, 9, 10, 3, 6, 15, 9, 0, 0, 6, 12, 10, 11, 1, 7, 13, 13, 8, 15, 9, 1, 4, 3, 5, 14, 11, 5, 12, 2, 7, 8, 2, 4, 14, 2, 14, 12, 11, 4, 2, 1, 12, 7, 4, 10, 7, 11, 13, 6, 1, 8, 5, 5, 0, 3, 15, 15, 10, 13, 3, 0, 9, 14, 8, 9, 6, 4, 11, 2, 8, 1, 12, 11, 7, 10, 1, 13, 14, 7, 2, 8, 13, 15, 6, 9, 15, 12, 0, 5, 9, 6, 10, 3, 4, 0, 5, 14, 3, 12, 10, 1, 15, 10, 4, 15, 2, 9, 7, 2, 12, 6, 9, 8, 5, 0, 6, 13, 1, 3, 13, 4, 14, 14, 0, 7, 11, 5, 3, 11, 8, 9, 4, 14, 3, 15, 2, 5, 12, 2, 9, 8, 5, 12, 15, 3, 10, 7, 11, 0, 14, 4, 1, 10, 7, 1, 6, 13, 0, 11, 8, 6, 13, 4, 13, 11, 0, 2, 11, 14, 7, 15, 4, 0, 9, 8, 1, 13, 10, 3, 14, 12, 3, 9, 5, 7, 12, 5, 2, 10, 15, 6, 8, 1, 6, 1, 6, 4, 11, 11, 13, 13, 8, 12, 1, 3, 4, 7, 10, 14, 7, 10, 9, 15, 5, 6, 0, 8, 15, 0, 14, 5, 2, 9, 3, 2, 12, 13, 1, 2, 15, 8, 13, 4, 8, 6, 10, 15, 3, 11, 7, 1, 4, 10, 12, 9, 5, 3, 6, 14, 11, 5, 0, 0, 14, 12, 9, 7, 2, 7, 2, 11, 1, 4, 14, 1, 7, 9, 4, 12, 10, 14, 8, 2, 13, 0, 15, 6, 12, 10, 9, 13, 0, 15, 3, 3, 5, 5, 6, 8, 11 ];
    exports.substitute = function substitute(inL, inR) {
      var out = 0;
      for (var i = 0; i < 4; i++) {
        var b = inL >>> 18 - 6 * i & 63;
        var sb = sTable[64 * i + b];
        out <<= 4;
        out |= sb;
      }
      for (var i = 0; i < 4; i++) {
        var b = inR >>> 18 - 6 * i & 63;
        var sb = sTable[256 + 64 * i + b];
        out <<= 4;
        out |= sb;
      }
      return out >>> 0;
    };
    var permuteTable = [ 16, 25, 12, 11, 3, 20, 4, 15, 31, 17, 9, 6, 27, 14, 1, 22, 30, 24, 8, 18, 0, 5, 29, 23, 13, 19, 2, 26, 10, 21, 28, 7 ];
    exports.permute = function permute(num) {
      var out = 0;
      for (var i = 0; i < permuteTable.length; i++) {
        out <<= 1;
        out |= num >>> permuteTable[i] & 1;
      }
      return out >>> 0;
    };
    exports.padSplit = function padSplit(num, size, group) {
      var str = num.toString(2);
      while (str.length < size) str = "0" + str;
      var out = [];
      for (var i = 0; i < size; i += group) out.push(str.slice(i, i + group));
      return out.join(" ");
    };
  }, {} ],
  63: [ function(require, module, exports) {
    (function(Buffer) {
      var generatePrime = require("./lib/generatePrime");
      var primes = require("./lib/primes.json");
      var DH = require("./lib/dh");
      function getDiffieHellman(mod) {
        var prime = new Buffer(primes[mod].prime, "hex");
        var gen = new Buffer(primes[mod].gen, "hex");
        return new DH(prime, gen);
      }
      var ENCODINGS = {
        binary: true,
        hex: true,
        base64: true
      };
      function createDiffieHellman(prime, enc, generator, genc) {
        if (Buffer.isBuffer(enc) || void 0 === ENCODINGS[enc]) return createDiffieHellman(prime, "binary", enc, generator);
        enc = enc || "binary";
        genc = genc || "binary";
        generator = generator || new Buffer([ 2 ]);
        Buffer.isBuffer(generator) || (generator = new Buffer(generator, genc));
        if ("number" === typeof prime) return new DH(generatePrime(prime, generator), generator, true);
        Buffer.isBuffer(prime) || (prime = new Buffer(prime, enc));
        return new DH(prime, generator, true);
      }
      exports.DiffieHellmanGroup = exports.createDiffieHellmanGroup = exports.getDiffieHellman = getDiffieHellman;
      exports.createDiffieHellman = exports.DiffieHellman = createDiffieHellman;
    }).call(this, require("buffer").Buffer);
  }, {
    "./lib/dh": 64,
    "./lib/generatePrime": 65,
    "./lib/primes.json": 66,
    buffer: 47
  } ],
  64: [ function(require, module, exports) {
    (function(Buffer) {
      var BN = require("bn.js");
      var MillerRabin = require("miller-rabin");
      var millerRabin = new MillerRabin();
      var TWENTYFOUR = new BN(24);
      var ELEVEN = new BN(11);
      var TEN = new BN(10);
      var THREE = new BN(3);
      var SEVEN = new BN(7);
      var primes = require("./generatePrime");
      var randomBytes = require("randombytes");
      module.exports = DH;
      function setPublicKey(pub, enc) {
        enc = enc || "utf8";
        Buffer.isBuffer(pub) || (pub = new Buffer(pub, enc));
        this._pub = new BN(pub);
        return this;
      }
      function setPrivateKey(priv, enc) {
        enc = enc || "utf8";
        Buffer.isBuffer(priv) || (priv = new Buffer(priv, enc));
        this._priv = new BN(priv);
        return this;
      }
      var primeCache = {};
      function checkPrime(prime, generator) {
        var gen = generator.toString("hex");
        var hex = [ gen, prime.toString(16) ].join("_");
        if (hex in primeCache) return primeCache[hex];
        var error = 0;
        if (prime.isEven() || !primes.simpleSieve || !primes.fermatTest(prime) || !millerRabin.test(prime)) {
          error += 1;
          error += "02" === gen || "05" === gen ? 8 : 4;
          primeCache[hex] = error;
          return error;
        }
        millerRabin.test(prime.shrn(1)) || (error += 2);
        var rem;
        switch (gen) {
         case "02":
          prime.mod(TWENTYFOUR).cmp(ELEVEN) && (error += 8);
          break;

         case "05":
          rem = prime.mod(TEN);
          rem.cmp(THREE) && rem.cmp(SEVEN) && (error += 8);
          break;

         default:
          error += 4;
        }
        primeCache[hex] = error;
        return error;
      }
      function DH(prime, generator, malleable) {
        this.setGenerator(generator);
        this.__prime = new BN(prime);
        this._prime = BN.mont(this.__prime);
        this._primeLen = prime.length;
        this._pub = void 0;
        this._priv = void 0;
        this._primeCode = void 0;
        if (malleable) {
          this.setPublicKey = setPublicKey;
          this.setPrivateKey = setPrivateKey;
        } else this._primeCode = 8;
      }
      Object.defineProperty(DH.prototype, "verifyError", {
        enumerable: true,
        get: function() {
          "number" !== typeof this._primeCode && (this._primeCode = checkPrime(this.__prime, this.__gen));
          return this._primeCode;
        }
      });
      DH.prototype.generateKeys = function() {
        this._priv || (this._priv = new BN(randomBytes(this._primeLen)));
        this._pub = this._gen.toRed(this._prime).redPow(this._priv).fromRed();
        return this.getPublicKey();
      };
      DH.prototype.computeSecret = function(other) {
        other = new BN(other);
        other = other.toRed(this._prime);
        var secret = other.redPow(this._priv).fromRed();
        var out = new Buffer(secret.toArray());
        var prime = this.getPrime();
        if (out.length < prime.length) {
          var front = new Buffer(prime.length - out.length);
          front.fill(0);
          out = Buffer.concat([ front, out ]);
        }
        return out;
      };
      DH.prototype.getPublicKey = function getPublicKey(enc) {
        return formatReturnValue(this._pub, enc);
      };
      DH.prototype.getPrivateKey = function getPrivateKey(enc) {
        return formatReturnValue(this._priv, enc);
      };
      DH.prototype.getPrime = function(enc) {
        return formatReturnValue(this.__prime, enc);
      };
      DH.prototype.getGenerator = function(enc) {
        return formatReturnValue(this._gen, enc);
      };
      DH.prototype.setGenerator = function(gen, enc) {
        enc = enc || "utf8";
        Buffer.isBuffer(gen) || (gen = new Buffer(gen, enc));
        this.__gen = gen;
        this._gen = new BN(gen);
        return this;
      };
      function formatReturnValue(bn, enc) {
        var buf = new Buffer(bn.toArray());
        return enc ? buf.toString(enc) : buf;
      }
    }).call(this, require("buffer").Buffer);
  }, {
    "./generatePrime": 65,
    "bn.js": 16,
    buffer: 47,
    "miller-rabin": 104,
    randombytes: 126
  } ],
  65: [ function(require, module, exports) {
    var randomBytes = require("randombytes");
    module.exports = findPrime;
    findPrime.simpleSieve = simpleSieve;
    findPrime.fermatTest = fermatTest;
    var BN = require("bn.js");
    var TWENTYFOUR = new BN(24);
    var MillerRabin = require("miller-rabin");
    var millerRabin = new MillerRabin();
    var ONE = new BN(1);
    var TWO = new BN(2);
    var FIVE = new BN(5);
    var SIXTEEN = new BN(16);
    var EIGHT = new BN(8);
    var TEN = new BN(10);
    var THREE = new BN(3);
    var SEVEN = new BN(7);
    var ELEVEN = new BN(11);
    var FOUR = new BN(4);
    var TWELVE = new BN(12);
    var primes = null;
    function _getPrimes() {
      if (null !== primes) return primes;
      var limit = 1048576;
      var res = [];
      res[0] = 2;
      for (var i = 1, k = 3; k < limit; k += 2) {
        var sqrt = Math.ceil(Math.sqrt(k));
        for (var j = 0; j < i && res[j] <= sqrt; j++) if (k % res[j] === 0) break;
        if (i !== j && res[j] <= sqrt) continue;
        res[i++] = k;
      }
      primes = res;
      return res;
    }
    function simpleSieve(p) {
      var primes = _getPrimes();
      for (var i = 0; i < primes.length; i++) if (0 === p.modn(primes[i])) return 0 === p.cmpn(primes[i]);
      return true;
    }
    function fermatTest(p) {
      var red = BN.mont(p);
      return 0 === TWO.toRed(red).redPow(p.subn(1)).fromRed().cmpn(1);
    }
    function findPrime(bits, gen) {
      if (bits < 16) return new BN(2 === gen || 5 === gen ? [ 140, 123 ] : [ 140, 39 ]);
      gen = new BN(gen);
      var num, n2;
      while (true) {
        num = new BN(randomBytes(Math.ceil(bits / 8)));
        while (num.bitLength() > bits) num.ishrn(1);
        num.isEven() && num.iadd(ONE);
        num.testn(1) || num.iadd(TWO);
        if (gen.cmp(TWO)) {
          if (!gen.cmp(FIVE)) while (num.mod(TEN).cmp(THREE)) num.iadd(FOUR);
        } else while (num.mod(TWENTYFOUR).cmp(ELEVEN)) num.iadd(FOUR);
        n2 = num.shrn(1);
        if (simpleSieve(n2) && simpleSieve(num) && fermatTest(n2) && fermatTest(num) && millerRabin.test(n2) && millerRabin.test(num)) return num;
      }
    }
  }, {
    "bn.js": 16,
    "miller-rabin": 104,
    randombytes: 126
  } ],
  66: [ function(require, module, exports) {
    module.exports = {
      modp1: {
        gen: "02",
        prime: "ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a63a3620ffffffffffffffff"
      },
      modp2: {
        gen: "02",
        prime: "ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece65381ffffffffffffffff"
      },
      modp5: {
        gen: "02",
        prime: "ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca237327ffffffffffffffff"
      },
      modp14: {
        gen: "02",
        prime: "ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aacaa68ffffffffffffffff"
      },
      modp15: {
        gen: "02",
        prime: "ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aaac42dad33170d04507a33a85521abdf1cba64ecfb850458dbef0a8aea71575d060c7db3970f85a6e1e4c7abf5ae8cdb0933d71e8c94e04a25619dcee3d2261ad2ee6bf12ffa06d98a0864d87602733ec86a64521f2b18177b200cbbe117577a615d6c770988c0bad946e208e24fa074e5ab3143db5bfce0fd108e4b82d120a93ad2caffffffffffffffff"
      },
      modp16: {
        gen: "02",
        prime: "ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aaac42dad33170d04507a33a85521abdf1cba64ecfb850458dbef0a8aea71575d060c7db3970f85a6e1e4c7abf5ae8cdb0933d71e8c94e04a25619dcee3d2261ad2ee6bf12ffa06d98a0864d87602733ec86a64521f2b18177b200cbbe117577a615d6c770988c0bad946e208e24fa074e5ab3143db5bfce0fd108e4b82d120a92108011a723c12a787e6d788719a10bdba5b2699c327186af4e23c1a946834b6150bda2583e9ca2ad44ce8dbbbc2db04de8ef92e8efc141fbecaa6287c59474e6bc05d99b2964fa090c3a2233ba186515be7ed1f612970cee2d7afb81bdd762170481cd0069127d5b05aa993b4ea988d8fddc186ffb7dc90a6c08f4df435c934063199ffffffffffffffff"
      },
      modp17: {
        gen: "02",
        prime: "ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aaac42dad33170d04507a33a85521abdf1cba64ecfb850458dbef0a8aea71575d060c7db3970f85a6e1e4c7abf5ae8cdb0933d71e8c94e04a25619dcee3d2261ad2ee6bf12ffa06d98a0864d87602733ec86a64521f2b18177b200cbbe117577a615d6c770988c0bad946e208e24fa074e5ab3143db5bfce0fd108e4b82d120a92108011a723c12a787e6d788719a10bdba5b2699c327186af4e23c1a946834b6150bda2583e9ca2ad44ce8dbbbc2db04de8ef92e8efc141fbecaa6287c59474e6bc05d99b2964fa090c3a2233ba186515be7ed1f612970cee2d7afb81bdd762170481cd0069127d5b05aa993b4ea988d8fddc186ffb7dc90a6c08f4df435c93402849236c3fab4d27c7026c1d4dcb2602646dec9751e763dba37bdf8ff9406ad9e530ee5db382f413001aeb06a53ed9027d831179727b0865a8918da3edbebcf9b14ed44ce6cbaced4bb1bdb7f1447e6cc254b332051512bd7af426fb8f401378cd2bf5983ca01c64b92ecf032ea15d1721d03f482d7ce6e74fef6d55e702f46980c82b5a84031900b1c9e59e7c97fbec7e8f323a97a7e36cc88be0f1d45b7ff585ac54bd407b22b4154aacc8f6d7ebf48e1d814cc5ed20f8037e0a79715eef29be32806a1d58bb7c5da76f550aa3d8a1fbff0eb19ccb1a313d55cda56c9ec2ef29632387fe8d76e3c0468043e8f663f4860ee12bf2d5b0b7474d6e694f91e6dcc4024ffffffffffffffff"
      },
      modp18: {
        gen: "02",
        prime: "ffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece45b3dc2007cb8a163bf0598da48361c55d39a69163fa8fd24cf5f83655d23dca3ad961c62f356208552bb9ed529077096966d670c354e4abc9804f1746c08ca18217c32905e462e36ce3be39e772c180e86039b2783a2ec07a28fb5c55df06f4c52c9de2bcbf6955817183995497cea956ae515d2261898fa051015728e5a8aaac42dad33170d04507a33a85521abdf1cba64ecfb850458dbef0a8aea71575d060c7db3970f85a6e1e4c7abf5ae8cdb0933d71e8c94e04a25619dcee3d2261ad2ee6bf12ffa06d98a0864d87602733ec86a64521f2b18177b200cbbe117577a615d6c770988c0bad946e208e24fa074e5ab3143db5bfce0fd108e4b82d120a92108011a723c12a787e6d788719a10bdba5b2699c327186af4e23c1a946834b6150bda2583e9ca2ad44ce8dbbbc2db04de8ef92e8efc141fbecaa6287c59474e6bc05d99b2964fa090c3a2233ba186515be7ed1f612970cee2d7afb81bdd762170481cd0069127d5b05aa993b4ea988d8fddc186ffb7dc90a6c08f4df435c93402849236c3fab4d27c7026c1d4dcb2602646dec9751e763dba37bdf8ff9406ad9e530ee5db382f413001aeb06a53ed9027d831179727b0865a8918da3edbebcf9b14ed44ce6cbaced4bb1bdb7f1447e6cc254b332051512bd7af426fb8f401378cd2bf5983ca01c64b92ecf032ea15d1721d03f482d7ce6e74fef6d55e702f46980c82b5a84031900b1c9e59e7c97fbec7e8f323a97a7e36cc88be0f1d45b7ff585ac54bd407b22b4154aacc8f6d7ebf48e1d814cc5ed20f8037e0a79715eef29be32806a1d58bb7c5da76f550aa3d8a1fbff0eb19ccb1a313d55cda56c9ec2ef29632387fe8d76e3c0468043e8f663f4860ee12bf2d5b0b7474d6e694f91e6dbe115974a3926f12fee5e438777cb6a932df8cd8bec4d073b931ba3bc832b68d9dd300741fa7bf8afc47ed2576f6936ba424663aab639c5ae4f5683423b4742bf1c978238f16cbe39d652de3fdb8befc848ad922222e04a4037c0713eb57a81a23f0c73473fc646cea306b4bcbc8862f8385ddfa9d4b7fa2c087e879683303ed5bdd3a062b3cf5b3a278a66d2a13f83f44f82ddf310ee074ab6a364597e899a0255dc164f31cc50846851df9ab48195ded7ea1b1d510bd7ee74d73faf36bc31ecfa268359046f4eb879f924009438b481c6cd7889a002ed5ee382bc9190da6fc026e479558e4475677e9aa9e3050e2765694dfc81f56e880b96e7160c980dd98edd3dfffffffffffffffff"
      }
    };
  }, {} ],
  67: [ function(require, module, exports) {
    "use strict";
    var elliptic = exports;
    elliptic.version = require("../package.json").version;
    elliptic.utils = require("./elliptic/utils");
    elliptic.rand = require("brorand");
    elliptic.curve = require("./elliptic/curve");
    elliptic.curves = require("./elliptic/curves");
    elliptic.ec = require("./elliptic/ec");
    elliptic.eddsa = require("./elliptic/eddsa");
  }, {
    "../package.json": 82,
    "./elliptic/curve": 70,
    "./elliptic/curves": 73,
    "./elliptic/ec": 74,
    "./elliptic/eddsa": 77,
    "./elliptic/utils": 81,
    brorand: 17
  } ],
  68: [ function(require, module, exports) {
    "use strict";
    var BN = require("bn.js");
    var elliptic = require("../../elliptic");
    var utils = elliptic.utils;
    var getNAF = utils.getNAF;
    var getJSF = utils.getJSF;
    var assert = utils.assert;
    function BaseCurve(type, conf) {
      this.type = type;
      this.p = new BN(conf.p, 16);
      this.red = conf.prime ? BN.red(conf.prime) : BN.mont(this.p);
      this.zero = new BN(0).toRed(this.red);
      this.one = new BN(1).toRed(this.red);
      this.two = new BN(2).toRed(this.red);
      this.n = conf.n && new BN(conf.n, 16);
      this.g = conf.g && this.pointFromJSON(conf.g, conf.gRed);
      this._wnafT1 = new Array(4);
      this._wnafT2 = new Array(4);
      this._wnafT3 = new Array(4);
      this._wnafT4 = new Array(4);
      var adjustCount = this.n && this.p.div(this.n);
      if (!adjustCount || adjustCount.cmpn(100) > 0) this.redN = null; else {
        this._maxwellTrick = true;
        this.redN = this.n.toRed(this.red);
      }
    }
    module.exports = BaseCurve;
    BaseCurve.prototype.point = function point() {
      throw new Error("Not implemented");
    };
    BaseCurve.prototype.validate = function validate() {
      throw new Error("Not implemented");
    };
    BaseCurve.prototype._fixedNafMul = function _fixedNafMul(p, k) {
      assert(p.precomputed);
      var doubles = p._getDoubles();
      var naf = getNAF(k, 1);
      var I = (1 << doubles.step + 1) - (doubles.step % 2 === 0 ? 2 : 1);
      I /= 3;
      var repr = [];
      for (var j = 0; j < naf.length; j += doubles.step) {
        var nafW = 0;
        for (var k = j + doubles.step - 1; k >= j; k--) nafW = (nafW << 1) + naf[k];
        repr.push(nafW);
      }
      var a = this.jpoint(null, null, null);
      var b = this.jpoint(null, null, null);
      for (var i = I; i > 0; i--) {
        for (var j = 0; j < repr.length; j++) {
          var nafW = repr[j];
          nafW === i ? b = b.mixedAdd(doubles.points[j]) : nafW === -i && (b = b.mixedAdd(doubles.points[j].neg()));
        }
        a = a.add(b);
      }
      return a.toP();
    };
    BaseCurve.prototype._wnafMul = function _wnafMul(p, k) {
      var w = 4;
      var nafPoints = p._getNAFPoints(w);
      w = nafPoints.wnd;
      var wnd = nafPoints.points;
      var naf = getNAF(k, w);
      var acc = this.jpoint(null, null, null);
      for (var i = naf.length - 1; i >= 0; i--) {
        for (var k = 0; i >= 0 && 0 === naf[i]; i--) k++;
        i >= 0 && k++;
        acc = acc.dblp(k);
        if (i < 0) break;
        var z = naf[i];
        assert(0 !== z);
        acc = "affine" === p.type ? z > 0 ? acc.mixedAdd(wnd[z - 1 >> 1]) : acc.mixedAdd(wnd[-z - 1 >> 1].neg()) : z > 0 ? acc.add(wnd[z - 1 >> 1]) : acc.add(wnd[-z - 1 >> 1].neg());
      }
      return "affine" === p.type ? acc.toP() : acc;
    };
    BaseCurve.prototype._wnafMulAdd = function _wnafMulAdd(defW, points, coeffs, len, jacobianResult) {
      var wndWidth = this._wnafT1;
      var wnd = this._wnafT2;
      var naf = this._wnafT3;
      var max = 0;
      for (var i = 0; i < len; i++) {
        var p = points[i];
        var nafPoints = p._getNAFPoints(defW);
        wndWidth[i] = nafPoints.wnd;
        wnd[i] = nafPoints.points;
      }
      for (var i = len - 1; i >= 1; i -= 2) {
        var a = i - 1;
        var b = i;
        if (1 !== wndWidth[a] || 1 !== wndWidth[b]) {
          naf[a] = getNAF(coeffs[a], wndWidth[a]);
          naf[b] = getNAF(coeffs[b], wndWidth[b]);
          max = Math.max(naf[a].length, max);
          max = Math.max(naf[b].length, max);
          continue;
        }
        var comb = [ points[a], null, null, points[b] ];
        if (0 === points[a].y.cmp(points[b].y)) {
          comb[1] = points[a].add(points[b]);
          comb[2] = points[a].toJ().mixedAdd(points[b].neg());
        } else if (0 === points[a].y.cmp(points[b].y.redNeg())) {
          comb[1] = points[a].toJ().mixedAdd(points[b]);
          comb[2] = points[a].add(points[b].neg());
        } else {
          comb[1] = points[a].toJ().mixedAdd(points[b]);
          comb[2] = points[a].toJ().mixedAdd(points[b].neg());
        }
        var index = [ -3, -1, -5, -7, 0, 7, 5, 1, 3 ];
        var jsf = getJSF(coeffs[a], coeffs[b]);
        max = Math.max(jsf[0].length, max);
        naf[a] = new Array(max);
        naf[b] = new Array(max);
        for (var j = 0; j < max; j++) {
          var ja = 0 | jsf[0][j];
          var jb = 0 | jsf[1][j];
          naf[a][j] = index[3 * (ja + 1) + (jb + 1)];
          naf[b][j] = 0;
          wnd[a] = comb;
        }
      }
      var acc = this.jpoint(null, null, null);
      var tmp = this._wnafT4;
      for (var i = max; i >= 0; i--) {
        var k = 0;
        while (i >= 0) {
          var zero = true;
          for (var j = 0; j < len; j++) {
            tmp[j] = 0 | naf[j][i];
            0 !== tmp[j] && (zero = false);
          }
          if (!zero) break;
          k++;
          i--;
        }
        i >= 0 && k++;
        acc = acc.dblp(k);
        if (i < 0) break;
        for (var j = 0; j < len; j++) {
          var z = tmp[j];
          var p;
          if (0 === z) continue;
          z > 0 ? p = wnd[j][z - 1 >> 1] : z < 0 && (p = wnd[j][-z - 1 >> 1].neg());
          acc = "affine" === p.type ? acc.mixedAdd(p) : acc.add(p);
        }
      }
      for (var i = 0; i < len; i++) wnd[i] = null;
      return jacobianResult ? acc : acc.toP();
    };
    function BasePoint(curve, type) {
      this.curve = curve;
      this.type = type;
      this.precomputed = null;
    }
    BaseCurve.BasePoint = BasePoint;
    BasePoint.prototype.eq = function eq() {
      throw new Error("Not implemented");
    };
    BasePoint.prototype.validate = function validate() {
      return this.curve.validate(this);
    };
    BaseCurve.prototype.decodePoint = function decodePoint(bytes, enc) {
      bytes = utils.toArray(bytes, enc);
      var len = this.p.byteLength();
      if ((4 === bytes[0] || 6 === bytes[0] || 7 === bytes[0]) && bytes.length - 1 === 2 * len) {
        6 === bytes[0] ? assert(bytes[bytes.length - 1] % 2 === 0) : 7 === bytes[0] && assert(bytes[bytes.length - 1] % 2 === 1);
        var res = this.point(bytes.slice(1, 1 + len), bytes.slice(1 + len, 1 + 2 * len));
        return res;
      }
      if ((2 === bytes[0] || 3 === bytes[0]) && bytes.length - 1 === len) return this.pointFromX(bytes.slice(1, 1 + len), 3 === bytes[0]);
      throw new Error("Unknown point format");
    };
    BasePoint.prototype.encodeCompressed = function encodeCompressed(enc) {
      return this.encode(enc, true);
    };
    BasePoint.prototype._encode = function _encode(compact) {
      var len = this.curve.p.byteLength();
      var x = this.getX().toArray("be", len);
      if (compact) return [ this.getY().isEven() ? 2 : 3 ].concat(x);
      return [ 4 ].concat(x, this.getY().toArray("be", len));
    };
    BasePoint.prototype.encode = function encode(enc, compact) {
      return utils.encode(this._encode(compact), enc);
    };
    BasePoint.prototype.precompute = function precompute(power) {
      if (this.precomputed) return this;
      var precomputed = {
        doubles: null,
        naf: null,
        beta: null
      };
      precomputed.naf = this._getNAFPoints(8);
      precomputed.doubles = this._getDoubles(4, power);
      precomputed.beta = this._getBeta();
      this.precomputed = precomputed;
      return this;
    };
    BasePoint.prototype._hasDoubles = function _hasDoubles(k) {
      if (!this.precomputed) return false;
      var doubles = this.precomputed.doubles;
      if (!doubles) return false;
      return doubles.points.length >= Math.ceil((k.bitLength() + 1) / doubles.step);
    };
    BasePoint.prototype._getDoubles = function _getDoubles(step, power) {
      if (this.precomputed && this.precomputed.doubles) return this.precomputed.doubles;
      var doubles = [ this ];
      var acc = this;
      for (var i = 0; i < power; i += step) {
        for (var j = 0; j < step; j++) acc = acc.dbl();
        doubles.push(acc);
      }
      return {
        step: step,
        points: doubles
      };
    };
    BasePoint.prototype._getNAFPoints = function _getNAFPoints(wnd) {
      if (this.precomputed && this.precomputed.naf) return this.precomputed.naf;
      var res = [ this ];
      var max = (1 << wnd) - 1;
      var dbl = 1 === max ? null : this.dbl();
      for (var i = 1; i < max; i++) res[i] = res[i - 1].add(dbl);
      return {
        wnd: wnd,
        points: res
      };
    };
    BasePoint.prototype._getBeta = function _getBeta() {
      return null;
    };
    BasePoint.prototype.dblp = function dblp(k) {
      var r = this;
      for (var i = 0; i < k; i++) r = r.dbl();
      return r;
    };
  }, {
    "../../elliptic": 67,
    "bn.js": 16
  } ],
  69: [ function(require, module, exports) {
    "use strict";
    var curve = require("../curve");
    var elliptic = require("../../elliptic");
    var BN = require("bn.js");
    var inherits = require("inherits");
    var Base = curve.base;
    var assert = elliptic.utils.assert;
    function EdwardsCurve(conf) {
      this.twisted = 1 !== (0 | conf.a);
      this.mOneA = this.twisted && -1 === (0 | conf.a);
      this.extended = this.mOneA;
      Base.call(this, "edwards", conf);
      this.a = new BN(conf.a, 16).umod(this.red.m);
      this.a = this.a.toRed(this.red);
      this.c = new BN(conf.c, 16).toRed(this.red);
      this.c2 = this.c.redSqr();
      this.d = new BN(conf.d, 16).toRed(this.red);
      this.dd = this.d.redAdd(this.d);
      assert(!this.twisted || 0 === this.c.fromRed().cmpn(1));
      this.oneC = 1 === (0 | conf.c);
    }
    inherits(EdwardsCurve, Base);
    module.exports = EdwardsCurve;
    EdwardsCurve.prototype._mulA = function _mulA(num) {
      return this.mOneA ? num.redNeg() : this.a.redMul(num);
    };
    EdwardsCurve.prototype._mulC = function _mulC(num) {
      return this.oneC ? num : this.c.redMul(num);
    };
    EdwardsCurve.prototype.jpoint = function jpoint(x, y, z, t) {
      return this.point(x, y, z, t);
    };
    EdwardsCurve.prototype.pointFromX = function pointFromX(x, odd) {
      x = new BN(x, 16);
      x.red || (x = x.toRed(this.red));
      var x2 = x.redSqr();
      var rhs = this.c2.redSub(this.a.redMul(x2));
      var lhs = this.one.redSub(this.c2.redMul(this.d).redMul(x2));
      var y2 = rhs.redMul(lhs.redInvm());
      var y = y2.redSqrt();
      if (0 !== y.redSqr().redSub(y2).cmp(this.zero)) throw new Error("invalid point");
      var isOdd = y.fromRed().isOdd();
      (odd && !isOdd || !odd && isOdd) && (y = y.redNeg());
      return this.point(x, y);
    };
    EdwardsCurve.prototype.pointFromY = function pointFromY(y, odd) {
      y = new BN(y, 16);
      y.red || (y = y.toRed(this.red));
      var y2 = y.redSqr();
      var lhs = y2.redSub(this.one);
      var rhs = y2.redMul(this.d).redAdd(this.one);
      var x2 = lhs.redMul(rhs.redInvm());
      if (0 === x2.cmp(this.zero)) {
        if (odd) throw new Error("invalid point");
        return this.point(this.zero, y);
      }
      var x = x2.redSqrt();
      if (0 !== x.redSqr().redSub(x2).cmp(this.zero)) throw new Error("invalid point");
      x.isOdd() !== odd && (x = x.redNeg());
      return this.point(x, y);
    };
    EdwardsCurve.prototype.validate = function validate(point) {
      if (point.isInfinity()) return true;
      point.normalize();
      var x2 = point.x.redSqr();
      var y2 = point.y.redSqr();
      var lhs = x2.redMul(this.a).redAdd(y2);
      var rhs = this.c2.redMul(this.one.redAdd(this.d.redMul(x2).redMul(y2)));
      return 0 === lhs.cmp(rhs);
    };
    function Point(curve, x, y, z, t) {
      Base.BasePoint.call(this, curve, "projective");
      if (null === x && null === y && null === z) {
        this.x = this.curve.zero;
        this.y = this.curve.one;
        this.z = this.curve.one;
        this.t = this.curve.zero;
        this.zOne = true;
      } else {
        this.x = new BN(x, 16);
        this.y = new BN(y, 16);
        this.z = z ? new BN(z, 16) : this.curve.one;
        this.t = t && new BN(t, 16);
        this.x.red || (this.x = this.x.toRed(this.curve.red));
        this.y.red || (this.y = this.y.toRed(this.curve.red));
        this.z.red || (this.z = this.z.toRed(this.curve.red));
        this.t && !this.t.red && (this.t = this.t.toRed(this.curve.red));
        this.zOne = this.z === this.curve.one;
        if (this.curve.extended && !this.t) {
          this.t = this.x.redMul(this.y);
          this.zOne || (this.t = this.t.redMul(this.z.redInvm()));
        }
      }
    }
    inherits(Point, Base.BasePoint);
    EdwardsCurve.prototype.pointFromJSON = function pointFromJSON(obj) {
      return Point.fromJSON(this, obj);
    };
    EdwardsCurve.prototype.point = function point(x, y, z, t) {
      return new Point(this, x, y, z, t);
    };
    Point.fromJSON = function fromJSON(curve, obj) {
      return new Point(curve, obj[0], obj[1], obj[2]);
    };
    Point.prototype.inspect = function inspect() {
      if (this.isInfinity()) return "<EC Point Infinity>";
      return "<EC Point x: " + this.x.fromRed().toString(16, 2) + " y: " + this.y.fromRed().toString(16, 2) + " z: " + this.z.fromRed().toString(16, 2) + ">";
    };
    Point.prototype.isInfinity = function isInfinity() {
      return 0 === this.x.cmpn(0) && 0 === this.y.cmp(this.z);
    };
    Point.prototype._extDbl = function _extDbl() {
      var a = this.x.redSqr();
      var b = this.y.redSqr();
      var c = this.z.redSqr();
      c = c.redIAdd(c);
      var d = this.curve._mulA(a);
      var e = this.x.redAdd(this.y).redSqr().redISub(a).redISub(b);
      var g = d.redAdd(b);
      var f = g.redSub(c);
      var h = d.redSub(b);
      var nx = e.redMul(f);
      var ny = g.redMul(h);
      var nt = e.redMul(h);
      var nz = f.redMul(g);
      return this.curve.point(nx, ny, nz, nt);
    };
    Point.prototype._projDbl = function _projDbl() {
      var b = this.x.redAdd(this.y).redSqr();
      var c = this.x.redSqr();
      var d = this.y.redSqr();
      var nx;
      var ny;
      var nz;
      if (this.curve.twisted) {
        var e = this.curve._mulA(c);
        var f = e.redAdd(d);
        if (this.zOne) {
          nx = b.redSub(c).redSub(d).redMul(f.redSub(this.curve.two));
          ny = f.redMul(e.redSub(d));
          nz = f.redSqr().redSub(f).redSub(f);
        } else {
          var h = this.z.redSqr();
          var j = f.redSub(h).redISub(h);
          nx = b.redSub(c).redISub(d).redMul(j);
          ny = f.redMul(e.redSub(d));
          nz = f.redMul(j);
        }
      } else {
        var e = c.redAdd(d);
        var h = this.curve._mulC(this.c.redMul(this.z)).redSqr();
        var j = e.redSub(h).redSub(h);
        nx = this.curve._mulC(b.redISub(e)).redMul(j);
        ny = this.curve._mulC(e).redMul(c.redISub(d));
        nz = e.redMul(j);
      }
      return this.curve.point(nx, ny, nz);
    };
    Point.prototype.dbl = function dbl() {
      if (this.isInfinity()) return this;
      return this.curve.extended ? this._extDbl() : this._projDbl();
    };
    Point.prototype._extAdd = function _extAdd(p) {
      var a = this.y.redSub(this.x).redMul(p.y.redSub(p.x));
      var b = this.y.redAdd(this.x).redMul(p.y.redAdd(p.x));
      var c = this.t.redMul(this.curve.dd).redMul(p.t);
      var d = this.z.redMul(p.z.redAdd(p.z));
      var e = b.redSub(a);
      var f = d.redSub(c);
      var g = d.redAdd(c);
      var h = b.redAdd(a);
      var nx = e.redMul(f);
      var ny = g.redMul(h);
      var nt = e.redMul(h);
      var nz = f.redMul(g);
      return this.curve.point(nx, ny, nz, nt);
    };
    Point.prototype._projAdd = function _projAdd(p) {
      var a = this.z.redMul(p.z);
      var b = a.redSqr();
      var c = this.x.redMul(p.x);
      var d = this.y.redMul(p.y);
      var e = this.curve.d.redMul(c).redMul(d);
      var f = b.redSub(e);
      var g = b.redAdd(e);
      var tmp = this.x.redAdd(this.y).redMul(p.x.redAdd(p.y)).redISub(c).redISub(d);
      var nx = a.redMul(f).redMul(tmp);
      var ny;
      var nz;
      if (this.curve.twisted) {
        ny = a.redMul(g).redMul(d.redSub(this.curve._mulA(c)));
        nz = f.redMul(g);
      } else {
        ny = a.redMul(g).redMul(d.redSub(c));
        nz = this.curve._mulC(f).redMul(g);
      }
      return this.curve.point(nx, ny, nz);
    };
    Point.prototype.add = function add(p) {
      if (this.isInfinity()) return p;
      if (p.isInfinity()) return this;
      return this.curve.extended ? this._extAdd(p) : this._projAdd(p);
    };
    Point.prototype.mul = function mul(k) {
      return this._hasDoubles(k) ? this.curve._fixedNafMul(this, k) : this.curve._wnafMul(this, k);
    };
    Point.prototype.mulAdd = function mulAdd(k1, p, k2) {
      return this.curve._wnafMulAdd(1, [ this, p ], [ k1, k2 ], 2, false);
    };
    Point.prototype.jmulAdd = function jmulAdd(k1, p, k2) {
      return this.curve._wnafMulAdd(1, [ this, p ], [ k1, k2 ], 2, true);
    };
    Point.prototype.normalize = function normalize() {
      if (this.zOne) return this;
      var zi = this.z.redInvm();
      this.x = this.x.redMul(zi);
      this.y = this.y.redMul(zi);
      this.t && (this.t = this.t.redMul(zi));
      this.z = this.curve.one;
      this.zOne = true;
      return this;
    };
    Point.prototype.neg = function neg() {
      return this.curve.point(this.x.redNeg(), this.y, this.z, this.t && this.t.redNeg());
    };
    Point.prototype.getX = function getX() {
      this.normalize();
      return this.x.fromRed();
    };
    Point.prototype.getY = function getY() {
      this.normalize();
      return this.y.fromRed();
    };
    Point.prototype.eq = function eq(other) {
      return this === other || 0 === this.getX().cmp(other.getX()) && 0 === this.getY().cmp(other.getY());
    };
    Point.prototype.eqXToP = function eqXToP(x) {
      var rx = x.toRed(this.curve.red).redMul(this.z);
      if (0 === this.x.cmp(rx)) return true;
      var xc = x.clone();
      var t = this.curve.redN.redMul(this.z);
      for (;;) {
        xc.iadd(this.curve.n);
        if (xc.cmp(this.curve.p) >= 0) return false;
        rx.redIAdd(t);
        if (0 === this.x.cmp(rx)) return true;
      }
      return false;
    };
    Point.prototype.toP = Point.prototype.normalize;
    Point.prototype.mixedAdd = Point.prototype.add;
  }, {
    "../../elliptic": 67,
    "../curve": 70,
    "bn.js": 16,
    inherits: 101
  } ],
  70: [ function(require, module, exports) {
    "use strict";
    var curve = exports;
    curve.base = require("./base");
    curve.short = require("./short");
    curve.mont = require("./mont");
    curve.edwards = require("./edwards");
  }, {
    "./base": 68,
    "./edwards": 69,
    "./mont": 71,
    "./short": 72
  } ],
  71: [ function(require, module, exports) {
    "use strict";
    var curve = require("../curve");
    var BN = require("bn.js");
    var inherits = require("inherits");
    var Base = curve.base;
    var elliptic = require("../../elliptic");
    var utils = elliptic.utils;
    function MontCurve(conf) {
      Base.call(this, "mont", conf);
      this.a = new BN(conf.a, 16).toRed(this.red);
      this.b = new BN(conf.b, 16).toRed(this.red);
      this.i4 = new BN(4).toRed(this.red).redInvm();
      this.two = new BN(2).toRed(this.red);
      this.a24 = this.i4.redMul(this.a.redAdd(this.two));
    }
    inherits(MontCurve, Base);
    module.exports = MontCurve;
    MontCurve.prototype.validate = function validate(point) {
      var x = point.normalize().x;
      var x2 = x.redSqr();
      var rhs = x2.redMul(x).redAdd(x2.redMul(this.a)).redAdd(x);
      var y = rhs.redSqrt();
      return 0 === y.redSqr().cmp(rhs);
    };
    function Point(curve, x, z) {
      Base.BasePoint.call(this, curve, "projective");
      if (null === x && null === z) {
        this.x = this.curve.one;
        this.z = this.curve.zero;
      } else {
        this.x = new BN(x, 16);
        this.z = new BN(z, 16);
        this.x.red || (this.x = this.x.toRed(this.curve.red));
        this.z.red || (this.z = this.z.toRed(this.curve.red));
      }
    }
    inherits(Point, Base.BasePoint);
    MontCurve.prototype.decodePoint = function decodePoint(bytes, enc) {
      return this.point(utils.toArray(bytes, enc), 1);
    };
    MontCurve.prototype.point = function point(x, z) {
      return new Point(this, x, z);
    };
    MontCurve.prototype.pointFromJSON = function pointFromJSON(obj) {
      return Point.fromJSON(this, obj);
    };
    Point.prototype.precompute = function precompute() {};
    Point.prototype._encode = function _encode() {
      return this.getX().toArray("be", this.curve.p.byteLength());
    };
    Point.fromJSON = function fromJSON(curve, obj) {
      return new Point(curve, obj[0], obj[1] || curve.one);
    };
    Point.prototype.inspect = function inspect() {
      if (this.isInfinity()) return "<EC Point Infinity>";
      return "<EC Point x: " + this.x.fromRed().toString(16, 2) + " z: " + this.z.fromRed().toString(16, 2) + ">";
    };
    Point.prototype.isInfinity = function isInfinity() {
      return 0 === this.z.cmpn(0);
    };
    Point.prototype.dbl = function dbl() {
      var a = this.x.redAdd(this.z);
      var aa = a.redSqr();
      var b = this.x.redSub(this.z);
      var bb = b.redSqr();
      var c = aa.redSub(bb);
      var nx = aa.redMul(bb);
      var nz = c.redMul(bb.redAdd(this.curve.a24.redMul(c)));
      return this.curve.point(nx, nz);
    };
    Point.prototype.add = function add() {
      throw new Error("Not supported on Montgomery curve");
    };
    Point.prototype.diffAdd = function diffAdd(p, diff) {
      var a = this.x.redAdd(this.z);
      var b = this.x.redSub(this.z);
      var c = p.x.redAdd(p.z);
      var d = p.x.redSub(p.z);
      var da = d.redMul(a);
      var cb = c.redMul(b);
      var nx = diff.z.redMul(da.redAdd(cb).redSqr());
      var nz = diff.x.redMul(da.redISub(cb).redSqr());
      return this.curve.point(nx, nz);
    };
    Point.prototype.mul = function mul(k) {
      var t = k.clone();
      var a = this;
      var b = this.curve.point(null, null);
      var c = this;
      for (var bits = []; 0 !== t.cmpn(0); t.iushrn(1)) bits.push(t.andln(1));
      for (var i = bits.length - 1; i >= 0; i--) if (0 === bits[i]) {
        a = a.diffAdd(b, c);
        b = b.dbl();
      } else {
        b = a.diffAdd(b, c);
        a = a.dbl();
      }
      return b;
    };
    Point.prototype.mulAdd = function mulAdd() {
      throw new Error("Not supported on Montgomery curve");
    };
    Point.prototype.jumlAdd = function jumlAdd() {
      throw new Error("Not supported on Montgomery curve");
    };
    Point.prototype.eq = function eq(other) {
      return 0 === this.getX().cmp(other.getX());
    };
    Point.prototype.normalize = function normalize() {
      this.x = this.x.redMul(this.z.redInvm());
      this.z = this.curve.one;
      return this;
    };
    Point.prototype.getX = function getX() {
      this.normalize();
      return this.x.fromRed();
    };
  }, {
    "../../elliptic": 67,
    "../curve": 70,
    "bn.js": 16,
    inherits: 101
  } ],
  72: [ function(require, module, exports) {
    "use strict";
    var curve = require("../curve");
    var elliptic = require("../../elliptic");
    var BN = require("bn.js");
    var inherits = require("inherits");
    var Base = curve.base;
    var assert = elliptic.utils.assert;
    function ShortCurve(conf) {
      Base.call(this, "short", conf);
      this.a = new BN(conf.a, 16).toRed(this.red);
      this.b = new BN(conf.b, 16).toRed(this.red);
      this.tinv = this.two.redInvm();
      this.zeroA = 0 === this.a.fromRed().cmpn(0);
      this.threeA = 0 === this.a.fromRed().sub(this.p).cmpn(-3);
      this.endo = this._getEndomorphism(conf);
      this._endoWnafT1 = new Array(4);
      this._endoWnafT2 = new Array(4);
    }
    inherits(ShortCurve, Base);
    module.exports = ShortCurve;
    ShortCurve.prototype._getEndomorphism = function _getEndomorphism(conf) {
      if (!this.zeroA || !this.g || !this.n || 1 !== this.p.modn(3)) return;
      var beta;
      var lambda;
      if (conf.beta) beta = new BN(conf.beta, 16).toRed(this.red); else {
        var betas = this._getEndoRoots(this.p);
        beta = betas[0].cmp(betas[1]) < 0 ? betas[0] : betas[1];
        beta = beta.toRed(this.red);
      }
      if (conf.lambda) lambda = new BN(conf.lambda, 16); else {
        var lambdas = this._getEndoRoots(this.n);
        if (0 === this.g.mul(lambdas[0]).x.cmp(this.g.x.redMul(beta))) lambda = lambdas[0]; else {
          lambda = lambdas[1];
          assert(0 === this.g.mul(lambda).x.cmp(this.g.x.redMul(beta)));
        }
      }
      var basis;
      basis = conf.basis ? conf.basis.map(function(vec) {
        return {
          a: new BN(vec.a, 16),
          b: new BN(vec.b, 16)
        };
      }) : this._getEndoBasis(lambda);
      return {
        beta: beta,
        lambda: lambda,
        basis: basis
      };
    };
    ShortCurve.prototype._getEndoRoots = function _getEndoRoots(num) {
      var red = num === this.p ? this.red : BN.mont(num);
      var tinv = new BN(2).toRed(red).redInvm();
      var ntinv = tinv.redNeg();
      var s = new BN(3).toRed(red).redNeg().redSqrt().redMul(tinv);
      var l1 = ntinv.redAdd(s).fromRed();
      var l2 = ntinv.redSub(s).fromRed();
      return [ l1, l2 ];
    };
    ShortCurve.prototype._getEndoBasis = function _getEndoBasis(lambda) {
      var aprxSqrt = this.n.ushrn(Math.floor(this.n.bitLength() / 2));
      var u = lambda;
      var v = this.n.clone();
      var x1 = new BN(1);
      var y1 = new BN(0);
      var x2 = new BN(0);
      var y2 = new BN(1);
      var a0;
      var b0;
      var a1;
      var b1;
      var a2;
      var b2;
      var prevR;
      var i = 0;
      var r;
      var x;
      while (0 !== u.cmpn(0)) {
        var q = v.div(u);
        r = v.sub(q.mul(u));
        x = x2.sub(q.mul(x1));
        var y = y2.sub(q.mul(y1));
        if (!a1 && r.cmp(aprxSqrt) < 0) {
          a0 = prevR.neg();
          b0 = x1;
          a1 = r.neg();
          b1 = x;
        } else if (a1 && 2 === ++i) break;
        prevR = r;
        v = u;
        u = r;
        x2 = x1;
        x1 = x;
        y2 = y1;
        y1 = y;
      }
      a2 = r.neg();
      b2 = x;
      var len1 = a1.sqr().add(b1.sqr());
      var len2 = a2.sqr().add(b2.sqr());
      if (len2.cmp(len1) >= 0) {
        a2 = a0;
        b2 = b0;
      }
      if (a1.negative) {
        a1 = a1.neg();
        b1 = b1.neg();
      }
      if (a2.negative) {
        a2 = a2.neg();
        b2 = b2.neg();
      }
      return [ {
        a: a1,
        b: b1
      }, {
        a: a2,
        b: b2
      } ];
    };
    ShortCurve.prototype._endoSplit = function _endoSplit(k) {
      var basis = this.endo.basis;
      var v1 = basis[0];
      var v2 = basis[1];
      var c1 = v2.b.mul(k).divRound(this.n);
      var c2 = v1.b.neg().mul(k).divRound(this.n);
      var p1 = c1.mul(v1.a);
      var p2 = c2.mul(v2.a);
      var q1 = c1.mul(v1.b);
      var q2 = c2.mul(v2.b);
      var k1 = k.sub(p1).sub(p2);
      var k2 = q1.add(q2).neg();
      return {
        k1: k1,
        k2: k2
      };
    };
    ShortCurve.prototype.pointFromX = function pointFromX(x, odd) {
      x = new BN(x, 16);
      x.red || (x = x.toRed(this.red));
      var y2 = x.redSqr().redMul(x).redIAdd(x.redMul(this.a)).redIAdd(this.b);
      var y = y2.redSqrt();
      if (0 !== y.redSqr().redSub(y2).cmp(this.zero)) throw new Error("invalid point");
      var isOdd = y.fromRed().isOdd();
      (odd && !isOdd || !odd && isOdd) && (y = y.redNeg());
      return this.point(x, y);
    };
    ShortCurve.prototype.validate = function validate(point) {
      if (point.inf) return true;
      var x = point.x;
      var y = point.y;
      var ax = this.a.redMul(x);
      var rhs = x.redSqr().redMul(x).redIAdd(ax).redIAdd(this.b);
      return 0 === y.redSqr().redISub(rhs).cmpn(0);
    };
    ShortCurve.prototype._endoWnafMulAdd = function _endoWnafMulAdd(points, coeffs, jacobianResult) {
      var npoints = this._endoWnafT1;
      var ncoeffs = this._endoWnafT2;
      for (var i = 0; i < points.length; i++) {
        var split = this._endoSplit(coeffs[i]);
        var p = points[i];
        var beta = p._getBeta();
        if (split.k1.negative) {
          split.k1.ineg();
          p = p.neg(true);
        }
        if (split.k2.negative) {
          split.k2.ineg();
          beta = beta.neg(true);
        }
        npoints[2 * i] = p;
        npoints[2 * i + 1] = beta;
        ncoeffs[2 * i] = split.k1;
        ncoeffs[2 * i + 1] = split.k2;
      }
      var res = this._wnafMulAdd(1, npoints, ncoeffs, 2 * i, jacobianResult);
      for (var j = 0; j < 2 * i; j++) {
        npoints[j] = null;
        ncoeffs[j] = null;
      }
      return res;
    };
    function Point(curve, x, y, isRed) {
      Base.BasePoint.call(this, curve, "affine");
      if (null === x && null === y) {
        this.x = null;
        this.y = null;
        this.inf = true;
      } else {
        this.x = new BN(x, 16);
        this.y = new BN(y, 16);
        if (isRed) {
          this.x.forceRed(this.curve.red);
          this.y.forceRed(this.curve.red);
        }
        this.x.red || (this.x = this.x.toRed(this.curve.red));
        this.y.red || (this.y = this.y.toRed(this.curve.red));
        this.inf = false;
      }
    }
    inherits(Point, Base.BasePoint);
    ShortCurve.prototype.point = function point(x, y, isRed) {
      return new Point(this, x, y, isRed);
    };
    ShortCurve.prototype.pointFromJSON = function pointFromJSON(obj, red) {
      return Point.fromJSON(this, obj, red);
    };
    Point.prototype._getBeta = function _getBeta() {
      if (!this.curve.endo) return;
      var pre = this.precomputed;
      if (pre && pre.beta) return pre.beta;
      var beta = this.curve.point(this.x.redMul(this.curve.endo.beta), this.y);
      if (pre) {
        var curve = this.curve;
        var endoMul = function(p) {
          return curve.point(p.x.redMul(curve.endo.beta), p.y);
        };
        pre.beta = beta;
        beta.precomputed = {
          beta: null,
          naf: pre.naf && {
            wnd: pre.naf.wnd,
            points: pre.naf.points.map(endoMul)
          },
          doubles: pre.doubles && {
            step: pre.doubles.step,
            points: pre.doubles.points.map(endoMul)
          }
        };
      }
      return beta;
    };
    Point.prototype.toJSON = function toJSON() {
      if (!this.precomputed) return [ this.x, this.y ];
      return [ this.x, this.y, this.precomputed && {
        doubles: this.precomputed.doubles && {
          step: this.precomputed.doubles.step,
          points: this.precomputed.doubles.points.slice(1)
        },
        naf: this.precomputed.naf && {
          wnd: this.precomputed.naf.wnd,
          points: this.precomputed.naf.points.slice(1)
        }
      } ];
    };
    Point.fromJSON = function fromJSON(curve, obj, red) {
      "string" === typeof obj && (obj = JSON.parse(obj));
      var res = curve.point(obj[0], obj[1], red);
      if (!obj[2]) return res;
      function obj2point(obj) {
        return curve.point(obj[0], obj[1], red);
      }
      var pre = obj[2];
      res.precomputed = {
        beta: null,
        doubles: pre.doubles && {
          step: pre.doubles.step,
          points: [ res ].concat(pre.doubles.points.map(obj2point))
        },
        naf: pre.naf && {
          wnd: pre.naf.wnd,
          points: [ res ].concat(pre.naf.points.map(obj2point))
        }
      };
      return res;
    };
    Point.prototype.inspect = function inspect() {
      if (this.isInfinity()) return "<EC Point Infinity>";
      return "<EC Point x: " + this.x.fromRed().toString(16, 2) + " y: " + this.y.fromRed().toString(16, 2) + ">";
    };
    Point.prototype.isInfinity = function isInfinity() {
      return this.inf;
    };
    Point.prototype.add = function add(p) {
      if (this.inf) return p;
      if (p.inf) return this;
      if (this.eq(p)) return this.dbl();
      if (this.neg().eq(p)) return this.curve.point(null, null);
      if (0 === this.x.cmp(p.x)) return this.curve.point(null, null);
      var c = this.y.redSub(p.y);
      0 !== c.cmpn(0) && (c = c.redMul(this.x.redSub(p.x).redInvm()));
      var nx = c.redSqr().redISub(this.x).redISub(p.x);
      var ny = c.redMul(this.x.redSub(nx)).redISub(this.y);
      return this.curve.point(nx, ny);
    };
    Point.prototype.dbl = function dbl() {
      if (this.inf) return this;
      var ys1 = this.y.redAdd(this.y);
      if (0 === ys1.cmpn(0)) return this.curve.point(null, null);
      var a = this.curve.a;
      var x2 = this.x.redSqr();
      var dyinv = ys1.redInvm();
      var c = x2.redAdd(x2).redIAdd(x2).redIAdd(a).redMul(dyinv);
      var nx = c.redSqr().redISub(this.x.redAdd(this.x));
      var ny = c.redMul(this.x.redSub(nx)).redISub(this.y);
      return this.curve.point(nx, ny);
    };
    Point.prototype.getX = function getX() {
      return this.x.fromRed();
    };
    Point.prototype.getY = function getY() {
      return this.y.fromRed();
    };
    Point.prototype.mul = function mul(k) {
      k = new BN(k, 16);
      return this._hasDoubles(k) ? this.curve._fixedNafMul(this, k) : this.curve.endo ? this.curve._endoWnafMulAdd([ this ], [ k ]) : this.curve._wnafMul(this, k);
    };
    Point.prototype.mulAdd = function mulAdd(k1, p2, k2) {
      var points = [ this, p2 ];
      var coeffs = [ k1, k2 ];
      return this.curve.endo ? this.curve._endoWnafMulAdd(points, coeffs) : this.curve._wnafMulAdd(1, points, coeffs, 2);
    };
    Point.prototype.jmulAdd = function jmulAdd(k1, p2, k2) {
      var points = [ this, p2 ];
      var coeffs = [ k1, k2 ];
      return this.curve.endo ? this.curve._endoWnafMulAdd(points, coeffs, true) : this.curve._wnafMulAdd(1, points, coeffs, 2, true);
    };
    Point.prototype.eq = function eq(p) {
      return this === p || this.inf === p.inf && (this.inf || 0 === this.x.cmp(p.x) && 0 === this.y.cmp(p.y));
    };
    Point.prototype.neg = function neg(_precompute) {
      if (this.inf) return this;
      var res = this.curve.point(this.x, this.y.redNeg());
      if (_precompute && this.precomputed) {
        var pre = this.precomputed;
        var negate = function(p) {
          return p.neg();
        };
        res.precomputed = {
          naf: pre.naf && {
            wnd: pre.naf.wnd,
            points: pre.naf.points.map(negate)
          },
          doubles: pre.doubles && {
            step: pre.doubles.step,
            points: pre.doubles.points.map(negate)
          }
        };
      }
      return res;
    };
    Point.prototype.toJ = function toJ() {
      if (this.inf) return this.curve.jpoint(null, null, null);
      var res = this.curve.jpoint(this.x, this.y, this.curve.one);
      return res;
    };
    function JPoint(curve, x, y, z) {
      Base.BasePoint.call(this, curve, "jacobian");
      if (null === x && null === y && null === z) {
        this.x = this.curve.one;
        this.y = this.curve.one;
        this.z = new BN(0);
      } else {
        this.x = new BN(x, 16);
        this.y = new BN(y, 16);
        this.z = new BN(z, 16);
      }
      this.x.red || (this.x = this.x.toRed(this.curve.red));
      this.y.red || (this.y = this.y.toRed(this.curve.red));
      this.z.red || (this.z = this.z.toRed(this.curve.red));
      this.zOne = this.z === this.curve.one;
    }
    inherits(JPoint, Base.BasePoint);
    ShortCurve.prototype.jpoint = function jpoint(x, y, z) {
      return new JPoint(this, x, y, z);
    };
    JPoint.prototype.toP = function toP() {
      if (this.isInfinity()) return this.curve.point(null, null);
      var zinv = this.z.redInvm();
      var zinv2 = zinv.redSqr();
      var ax = this.x.redMul(zinv2);
      var ay = this.y.redMul(zinv2).redMul(zinv);
      return this.curve.point(ax, ay);
    };
    JPoint.prototype.neg = function neg() {
      return this.curve.jpoint(this.x, this.y.redNeg(), this.z);
    };
    JPoint.prototype.add = function add(p) {
      if (this.isInfinity()) return p;
      if (p.isInfinity()) return this;
      var pz2 = p.z.redSqr();
      var z2 = this.z.redSqr();
      var u1 = this.x.redMul(pz2);
      var u2 = p.x.redMul(z2);
      var s1 = this.y.redMul(pz2.redMul(p.z));
      var s2 = p.y.redMul(z2.redMul(this.z));
      var h = u1.redSub(u2);
      var r = s1.redSub(s2);
      if (0 === h.cmpn(0)) return 0 !== r.cmpn(0) ? this.curve.jpoint(null, null, null) : this.dbl();
      var h2 = h.redSqr();
      var h3 = h2.redMul(h);
      var v = u1.redMul(h2);
      var nx = r.redSqr().redIAdd(h3).redISub(v).redISub(v);
      var ny = r.redMul(v.redISub(nx)).redISub(s1.redMul(h3));
      var nz = this.z.redMul(p.z).redMul(h);
      return this.curve.jpoint(nx, ny, nz);
    };
    JPoint.prototype.mixedAdd = function mixedAdd(p) {
      if (this.isInfinity()) return p.toJ();
      if (p.isInfinity()) return this;
      var z2 = this.z.redSqr();
      var u1 = this.x;
      var u2 = p.x.redMul(z2);
      var s1 = this.y;
      var s2 = p.y.redMul(z2).redMul(this.z);
      var h = u1.redSub(u2);
      var r = s1.redSub(s2);
      if (0 === h.cmpn(0)) return 0 !== r.cmpn(0) ? this.curve.jpoint(null, null, null) : this.dbl();
      var h2 = h.redSqr();
      var h3 = h2.redMul(h);
      var v = u1.redMul(h2);
      var nx = r.redSqr().redIAdd(h3).redISub(v).redISub(v);
      var ny = r.redMul(v.redISub(nx)).redISub(s1.redMul(h3));
      var nz = this.z.redMul(h);
      return this.curve.jpoint(nx, ny, nz);
    };
    JPoint.prototype.dblp = function dblp(pow) {
      if (0 === pow) return this;
      if (this.isInfinity()) return this;
      if (!pow) return this.dbl();
      if (this.curve.zeroA || this.curve.threeA) {
        var r = this;
        for (var i = 0; i < pow; i++) r = r.dbl();
        return r;
      }
      var a = this.curve.a;
      var tinv = this.curve.tinv;
      var jx = this.x;
      var jy = this.y;
      var jz = this.z;
      var jz4 = jz.redSqr().redSqr();
      var jyd = jy.redAdd(jy);
      for (var i = 0; i < pow; i++) {
        var jx2 = jx.redSqr();
        var jyd2 = jyd.redSqr();
        var jyd4 = jyd2.redSqr();
        var c = jx2.redAdd(jx2).redIAdd(jx2).redIAdd(a.redMul(jz4));
        var t1 = jx.redMul(jyd2);
        var nx = c.redSqr().redISub(t1.redAdd(t1));
        var t2 = t1.redISub(nx);
        var dny = c.redMul(t2);
        dny = dny.redIAdd(dny).redISub(jyd4);
        var nz = jyd.redMul(jz);
        i + 1 < pow && (jz4 = jz4.redMul(jyd4));
        jx = nx;
        jz = nz;
        jyd = dny;
      }
      return this.curve.jpoint(jx, jyd.redMul(tinv), jz);
    };
    JPoint.prototype.dbl = function dbl() {
      if (this.isInfinity()) return this;
      return this.curve.zeroA ? this._zeroDbl() : this.curve.threeA ? this._threeDbl() : this._dbl();
    };
    JPoint.prototype._zeroDbl = function _zeroDbl() {
      var nx;
      var ny;
      var nz;
      if (this.zOne) {
        var xx = this.x.redSqr();
        var yy = this.y.redSqr();
        var yyyy = yy.redSqr();
        var s = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy);
        s = s.redIAdd(s);
        var m = xx.redAdd(xx).redIAdd(xx);
        var t = m.redSqr().redISub(s).redISub(s);
        var yyyy8 = yyyy.redIAdd(yyyy);
        yyyy8 = yyyy8.redIAdd(yyyy8);
        yyyy8 = yyyy8.redIAdd(yyyy8);
        nx = t;
        ny = m.redMul(s.redISub(t)).redISub(yyyy8);
        nz = this.y.redAdd(this.y);
      } else {
        var a = this.x.redSqr();
        var b = this.y.redSqr();
        var c = b.redSqr();
        var d = this.x.redAdd(b).redSqr().redISub(a).redISub(c);
        d = d.redIAdd(d);
        var e = a.redAdd(a).redIAdd(a);
        var f = e.redSqr();
        var c8 = c.redIAdd(c);
        c8 = c8.redIAdd(c8);
        c8 = c8.redIAdd(c8);
        nx = f.redISub(d).redISub(d);
        ny = e.redMul(d.redISub(nx)).redISub(c8);
        nz = this.y.redMul(this.z);
        nz = nz.redIAdd(nz);
      }
      return this.curve.jpoint(nx, ny, nz);
    };
    JPoint.prototype._threeDbl = function _threeDbl() {
      var nx;
      var ny;
      var nz;
      if (this.zOne) {
        var xx = this.x.redSqr();
        var yy = this.y.redSqr();
        var yyyy = yy.redSqr();
        var s = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy);
        s = s.redIAdd(s);
        var m = xx.redAdd(xx).redIAdd(xx).redIAdd(this.curve.a);
        var t = m.redSqr().redISub(s).redISub(s);
        nx = t;
        var yyyy8 = yyyy.redIAdd(yyyy);
        yyyy8 = yyyy8.redIAdd(yyyy8);
        yyyy8 = yyyy8.redIAdd(yyyy8);
        ny = m.redMul(s.redISub(t)).redISub(yyyy8);
        nz = this.y.redAdd(this.y);
      } else {
        var delta = this.z.redSqr();
        var gamma = this.y.redSqr();
        var beta = this.x.redMul(gamma);
        var alpha = this.x.redSub(delta).redMul(this.x.redAdd(delta));
        alpha = alpha.redAdd(alpha).redIAdd(alpha);
        var beta4 = beta.redIAdd(beta);
        beta4 = beta4.redIAdd(beta4);
        var beta8 = beta4.redAdd(beta4);
        nx = alpha.redSqr().redISub(beta8);
        nz = this.y.redAdd(this.z).redSqr().redISub(gamma).redISub(delta);
        var ggamma8 = gamma.redSqr();
        ggamma8 = ggamma8.redIAdd(ggamma8);
        ggamma8 = ggamma8.redIAdd(ggamma8);
        ggamma8 = ggamma8.redIAdd(ggamma8);
        ny = alpha.redMul(beta4.redISub(nx)).redISub(ggamma8);
      }
      return this.curve.jpoint(nx, ny, nz);
    };
    JPoint.prototype._dbl = function _dbl() {
      var a = this.curve.a;
      var jx = this.x;
      var jy = this.y;
      var jz = this.z;
      var jz4 = jz.redSqr().redSqr();
      var jx2 = jx.redSqr();
      var jy2 = jy.redSqr();
      var c = jx2.redAdd(jx2).redIAdd(jx2).redIAdd(a.redMul(jz4));
      var jxd4 = jx.redAdd(jx);
      jxd4 = jxd4.redIAdd(jxd4);
      var t1 = jxd4.redMul(jy2);
      var nx = c.redSqr().redISub(t1.redAdd(t1));
      var t2 = t1.redISub(nx);
      var jyd8 = jy2.redSqr();
      jyd8 = jyd8.redIAdd(jyd8);
      jyd8 = jyd8.redIAdd(jyd8);
      jyd8 = jyd8.redIAdd(jyd8);
      var ny = c.redMul(t2).redISub(jyd8);
      var nz = jy.redAdd(jy).redMul(jz);
      return this.curve.jpoint(nx, ny, nz);
    };
    JPoint.prototype.trpl = function trpl() {
      if (!this.curve.zeroA) return this.dbl().add(this);
      var xx = this.x.redSqr();
      var yy = this.y.redSqr();
      var zz = this.z.redSqr();
      var yyyy = yy.redSqr();
      var m = xx.redAdd(xx).redIAdd(xx);
      var mm = m.redSqr();
      var e = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy);
      e = e.redIAdd(e);
      e = e.redAdd(e).redIAdd(e);
      e = e.redISub(mm);
      var ee = e.redSqr();
      var t = yyyy.redIAdd(yyyy);
      t = t.redIAdd(t);
      t = t.redIAdd(t);
      t = t.redIAdd(t);
      var u = m.redIAdd(e).redSqr().redISub(mm).redISub(ee).redISub(t);
      var yyu4 = yy.redMul(u);
      yyu4 = yyu4.redIAdd(yyu4);
      yyu4 = yyu4.redIAdd(yyu4);
      var nx = this.x.redMul(ee).redISub(yyu4);
      nx = nx.redIAdd(nx);
      nx = nx.redIAdd(nx);
      var ny = this.y.redMul(u.redMul(t.redISub(u)).redISub(e.redMul(ee)));
      ny = ny.redIAdd(ny);
      ny = ny.redIAdd(ny);
      ny = ny.redIAdd(ny);
      var nz = this.z.redAdd(e).redSqr().redISub(zz).redISub(ee);
      return this.curve.jpoint(nx, ny, nz);
    };
    JPoint.prototype.mul = function mul(k, kbase) {
      k = new BN(k, kbase);
      return this.curve._wnafMul(this, k);
    };
    JPoint.prototype.eq = function eq(p) {
      if ("affine" === p.type) return this.eq(p.toJ());
      if (this === p) return true;
      var z2 = this.z.redSqr();
      var pz2 = p.z.redSqr();
      if (0 !== this.x.redMul(pz2).redISub(p.x.redMul(z2)).cmpn(0)) return false;
      var z3 = z2.redMul(this.z);
      var pz3 = pz2.redMul(p.z);
      return 0 === this.y.redMul(pz3).redISub(p.y.redMul(z3)).cmpn(0);
    };
    JPoint.prototype.eqXToP = function eqXToP(x) {
      var zs = this.z.redSqr();
      var rx = x.toRed(this.curve.red).redMul(zs);
      if (0 === this.x.cmp(rx)) return true;
      var xc = x.clone();
      var t = this.curve.redN.redMul(zs);
      for (;;) {
        xc.iadd(this.curve.n);
        if (xc.cmp(this.curve.p) >= 0) return false;
        rx.redIAdd(t);
        if (0 === this.x.cmp(rx)) return true;
      }
      return false;
    };
    JPoint.prototype.inspect = function inspect() {
      if (this.isInfinity()) return "<EC JPoint Infinity>";
      return "<EC JPoint x: " + this.x.toString(16, 2) + " y: " + this.y.toString(16, 2) + " z: " + this.z.toString(16, 2) + ">";
    };
    JPoint.prototype.isInfinity = function isInfinity() {
      return 0 === this.z.cmpn(0);
    };
  }, {
    "../../elliptic": 67,
    "../curve": 70,
    "bn.js": 16,
    inherits: 101
  } ],
  73: [ function(require, module, exports) {
    "use strict";
    var curves = exports;
    var hash = require("hash.js");
    var elliptic = require("../elliptic");
    var assert = elliptic.utils.assert;
    function PresetCurve(options) {
      "short" === options.type ? this.curve = new elliptic.curve.short(options) : "edwards" === options.type ? this.curve = new elliptic.curve.edwards(options) : this.curve = new elliptic.curve.mont(options);
      this.g = this.curve.g;
      this.n = this.curve.n;
      this.hash = options.hash;
      assert(this.g.validate(), "Invalid curve");
      assert(this.g.mul(this.n).isInfinity(), "Invalid curve, G*N != O");
    }
    curves.PresetCurve = PresetCurve;
    function defineCurve(name, options) {
      Object.defineProperty(curves, name, {
        configurable: true,
        enumerable: true,
        get: function() {
          var curve = new PresetCurve(options);
          Object.defineProperty(curves, name, {
            configurable: true,
            enumerable: true,
            value: curve
          });
          return curve;
        }
      });
    }
    defineCurve("p192", {
      type: "short",
      prime: "p192",
      p: "ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff",
      a: "ffffffff ffffffff ffffffff fffffffe ffffffff fffffffc",
      b: "64210519 e59c80e7 0fa7e9ab 72243049 feb8deec c146b9b1",
      n: "ffffffff ffffffff ffffffff 99def836 146bc9b1 b4d22831",
      hash: hash.sha256,
      gRed: false,
      g: [ "188da80e b03090f6 7cbf20eb 43a18800 f4ff0afd 82ff1012", "07192b95 ffc8da78 631011ed 6b24cdd5 73f977a1 1e794811" ]
    });
    defineCurve("p224", {
      type: "short",
      prime: "p224",
      p: "ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001",
      a: "ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff fffffffe",
      b: "b4050a85 0c04b3ab f5413256 5044b0b7 d7bfd8ba 270b3943 2355ffb4",
      n: "ffffffff ffffffff ffffffff ffff16a2 e0b8f03e 13dd2945 5c5c2a3d",
      hash: hash.sha256,
      gRed: false,
      g: [ "b70e0cbd 6bb4bf7f 321390b9 4a03c1d3 56c21122 343280d6 115c1d21", "bd376388 b5f723fb 4c22dfe6 cd4375a0 5a074764 44d58199 85007e34" ]
    });
    defineCurve("p256", {
      type: "short",
      prime: null,
      p: "ffffffff 00000001 00000000 00000000 00000000 ffffffff ffffffff ffffffff",
      a: "ffffffff 00000001 00000000 00000000 00000000 ffffffff ffffffff fffffffc",
      b: "5ac635d8 aa3a93e7 b3ebbd55 769886bc 651d06b0 cc53b0f6 3bce3c3e 27d2604b",
      n: "ffffffff 00000000 ffffffff ffffffff bce6faad a7179e84 f3b9cac2 fc632551",
      hash: hash.sha256,
      gRed: false,
      g: [ "6b17d1f2 e12c4247 f8bce6e5 63a440f2 77037d81 2deb33a0 f4a13945 d898c296", "4fe342e2 fe1a7f9b 8ee7eb4a 7c0f9e16 2bce3357 6b315ece cbb64068 37bf51f5" ]
    });
    defineCurve("p384", {
      type: "short",
      prime: null,
      p: "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe ffffffff 00000000 00000000 ffffffff",
      a: "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe ffffffff 00000000 00000000 fffffffc",
      b: "b3312fa7 e23ee7e4 988e056b e3f82d19 181d9c6e fe814112 0314088f 5013875a c656398d 8a2ed19d 2a85c8ed d3ec2aef",
      n: "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff c7634d81 f4372ddf 581a0db2 48b0a77a ecec196a ccc52973",
      hash: hash.sha384,
      gRed: false,
      g: [ "aa87ca22 be8b0537 8eb1c71e f320ad74 6e1d3b62 8ba79b98 59f741e0 82542a38 5502f25d bf55296c 3a545e38 72760ab7", "3617de4a 96262c6f 5d9e98bf 9292dc29 f8f41dbd 289a147c e9da3113 b5f0b8c0 0a60b1ce 1d7e819d 7a431d7c 90ea0e5f" ]
    });
    defineCurve("p521", {
      type: "short",
      prime: null,
      p: "000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff",
      a: "000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffc",
      b: "00000051 953eb961 8e1c9a1f 929a21a0 b68540ee a2da725b 99b315f3 b8b48991 8ef109e1 56193951 ec7e937b 1652c0bd 3bb1bf07 3573df88 3d2c34f1 ef451fd4 6b503f00",
      n: "000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffa 51868783 bf2f966b 7fcc0148 f709a5d0 3bb5c9b8 899c47ae bb6fb71e 91386409",
      hash: hash.sha512,
      gRed: false,
      g: [ "000000c6 858e06b7 0404e9cd 9e3ecb66 2395b442 9c648139 053fb521 f828af60 6b4d3dba a14b5e77 efe75928 fe1dc127 a2ffa8de 3348b3c1 856a429b f97e7e31 c2e5bd66", "00000118 39296a78 9a3bc004 5c8a5fb4 2c7d1bd9 98f54449 579b4468 17afbd17 273e662c 97ee7299 5ef42640 c550b901 3fad0761 353c7086 a272c240 88be9476 9fd16650" ]
    });
    defineCurve("curve25519", {
      type: "mont",
      prime: "p25519",
      p: "7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed",
      a: "76d06",
      b: "1",
      n: "1000000000000000 0000000000000000 14def9dea2f79cd6 5812631a5cf5d3ed",
      hash: hash.sha256,
      gRed: false,
      g: [ "9" ]
    });
    defineCurve("ed25519", {
      type: "edwards",
      prime: "p25519",
      p: "7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed",
      a: "-1",
      c: "1",
      d: "52036cee2b6ffe73 8cc740797779e898 00700a4d4141d8ab 75eb4dca135978a3",
      n: "1000000000000000 0000000000000000 14def9dea2f79cd6 5812631a5cf5d3ed",
      hash: hash.sha256,
      gRed: false,
      g: [ "216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a", "6666666666666666666666666666666666666666666666666666666666666658" ]
    });
    var pre;
    try {
      pre = require("./precomputed/secp256k1");
    } catch (e) {
      pre = void 0;
    }
    defineCurve("secp256k1", {
      type: "short",
      prime: "k256",
      p: "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f",
      a: "0",
      b: "7",
      n: "ffffffff ffffffff ffffffff fffffffe baaedce6 af48a03b bfd25e8c d0364141",
      h: "1",
      hash: hash.sha256,
      beta: "7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee",
      lambda: "5363ad4cc05c30e0a5261c028812645a122e22ea20816678df02967c1b23bd72",
      basis: [ {
        a: "3086d221a7d46bcde86c90e49284eb15",
        b: "-e4437ed6010e88286f547fa90abfe4c3"
      }, {
        a: "114ca50f7a8e2f3f657c1108d9d44cfd8",
        b: "3086d221a7d46bcde86c90e49284eb15"
      } ],
      gRed: false,
      g: [ "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798", "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8", pre ]
    });
  }, {
    "../elliptic": 67,
    "./precomputed/secp256k1": 80,
    "hash.js": 86
  } ],
  74: [ function(require, module, exports) {
    "use strict";
    var BN = require("bn.js");
    var HmacDRBG = require("hmac-drbg");
    var elliptic = require("../../elliptic");
    var utils = elliptic.utils;
    var assert = utils.assert;
    var KeyPair = require("./key");
    var Signature = require("./signature");
    function EC(options) {
      if (!(this instanceof EC)) return new EC(options);
      if ("string" === typeof options) {
        assert(elliptic.curves.hasOwnProperty(options), "Unknown curve " + options);
        options = elliptic.curves[options];
      }
      options instanceof elliptic.curves.PresetCurve && (options = {
        curve: options
      });
      this.curve = options.curve.curve;
      this.n = this.curve.n;
      this.nh = this.n.ushrn(1);
      this.g = this.curve.g;
      this.g = options.curve.g;
      this.g.precompute(options.curve.n.bitLength() + 1);
      this.hash = options.hash || options.curve.hash;
    }
    module.exports = EC;
    EC.prototype.keyPair = function keyPair(options) {
      return new KeyPair(this, options);
    };
    EC.prototype.keyFromPrivate = function keyFromPrivate(priv, enc) {
      return KeyPair.fromPrivate(this, priv, enc);
    };
    EC.prototype.keyFromPublic = function keyFromPublic(pub, enc) {
      return KeyPair.fromPublic(this, pub, enc);
    };
    EC.prototype.genKeyPair = function genKeyPair(options) {
      options || (options = {});
      var drbg = new HmacDRBG({
        hash: this.hash,
        pers: options.pers,
        persEnc: options.persEnc || "utf8",
        entropy: options.entropy || elliptic.rand(this.hash.hmacStrength),
        entropyEnc: options.entropy && options.entropyEnc || "utf8",
        nonce: this.n.toArray()
      });
      var bytes = this.n.byteLength();
      var ns2 = this.n.sub(new BN(2));
      do {
        var priv = new BN(drbg.generate(bytes));
        if (priv.cmp(ns2) > 0) continue;
        priv.iaddn(1);
        return this.keyFromPrivate(priv);
      } while (true);
    };
    EC.prototype._truncateToN = function truncateToN(msg, truncOnly) {
      var delta = 8 * msg.byteLength() - this.n.bitLength();
      delta > 0 && (msg = msg.ushrn(delta));
      return !truncOnly && msg.cmp(this.n) >= 0 ? msg.sub(this.n) : msg;
    };
    EC.prototype.sign = function sign(msg, key, enc, options) {
      if ("object" === typeof enc) {
        options = enc;
        enc = null;
      }
      options || (options = {});
      key = this.keyFromPrivate(key, enc);
      msg = this._truncateToN(new BN(msg, 16));
      var bytes = this.n.byteLength();
      var bkey = key.getPrivate().toArray("be", bytes);
      var nonce = msg.toArray("be", bytes);
      var drbg = new HmacDRBG({
        hash: this.hash,
        entropy: bkey,
        nonce: nonce,
        pers: options.pers,
        persEnc: options.persEnc || "utf8"
      });
      var ns1 = this.n.sub(new BN(1));
      for (var iter = 0; true; iter++) {
        var k = options.k ? options.k(iter) : new BN(drbg.generate(this.n.byteLength()));
        k = this._truncateToN(k, true);
        if (k.cmpn(1) <= 0 || k.cmp(ns1) >= 0) continue;
        var kp = this.g.mul(k);
        if (kp.isInfinity()) continue;
        var kpX = kp.getX();
        var r = kpX.umod(this.n);
        if (0 === r.cmpn(0)) continue;
        var s = k.invm(this.n).mul(r.mul(key.getPrivate()).iadd(msg));
        s = s.umod(this.n);
        if (0 === s.cmpn(0)) continue;
        var recoveryParam = (kp.getY().isOdd() ? 1 : 0) | (0 !== kpX.cmp(r) ? 2 : 0);
        if (options.canonical && s.cmp(this.nh) > 0) {
          s = this.n.sub(s);
          recoveryParam ^= 1;
        }
        return new Signature({
          r: r,
          s: s,
          recoveryParam: recoveryParam
        });
      }
    };
    EC.prototype.verify = function verify(msg, signature, key, enc) {
      msg = this._truncateToN(new BN(msg, 16));
      key = this.keyFromPublic(key, enc);
      signature = new Signature(signature, "hex");
      var r = signature.r;
      var s = signature.s;
      if (r.cmpn(1) < 0 || r.cmp(this.n) >= 0) return false;
      if (s.cmpn(1) < 0 || s.cmp(this.n) >= 0) return false;
      var sinv = s.invm(this.n);
      var u1 = sinv.mul(msg).umod(this.n);
      var u2 = sinv.mul(r).umod(this.n);
      if (!this.curve._maxwellTrick) {
        var p = this.g.mulAdd(u1, key.getPublic(), u2);
        if (p.isInfinity()) return false;
        return 0 === p.getX().umod(this.n).cmp(r);
      }
      var p = this.g.jmulAdd(u1, key.getPublic(), u2);
      if (p.isInfinity()) return false;
      return p.eqXToP(r);
    };
    EC.prototype.recoverPubKey = function(msg, signature, j, enc) {
      assert((3 & j) === j, "The recovery param is more than two bits");
      signature = new Signature(signature, enc);
      var n = this.n;
      var e = new BN(msg);
      var r = signature.r;
      var s = signature.s;
      var isYOdd = 1 & j;
      var isSecondKey = j >> 1;
      if (r.cmp(this.curve.p.umod(this.curve.n)) >= 0 && isSecondKey) throw new Error("Unable to find sencond key candinate");
      r = isSecondKey ? this.curve.pointFromX(r.add(this.curve.n), isYOdd) : this.curve.pointFromX(r, isYOdd);
      var rInv = signature.r.invm(n);
      var s1 = n.sub(e).mul(rInv).umod(n);
      var s2 = s.mul(rInv).umod(n);
      return this.g.mulAdd(s1, r, s2);
    };
    EC.prototype.getKeyRecoveryParam = function(e, signature, Q, enc) {
      signature = new Signature(signature, enc);
      if (null !== signature.recoveryParam) return signature.recoveryParam;
      for (var i = 0; i < 4; i++) {
        var Qprime;
        try {
          Qprime = this.recoverPubKey(e, signature, i);
        } catch (e) {
          continue;
        }
        if (Qprime.eq(Q)) return i;
      }
      throw new Error("Unable to find valid recovery factor");
    };
  }, {
    "../../elliptic": 67,
    "./key": 75,
    "./signature": 76,
    "bn.js": 16,
    "hmac-drbg": 98
  } ],
  75: [ function(require, module, exports) {
    "use strict";
    var BN = require("bn.js");
    var elliptic = require("../../elliptic");
    var utils = elliptic.utils;
    var assert = utils.assert;
    function KeyPair(ec, options) {
      this.ec = ec;
      this.priv = null;
      this.pub = null;
      options.priv && this._importPrivate(options.priv, options.privEnc);
      options.pub && this._importPublic(options.pub, options.pubEnc);
    }
    module.exports = KeyPair;
    KeyPair.fromPublic = function fromPublic(ec, pub, enc) {
      if (pub instanceof KeyPair) return pub;
      return new KeyPair(ec, {
        pub: pub,
        pubEnc: enc
      });
    };
    KeyPair.fromPrivate = function fromPrivate(ec, priv, enc) {
      if (priv instanceof KeyPair) return priv;
      return new KeyPair(ec, {
        priv: priv,
        privEnc: enc
      });
    };
    KeyPair.prototype.validate = function validate() {
      var pub = this.getPublic();
      if (pub.isInfinity()) return {
        result: false,
        reason: "Invalid public key"
      };
      if (!pub.validate()) return {
        result: false,
        reason: "Public key is not a point"
      };
      if (!pub.mul(this.ec.curve.n).isInfinity()) return {
        result: false,
        reason: "Public key * N != O"
      };
      return {
        result: true,
        reason: null
      };
    };
    KeyPair.prototype.getPublic = function getPublic(compact, enc) {
      if ("string" === typeof compact) {
        enc = compact;
        compact = null;
      }
      this.pub || (this.pub = this.ec.g.mul(this.priv));
      if (!enc) return this.pub;
      return this.pub.encode(enc, compact);
    };
    KeyPair.prototype.getPrivate = function getPrivate(enc) {
      return "hex" === enc ? this.priv.toString(16, 2) : this.priv;
    };
    KeyPair.prototype._importPrivate = function _importPrivate(key, enc) {
      this.priv = new BN(key, enc || 16);
      this.priv = this.priv.umod(this.ec.curve.n);
    };
    KeyPair.prototype._importPublic = function _importPublic(key, enc) {
      if (key.x || key.y) {
        "mont" === this.ec.curve.type ? assert(key.x, "Need x coordinate") : "short" !== this.ec.curve.type && "edwards" !== this.ec.curve.type || assert(key.x && key.y, "Need both x and y coordinate");
        this.pub = this.ec.curve.point(key.x, key.y);
        return;
      }
      this.pub = this.ec.curve.decodePoint(key, enc);
    };
    KeyPair.prototype.derive = function derive(pub) {
      return pub.mul(this.priv).getX();
    };
    KeyPair.prototype.sign = function sign(msg, enc, options) {
      return this.ec.sign(msg, this, enc, options);
    };
    KeyPair.prototype.verify = function verify(msg, signature) {
      return this.ec.verify(msg, signature, this);
    };
    KeyPair.prototype.inspect = function inspect() {
      return "<Key priv: " + (this.priv && this.priv.toString(16, 2)) + " pub: " + (this.pub && this.pub.inspect()) + " >";
    };
  }, {
    "../../elliptic": 67,
    "bn.js": 16
  } ],
  76: [ function(require, module, exports) {
    "use strict";
    var BN = require("bn.js");
    var elliptic = require("../../elliptic");
    var utils = elliptic.utils;
    var assert = utils.assert;
    function Signature(options, enc) {
      if (options instanceof Signature) return options;
      if (this._importDER(options, enc)) return;
      assert(options.r && options.s, "Signature without r or s");
      this.r = new BN(options.r, 16);
      this.s = new BN(options.s, 16);
      void 0 === options.recoveryParam ? this.recoveryParam = null : this.recoveryParam = options.recoveryParam;
    }
    module.exports = Signature;
    function Position() {
      this.place = 0;
    }
    function getLength(buf, p) {
      var initial = buf[p.place++];
      if (!(128 & initial)) return initial;
      var octetLen = 15 & initial;
      var val = 0;
      for (var i = 0, off = p.place; i < octetLen; i++, off++) {
        val <<= 8;
        val |= buf[off];
      }
      p.place = off;
      return val;
    }
    function rmPadding(buf) {
      var i = 0;
      var len = buf.length - 1;
      while (!buf[i] && !(128 & buf[i + 1]) && i < len) i++;
      if (0 === i) return buf;
      return buf.slice(i);
    }
    Signature.prototype._importDER = function _importDER(data, enc) {
      data = utils.toArray(data, enc);
      var p = new Position();
      if (48 !== data[p.place++]) return false;
      var len = getLength(data, p);
      if (len + p.place !== data.length) return false;
      if (2 !== data[p.place++]) return false;
      var rlen = getLength(data, p);
      var r = data.slice(p.place, rlen + p.place);
      p.place += rlen;
      if (2 !== data[p.place++]) return false;
      var slen = getLength(data, p);
      if (data.length !== slen + p.place) return false;
      var s = data.slice(p.place, slen + p.place);
      0 === r[0] && 128 & r[1] && (r = r.slice(1));
      0 === s[0] && 128 & s[1] && (s = s.slice(1));
      this.r = new BN(r);
      this.s = new BN(s);
      this.recoveryParam = null;
      return true;
    };
    function constructLength(arr, len) {
      if (len < 128) {
        arr.push(len);
        return;
      }
      var octets = 1 + (Math.log(len) / Math.LN2 >>> 3);
      arr.push(128 | octets);
      while (--octets) arr.push(len >>> (octets << 3) & 255);
      arr.push(len);
    }
    Signature.prototype.toDER = function toDER(enc) {
      var r = this.r.toArray();
      var s = this.s.toArray();
      128 & r[0] && (r = [ 0 ].concat(r));
      128 & s[0] && (s = [ 0 ].concat(s));
      r = rmPadding(r);
      s = rmPadding(s);
      while (!s[0] && !(128 & s[1])) s = s.slice(1);
      var arr = [ 2 ];
      constructLength(arr, r.length);
      arr = arr.concat(r);
      arr.push(2);
      constructLength(arr, s.length);
      var backHalf = arr.concat(s);
      var res = [ 48 ];
      constructLength(res, backHalf.length);
      res = res.concat(backHalf);
      return utils.encode(res, enc);
    };
  }, {
    "../../elliptic": 67,
    "bn.js": 16
  } ],
  77: [ function(require, module, exports) {
    "use strict";
    var hash = require("hash.js");
    var elliptic = require("../../elliptic");
    var utils = elliptic.utils;
    var assert = utils.assert;
    var parseBytes = utils.parseBytes;
    var KeyPair = require("./key");
    var Signature = require("./signature");
    function EDDSA(curve) {
      assert("ed25519" === curve, "only tested with ed25519 so far");
      if (!(this instanceof EDDSA)) return new EDDSA(curve);
      var curve = elliptic.curves[curve].curve;
      this.curve = curve;
      this.g = curve.g;
      this.g.precompute(curve.n.bitLength() + 1);
      this.pointClass = curve.point().constructor;
      this.encodingLength = Math.ceil(curve.n.bitLength() / 8);
      this.hash = hash.sha512;
    }
    module.exports = EDDSA;
    EDDSA.prototype.sign = function sign(message, secret) {
      message = parseBytes(message);
      var key = this.keyFromSecret(secret);
      var r = this.hashInt(key.messagePrefix(), message);
      var R = this.g.mul(r);
      var Rencoded = this.encodePoint(R);
      var s_ = this.hashInt(Rencoded, key.pubBytes(), message).mul(key.priv());
      var S = r.add(s_).umod(this.curve.n);
      return this.makeSignature({
        R: R,
        S: S,
        Rencoded: Rencoded
      });
    };
    EDDSA.prototype.verify = function verify(message, sig, pub) {
      message = parseBytes(message);
      sig = this.makeSignature(sig);
      var key = this.keyFromPublic(pub);
      var h = this.hashInt(sig.Rencoded(), key.pubBytes(), message);
      var SG = this.g.mul(sig.S());
      var RplusAh = sig.R().add(key.pub().mul(h));
      return RplusAh.eq(SG);
    };
    EDDSA.prototype.hashInt = function hashInt() {
      var hash = this.hash();
      for (var i = 0; i < arguments.length; i++) hash.update(arguments[i]);
      return utils.intFromLE(hash.digest()).umod(this.curve.n);
    };
    EDDSA.prototype.keyFromPublic = function keyFromPublic(pub) {
      return KeyPair.fromPublic(this, pub);
    };
    EDDSA.prototype.keyFromSecret = function keyFromSecret(secret) {
      return KeyPair.fromSecret(this, secret);
    };
    EDDSA.prototype.makeSignature = function makeSignature(sig) {
      if (sig instanceof Signature) return sig;
      return new Signature(this, sig);
    };
    EDDSA.prototype.encodePoint = function encodePoint(point) {
      var enc = point.getY().toArray("le", this.encodingLength);
      enc[this.encodingLength - 1] |= point.getX().isOdd() ? 128 : 0;
      return enc;
    };
    EDDSA.prototype.decodePoint = function decodePoint(bytes) {
      bytes = utils.parseBytes(bytes);
      var lastIx = bytes.length - 1;
      var normed = bytes.slice(0, lastIx).concat(-129 & bytes[lastIx]);
      var xIsOdd = 0 !== (128 & bytes[lastIx]);
      var y = utils.intFromLE(normed);
      return this.curve.pointFromY(y, xIsOdd);
    };
    EDDSA.prototype.encodeInt = function encodeInt(num) {
      return num.toArray("le", this.encodingLength);
    };
    EDDSA.prototype.decodeInt = function decodeInt(bytes) {
      return utils.intFromLE(bytes);
    };
    EDDSA.prototype.isPoint = function isPoint(val) {
      return val instanceof this.pointClass;
    };
  }, {
    "../../elliptic": 67,
    "./key": 78,
    "./signature": 79,
    "hash.js": 86
  } ],
  78: [ function(require, module, exports) {
    "use strict";
    var elliptic = require("../../elliptic");
    var utils = elliptic.utils;
    var assert = utils.assert;
    var parseBytes = utils.parseBytes;
    var cachedProperty = utils.cachedProperty;
    function KeyPair(eddsa, params) {
      this.eddsa = eddsa;
      this._secret = parseBytes(params.secret);
      eddsa.isPoint(params.pub) ? this._pub = params.pub : this._pubBytes = parseBytes(params.pub);
    }
    KeyPair.fromPublic = function fromPublic(eddsa, pub) {
      if (pub instanceof KeyPair) return pub;
      return new KeyPair(eddsa, {
        pub: pub
      });
    };
    KeyPair.fromSecret = function fromSecret(eddsa, secret) {
      if (secret instanceof KeyPair) return secret;
      return new KeyPair(eddsa, {
        secret: secret
      });
    };
    KeyPair.prototype.secret = function secret() {
      return this._secret;
    };
    cachedProperty(KeyPair, "pubBytes", function pubBytes() {
      return this.eddsa.encodePoint(this.pub());
    });
    cachedProperty(KeyPair, "pub", function pub() {
      if (this._pubBytes) return this.eddsa.decodePoint(this._pubBytes);
      return this.eddsa.g.mul(this.priv());
    });
    cachedProperty(KeyPair, "privBytes", function privBytes() {
      var eddsa = this.eddsa;
      var hash = this.hash();
      var lastIx = eddsa.encodingLength - 1;
      var a = hash.slice(0, eddsa.encodingLength);
      a[0] &= 248;
      a[lastIx] &= 127;
      a[lastIx] |= 64;
      return a;
    });
    cachedProperty(KeyPair, "priv", function priv() {
      return this.eddsa.decodeInt(this.privBytes());
    });
    cachedProperty(KeyPair, "hash", function hash() {
      return this.eddsa.hash().update(this.secret()).digest();
    });
    cachedProperty(KeyPair, "messagePrefix", function messagePrefix() {
      return this.hash().slice(this.eddsa.encodingLength);
    });
    KeyPair.prototype.sign = function sign(message) {
      assert(this._secret, "KeyPair can only verify");
      return this.eddsa.sign(message, this);
    };
    KeyPair.prototype.verify = function verify(message, sig) {
      return this.eddsa.verify(message, sig, this);
    };
    KeyPair.prototype.getSecret = function getSecret(enc) {
      assert(this._secret, "KeyPair is public only");
      return utils.encode(this.secret(), enc);
    };
    KeyPair.prototype.getPublic = function getPublic(enc) {
      return utils.encode(this.pubBytes(), enc);
    };
    module.exports = KeyPair;
  }, {
    "../../elliptic": 67
  } ],
  79: [ function(require, module, exports) {
    "use strict";
    var BN = require("bn.js");
    var elliptic = require("../../elliptic");
    var utils = elliptic.utils;
    var assert = utils.assert;
    var cachedProperty = utils.cachedProperty;
    var parseBytes = utils.parseBytes;
    function Signature(eddsa, sig) {
      this.eddsa = eddsa;
      "object" !== typeof sig && (sig = parseBytes(sig));
      Array.isArray(sig) && (sig = {
        R: sig.slice(0, eddsa.encodingLength),
        S: sig.slice(eddsa.encodingLength)
      });
      assert(sig.R && sig.S, "Signature without R or S");
      eddsa.isPoint(sig.R) && (this._R = sig.R);
      sig.S instanceof BN && (this._S = sig.S);
      this._Rencoded = Array.isArray(sig.R) ? sig.R : sig.Rencoded;
      this._Sencoded = Array.isArray(sig.S) ? sig.S : sig.Sencoded;
    }
    cachedProperty(Signature, "S", function S() {
      return this.eddsa.decodeInt(this.Sencoded());
    });
    cachedProperty(Signature, "R", function R() {
      return this.eddsa.decodePoint(this.Rencoded());
    });
    cachedProperty(Signature, "Rencoded", function Rencoded() {
      return this.eddsa.encodePoint(this.R());
    });
    cachedProperty(Signature, "Sencoded", function Sencoded() {
      return this.eddsa.encodeInt(this.S());
    });
    Signature.prototype.toBytes = function toBytes() {
      return this.Rencoded().concat(this.Sencoded());
    };
    Signature.prototype.toHex = function toHex() {
      return utils.encode(this.toBytes(), "hex").toUpperCase();
    };
    module.exports = Signature;
  }, {
    "../../elliptic": 67,
    "bn.js": 16
  } ],
  80: [ function(require, module, exports) {
    module.exports = {
      doubles: {
        step: 4,
        points: [ [ "e60fce93b59e9ec53011aabc21c23e97b2a31369b87a5ae9c44ee89e2a6dec0a", "f7e3507399e595929db99f34f57937101296891e44d23f0be1f32cce69616821" ], [ "8282263212c609d9ea2a6e3e172de238d8c39cabd5ac1ca10646e23fd5f51508", "11f8a8098557dfe45e8256e830b60ace62d613ac2f7b17bed31b6eaff6e26caf" ], [ "175e159f728b865a72f99cc6c6fc846de0b93833fd2222ed73fce5b551e5b739", "d3506e0d9e3c79eba4ef97a51ff71f5eacb5955add24345c6efa6ffee9fed695" ], [ "363d90d447b00c9c99ceac05b6262ee053441c7e55552ffe526bad8f83ff4640", "4e273adfc732221953b445397f3363145b9a89008199ecb62003c7f3bee9de9" ], [ "8b4b5f165df3c2be8c6244b5b745638843e4a781a15bcd1b69f79a55dffdf80c", "4aad0a6f68d308b4b3fbd7813ab0da04f9e336546162ee56b3eff0c65fd4fd36" ], [ "723cbaa6e5db996d6bf771c00bd548c7b700dbffa6c0e77bcb6115925232fcda", "96e867b5595cc498a921137488824d6e2660a0653779494801dc069d9eb39f5f" ], [ "eebfa4d493bebf98ba5feec812c2d3b50947961237a919839a533eca0e7dd7fa", "5d9a8ca3970ef0f269ee7edaf178089d9ae4cdc3a711f712ddfd4fdae1de8999" ], [ "100f44da696e71672791d0a09b7bde459f1215a29b3c03bfefd7835b39a48db0", "cdd9e13192a00b772ec8f3300c090666b7ff4a18ff5195ac0fbd5cd62bc65a09" ], [ "e1031be262c7ed1b1dc9227a4a04c017a77f8d4464f3b3852c8acde6e534fd2d", "9d7061928940405e6bb6a4176597535af292dd419e1ced79a44f18f29456a00d" ], [ "feea6cae46d55b530ac2839f143bd7ec5cf8b266a41d6af52d5e688d9094696d", "e57c6b6c97dce1bab06e4e12bf3ecd5c981c8957cc41442d3155debf18090088" ], [ "da67a91d91049cdcb367be4be6ffca3cfeed657d808583de33fa978bc1ec6cb1", "9bacaa35481642bc41f463f7ec9780e5dec7adc508f740a17e9ea8e27a68be1d" ], [ "53904faa0b334cdda6e000935ef22151ec08d0f7bb11069f57545ccc1a37b7c0", "5bc087d0bc80106d88c9eccac20d3c1c13999981e14434699dcb096b022771c8" ], [ "8e7bcd0bd35983a7719cca7764ca906779b53a043a9b8bcaeff959f43ad86047", "10b7770b2a3da4b3940310420ca9514579e88e2e47fd68b3ea10047e8460372a" ], [ "385eed34c1cdff21e6d0818689b81bde71a7f4f18397e6690a841e1599c43862", "283bebc3e8ea23f56701de19e9ebf4576b304eec2086dc8cc0458fe5542e5453" ], [ "6f9d9b803ecf191637c73a4413dfa180fddf84a5947fbc9c606ed86c3fac3a7", "7c80c68e603059ba69b8e2a30e45c4d47ea4dd2f5c281002d86890603a842160" ], [ "3322d401243c4e2582a2147c104d6ecbf774d163db0f5e5313b7e0e742d0e6bd", "56e70797e9664ef5bfb019bc4ddaf9b72805f63ea2873af624f3a2e96c28b2a0" ], [ "85672c7d2de0b7da2bd1770d89665868741b3f9af7643397721d74d28134ab83", "7c481b9b5b43b2eb6374049bfa62c2e5e77f17fcc5298f44c8e3094f790313a6" ], [ "948bf809b1988a46b06c9f1919413b10f9226c60f668832ffd959af60c82a0a", "53a562856dcb6646dc6b74c5d1c3418c6d4dff08c97cd2bed4cb7f88d8c8e589" ], [ "6260ce7f461801c34f067ce0f02873a8f1b0e44dfc69752accecd819f38fd8e8", "bc2da82b6fa5b571a7f09049776a1ef7ecd292238051c198c1a84e95b2b4ae17" ], [ "e5037de0afc1d8d43d8348414bbf4103043ec8f575bfdc432953cc8d2037fa2d", "4571534baa94d3b5f9f98d09fb990bddbd5f5b03ec481f10e0e5dc841d755bda" ], [ "e06372b0f4a207adf5ea905e8f1771b4e7e8dbd1c6a6c5b725866a0ae4fce725", "7a908974bce18cfe12a27bb2ad5a488cd7484a7787104870b27034f94eee31dd" ], [ "213c7a715cd5d45358d0bbf9dc0ce02204b10bdde2a3f58540ad6908d0559754", "4b6dad0b5ae462507013ad06245ba190bb4850f5f36a7eeddff2c27534b458f2" ], [ "4e7c272a7af4b34e8dbb9352a5419a87e2838c70adc62cddf0cc3a3b08fbd53c", "17749c766c9d0b18e16fd09f6def681b530b9614bff7dd33e0b3941817dcaae6" ], [ "fea74e3dbe778b1b10f238ad61686aa5c76e3db2be43057632427e2840fb27b6", "6e0568db9b0b13297cf674deccb6af93126b596b973f7b77701d3db7f23cb96f" ], [ "76e64113f677cf0e10a2570d599968d31544e179b760432952c02a4417bdde39", "c90ddf8dee4e95cf577066d70681f0d35e2a33d2b56d2032b4b1752d1901ac01" ], [ "c738c56b03b2abe1e8281baa743f8f9a8f7cc643df26cbee3ab150242bcbb891", "893fb578951ad2537f718f2eacbfbbbb82314eef7880cfe917e735d9699a84c3" ], [ "d895626548b65b81e264c7637c972877d1d72e5f3a925014372e9f6588f6c14b", "febfaa38f2bc7eae728ec60818c340eb03428d632bb067e179363ed75d7d991f" ], [ "b8da94032a957518eb0f6433571e8761ceffc73693e84edd49150a564f676e03", "2804dfa44805a1e4d7c99cc9762808b092cc584d95ff3b511488e4e74efdf6e7" ], [ "e80fea14441fb33a7d8adab9475d7fab2019effb5156a792f1a11778e3c0df5d", "eed1de7f638e00771e89768ca3ca94472d155e80af322ea9fcb4291b6ac9ec78" ], [ "a301697bdfcd704313ba48e51d567543f2a182031efd6915ddc07bbcc4e16070", "7370f91cfb67e4f5081809fa25d40f9b1735dbf7c0a11a130c0d1a041e177ea1" ], [ "90ad85b389d6b936463f9d0512678de208cc330b11307fffab7ac63e3fb04ed4", "e507a3620a38261affdcbd9427222b839aefabe1582894d991d4d48cb6ef150" ], [ "8f68b9d2f63b5f339239c1ad981f162ee88c5678723ea3351b7b444c9ec4c0da", "662a9f2dba063986de1d90c2b6be215dbbea2cfe95510bfdf23cbf79501fff82" ], [ "e4f3fb0176af85d65ff99ff9198c36091f48e86503681e3e6686fd5053231e11", "1e63633ad0ef4f1c1661a6d0ea02b7286cc7e74ec951d1c9822c38576feb73bc" ], [ "8c00fa9b18ebf331eb961537a45a4266c7034f2f0d4e1d0716fb6eae20eae29e", "efa47267fea521a1a9dc343a3736c974c2fadafa81e36c54e7d2a4c66702414b" ], [ "e7a26ce69dd4829f3e10cec0a9e98ed3143d084f308b92c0997fddfc60cb3e41", "2a758e300fa7984b471b006a1aafbb18d0a6b2c0420e83e20e8a9421cf2cfd51" ], [ "b6459e0ee3662ec8d23540c223bcbdc571cbcb967d79424f3cf29eb3de6b80ef", "67c876d06f3e06de1dadf16e5661db3c4b3ae6d48e35b2ff30bf0b61a71ba45" ], [ "d68a80c8280bb840793234aa118f06231d6f1fc67e73c5a5deda0f5b496943e8", "db8ba9fff4b586d00c4b1f9177b0e28b5b0e7b8f7845295a294c84266b133120" ], [ "324aed7df65c804252dc0270907a30b09612aeb973449cea4095980fc28d3d5d", "648a365774b61f2ff130c0c35aec1f4f19213b0c7e332843967224af96ab7c84" ], [ "4df9c14919cde61f6d51dfdbe5fee5dceec4143ba8d1ca888e8bd373fd054c96", "35ec51092d8728050974c23a1d85d4b5d506cdc288490192ebac06cad10d5d" ], [ "9c3919a84a474870faed8a9c1cc66021523489054d7f0308cbfc99c8ac1f98cd", "ddb84f0f4a4ddd57584f044bf260e641905326f76c64c8e6be7e5e03d4fc599d" ], [ "6057170b1dd12fdf8de05f281d8e06bb91e1493a8b91d4cc5a21382120a959e5", "9a1af0b26a6a4807add9a2daf71df262465152bc3ee24c65e899be932385a2a8" ], [ "a576df8e23a08411421439a4518da31880cef0fba7d4df12b1a6973eecb94266", "40a6bf20e76640b2c92b97afe58cd82c432e10a7f514d9f3ee8be11ae1b28ec8" ], [ "7778a78c28dec3e30a05fe9629de8c38bb30d1f5cf9a3a208f763889be58ad71", "34626d9ab5a5b22ff7098e12f2ff580087b38411ff24ac563b513fc1fd9f43ac" ], [ "928955ee637a84463729fd30e7afd2ed5f96274e5ad7e5cb09eda9c06d903ac", "c25621003d3f42a827b78a13093a95eeac3d26efa8a8d83fc5180e935bcd091f" ], [ "85d0fef3ec6db109399064f3a0e3b2855645b4a907ad354527aae75163d82751", "1f03648413a38c0be29d496e582cf5663e8751e96877331582c237a24eb1f962" ], [ "ff2b0dce97eece97c1c9b6041798b85dfdfb6d8882da20308f5404824526087e", "493d13fef524ba188af4c4dc54d07936c7b7ed6fb90e2ceb2c951e01f0c29907" ], [ "827fbbe4b1e880ea9ed2b2e6301b212b57f1ee148cd6dd28780e5e2cf856e241", "c60f9c923c727b0b71bef2c67d1d12687ff7a63186903166d605b68baec293ec" ], [ "eaa649f21f51bdbae7be4ae34ce6e5217a58fdce7f47f9aa7f3b58fa2120e2b3", "be3279ed5bbbb03ac69a80f89879aa5a01a6b965f13f7e59d47a5305ba5ad93d" ], [ "e4a42d43c5cf169d9391df6decf42ee541b6d8f0c9a137401e23632dda34d24f", "4d9f92e716d1c73526fc99ccfb8ad34ce886eedfa8d8e4f13a7f7131deba9414" ], [ "1ec80fef360cbdd954160fadab352b6b92b53576a88fea4947173b9d4300bf19", "aeefe93756b5340d2f3a4958a7abbf5e0146e77f6295a07b671cdc1cc107cefd" ], [ "146a778c04670c2f91b00af4680dfa8bce3490717d58ba889ddb5928366642be", "b318e0ec3354028add669827f9d4b2870aaa971d2f7e5ed1d0b297483d83efd0" ], [ "fa50c0f61d22e5f07e3acebb1aa07b128d0012209a28b9776d76a8793180eef9", "6b84c6922397eba9b72cd2872281a68a5e683293a57a213b38cd8d7d3f4f2811" ], [ "da1d61d0ca721a11b1a5bf6b7d88e8421a288ab5d5bba5220e53d32b5f067ec2", "8157f55a7c99306c79c0766161c91e2966a73899d279b48a655fba0f1ad836f1" ], [ "a8e282ff0c9706907215ff98e8fd416615311de0446f1e062a73b0610d064e13", "7f97355b8db81c09abfb7f3c5b2515888b679a3e50dd6bd6cef7c73111f4cc0c" ], [ "174a53b9c9a285872d39e56e6913cab15d59b1fa512508c022f382de8319497c", "ccc9dc37abfc9c1657b4155f2c47f9e6646b3a1d8cb9854383da13ac079afa73" ], [ "959396981943785c3d3e57edf5018cdbe039e730e4918b3d884fdff09475b7ba", "2e7e552888c331dd8ba0386a4b9cd6849c653f64c8709385e9b8abf87524f2fd" ], [ "d2a63a50ae401e56d645a1153b109a8fcca0a43d561fba2dbb51340c9d82b151", "e82d86fb6443fcb7565aee58b2948220a70f750af484ca52d4142174dcf89405" ], [ "64587e2335471eb890ee7896d7cfdc866bacbdbd3839317b3436f9b45617e073", "d99fcdd5bf6902e2ae96dd6447c299a185b90a39133aeab358299e5e9faf6589" ], [ "8481bde0e4e4d885b3a546d3e549de042f0aa6cea250e7fd358d6c86dd45e458", "38ee7b8cba5404dd84a25bf39cecb2ca900a79c42b262e556d64b1b59779057e" ], [ "13464a57a78102aa62b6979ae817f4637ffcfed3c4b1ce30bcd6303f6caf666b", "69be159004614580ef7e433453ccb0ca48f300a81d0942e13f495a907f6ecc27" ], [ "bc4a9df5b713fe2e9aef430bcc1dc97a0cd9ccede2f28588cada3a0d2d83f366", "d3a81ca6e785c06383937adf4b798caa6e8a9fbfa547b16d758d666581f33c1" ], [ "8c28a97bf8298bc0d23d8c749452a32e694b65e30a9472a3954ab30fe5324caa", "40a30463a3305193378fedf31f7cc0eb7ae784f0451cb9459e71dc73cbef9482" ], [ "8ea9666139527a8c1dd94ce4f071fd23c8b350c5a4bb33748c4ba111faccae0", "620efabbc8ee2782e24e7c0cfb95c5d735b783be9cf0f8e955af34a30e62b945" ], [ "dd3625faef5ba06074669716bbd3788d89bdde815959968092f76cc4eb9a9787", "7a188fa3520e30d461da2501045731ca941461982883395937f68d00c644a573" ], [ "f710d79d9eb962297e4f6232b40e8f7feb2bc63814614d692c12de752408221e", "ea98e67232d3b3295d3b535532115ccac8612c721851617526ae47a9c77bfc82" ] ]
      },
      naf: {
        wnd: 7,
        points: [ [ "f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9", "388f7b0f632de8140fe337e62a37f3566500a99934c2231b6cb9fd7584b8e672" ], [ "2f8bde4d1a07209355b4a7250a5c5128e88b84bddc619ab7cba8d569b240efe4", "d8ac222636e5e3d6d4dba9dda6c9c426f788271bab0d6840dca87d3aa6ac62d6" ], [ "5cbdf0646e5db4eaa398f365f2ea7a0e3d419b7e0330e39ce92bddedcac4f9bc", "6aebca40ba255960a3178d6d861a54dba813d0b813fde7b5a5082628087264da" ], [ "acd484e2f0c7f65309ad178a9f559abde09796974c57e714c35f110dfc27ccbe", "cc338921b0a7d9fd64380971763b61e9add888a4375f8e0f05cc262ac64f9c37" ], [ "774ae7f858a9411e5ef4246b70c65aac5649980be5c17891bbec17895da008cb", "d984a032eb6b5e190243dd56d7b7b365372db1e2dff9d6a8301d74c9c953c61b" ], [ "f28773c2d975288bc7d1d205c3748651b075fbc6610e58cddeeddf8f19405aa8", "ab0902e8d880a89758212eb65cdaf473a1a06da521fa91f29b5cb52db03ed81" ], [ "d7924d4f7d43ea965a465ae3095ff41131e5946f3c85f79e44adbcf8e27e080e", "581e2872a86c72a683842ec228cc6defea40af2bd896d3a5c504dc9ff6a26b58" ], [ "defdea4cdb677750a420fee807eacf21eb9898ae79b9768766e4faa04a2d4a34", "4211ab0694635168e997b0ead2a93daeced1f4a04a95c0f6cfb199f69e56eb77" ], [ "2b4ea0a797a443d293ef5cff444f4979f06acfebd7e86d277475656138385b6c", "85e89bc037945d93b343083b5a1c86131a01f60c50269763b570c854e5c09b7a" ], [ "352bbf4a4cdd12564f93fa332ce333301d9ad40271f8107181340aef25be59d5", "321eb4075348f534d59c18259dda3e1f4a1b3b2e71b1039c67bd3d8bcf81998c" ], [ "2fa2104d6b38d11b0230010559879124e42ab8dfeff5ff29dc9cdadd4ecacc3f", "2de1068295dd865b64569335bd5dd80181d70ecfc882648423ba76b532b7d67" ], [ "9248279b09b4d68dab21a9b066edda83263c3d84e09572e269ca0cd7f5453714", "73016f7bf234aade5d1aa71bdea2b1ff3fc0de2a887912ffe54a32ce97cb3402" ], [ "daed4f2be3a8bf278e70132fb0beb7522f570e144bf615c07e996d443dee8729", "a69dce4a7d6c98e8d4a1aca87ef8d7003f83c230f3afa726ab40e52290be1c55" ], [ "c44d12c7065d812e8acf28d7cbb19f9011ecd9e9fdf281b0e6a3b5e87d22e7db", "2119a460ce326cdc76c45926c982fdac0e106e861edf61c5a039063f0e0e6482" ], [ "6a245bf6dc698504c89a20cfded60853152b695336c28063b61c65cbd269e6b4", "e022cf42c2bd4a708b3f5126f16a24ad8b33ba48d0423b6efd5e6348100d8a82" ], [ "1697ffa6fd9de627c077e3d2fe541084ce13300b0bec1146f95ae57f0d0bd6a5", "b9c398f186806f5d27561506e4557433a2cf15009e498ae7adee9d63d01b2396" ], [ "605bdb019981718b986d0f07e834cb0d9deb8360ffb7f61df982345ef27a7479", "2972d2de4f8d20681a78d93ec96fe23c26bfae84fb14db43b01e1e9056b8c49" ], [ "62d14dab4150bf497402fdc45a215e10dcb01c354959b10cfe31c7e9d87ff33d", "80fc06bd8cc5b01098088a1950eed0db01aa132967ab472235f5642483b25eaf" ], [ "80c60ad0040f27dade5b4b06c408e56b2c50e9f56b9b8b425e555c2f86308b6f", "1c38303f1cc5c30f26e66bad7fe72f70a65eed4cbe7024eb1aa01f56430bd57a" ], [ "7a9375ad6167ad54aa74c6348cc54d344cc5dc9487d847049d5eabb0fa03c8fb", "d0e3fa9eca8726909559e0d79269046bdc59ea10c70ce2b02d499ec224dc7f7" ], [ "d528ecd9b696b54c907a9ed045447a79bb408ec39b68df504bb51f459bc3ffc9", "eecf41253136e5f99966f21881fd656ebc4345405c520dbc063465b521409933" ], [ "49370a4b5f43412ea25f514e8ecdad05266115e4a7ecb1387231808f8b45963", "758f3f41afd6ed428b3081b0512fd62a54c3f3afbb5b6764b653052a12949c9a" ], [ "77f230936ee88cbbd73df930d64702ef881d811e0e1498e2f1c13eb1fc345d74", "958ef42a7886b6400a08266e9ba1b37896c95330d97077cbbe8eb3c7671c60d6" ], [ "f2dac991cc4ce4b9ea44887e5c7c0bce58c80074ab9d4dbaeb28531b7739f530", "e0dedc9b3b2f8dad4da1f32dec2531df9eb5fbeb0598e4fd1a117dba703a3c37" ], [ "463b3d9f662621fb1b4be8fbbe2520125a216cdfc9dae3debcba4850c690d45b", "5ed430d78c296c3543114306dd8622d7c622e27c970a1de31cb377b01af7307e" ], [ "f16f804244e46e2a09232d4aff3b59976b98fac14328a2d1a32496b49998f247", "cedabd9b82203f7e13d206fcdf4e33d92a6c53c26e5cce26d6579962c4e31df6" ], [ "caf754272dc84563b0352b7a14311af55d245315ace27c65369e15f7151d41d1", "cb474660ef35f5f2a41b643fa5e460575f4fa9b7962232a5c32f908318a04476" ], [ "2600ca4b282cb986f85d0f1709979d8b44a09c07cb86d7c124497bc86f082120", "4119b88753c15bd6a693b03fcddbb45d5ac6be74ab5f0ef44b0be9475a7e4b40" ], [ "7635ca72d7e8432c338ec53cd12220bc01c48685e24f7dc8c602a7746998e435", "91b649609489d613d1d5e590f78e6d74ecfc061d57048bad9e76f302c5b9c61" ], [ "754e3239f325570cdbbf4a87deee8a66b7f2b33479d468fbc1a50743bf56cc18", "673fb86e5bda30fb3cd0ed304ea49a023ee33d0197a695d0c5d98093c536683" ], [ "e3e6bd1071a1e96aff57859c82d570f0330800661d1c952f9fe2694691d9b9e8", "59c9e0bba394e76f40c0aa58379a3cb6a5a2283993e90c4167002af4920e37f5" ], [ "186b483d056a033826ae73d88f732985c4ccb1f32ba35f4b4cc47fdcf04aa6eb", "3b952d32c67cf77e2e17446e204180ab21fb8090895138b4a4a797f86e80888b" ], [ "df9d70a6b9876ce544c98561f4be4f725442e6d2b737d9c91a8321724ce0963f", "55eb2dafd84d6ccd5f862b785dc39d4ab157222720ef9da217b8c45cf2ba2417" ], [ "5edd5cc23c51e87a497ca815d5dce0f8ab52554f849ed8995de64c5f34ce7143", "efae9c8dbc14130661e8cec030c89ad0c13c66c0d17a2905cdc706ab7399a868" ], [ "290798c2b6476830da12fe02287e9e777aa3fba1c355b17a722d362f84614fba", "e38da76dcd440621988d00bcf79af25d5b29c094db2a23146d003afd41943e7a" ], [ "af3c423a95d9f5b3054754efa150ac39cd29552fe360257362dfdecef4053b45", "f98a3fd831eb2b749a93b0e6f35cfb40c8cd5aa667a15581bc2feded498fd9c6" ], [ "766dbb24d134e745cccaa28c99bf274906bb66b26dcf98df8d2fed50d884249a", "744b1152eacbe5e38dcc887980da38b897584a65fa06cedd2c924f97cbac5996" ], [ "59dbf46f8c94759ba21277c33784f41645f7b44f6c596a58ce92e666191abe3e", "c534ad44175fbc300f4ea6ce648309a042ce739a7919798cd85e216c4a307f6e" ], [ "f13ada95103c4537305e691e74e9a4a8dd647e711a95e73cb62dc6018cfd87b8", "e13817b44ee14de663bf4bc808341f326949e21a6a75c2570778419bdaf5733d" ], [ "7754b4fa0e8aced06d4167a2c59cca4cda1869c06ebadfb6488550015a88522c", "30e93e864e669d82224b967c3020b8fa8d1e4e350b6cbcc537a48b57841163a2" ], [ "948dcadf5990e048aa3874d46abef9d701858f95de8041d2a6828c99e2262519", "e491a42537f6e597d5d28a3224b1bc25df9154efbd2ef1d2cbba2cae5347d57e" ], [ "7962414450c76c1689c7b48f8202ec37fb224cf5ac0bfa1570328a8a3d7c77ab", "100b610ec4ffb4760d5c1fc133ef6f6b12507a051f04ac5760afa5b29db83437" ], [ "3514087834964b54b15b160644d915485a16977225b8847bb0dd085137ec47ca", "ef0afbb2056205448e1652c48e8127fc6039e77c15c2378b7e7d15a0de293311" ], [ "d3cc30ad6b483e4bc79ce2c9dd8bc54993e947eb8df787b442943d3f7b527eaf", "8b378a22d827278d89c5e9be8f9508ae3c2ad46290358630afb34db04eede0a4" ], [ "1624d84780732860ce1c78fcbfefe08b2b29823db913f6493975ba0ff4847610", "68651cf9b6da903e0914448c6cd9d4ca896878f5282be4c8cc06e2a404078575" ], [ "733ce80da955a8a26902c95633e62a985192474b5af207da6df7b4fd5fc61cd4", "f5435a2bd2badf7d485a4d8b8db9fcce3e1ef8e0201e4578c54673bc1dc5ea1d" ], [ "15d9441254945064cf1a1c33bbd3b49f8966c5092171e699ef258dfab81c045c", "d56eb30b69463e7234f5137b73b84177434800bacebfc685fc37bbe9efe4070d" ], [ "a1d0fcf2ec9de675b612136e5ce70d271c21417c9d2b8aaaac138599d0717940", "edd77f50bcb5a3cab2e90737309667f2641462a54070f3d519212d39c197a629" ], [ "e22fbe15c0af8ccc5780c0735f84dbe9a790badee8245c06c7ca37331cb36980", "a855babad5cd60c88b430a69f53a1a7a38289154964799be43d06d77d31da06" ], [ "311091dd9860e8e20ee13473c1155f5f69635e394704eaa74009452246cfa9b3", "66db656f87d1f04fffd1f04788c06830871ec5a64feee685bd80f0b1286d8374" ], [ "34c1fd04d301be89b31c0442d3e6ac24883928b45a9340781867d4232ec2dbdf", "9414685e97b1b5954bd46f730174136d57f1ceeb487443dc5321857ba73abee" ], [ "f219ea5d6b54701c1c14de5b557eb42a8d13f3abbcd08affcc2a5e6b049b8d63", "4cb95957e83d40b0f73af4544cccf6b1f4b08d3c07b27fb8d8c2962a400766d1" ], [ "d7b8740f74a8fbaab1f683db8f45de26543a5490bca627087236912469a0b448", "fa77968128d9c92ee1010f337ad4717eff15db5ed3c049b3411e0315eaa4593b" ], [ "32d31c222f8f6f0ef86f7c98d3a3335ead5bcd32abdd94289fe4d3091aa824bf", "5f3032f5892156e39ccd3d7915b9e1da2e6dac9e6f26e961118d14b8462e1661" ], [ "7461f371914ab32671045a155d9831ea8793d77cd59592c4340f86cbc18347b5", "8ec0ba238b96bec0cbdddcae0aa442542eee1ff50c986ea6b39847b3cc092ff6" ], [ "ee079adb1df1860074356a25aa38206a6d716b2c3e67453d287698bad7b2b2d6", "8dc2412aafe3be5c4c5f37e0ecc5f9f6a446989af04c4e25ebaac479ec1c8c1e" ], [ "16ec93e447ec83f0467b18302ee620f7e65de331874c9dc72bfd8616ba9da6b5", "5e4631150e62fb40d0e8c2a7ca5804a39d58186a50e497139626778e25b0674d" ], [ "eaa5f980c245f6f038978290afa70b6bd8855897f98b6aa485b96065d537bd99", "f65f5d3e292c2e0819a528391c994624d784869d7e6ea67fb18041024edc07dc" ], [ "78c9407544ac132692ee1910a02439958ae04877151342ea96c4b6b35a49f51", "f3e0319169eb9b85d5404795539a5e68fa1fbd583c064d2462b675f194a3ddb4" ], [ "494f4be219a1a77016dcd838431aea0001cdc8ae7a6fc688726578d9702857a5", "42242a969283a5f339ba7f075e36ba2af925ce30d767ed6e55f4b031880d562c" ], [ "a598a8030da6d86c6bc7f2f5144ea549d28211ea58faa70ebf4c1e665c1fe9b5", "204b5d6f84822c307e4b4a7140737aec23fc63b65b35f86a10026dbd2d864e6b" ], [ "c41916365abb2b5d09192f5f2dbeafec208f020f12570a184dbadc3e58595997", "4f14351d0087efa49d245b328984989d5caf9450f34bfc0ed16e96b58fa9913" ], [ "841d6063a586fa475a724604da03bc5b92a2e0d2e0a36acfe4c73a5514742881", "73867f59c0659e81904f9a1c7543698e62562d6744c169ce7a36de01a8d6154" ], [ "5e95bb399a6971d376026947f89bde2f282b33810928be4ded112ac4d70e20d5", "39f23f366809085beebfc71181313775a99c9aed7d8ba38b161384c746012865" ], [ "36e4641a53948fd476c39f8a99fd974e5ec07564b5315d8bf99471bca0ef2f66", "d2424b1b1abe4eb8164227b085c9aa9456ea13493fd563e06fd51cf5694c78fc" ], [ "336581ea7bfbbb290c191a2f507a41cf5643842170e914faeab27c2c579f726", "ead12168595fe1be99252129b6e56b3391f7ab1410cd1e0ef3dcdcabd2fda224" ], [ "8ab89816dadfd6b6a1f2634fcf00ec8403781025ed6890c4849742706bd43ede", "6fdcef09f2f6d0a044e654aef624136f503d459c3e89845858a47a9129cdd24e" ], [ "1e33f1a746c9c5778133344d9299fcaa20b0938e8acff2544bb40284b8c5fb94", "60660257dd11b3aa9c8ed618d24edff2306d320f1d03010e33a7d2057f3b3b6" ], [ "85b7c1dcb3cec1b7ee7f30ded79dd20a0ed1f4cc18cbcfcfa410361fd8f08f31", "3d98a9cdd026dd43f39048f25a8847f4fcafad1895d7a633c6fed3c35e999511" ], [ "29df9fbd8d9e46509275f4b125d6d45d7fbe9a3b878a7af872a2800661ac5f51", "b4c4fe99c775a606e2d8862179139ffda61dc861c019e55cd2876eb2a27d84b" ], [ "a0b1cae06b0a847a3fea6e671aaf8adfdfe58ca2f768105c8082b2e449fce252", "ae434102edde0958ec4b19d917a6a28e6b72da1834aff0e650f049503a296cf2" ], [ "4e8ceafb9b3e9a136dc7ff67e840295b499dfb3b2133e4ba113f2e4c0e121e5", "cf2174118c8b6d7a4b48f6d534ce5c79422c086a63460502b827ce62a326683c" ], [ "d24a44e047e19b6f5afb81c7ca2f69080a5076689a010919f42725c2b789a33b", "6fb8d5591b466f8fc63db50f1c0f1c69013f996887b8244d2cdec417afea8fa3" ], [ "ea01606a7a6c9cdd249fdfcfacb99584001edd28abbab77b5104e98e8e3b35d4", "322af4908c7312b0cfbfe369f7a7b3cdb7d4494bc2823700cfd652188a3ea98d" ], [ "af8addbf2b661c8a6c6328655eb96651252007d8c5ea31be4ad196de8ce2131f", "6749e67c029b85f52a034eafd096836b2520818680e26ac8f3dfbcdb71749700" ], [ "e3ae1974566ca06cc516d47e0fb165a674a3dabcfca15e722f0e3450f45889", "2aeabe7e4531510116217f07bf4d07300de97e4874f81f533420a72eeb0bd6a4" ], [ "591ee355313d99721cf6993ffed1e3e301993ff3ed258802075ea8ced397e246", "b0ea558a113c30bea60fc4775460c7901ff0b053d25ca2bdeee98f1a4be5d196" ], [ "11396d55fda54c49f19aa97318d8da61fa8584e47b084945077cf03255b52984", "998c74a8cd45ac01289d5833a7beb4744ff536b01b257be4c5767bea93ea57a4" ], [ "3c5d2a1ba39c5a1790000738c9e0c40b8dcdfd5468754b6405540157e017aa7a", "b2284279995a34e2f9d4de7396fc18b80f9b8b9fdd270f6661f79ca4c81bd257" ], [ "cc8704b8a60a0defa3a99a7299f2e9c3fbc395afb04ac078425ef8a1793cc030", "bdd46039feed17881d1e0862db347f8cf395b74fc4bcdc4e940b74e3ac1f1b13" ], [ "c533e4f7ea8555aacd9777ac5cad29b97dd4defccc53ee7ea204119b2889b197", "6f0a256bc5efdf429a2fb6242f1a43a2d9b925bb4a4b3a26bb8e0f45eb596096" ], [ "c14f8f2ccb27d6f109f6d08d03cc96a69ba8c34eec07bbcf566d48e33da6593", "c359d6923bb398f7fd4473e16fe1c28475b740dd098075e6c0e8649113dc3a38" ], [ "a6cbc3046bc6a450bac24789fa17115a4c9739ed75f8f21ce441f72e0b90e6ef", "21ae7f4680e889bb130619e2c0f95a360ceb573c70603139862afd617fa9b9f" ], [ "347d6d9a02c48927ebfb86c1359b1caf130a3c0267d11ce6344b39f99d43cc38", "60ea7f61a353524d1c987f6ecec92f086d565ab687870cb12689ff1e31c74448" ], [ "da6545d2181db8d983f7dcb375ef5866d47c67b1bf31c8cf855ef7437b72656a", "49b96715ab6878a79e78f07ce5680c5d6673051b4935bd897fea824b77dc208a" ], [ "c40747cc9d012cb1a13b8148309c6de7ec25d6945d657146b9d5994b8feb1111", "5ca560753be2a12fc6de6caf2cb489565db936156b9514e1bb5e83037e0fa2d4" ], [ "4e42c8ec82c99798ccf3a610be870e78338c7f713348bd34c8203ef4037f3502", "7571d74ee5e0fb92a7a8b33a07783341a5492144cc54bcc40a94473693606437" ], [ "3775ab7089bc6af823aba2e1af70b236d251cadb0c86743287522a1b3b0dedea", "be52d107bcfa09d8bcb9736a828cfa7fac8db17bf7a76a2c42ad961409018cf7" ], [ "cee31cbf7e34ec379d94fb814d3d775ad954595d1314ba8846959e3e82f74e26", "8fd64a14c06b589c26b947ae2bcf6bfa0149ef0be14ed4d80f448a01c43b1c6d" ], [ "b4f9eaea09b6917619f6ea6a4eb5464efddb58fd45b1ebefcdc1a01d08b47986", "39e5c9925b5a54b07433a4f18c61726f8bb131c012ca542eb24a8ac07200682a" ], [ "d4263dfc3d2df923a0179a48966d30ce84e2515afc3dccc1b77907792ebcc60e", "62dfaf07a0f78feb30e30d6295853ce189e127760ad6cf7fae164e122a208d54" ], [ "48457524820fa65a4f8d35eb6930857c0032acc0a4a2de422233eeda897612c4", "25a748ab367979d98733c38a1fa1c2e7dc6cc07db2d60a9ae7a76aaa49bd0f77" ], [ "dfeeef1881101f2cb11644f3a2afdfc2045e19919152923f367a1767c11cceda", "ecfb7056cf1de042f9420bab396793c0c390bde74b4bbdff16a83ae09a9a7517" ], [ "6d7ef6b17543f8373c573f44e1f389835d89bcbc6062ced36c82df83b8fae859", "cd450ec335438986dfefa10c57fea9bcc521a0959b2d80bbf74b190dca712d10" ], [ "e75605d59102a5a2684500d3b991f2e3f3c88b93225547035af25af66e04541f", "f5c54754a8f71ee540b9b48728473e314f729ac5308b06938360990e2bfad125" ], [ "eb98660f4c4dfaa06a2be453d5020bc99a0c2e60abe388457dd43fefb1ed620c", "6cb9a8876d9cb8520609af3add26cd20a0a7cd8a9411131ce85f44100099223e" ], [ "13e87b027d8514d35939f2e6892b19922154596941888336dc3563e3b8dba942", "fef5a3c68059a6dec5d624114bf1e91aac2b9da568d6abeb2570d55646b8adf1" ], [ "ee163026e9fd6fe017c38f06a5be6fc125424b371ce2708e7bf4491691e5764a", "1acb250f255dd61c43d94ccc670d0f58f49ae3fa15b96623e5430da0ad6c62b2" ], [ "b268f5ef9ad51e4d78de3a750c2dc89b1e626d43505867999932e5db33af3d80", "5f310d4b3c99b9ebb19f77d41c1dee018cf0d34fd4191614003e945a1216e423" ], [ "ff07f3118a9df035e9fad85eb6c7bfe42b02f01ca99ceea3bf7ffdba93c4750d", "438136d603e858a3a5c440c38eccbaddc1d2942114e2eddd4740d098ced1f0d8" ], [ "8d8b9855c7c052a34146fd20ffb658bea4b9f69e0d825ebec16e8c3ce2b526a1", "cdb559eedc2d79f926baf44fb84ea4d44bcf50fee51d7ceb30e2e7f463036758" ], [ "52db0b5384dfbf05bfa9d472d7ae26dfe4b851ceca91b1eba54263180da32b63", "c3b997d050ee5d423ebaf66a6db9f57b3180c902875679de924b69d84a7b375" ], [ "e62f9490d3d51da6395efd24e80919cc7d0f29c3f3fa48c6fff543becbd43352", "6d89ad7ba4876b0b22c2ca280c682862f342c8591f1daf5170e07bfd9ccafa7d" ], [ "7f30ea2476b399b4957509c88f77d0191afa2ff5cb7b14fd6d8e7d65aaab1193", "ca5ef7d4b231c94c3b15389a5f6311e9daff7bb67b103e9880ef4bff637acaec" ], [ "5098ff1e1d9f14fb46a210fada6c903fef0fb7b4a1dd1d9ac60a0361800b7a00", "9731141d81fc8f8084d37c6e7542006b3ee1b40d60dfe5362a5b132fd17ddc0" ], [ "32b78c7de9ee512a72895be6b9cbefa6e2f3c4ccce445c96b9f2c81e2778ad58", "ee1849f513df71e32efc3896ee28260c73bb80547ae2275ba497237794c8753c" ], [ "e2cb74fddc8e9fbcd076eef2a7c72b0ce37d50f08269dfc074b581550547a4f7", "d3aa2ed71c9dd2247a62df062736eb0baddea9e36122d2be8641abcb005cc4a4" ], [ "8438447566d4d7bedadc299496ab357426009a35f235cb141be0d99cd10ae3a8", "c4e1020916980a4da5d01ac5e6ad330734ef0d7906631c4f2390426b2edd791f" ], [ "4162d488b89402039b584c6fc6c308870587d9c46f660b878ab65c82c711d67e", "67163e903236289f776f22c25fb8a3afc1732f2b84b4e95dbda47ae5a0852649" ], [ "3fad3fa84caf0f34f0f89bfd2dcf54fc175d767aec3e50684f3ba4a4bf5f683d", "cd1bc7cb6cc407bb2f0ca647c718a730cf71872e7d0d2a53fa20efcdfe61826" ], [ "674f2600a3007a00568c1a7ce05d0816c1fb84bf1370798f1c69532faeb1a86b", "299d21f9413f33b3edf43b257004580b70db57da0b182259e09eecc69e0d38a5" ], [ "d32f4da54ade74abb81b815ad1fb3b263d82d6c692714bcff87d29bd5ee9f08f", "f9429e738b8e53b968e99016c059707782e14f4535359d582fc416910b3eea87" ], [ "30e4e670435385556e593657135845d36fbb6931f72b08cb1ed954f1e3ce3ff6", "462f9bce619898638499350113bbc9b10a878d35da70740dc695a559eb88db7b" ], [ "be2062003c51cc3004682904330e4dee7f3dcd10b01e580bf1971b04d4cad297", "62188bc49d61e5428573d48a74e1c655b1c61090905682a0d5558ed72dccb9bc" ], [ "93144423ace3451ed29e0fb9ac2af211cb6e84a601df5993c419859fff5df04a", "7c10dfb164c3425f5c71a3f9d7992038f1065224f72bb9d1d902a6d13037b47c" ], [ "b015f8044f5fcbdcf21ca26d6c34fb8197829205c7b7d2a7cb66418c157b112c", "ab8c1e086d04e813744a655b2df8d5f83b3cdc6faa3088c1d3aea1454e3a1d5f" ], [ "d5e9e1da649d97d89e4868117a465a3a4f8a18de57a140d36b3f2af341a21b52", "4cb04437f391ed73111a13cc1d4dd0db1693465c2240480d8955e8592f27447a" ], [ "d3ae41047dd7ca065dbf8ed77b992439983005cd72e16d6f996a5316d36966bb", "bd1aeb21ad22ebb22a10f0303417c6d964f8cdd7df0aca614b10dc14d125ac46" ], [ "463e2763d885f958fc66cdd22800f0a487197d0a82e377b49f80af87c897b065", "bfefacdb0e5d0fd7df3a311a94de062b26b80c61fbc97508b79992671ef7ca7f" ], [ "7985fdfd127c0567c6f53ec1bb63ec3158e597c40bfe747c83cddfc910641917", "603c12daf3d9862ef2b25fe1de289aed24ed291e0ec6708703a5bd567f32ed03" ], [ "74a1ad6b5f76e39db2dd249410eac7f99e74c59cb83d2d0ed5ff1543da7703e9", "cc6157ef18c9c63cd6193d83631bbea0093e0968942e8c33d5737fd790e0db08" ], [ "30682a50703375f602d416664ba19b7fc9bab42c72747463a71d0896b22f6da3", "553e04f6b018b4fa6c8f39e7f311d3176290d0e0f19ca73f17714d9977a22ff8" ], [ "9e2158f0d7c0d5f26c3791efefa79597654e7a2b2464f52b1ee6c1347769ef57", "712fcdd1b9053f09003a3481fa7762e9ffd7c8ef35a38509e2fbf2629008373" ], [ "176e26989a43c9cfeba4029c202538c28172e566e3c4fce7322857f3be327d66", "ed8cc9d04b29eb877d270b4878dc43c19aefd31f4eee09ee7b47834c1fa4b1c3" ], [ "75d46efea3771e6e68abb89a13ad747ecf1892393dfc4f1b7004788c50374da8", "9852390a99507679fd0b86fd2b39a868d7efc22151346e1a3ca4726586a6bed8" ], [ "809a20c67d64900ffb698c4c825f6d5f2310fb0451c869345b7319f645605721", "9e994980d9917e22b76b061927fa04143d096ccc54963e6a5ebfa5f3f8e286c1" ], [ "1b38903a43f7f114ed4500b4eac7083fdefece1cf29c63528d563446f972c180", "4036edc931a60ae889353f77fd53de4a2708b26b6f5da72ad3394119daf408f9" ] ]
      }
    };
  }, {} ],
  81: [ function(require, module, exports) {
    "use strict";
    var utils = exports;
    var BN = require("bn.js");
    var minAssert = require("minimalistic-assert");
    var minUtils = require("minimalistic-crypto-utils");
    utils.assert = minAssert;
    utils.toArray = minUtils.toArray;
    utils.zero2 = minUtils.zero2;
    utils.toHex = minUtils.toHex;
    utils.encode = minUtils.encode;
    function getNAF(num, w) {
      var naf = [];
      var ws = 1 << w + 1;
      var k = num.clone();
      while (k.cmpn(1) >= 0) {
        var z;
        if (k.isOdd()) {
          var mod = k.andln(ws - 1);
          z = mod > (ws >> 1) - 1 ? (ws >> 1) - mod : mod;
          k.isubn(z);
        } else z = 0;
        naf.push(z);
        var shift = 0 !== k.cmpn(0) && 0 === k.andln(ws - 1) ? w + 1 : 1;
        for (var i = 1; i < shift; i++) naf.push(0);
        k.iushrn(shift);
      }
      return naf;
    }
    utils.getNAF = getNAF;
    function getJSF(k1, k2) {
      var jsf = [ [], [] ];
      k1 = k1.clone();
      k2 = k2.clone();
      var d1 = 0;
      var d2 = 0;
      while (k1.cmpn(-d1) > 0 || k2.cmpn(-d2) > 0) {
        var m14 = k1.andln(3) + d1 & 3;
        var m24 = k2.andln(3) + d2 & 3;
        3 === m14 && (m14 = -1);
        3 === m24 && (m24 = -1);
        var u1;
        if (0 === (1 & m14)) u1 = 0; else {
          var m8 = k1.andln(7) + d1 & 7;
          u1 = 3 !== m8 && 5 !== m8 || 2 !== m24 ? m14 : -m14;
        }
        jsf[0].push(u1);
        var u2;
        if (0 === (1 & m24)) u2 = 0; else {
          var m8 = k2.andln(7) + d2 & 7;
          u2 = 3 !== m8 && 5 !== m8 || 2 !== m14 ? m24 : -m24;
        }
        jsf[1].push(u2);
        2 * d1 === u1 + 1 && (d1 = 1 - d1);
        2 * d2 === u2 + 1 && (d2 = 1 - d2);
        k1.iushrn(1);
        k2.iushrn(1);
      }
      return jsf;
    }
    utils.getJSF = getJSF;
    function cachedProperty(obj, name, computer) {
      var key = "_" + name;
      obj.prototype[name] = function cachedProperty() {
        return void 0 !== this[key] ? this[key] : this[key] = computer.call(this);
      };
    }
    utils.cachedProperty = cachedProperty;
    function parseBytes(bytes) {
      return "string" === typeof bytes ? utils.toArray(bytes, "hex") : bytes;
    }
    utils.parseBytes = parseBytes;
    function intFromLE(bytes) {
      return new BN(bytes, "hex", "le");
    }
    utils.intFromLE = intFromLE;
  }, {
    "bn.js": 16,
    "minimalistic-assert": 105,
    "minimalistic-crypto-utils": 106
  } ],
  82: [ function(require, module, exports) {
    module.exports = {
      _args: [ [ {
        raw: "elliptic@^6.0.0",
        scope: null,
        escapedName: "elliptic",
        name: "elliptic",
        rawSpec: "^6.0.0",
        spec: ">=6.0.0 <7.0.0",
        type: "range"
      }, "/Users/nantas/fireball-x/fireball_2.0-release/dist/CocosCreator.app/Contents/Resources/app/node_modules/browserify-sign" ] ],
      _cnpm_publish_time: 1487798867116,
      _from: "elliptic@^6.0.0",
      _hasShrinkwrap: false,
      _id: "elliptic@6.4.0",
      _location: "/elliptic",
      _nodeVersion: "7.0.0",
      _npmOperationalInternal: {
        host: "packages-18-east.internal.npmjs.com",
        tmp: "tmp/elliptic-6.4.0.tgz_1487798866428_0.30510620190761983"
      },
      _npmUser: {
        name: "indutny",
        email: "fedor@indutny.com"
      },
      _npmVersion: "3.10.8",
      _phantomChildren: {},
      _requested: {
        raw: "elliptic@^6.0.0",
        scope: null,
        escapedName: "elliptic",
        name: "elliptic",
        rawSpec: "^6.0.0",
        spec: ">=6.0.0 <7.0.0",
        type: "range"
      },
      _requiredBy: [ "/browserify-sign", "/create-ecdh" ],
      _resolved: "http://registry.npm.taobao.org/elliptic/download/elliptic-6.4.0.tgz",
      _shasum: "cac9af8762c85836187003c8dfe193e5e2eae5df",
      _shrinkwrap: null,
      _spec: "elliptic@^6.0.0",
      _where: "/Users/nantas/fireball-x/fireball_2.0-release/dist/CocosCreator.app/Contents/Resources/app/node_modules/browserify-sign",
      author: {
        name: "Fedor Indutny",
        email: "fedor@indutny.com"
      },
      bugs: {
        url: "https://github.com/indutny/elliptic/issues"
      },
      dependencies: {
        "bn.js": "^4.4.0",
        brorand: "^1.0.1",
        "hash.js": "^1.0.0",
        "hmac-drbg": "^1.0.0",
        inherits: "^2.0.1",
        "minimalistic-assert": "^1.0.0",
        "minimalistic-crypto-utils": "^1.0.0"
      },
      description: "EC cryptography",
      devDependencies: {
        brfs: "^1.4.3",
        coveralls: "^2.11.3",
        grunt: "^0.4.5",
        "grunt-browserify": "^5.0.0",
        "grunt-cli": "^1.2.0",
        "grunt-contrib-connect": "^1.0.0",
        "grunt-contrib-copy": "^1.0.0",
        "grunt-contrib-uglify": "^1.0.1",
        "grunt-mocha-istanbul": "^3.0.1",
        "grunt-saucelabs": "^8.6.2",
        istanbul: "^0.4.2",
        jscs: "^2.9.0",
        jshint: "^2.6.0",
        mocha: "^2.1.0"
      },
      directories: {},
      dist: {
        shasum: "cac9af8762c85836187003c8dfe193e5e2eae5df",
        size: 41164,
        noattachment: false,
        tarball: "http://registry.npm.taobao.org/elliptic/download/elliptic-6.4.0.tgz"
      },
      files: [ "lib" ],
      gitHead: "6b0d2b76caae91471649c8e21f0b1d3ba0f96090",
      homepage: "https://github.com/indutny/elliptic",
      keywords: [ "EC", "Elliptic", "curve", "Cryptography" ],
      license: "MIT",
      main: "lib/elliptic.js",
      maintainers: [ {
        name: "indutny",
        email: "fedor@indutny.com"
      } ],
      name: "elliptic",
      optionalDependencies: {},
      publish_time: 1487798867116,
      readme: "# Elliptic [![Build Status](https://secure.travis-ci.org/indutny/elliptic.png)](http://travis-ci.org/indutny/elliptic) [![Coverage Status](https://coveralls.io/repos/indutny/elliptic/badge.svg?branch=master&service=github)](https://coveralls.io/github/indutny/elliptic?branch=master) [![Code Climate](https://codeclimate.com/github/indutny/elliptic/badges/gpa.svg)](https://codeclimate.com/github/indutny/elliptic)\n\n[![Saucelabs Test Status](https://saucelabs.com/browser-matrix/gh-indutny-elliptic.svg)](https://saucelabs.com/u/gh-indutny-elliptic)\n\nFast elliptic-curve cryptography in a plain javascript implementation.\n\nNOTE: Please take a look at http://safecurves.cr.yp.to/ before choosing a curve\nfor your cryptography operations.\n\n## Incentive\n\nECC is much slower than regular RSA cryptography, the JS implementations are\neven more slower.\n\n## Benchmarks\n\n```bash\n$ node benchmarks/index.js\nBenchmarking: sign\nelliptic#sign x 262 ops/sec \xb10.51% (177 runs sampled)\neccjs#sign x 55.91 ops/sec \xb10.90% (144 runs sampled)\n------------------------\nFastest is elliptic#sign\n========================\nBenchmarking: verify\nelliptic#verify x 113 ops/sec \xb10.50% (166 runs sampled)\neccjs#verify x 48.56 ops/sec \xb10.36% (125 runs sampled)\n------------------------\nFastest is elliptic#verify\n========================\nBenchmarking: gen\nelliptic#gen x 294 ops/sec \xb10.43% (176 runs sampled)\neccjs#gen x 62.25 ops/sec \xb10.63% (129 runs sampled)\n------------------------\nFastest is elliptic#gen\n========================\nBenchmarking: ecdh\nelliptic#ecdh x 136 ops/sec \xb10.85% (156 runs sampled)\n------------------------\nFastest is elliptic#ecdh\n========================\n```\n\n## API\n\n### ECDSA\n\n```javascript\nvar EC = require('elliptic').ec;\n\n// Create and initialize EC context\n// (better do it once and reuse it)\nvar ec = new EC('secp256k1');\n\n// Generate keys\nvar key = ec.genKeyPair();\n\n// Sign message (must be an array, or it'll be treated as a hex sequence)\nvar msg = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];\nvar signature = key.sign(msg);\n\n// Export DER encoded signature in Array\nvar derSign = signature.toDER();\n\n// Verify signature\nconsole.log(key.verify(msg, derSign));\n\n// CHECK WITH NO PRIVATE KEY\n\n// Public key as '04 + x + y'\nvar pub = '04bb1fa3...';\n\n// Signature MUST be either:\n// 1) hex-string of DER-encoded signature; or\n// 2) DER-encoded signature as buffer; or\n// 3) object with two hex-string properties (r and s)\n\nvar signature = 'b102ac...'; // case 1\nvar signature = new Buffer('...'); // case 2\nvar signature = { r: 'b1fc...', s: '9c42...' }; // case 3\n\n// Import public key\nvar key = ec.keyFromPublic(pub, 'hex');\n\n// Verify signature\nconsole.log(key.verify(msg, signature));\n```\n\n### EdDSA\n\n```javascript\nvar EdDSA = require('elliptic').eddsa;\n\n// Create and initialize EdDSA context\n// (better do it once and reuse it)\nvar ec = new EdDSA('ed25519');\n\n// Create key pair from secret\nvar key = ec.keyFromSecret('693e3c...'); // hex string, array or Buffer\n\n// Sign message (must be an array, or it'll be treated as a hex sequence)\nvar msg = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];\nvar signature = key.sign(msg).toHex();\n\n// Verify signature\nconsole.log(key.verify(msg, signature));\n\n// CHECK WITH NO PRIVATE KEY\n\n// Import public key\nvar pub = '0a1af638...';\nvar key = ec.keyFromPublic(pub, 'hex');\n\n// Verify signature\nvar signature = '70bed1...';\nconsole.log(key.verify(msg, signature));\n```\n\n### ECDH\n\n```javascript\nvar EC = require('elliptic').ec;\nvar ec = new EC('curve25519');\n\n// Generate keys\nvar key1 = ec.genKeyPair();\nvar key2 = ec.genKeyPair();\n\nvar shared1 = key1.derive(key2.getPublic());\nvar shared2 = key2.derive(key1.getPublic());\n\nconsole.log('Both shared secrets are BN instances');\nconsole.log(shared1.toString(16));\nconsole.log(shared2.toString(16));\n```\n\nthree and more members:\n```javascript\nvar EC = require('elliptic').ec;\nvar ec = new EC('curve25519');\n\nvar A = ec.genKeyPair();\nvar B = ec.genKeyPair();\nvar C = ec.genKeyPair();\n\nvar AB = A.getPublic().mul(B.getPrivate())\nvar BC = B.getPublic().mul(C.getPrivate())\nvar CA = C.getPublic().mul(A.getPrivate())\n\nvar ABC = AB.mul(C.getPrivate())\nvar BCA = BC.mul(A.getPrivate())\nvar CAB = CA.mul(B.getPrivate())\n\nconsole.log(ABC.getX().toString(16))\nconsole.log(BCA.getX().toString(16))\nconsole.log(CAB.getX().toString(16))\n```\n\nNOTE: `.derive()` returns a [BN][1] instance.\n\n## Supported curves\n\nElliptic.js support following curve types:\n\n* Short Weierstrass\n* Montgomery\n* Edwards\n* Twisted Edwards\n\nFollowing curve 'presets' are embedded into the library:\n\n* `secp256k1`\n* `p192`\n* `p224`\n* `p256`\n* `p384`\n* `p521`\n* `curve25519`\n* `ed25519`\n\nNOTE: That `curve25519` could not be used for ECDSA, use `ed25519` instead.\n\n### Implementation details\n\nECDSA is using deterministic `k` value generation as per [RFC6979][0]. Most of\nthe curve operations are performed on non-affine coordinates (either projective\nor extended), various windowing techniques are used for different cases.\n\nAll operations are performed in reduction context using [bn.js][1], hashing is\nprovided by [hash.js][2]\n\n### Related projects\n\n* [eccrypto][3]: isomorphic implementation of ECDSA, ECDH and ECIES for both\n  browserify and node (uses `elliptic` for browser and [secp256k1-node][4] for\n  node)\n\n#### LICENSE\n\nThis software is licensed under the MIT License.\n\nCopyright Fedor Indutny, 2014.\n\nPermission is hereby granted, free of charge, to any person obtaining a\ncopy of this software and associated documentation files (the\n\"Software\"), to deal in the Software without restriction, including\nwithout limitation the rights to use, copy, modify, merge, publish,\ndistribute, sublicense, and/or sell copies of the Software, and to permit\npersons to whom the Software is furnished to do so, subject to the\nfollowing conditions:\n\nThe above copyright notice and this permission notice shall be included\nin all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS\nOR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\nMERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN\nNO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,\nDAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR\nOTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE\nUSE OR OTHER DEALINGS IN THE SOFTWARE.\n\n[0]: http://tools.ietf.org/html/rfc6979\n[1]: https://github.com/indutny/bn.js\n[2]: https://github.com/indutny/hash.js\n[3]: https://github.com/bitchan/eccrypto\n[4]: https://github.com/wanderer/secp256k1-node\n",
      readmeFilename: "README.md",
      repository: {
        type: "git",
        url: "git+ssh://git@github.com/indutny/elliptic.git"
      },
      scripts: {
        jscs: "jscs benchmarks/*.js lib/*.js lib/**/*.js lib/**/**/*.js test/index.js",
        jshint: "jscs benchmarks/*.js lib/*.js lib/**/*.js lib/**/**/*.js test/index.js",
        lint: "npm run jscs && npm run jshint",
        test: "npm run lint && npm run unit",
        unit: "istanbul test _mocha --reporter=spec test/index.js",
        version: "grunt dist && git add dist/"
      },
      version: "6.4.0"
    };
  }, {} ],
  83: [ function(require, module, exports) {
    function EventEmitter() {
      this._events = this._events || {};
      this._maxListeners = this._maxListeners || void 0;
    }
    module.exports = EventEmitter;
    EventEmitter.EventEmitter = EventEmitter;
    EventEmitter.prototype._events = void 0;
    EventEmitter.prototype._maxListeners = void 0;
    EventEmitter.defaultMaxListeners = 10;
    EventEmitter.prototype.setMaxListeners = function(n) {
      if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError("n must be a positive number");
      this._maxListeners = n;
      return this;
    };
    EventEmitter.prototype.emit = function(type) {
      var er, handler, len, args, i, listeners;
      this._events || (this._events = {});
      if ("error" === type && (!this._events.error || isObject(this._events.error) && !this._events.error.length)) {
        er = arguments[1];
        if (er instanceof Error) throw er;
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ")");
        err.context = er;
        throw err;
      }
      handler = this._events[type];
      if (isUndefined(handler)) return false;
      if (isFunction(handler)) switch (arguments.length) {
       case 1:
        handler.call(this);
        break;

       case 2:
        handler.call(this, arguments[1]);
        break;

       case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;

       default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
      } else if (isObject(handler)) {
        args = Array.prototype.slice.call(arguments, 1);
        listeners = handler.slice();
        len = listeners.length;
        for (i = 0; i < len; i++) listeners[i].apply(this, args);
      }
      return true;
    };
    EventEmitter.prototype.addListener = function(type, listener) {
      var m;
      if (!isFunction(listener)) throw TypeError("listener must be a function");
      this._events || (this._events = {});
      this._events.newListener && this.emit("newListener", type, isFunction(listener.listener) ? listener.listener : listener);
      this._events[type] ? isObject(this._events[type]) ? this._events[type].push(listener) : this._events[type] = [ this._events[type], listener ] : this._events[type] = listener;
      if (isObject(this._events[type]) && !this._events[type].warned) {
        m = isUndefined(this._maxListeners) ? EventEmitter.defaultMaxListeners : this._maxListeners;
        if (m && m > 0 && this._events[type].length > m) {
          this._events[type].warned = true;
          console.error("(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.", this._events[type].length);
          "function" === typeof console.trace && console.trace();
        }
      }
      return this;
    };
    EventEmitter.prototype.on = EventEmitter.prototype.addListener;
    EventEmitter.prototype.once = function(type, listener) {
      if (!isFunction(listener)) throw TypeError("listener must be a function");
      var fired = false;
      function g() {
        this.removeListener(type, g);
        if (!fired) {
          fired = true;
          listener.apply(this, arguments);
        }
      }
      g.listener = listener;
      this.on(type, g);
      return this;
    };
    EventEmitter.prototype.removeListener = function(type, listener) {
      var list, position, length, i;
      if (!isFunction(listener)) throw TypeError("listener must be a function");
      if (!this._events || !this._events[type]) return this;
      list = this._events[type];
      length = list.length;
      position = -1;
      if (list === listener || isFunction(list.listener) && list.listener === listener) {
        delete this._events[type];
        this._events.removeListener && this.emit("removeListener", type, listener);
      } else if (isObject(list)) {
        for (i = length; i-- > 0; ) if (list[i] === listener || list[i].listener && list[i].listener === listener) {
          position = i;
          break;
        }
        if (position < 0) return this;
        if (1 === list.length) {
          list.length = 0;
          delete this._events[type];
        } else list.splice(position, 1);
        this._events.removeListener && this.emit("removeListener", type, listener);
      }
      return this;
    };
    EventEmitter.prototype.removeAllListeners = function(type) {
      var key, listeners;
      if (!this._events) return this;
      if (!this._events.removeListener) {
        0 === arguments.length ? this._events = {} : this._events[type] && delete this._events[type];
        return this;
      }
      if (0 === arguments.length) {
        for (key in this._events) {
          if ("removeListener" === key) continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners("removeListener");
        this._events = {};
        return this;
      }
      listeners = this._events[type];
      if (isFunction(listeners)) this.removeListener(type, listeners); else if (listeners) while (listeners.length) this.removeListener(type, listeners[listeners.length - 1]);
      delete this._events[type];
      return this;
    };
    EventEmitter.prototype.listeners = function(type) {
      var ret;
      ret = this._events && this._events[type] ? isFunction(this._events[type]) ? [ this._events[type] ] : this._events[type].slice() : [];
      return ret;
    };
    EventEmitter.prototype.listenerCount = function(type) {
      if (this._events) {
        var evlistener = this._events[type];
        if (isFunction(evlistener)) return 1;
        if (evlistener) return evlistener.length;
      }
      return 0;
    };
    EventEmitter.listenerCount = function(emitter, type) {
      return emitter.listenerCount(type);
    };
    function isFunction(arg) {
      return "function" === typeof arg;
    }
    function isNumber(arg) {
      return "number" === typeof arg;
    }
    function isObject(arg) {
      return "object" === typeof arg && null !== arg;
    }
    function isUndefined(arg) {
      return void 0 === arg;
    }
  }, {} ],
  84: [ function(require, module, exports) {
    var Buffer = require("safe-buffer").Buffer;
    var MD5 = require("md5.js");
    function EVP_BytesToKey(password, salt, keyBits, ivLen) {
      Buffer.isBuffer(password) || (password = Buffer.from(password, "binary"));
      if (salt) {
        Buffer.isBuffer(salt) || (salt = Buffer.from(salt, "binary"));
        if (8 !== salt.length) throw new RangeError("salt should be Buffer with 8 byte length");
      }
      var keyLen = keyBits / 8;
      var key = Buffer.alloc(keyLen);
      var iv = Buffer.alloc(ivLen || 0);
      var tmp = Buffer.alloc(0);
      while (keyLen > 0 || ivLen > 0) {
        var hash = new MD5();
        hash.update(tmp);
        hash.update(password);
        salt && hash.update(salt);
        tmp = hash.digest();
        var used = 0;
        if (keyLen > 0) {
          var keyStart = key.length - keyLen;
          used = Math.min(keyLen, tmp.length);
          tmp.copy(key, keyStart, 0, used);
          keyLen -= used;
        }
        if (used < tmp.length && ivLen > 0) {
          var ivStart = iv.length - ivLen;
          var length = Math.min(ivLen, tmp.length - used);
          tmp.copy(iv, ivStart, used, used + length);
          ivLen -= length;
        }
      }
      tmp.fill(0);
      return {
        key: key,
        iv: iv
      };
    }
    module.exports = EVP_BytesToKey;
  }, {
    "md5.js": 103,
    "safe-buffer": 144
  } ],
  85: [ function(require, module, exports) {
    "use strict";
    var Buffer = require("safe-buffer").Buffer;
    var Transform = require("stream").Transform;
    var inherits = require("inherits");
    function throwIfNotStringOrBuffer(val, prefix) {
      if (!Buffer.isBuffer(val) && "string" !== typeof val) throw new TypeError(prefix + " must be a string or a buffer");
    }
    function HashBase(blockSize) {
      Transform.call(this);
      this._block = Buffer.allocUnsafe(blockSize);
      this._blockSize = blockSize;
      this._blockOffset = 0;
      this._length = [ 0, 0, 0, 0 ];
      this._finalized = false;
    }
    inherits(HashBase, Transform);
    HashBase.prototype._transform = function(chunk, encoding, callback) {
      var error = null;
      try {
        this.update(chunk, encoding);
      } catch (err) {
        error = err;
      }
      callback(error);
    };
    HashBase.prototype._flush = function(callback) {
      var error = null;
      try {
        this.push(this.digest());
      } catch (err) {
        error = err;
      }
      callback(error);
    };
    HashBase.prototype.update = function(data, encoding) {
      throwIfNotStringOrBuffer(data, "Data");
      if (this._finalized) throw new Error("Digest already called");
      Buffer.isBuffer(data) || (data = Buffer.from(data, encoding));
      var block = this._block;
      var offset = 0;
      while (this._blockOffset + data.length - offset >= this._blockSize) {
        for (var i = this._blockOffset; i < this._blockSize; ) block[i++] = data[offset++];
        this._update();
        this._blockOffset = 0;
      }
      while (offset < data.length) block[this._blockOffset++] = data[offset++];
      for (var j = 0, carry = 8 * data.length; carry > 0; ++j) {
        this._length[j] += carry;
        carry = this._length[j] / 4294967296 | 0;
        carry > 0 && (this._length[j] -= 4294967296 * carry);
      }
      return this;
    };
    HashBase.prototype._update = function() {
      throw new Error("_update is not implemented");
    };
    HashBase.prototype.digest = function(encoding) {
      if (this._finalized) throw new Error("Digest already called");
      this._finalized = true;
      var digest = this._digest();
      void 0 !== encoding && (digest = digest.toString(encoding));
      this._block.fill(0);
      this._blockOffset = 0;
      for (var i = 0; i < 4; ++i) this._length[i] = 0;
      return digest;
    };
    HashBase.prototype._digest = function() {
      throw new Error("_digest is not implemented");
    };
    module.exports = HashBase;
  }, {
    inherits: 101,
    "safe-buffer": 144,
    stream: 153
  } ],
  86: [ function(require, module, exports) {
    var hash = exports;
    hash.utils = require("./hash/utils");
    hash.common = require("./hash/common");
    hash.sha = require("./hash/sha");
    hash.ripemd = require("./hash/ripemd");
    hash.hmac = require("./hash/hmac");
    hash.sha1 = hash.sha.sha1;
    hash.sha256 = hash.sha.sha256;
    hash.sha224 = hash.sha.sha224;
    hash.sha384 = hash.sha.sha384;
    hash.sha512 = hash.sha.sha512;
    hash.ripemd160 = hash.ripemd.ripemd160;
  }, {
    "./hash/common": 87,
    "./hash/hmac": 88,
    "./hash/ripemd": 89,
    "./hash/sha": 90,
    "./hash/utils": 97
  } ],
  87: [ function(require, module, exports) {
    "use strict";
    var utils = require("./utils");
    var assert = require("minimalistic-assert");
    function BlockHash() {
      this.pending = null;
      this.pendingTotal = 0;
      this.blockSize = this.constructor.blockSize;
      this.outSize = this.constructor.outSize;
      this.hmacStrength = this.constructor.hmacStrength;
      this.padLength = this.constructor.padLength / 8;
      this.endian = "big";
      this._delta8 = this.blockSize / 8;
      this._delta32 = this.blockSize / 32;
    }
    exports.BlockHash = BlockHash;
    BlockHash.prototype.update = function update(msg, enc) {
      msg = utils.toArray(msg, enc);
      this.pending ? this.pending = this.pending.concat(msg) : this.pending = msg;
      this.pendingTotal += msg.length;
      if (this.pending.length >= this._delta8) {
        msg = this.pending;
        var r = msg.length % this._delta8;
        this.pending = msg.slice(msg.length - r, msg.length);
        0 === this.pending.length && (this.pending = null);
        msg = utils.join32(msg, 0, msg.length - r, this.endian);
        for (var i = 0; i < msg.length; i += this._delta32) this._update(msg, i, i + this._delta32);
      }
      return this;
    };
    BlockHash.prototype.digest = function digest(enc) {
      this.update(this._pad());
      assert(null === this.pending);
      return this._digest(enc);
    };
    BlockHash.prototype._pad = function pad() {
      var len = this.pendingTotal;
      var bytes = this._delta8;
      var k = bytes - (len + this.padLength) % bytes;
      var res = new Array(k + this.padLength);
      res[0] = 128;
      for (var i = 1; i < k; i++) res[i] = 0;
      len <<= 3;
      if ("big" === this.endian) {
        for (var t = 8; t < this.padLength; t++) res[i++] = 0;
        res[i++] = 0;
        res[i++] = 0;
        res[i++] = 0;
        res[i++] = 0;
        res[i++] = len >>> 24 & 255;
        res[i++] = len >>> 16 & 255;
        res[i++] = len >>> 8 & 255;
        res[i++] = 255 & len;
      } else {
        res[i++] = 255 & len;
        res[i++] = len >>> 8 & 255;
        res[i++] = len >>> 16 & 255;
        res[i++] = len >>> 24 & 255;
        res[i++] = 0;
        res[i++] = 0;
        res[i++] = 0;
        res[i++] = 0;
        for (t = 8; t < this.padLength; t++) res[i++] = 0;
      }
      return res;
    };
  }, {
    "./utils": 97,
    "minimalistic-assert": 105
  } ],
  88: [ function(require, module, exports) {
    "use strict";
    var utils = require("./utils");
    var assert = require("minimalistic-assert");
    function Hmac(hash, key, enc) {
      if (!(this instanceof Hmac)) return new Hmac(hash, key, enc);
      this.Hash = hash;
      this.blockSize = hash.blockSize / 8;
      this.outSize = hash.outSize / 8;
      this.inner = null;
      this.outer = null;
      this._init(utils.toArray(key, enc));
    }
    module.exports = Hmac;
    Hmac.prototype._init = function init(key) {
      key.length > this.blockSize && (key = new this.Hash().update(key).digest());
      assert(key.length <= this.blockSize);
      for (var i = key.length; i < this.blockSize; i++) key.push(0);
      for (i = 0; i < key.length; i++) key[i] ^= 54;
      this.inner = new this.Hash().update(key);
      for (i = 0; i < key.length; i++) key[i] ^= 106;
      this.outer = new this.Hash().update(key);
    };
    Hmac.prototype.update = function update(msg, enc) {
      this.inner.update(msg, enc);
      return this;
    };
    Hmac.prototype.digest = function digest(enc) {
      this.outer.update(this.inner.digest());
      return this.outer.digest(enc);
    };
  }, {
    "./utils": 97,
    "minimalistic-assert": 105
  } ],
  89: [ function(require, module, exports) {
    "use strict";
    var utils = require("./utils");
    var common = require("./common");
    var rotl32 = utils.rotl32;
    var sum32 = utils.sum32;
    var sum32_3 = utils.sum32_3;
    var sum32_4 = utils.sum32_4;
    var BlockHash = common.BlockHash;
    function RIPEMD160() {
      if (!(this instanceof RIPEMD160)) return new RIPEMD160();
      BlockHash.call(this);
      this.h = [ 1732584193, 4023233417, 2562383102, 271733878, 3285377520 ];
      this.endian = "little";
    }
    utils.inherits(RIPEMD160, BlockHash);
    exports.ripemd160 = RIPEMD160;
    RIPEMD160.blockSize = 512;
    RIPEMD160.outSize = 160;
    RIPEMD160.hmacStrength = 192;
    RIPEMD160.padLength = 64;
    RIPEMD160.prototype._update = function update(msg, start) {
      var A = this.h[0];
      var B = this.h[1];
      var C = this.h[2];
      var D = this.h[3];
      var E = this.h[4];
      var Ah = A;
      var Bh = B;
      var Ch = C;
      var Dh = D;
      var Eh = E;
      for (var j = 0; j < 80; j++) {
        var T = sum32(rotl32(sum32_4(A, f(j, B, C, D), msg[r[j] + start], K(j)), s[j]), E);
        A = E;
        E = D;
        D = rotl32(C, 10);
        C = B;
        B = T;
        T = sum32(rotl32(sum32_4(Ah, f(79 - j, Bh, Ch, Dh), msg[rh[j] + start], Kh(j)), sh[j]), Eh);
        Ah = Eh;
        Eh = Dh;
        Dh = rotl32(Ch, 10);
        Ch = Bh;
        Bh = T;
      }
      T = sum32_3(this.h[1], C, Dh);
      this.h[1] = sum32_3(this.h[2], D, Eh);
      this.h[2] = sum32_3(this.h[3], E, Ah);
      this.h[3] = sum32_3(this.h[4], A, Bh);
      this.h[4] = sum32_3(this.h[0], B, Ch);
      this.h[0] = T;
    };
    RIPEMD160.prototype._digest = function digest(enc) {
      return "hex" === enc ? utils.toHex32(this.h, "little") : utils.split32(this.h, "little");
    };
    function f(j, x, y, z) {
      return j <= 15 ? x ^ y ^ z : j <= 31 ? x & y | ~x & z : j <= 47 ? (x | ~y) ^ z : j <= 63 ? x & z | y & ~z : x ^ (y | ~z);
    }
    function K(j) {
      return j <= 15 ? 0 : j <= 31 ? 1518500249 : j <= 47 ? 1859775393 : j <= 63 ? 2400959708 : 2840853838;
    }
    function Kh(j) {
      return j <= 15 ? 1352829926 : j <= 31 ? 1548603684 : j <= 47 ? 1836072691 : j <= 63 ? 2053994217 : 0;
    }
    var r = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8, 3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2, 4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13 ];
    var rh = [ 5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2, 15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14, 12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11 ];
    var s = [ 11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12, 11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12, 9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6 ];
    var sh = [ 8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11, 9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8, 8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11 ];
  }, {
    "./common": 87,
    "./utils": 97
  } ],
  90: [ function(require, module, exports) {
    "use strict";
    exports.sha1 = require("./sha/1");
    exports.sha224 = require("./sha/224");
    exports.sha256 = require("./sha/256");
    exports.sha384 = require("./sha/384");
    exports.sha512 = require("./sha/512");
  }, {
    "./sha/1": 91,
    "./sha/224": 92,
    "./sha/256": 93,
    "./sha/384": 94,
    "./sha/512": 95
  } ],
  91: [ function(require, module, exports) {
    "use strict";
    var utils = require("../utils");
    var common = require("../common");
    var shaCommon = require("./common");
    var rotl32 = utils.rotl32;
    var sum32 = utils.sum32;
    var sum32_5 = utils.sum32_5;
    var ft_1 = shaCommon.ft_1;
    var BlockHash = common.BlockHash;
    var sha1_K = [ 1518500249, 1859775393, 2400959708, 3395469782 ];
    function SHA1() {
      if (!(this instanceof SHA1)) return new SHA1();
      BlockHash.call(this);
      this.h = [ 1732584193, 4023233417, 2562383102, 271733878, 3285377520 ];
      this.W = new Array(80);
    }
    utils.inherits(SHA1, BlockHash);
    module.exports = SHA1;
    SHA1.blockSize = 512;
    SHA1.outSize = 160;
    SHA1.hmacStrength = 80;
    SHA1.padLength = 64;
    SHA1.prototype._update = function _update(msg, start) {
      var W = this.W;
      for (var i = 0; i < 16; i++) W[i] = msg[start + i];
      for (;i < W.length; i++) W[i] = rotl32(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
      var a = this.h[0];
      var b = this.h[1];
      var c = this.h[2];
      var d = this.h[3];
      var e = this.h[4];
      for (i = 0; i < W.length; i++) {
        var s = ~~(i / 20);
        var t = sum32_5(rotl32(a, 5), ft_1(s, b, c, d), e, W[i], sha1_K[s]);
        e = d;
        d = c;
        c = rotl32(b, 30);
        b = a;
        a = t;
      }
      this.h[0] = sum32(this.h[0], a);
      this.h[1] = sum32(this.h[1], b);
      this.h[2] = sum32(this.h[2], c);
      this.h[3] = sum32(this.h[3], d);
      this.h[4] = sum32(this.h[4], e);
    };
    SHA1.prototype._digest = function digest(enc) {
      return "hex" === enc ? utils.toHex32(this.h, "big") : utils.split32(this.h, "big");
    };
  }, {
    "../common": 87,
    "../utils": 97,
    "./common": 96
  } ],
  92: [ function(require, module, exports) {
    "use strict";
    var utils = require("../utils");
    var SHA256 = require("./256");
    function SHA224() {
      if (!(this instanceof SHA224)) return new SHA224();
      SHA256.call(this);
      this.h = [ 3238371032, 914150663, 812702999, 4144912697, 4290775857, 1750603025, 1694076839, 3204075428 ];
    }
    utils.inherits(SHA224, SHA256);
    module.exports = SHA224;
    SHA224.blockSize = 512;
    SHA224.outSize = 224;
    SHA224.hmacStrength = 192;
    SHA224.padLength = 64;
    SHA224.prototype._digest = function digest(enc) {
      return "hex" === enc ? utils.toHex32(this.h.slice(0, 7), "big") : utils.split32(this.h.slice(0, 7), "big");
    };
  }, {
    "../utils": 97,
    "./256": 93
  } ],
  93: [ function(require, module, exports) {
    "use strict";
    var utils = require("../utils");
    var common = require("../common");
    var shaCommon = require("./common");
    var assert = require("minimalistic-assert");
    var sum32 = utils.sum32;
    var sum32_4 = utils.sum32_4;
    var sum32_5 = utils.sum32_5;
    var ch32 = shaCommon.ch32;
    var maj32 = shaCommon.maj32;
    var s0_256 = shaCommon.s0_256;
    var s1_256 = shaCommon.s1_256;
    var g0_256 = shaCommon.g0_256;
    var g1_256 = shaCommon.g1_256;
    var BlockHash = common.BlockHash;
    var sha256_K = [ 1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298 ];
    function SHA256() {
      if (!(this instanceof SHA256)) return new SHA256();
      BlockHash.call(this);
      this.h = [ 1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225 ];
      this.k = sha256_K;
      this.W = new Array(64);
    }
    utils.inherits(SHA256, BlockHash);
    module.exports = SHA256;
    SHA256.blockSize = 512;
    SHA256.outSize = 256;
    SHA256.hmacStrength = 192;
    SHA256.padLength = 64;
    SHA256.prototype._update = function _update(msg, start) {
      var W = this.W;
      for (var i = 0; i < 16; i++) W[i] = msg[start + i];
      for (;i < W.length; i++) W[i] = sum32_4(g1_256(W[i - 2]), W[i - 7], g0_256(W[i - 15]), W[i - 16]);
      var a = this.h[0];
      var b = this.h[1];
      var c = this.h[2];
      var d = this.h[3];
      var e = this.h[4];
      var f = this.h[5];
      var g = this.h[6];
      var h = this.h[7];
      assert(this.k.length === W.length);
      for (i = 0; i < W.length; i++) {
        var T1 = sum32_5(h, s1_256(e), ch32(e, f, g), this.k[i], W[i]);
        var T2 = sum32(s0_256(a), maj32(a, b, c));
        h = g;
        g = f;
        f = e;
        e = sum32(d, T1);
        d = c;
        c = b;
        b = a;
        a = sum32(T1, T2);
      }
      this.h[0] = sum32(this.h[0], a);
      this.h[1] = sum32(this.h[1], b);
      this.h[2] = sum32(this.h[2], c);
      this.h[3] = sum32(this.h[3], d);
      this.h[4] = sum32(this.h[4], e);
      this.h[5] = sum32(this.h[5], f);
      this.h[6] = sum32(this.h[6], g);
      this.h[7] = sum32(this.h[7], h);
    };
    SHA256.prototype._digest = function digest(enc) {
      return "hex" === enc ? utils.toHex32(this.h, "big") : utils.split32(this.h, "big");
    };
  }, {
    "../common": 87,
    "../utils": 97,
    "./common": 96,
    "minimalistic-assert": 105
  } ],
  94: [ function(require, module, exports) {
    "use strict";
    var utils = require("../utils");
    var SHA512 = require("./512");
    function SHA384() {
      if (!(this instanceof SHA384)) return new SHA384();
      SHA512.call(this);
      this.h = [ 3418070365, 3238371032, 1654270250, 914150663, 2438529370, 812702999, 355462360, 4144912697, 1731405415, 4290775857, 2394180231, 1750603025, 3675008525, 1694076839, 1203062813, 3204075428 ];
    }
    utils.inherits(SHA384, SHA512);
    module.exports = SHA384;
    SHA384.blockSize = 1024;
    SHA384.outSize = 384;
    SHA384.hmacStrength = 192;
    SHA384.padLength = 128;
    SHA384.prototype._digest = function digest(enc) {
      return "hex" === enc ? utils.toHex32(this.h.slice(0, 12), "big") : utils.split32(this.h.slice(0, 12), "big");
    };
  }, {
    "../utils": 97,
    "./512": 95
  } ],
  95: [ function(require, module, exports) {
    "use strict";
    var utils = require("../utils");
    var common = require("../common");
    var assert = require("minimalistic-assert");
    var rotr64_hi = utils.rotr64_hi;
    var rotr64_lo = utils.rotr64_lo;
    var shr64_hi = utils.shr64_hi;
    var shr64_lo = utils.shr64_lo;
    var sum64 = utils.sum64;
    var sum64_hi = utils.sum64_hi;
    var sum64_lo = utils.sum64_lo;
    var sum64_4_hi = utils.sum64_4_hi;
    var sum64_4_lo = utils.sum64_4_lo;
    var sum64_5_hi = utils.sum64_5_hi;
    var sum64_5_lo = utils.sum64_5_lo;
    var BlockHash = common.BlockHash;
    var sha512_K = [ 1116352408, 3609767458, 1899447441, 602891725, 3049323471, 3964484399, 3921009573, 2173295548, 961987163, 4081628472, 1508970993, 3053834265, 2453635748, 2937671579, 2870763221, 3664609560, 3624381080, 2734883394, 310598401, 1164996542, 607225278, 1323610764, 1426881987, 3590304994, 1925078388, 4068182383, 2162078206, 991336113, 2614888103, 633803317, 3248222580, 3479774868, 3835390401, 2666613458, 4022224774, 944711139, 264347078, 2341262773, 604807628, 2007800933, 770255983, 1495990901, 1249150122, 1856431235, 1555081692, 3175218132, 1996064986, 2198950837, 2554220882, 3999719339, 2821834349, 766784016, 2952996808, 2566594879, 3210313671, 3203337956, 3336571891, 1034457026, 3584528711, 2466948901, 113926993, 3758326383, 338241895, 168717936, 666307205, 1188179964, 773529912, 1546045734, 1294757372, 1522805485, 1396182291, 2643833823, 1695183700, 2343527390, 1986661051, 1014477480, 2177026350, 1206759142, 2456956037, 344077627, 2730485921, 1290863460, 2820302411, 3158454273, 3259730800, 3505952657, 3345764771, 106217008, 3516065817, 3606008344, 3600352804, 1432725776, 4094571909, 1467031594, 275423344, 851169720, 430227734, 3100823752, 506948616, 1363258195, 659060556, 3750685593, 883997877, 3785050280, 958139571, 3318307427, 1322822218, 3812723403, 1537002063, 2003034995, 1747873779, 3602036899, 1955562222, 1575990012, 2024104815, 1125592928, 2227730452, 2716904306, 2361852424, 442776044, 2428436474, 593698344, 2756734187, 3733110249, 3204031479, 2999351573, 3329325298, 3815920427, 3391569614, 3928383900, 3515267271, 566280711, 3940187606, 3454069534, 4118630271, 4000239992, 116418474, 1914138554, 174292421, 2731055270, 289380356, 3203993006, 460393269, 320620315, 685471733, 587496836, 852142971, 1086792851, 1017036298, 365543100, 1126000580, 2618297676, 1288033470, 3409855158, 1501505948, 4234509866, 1607167915, 987167468, 1816402316, 1246189591 ];
    function SHA512() {
      if (!(this instanceof SHA512)) return new SHA512();
      BlockHash.call(this);
      this.h = [ 1779033703, 4089235720, 3144134277, 2227873595, 1013904242, 4271175723, 2773480762, 1595750129, 1359893119, 2917565137, 2600822924, 725511199, 528734635, 4215389547, 1541459225, 327033209 ];
      this.k = sha512_K;
      this.W = new Array(160);
    }
    utils.inherits(SHA512, BlockHash);
    module.exports = SHA512;
    SHA512.blockSize = 1024;
    SHA512.outSize = 512;
    SHA512.hmacStrength = 192;
    SHA512.padLength = 128;
    SHA512.prototype._prepareBlock = function _prepareBlock(msg, start) {
      var W = this.W;
      for (var i = 0; i < 32; i++) W[i] = msg[start + i];
      for (;i < W.length; i += 2) {
        var c0_hi = g1_512_hi(W[i - 4], W[i - 3]);
        var c0_lo = g1_512_lo(W[i - 4], W[i - 3]);
        var c1_hi = W[i - 14];
        var c1_lo = W[i - 13];
        var c2_hi = g0_512_hi(W[i - 30], W[i - 29]);
        var c2_lo = g0_512_lo(W[i - 30], W[i - 29]);
        var c3_hi = W[i - 32];
        var c3_lo = W[i - 31];
        W[i] = sum64_4_hi(c0_hi, c0_lo, c1_hi, c1_lo, c2_hi, c2_lo, c3_hi, c3_lo);
        W[i + 1] = sum64_4_lo(c0_hi, c0_lo, c1_hi, c1_lo, c2_hi, c2_lo, c3_hi, c3_lo);
      }
    };
    SHA512.prototype._update = function _update(msg, start) {
      this._prepareBlock(msg, start);
      var W = this.W;
      var ah = this.h[0];
      var al = this.h[1];
      var bh = this.h[2];
      var bl = this.h[3];
      var ch = this.h[4];
      var cl = this.h[5];
      var dh = this.h[6];
      var dl = this.h[7];
      var eh = this.h[8];
      var el = this.h[9];
      var fh = this.h[10];
      var fl = this.h[11];
      var gh = this.h[12];
      var gl = this.h[13];
      var hh = this.h[14];
      var hl = this.h[15];
      assert(this.k.length === W.length);
      for (var i = 0; i < W.length; i += 2) {
        var c0_hi = hh;
        var c0_lo = hl;
        var c1_hi = s1_512_hi(eh, el);
        var c1_lo = s1_512_lo(eh, el);
        var c2_hi = ch64_hi(eh, el, fh, fl, gh, gl);
        var c2_lo = ch64_lo(eh, el, fh, fl, gh, gl);
        var c3_hi = this.k[i];
        var c3_lo = this.k[i + 1];
        var c4_hi = W[i];
        var c4_lo = W[i + 1];
        var T1_hi = sum64_5_hi(c0_hi, c0_lo, c1_hi, c1_lo, c2_hi, c2_lo, c3_hi, c3_lo, c4_hi, c4_lo);
        var T1_lo = sum64_5_lo(c0_hi, c0_lo, c1_hi, c1_lo, c2_hi, c2_lo, c3_hi, c3_lo, c4_hi, c4_lo);
        c0_hi = s0_512_hi(ah, al);
        c0_lo = s0_512_lo(ah, al);
        c1_hi = maj64_hi(ah, al, bh, bl, ch, cl);
        c1_lo = maj64_lo(ah, al, bh, bl, ch, cl);
        var T2_hi = sum64_hi(c0_hi, c0_lo, c1_hi, c1_lo);
        var T2_lo = sum64_lo(c0_hi, c0_lo, c1_hi, c1_lo);
        hh = gh;
        hl = gl;
        gh = fh;
        gl = fl;
        fh = eh;
        fl = el;
        eh = sum64_hi(dh, dl, T1_hi, T1_lo);
        el = sum64_lo(dl, dl, T1_hi, T1_lo);
        dh = ch;
        dl = cl;
        ch = bh;
        cl = bl;
        bh = ah;
        bl = al;
        ah = sum64_hi(T1_hi, T1_lo, T2_hi, T2_lo);
        al = sum64_lo(T1_hi, T1_lo, T2_hi, T2_lo);
      }
      sum64(this.h, 0, ah, al);
      sum64(this.h, 2, bh, bl);
      sum64(this.h, 4, ch, cl);
      sum64(this.h, 6, dh, dl);
      sum64(this.h, 8, eh, el);
      sum64(this.h, 10, fh, fl);
      sum64(this.h, 12, gh, gl);
      sum64(this.h, 14, hh, hl);
    };
    SHA512.prototype._digest = function digest(enc) {
      return "hex" === enc ? utils.toHex32(this.h, "big") : utils.split32(this.h, "big");
    };
    function ch64_hi(xh, xl, yh, yl, zh) {
      var r = xh & yh ^ ~xh & zh;
      r < 0 && (r += 4294967296);
      return r;
    }
    function ch64_lo(xh, xl, yh, yl, zh, zl) {
      var r = xl & yl ^ ~xl & zl;
      r < 0 && (r += 4294967296);
      return r;
    }
    function maj64_hi(xh, xl, yh, yl, zh) {
      var r = xh & yh ^ xh & zh ^ yh & zh;
      r < 0 && (r += 4294967296);
      return r;
    }
    function maj64_lo(xh, xl, yh, yl, zh, zl) {
      var r = xl & yl ^ xl & zl ^ yl & zl;
      r < 0 && (r += 4294967296);
      return r;
    }
    function s0_512_hi(xh, xl) {
      var c0_hi = rotr64_hi(xh, xl, 28);
      var c1_hi = rotr64_hi(xl, xh, 2);
      var c2_hi = rotr64_hi(xl, xh, 7);
      var r = c0_hi ^ c1_hi ^ c2_hi;
      r < 0 && (r += 4294967296);
      return r;
    }
    function s0_512_lo(xh, xl) {
      var c0_lo = rotr64_lo(xh, xl, 28);
      var c1_lo = rotr64_lo(xl, xh, 2);
      var c2_lo = rotr64_lo(xl, xh, 7);
      var r = c0_lo ^ c1_lo ^ c2_lo;
      r < 0 && (r += 4294967296);
      return r;
    }
    function s1_512_hi(xh, xl) {
      var c0_hi = rotr64_hi(xh, xl, 14);
      var c1_hi = rotr64_hi(xh, xl, 18);
      var c2_hi = rotr64_hi(xl, xh, 9);
      var r = c0_hi ^ c1_hi ^ c2_hi;
      r < 0 && (r += 4294967296);
      return r;
    }
    function s1_512_lo(xh, xl) {
      var c0_lo = rotr64_lo(xh, xl, 14);
      var c1_lo = rotr64_lo(xh, xl, 18);
      var c2_lo = rotr64_lo(xl, xh, 9);
      var r = c0_lo ^ c1_lo ^ c2_lo;
      r < 0 && (r += 4294967296);
      return r;
    }
    function g0_512_hi(xh, xl) {
      var c0_hi = rotr64_hi(xh, xl, 1);
      var c1_hi = rotr64_hi(xh, xl, 8);
      var c2_hi = shr64_hi(xh, xl, 7);
      var r = c0_hi ^ c1_hi ^ c2_hi;
      r < 0 && (r += 4294967296);
      return r;
    }
    function g0_512_lo(xh, xl) {
      var c0_lo = rotr64_lo(xh, xl, 1);
      var c1_lo = rotr64_lo(xh, xl, 8);
      var c2_lo = shr64_lo(xh, xl, 7);
      var r = c0_lo ^ c1_lo ^ c2_lo;
      r < 0 && (r += 4294967296);
      return r;
    }
    function g1_512_hi(xh, xl) {
      var c0_hi = rotr64_hi(xh, xl, 19);
      var c1_hi = rotr64_hi(xl, xh, 29);
      var c2_hi = shr64_hi(xh, xl, 6);
      var r = c0_hi ^ c1_hi ^ c2_hi;
      r < 0 && (r += 4294967296);
      return r;
    }
    function g1_512_lo(xh, xl) {
      var c0_lo = rotr64_lo(xh, xl, 19);
      var c1_lo = rotr64_lo(xl, xh, 29);
      var c2_lo = shr64_lo(xh, xl, 6);
      var r = c0_lo ^ c1_lo ^ c2_lo;
      r < 0 && (r += 4294967296);
      return r;
    }
  }, {
    "../common": 87,
    "../utils": 97,
    "minimalistic-assert": 105
  } ],
  96: [ function(require, module, exports) {
    "use strict";
    var utils = require("../utils");
    var rotr32 = utils.rotr32;
    function ft_1(s, x, y, z) {
      if (0 === s) return ch32(x, y, z);
      if (1 === s || 3 === s) return p32(x, y, z);
      if (2 === s) return maj32(x, y, z);
    }
    exports.ft_1 = ft_1;
    function ch32(x, y, z) {
      return x & y ^ ~x & z;
    }
    exports.ch32 = ch32;
    function maj32(x, y, z) {
      return x & y ^ x & z ^ y & z;
    }
    exports.maj32 = maj32;
    function p32(x, y, z) {
      return x ^ y ^ z;
    }
    exports.p32 = p32;
    function s0_256(x) {
      return rotr32(x, 2) ^ rotr32(x, 13) ^ rotr32(x, 22);
    }
    exports.s0_256 = s0_256;
    function s1_256(x) {
      return rotr32(x, 6) ^ rotr32(x, 11) ^ rotr32(x, 25);
    }
    exports.s1_256 = s1_256;
    function g0_256(x) {
      return rotr32(x, 7) ^ rotr32(x, 18) ^ x >>> 3;
    }
    exports.g0_256 = g0_256;
    function g1_256(x) {
      return rotr32(x, 17) ^ rotr32(x, 19) ^ x >>> 10;
    }
    exports.g1_256 = g1_256;
  }, {
    "../utils": 97
  } ],
  97: [ function(require, module, exports) {
    "use strict";
    var assert = require("minimalistic-assert");
    var inherits = require("inherits");
    exports.inherits = inherits;
    function toArray(msg, enc) {
      if (Array.isArray(msg)) return msg.slice();
      if (!msg) return [];
      var res = [];
      if ("string" === typeof msg) if (enc) {
        if ("hex" === enc) {
          msg = msg.replace(/[^a-z0-9]+/gi, "");
          msg.length % 2 !== 0 && (msg = "0" + msg);
          for (i = 0; i < msg.length; i += 2) res.push(parseInt(msg[i] + msg[i + 1], 16));
        }
      } else for (var i = 0; i < msg.length; i++) {
        var c = msg.charCodeAt(i);
        var hi = c >> 8;
        var lo = 255 & c;
        hi ? res.push(hi, lo) : res.push(lo);
      } else for (i = 0; i < msg.length; i++) res[i] = 0 | msg[i];
      return res;
    }
    exports.toArray = toArray;
    function toHex(msg) {
      var res = "";
      for (var i = 0; i < msg.length; i++) res += zero2(msg[i].toString(16));
      return res;
    }
    exports.toHex = toHex;
    function htonl(w) {
      var res = w >>> 24 | w >>> 8 & 65280 | w << 8 & 16711680 | (255 & w) << 24;
      return res >>> 0;
    }
    exports.htonl = htonl;
    function toHex32(msg, endian) {
      var res = "";
      for (var i = 0; i < msg.length; i++) {
        var w = msg[i];
        "little" === endian && (w = htonl(w));
        res += zero8(w.toString(16));
      }
      return res;
    }
    exports.toHex32 = toHex32;
    function zero2(word) {
      return 1 === word.length ? "0" + word : word;
    }
    exports.zero2 = zero2;
    function zero8(word) {
      return 7 === word.length ? "0" + word : 6 === word.length ? "00" + word : 5 === word.length ? "000" + word : 4 === word.length ? "0000" + word : 3 === word.length ? "00000" + word : 2 === word.length ? "000000" + word : 1 === word.length ? "0000000" + word : word;
    }
    exports.zero8 = zero8;
    function join32(msg, start, end, endian) {
      var len = end - start;
      assert(len % 4 === 0);
      var res = new Array(len / 4);
      for (var i = 0, k = start; i < res.length; i++, k += 4) {
        var w;
        w = "big" === endian ? msg[k] << 24 | msg[k + 1] << 16 | msg[k + 2] << 8 | msg[k + 3] : msg[k + 3] << 24 | msg[k + 2] << 16 | msg[k + 1] << 8 | msg[k];
        res[i] = w >>> 0;
      }
      return res;
    }
    exports.join32 = join32;
    function split32(msg, endian) {
      var res = new Array(4 * msg.length);
      for (var i = 0, k = 0; i < msg.length; i++, k += 4) {
        var m = msg[i];
        if ("big" === endian) {
          res[k] = m >>> 24;
          res[k + 1] = m >>> 16 & 255;
          res[k + 2] = m >>> 8 & 255;
          res[k + 3] = 255 & m;
        } else {
          res[k + 3] = m >>> 24;
          res[k + 2] = m >>> 16 & 255;
          res[k + 1] = m >>> 8 & 255;
          res[k] = 255 & m;
        }
      }
      return res;
    }
    exports.split32 = split32;
    function rotr32(w, b) {
      return w >>> b | w << 32 - b;
    }
    exports.rotr32 = rotr32;
    function rotl32(w, b) {
      return w << b | w >>> 32 - b;
    }
    exports.rotl32 = rotl32;
    function sum32(a, b) {
      return a + b >>> 0;
    }
    exports.sum32 = sum32;
    function sum32_3(a, b, c) {
      return a + b + c >>> 0;
    }
    exports.sum32_3 = sum32_3;
    function sum32_4(a, b, c, d) {
      return a + b + c + d >>> 0;
    }
    exports.sum32_4 = sum32_4;
    function sum32_5(a, b, c, d, e) {
      return a + b + c + d + e >>> 0;
    }
    exports.sum32_5 = sum32_5;
    function sum64(buf, pos, ah, al) {
      var bh = buf[pos];
      var bl = buf[pos + 1];
      var lo = al + bl >>> 0;
      var hi = (lo < al ? 1 : 0) + ah + bh;
      buf[pos] = hi >>> 0;
      buf[pos + 1] = lo;
    }
    exports.sum64 = sum64;
    function sum64_hi(ah, al, bh, bl) {
      var lo = al + bl >>> 0;
      var hi = (lo < al ? 1 : 0) + ah + bh;
      return hi >>> 0;
    }
    exports.sum64_hi = sum64_hi;
    function sum64_lo(ah, al, bh, bl) {
      var lo = al + bl;
      return lo >>> 0;
    }
    exports.sum64_lo = sum64_lo;
    function sum64_4_hi(ah, al, bh, bl, ch, cl, dh, dl) {
      var carry = 0;
      var lo = al;
      lo = lo + bl >>> 0;
      carry += lo < al ? 1 : 0;
      lo = lo + cl >>> 0;
      carry += lo < cl ? 1 : 0;
      lo = lo + dl >>> 0;
      carry += lo < dl ? 1 : 0;
      var hi = ah + bh + ch + dh + carry;
      return hi >>> 0;
    }
    exports.sum64_4_hi = sum64_4_hi;
    function sum64_4_lo(ah, al, bh, bl, ch, cl, dh, dl) {
      var lo = al + bl + cl + dl;
      return lo >>> 0;
    }
    exports.sum64_4_lo = sum64_4_lo;
    function sum64_5_hi(ah, al, bh, bl, ch, cl, dh, dl, eh, el) {
      var carry = 0;
      var lo = al;
      lo = lo + bl >>> 0;
      carry += lo < al ? 1 : 0;
      lo = lo + cl >>> 0;
      carry += lo < cl ? 1 : 0;
      lo = lo + dl >>> 0;
      carry += lo < dl ? 1 : 0;
      lo = lo + el >>> 0;
      carry += lo < el ? 1 : 0;
      var hi = ah + bh + ch + dh + eh + carry;
      return hi >>> 0;
    }
    exports.sum64_5_hi = sum64_5_hi;
    function sum64_5_lo(ah, al, bh, bl, ch, cl, dh, dl, eh, el) {
      var lo = al + bl + cl + dl + el;
      return lo >>> 0;
    }
    exports.sum64_5_lo = sum64_5_lo;
    function rotr64_hi(ah, al, num) {
      var r = al << 32 - num | ah >>> num;
      return r >>> 0;
    }
    exports.rotr64_hi = rotr64_hi;
    function rotr64_lo(ah, al, num) {
      var r = ah << 32 - num | al >>> num;
      return r >>> 0;
    }
    exports.rotr64_lo = rotr64_lo;
    function shr64_hi(ah, al, num) {
      return ah >>> num;
    }
    exports.shr64_hi = shr64_hi;
    function shr64_lo(ah, al, num) {
      var r = ah << 32 - num | al >>> num;
      return r >>> 0;
    }
    exports.shr64_lo = shr64_lo;
  }, {
    inherits: 101,
    "minimalistic-assert": 105
  } ],
  98: [ function(require, module, exports) {
    "use strict";
    var hash = require("hash.js");
    var utils = require("minimalistic-crypto-utils");
    var assert = require("minimalistic-assert");
    function HmacDRBG(options) {
      if (!(this instanceof HmacDRBG)) return new HmacDRBG(options);
      this.hash = options.hash;
      this.predResist = !!options.predResist;
      this.outLen = this.hash.outSize;
      this.minEntropy = options.minEntropy || this.hash.hmacStrength;
      this._reseed = null;
      this.reseedInterval = null;
      this.K = null;
      this.V = null;
      var entropy = utils.toArray(options.entropy, options.entropyEnc || "hex");
      var nonce = utils.toArray(options.nonce, options.nonceEnc || "hex");
      var pers = utils.toArray(options.pers, options.persEnc || "hex");
      assert(entropy.length >= this.minEntropy / 8, "Not enough entropy. Minimum is: " + this.minEntropy + " bits");
      this._init(entropy, nonce, pers);
    }
    module.exports = HmacDRBG;
    HmacDRBG.prototype._init = function init(entropy, nonce, pers) {
      var seed = entropy.concat(nonce).concat(pers);
      this.K = new Array(this.outLen / 8);
      this.V = new Array(this.outLen / 8);
      for (var i = 0; i < this.V.length; i++) {
        this.K[i] = 0;
        this.V[i] = 1;
      }
      this._update(seed);
      this._reseed = 1;
      this.reseedInterval = 281474976710656;
    };
    HmacDRBG.prototype._hmac = function hmac() {
      return new hash.hmac(this.hash, this.K);
    };
    HmacDRBG.prototype._update = function update(seed) {
      var kmac = this._hmac().update(this.V).update([ 0 ]);
      seed && (kmac = kmac.update(seed));
      this.K = kmac.digest();
      this.V = this._hmac().update(this.V).digest();
      if (!seed) return;
      this.K = this._hmac().update(this.V).update([ 1 ]).update(seed).digest();
      this.V = this._hmac().update(this.V).digest();
    };
    HmacDRBG.prototype.reseed = function reseed(entropy, entropyEnc, add, addEnc) {
      if ("string" !== typeof entropyEnc) {
        addEnc = add;
        add = entropyEnc;
        entropyEnc = null;
      }
      entropy = utils.toArray(entropy, entropyEnc);
      add = utils.toArray(add, addEnc);
      assert(entropy.length >= this.minEntropy / 8, "Not enough entropy. Minimum is: " + this.minEntropy + " bits");
      this._update(entropy.concat(add || []));
      this._reseed = 1;
    };
    HmacDRBG.prototype.generate = function generate(len, enc, add, addEnc) {
      if (this._reseed > this.reseedInterval) throw new Error("Reseed is required");
      if ("string" !== typeof enc) {
        addEnc = add;
        add = enc;
        enc = null;
      }
      if (add) {
        add = utils.toArray(add, addEnc || "hex");
        this._update(add);
      }
      var temp = [];
      while (temp.length < len) {
        this.V = this._hmac().update(this.V).digest();
        temp = temp.concat(this.V);
      }
      var res = temp.slice(0, len);
      this._update(add);
      this._reseed++;
      return utils.encode(res, enc);
    };
  }, {
    "hash.js": 86,
    "minimalistic-assert": 105,
    "minimalistic-crypto-utils": 106
  } ],
  99: [ function(require, module, exports) {
    exports.read = function(buffer, offset, isLE, mLen, nBytes) {
      var e, m;
      var eLen = 8 * nBytes - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var nBits = -7;
      var i = isLE ? nBytes - 1 : 0;
      var d = isLE ? -1 : 1;
      var s = buffer[offset + i];
      i += d;
      e = s & (1 << -nBits) - 1;
      s >>= -nBits;
      nBits += eLen;
      for (;nBits > 0; e = 256 * e + buffer[offset + i], i += d, nBits -= 8) ;
      m = e & (1 << -nBits) - 1;
      e >>= -nBits;
      nBits += mLen;
      for (;nBits > 0; m = 256 * m + buffer[offset + i], i += d, nBits -= 8) ;
      if (0 === e) e = 1 - eBias; else {
        if (e === eMax) return m ? NaN : Infinity * (s ? -1 : 1);
        m += Math.pow(2, mLen);
        e -= eBias;
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
    };
    exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c;
      var eLen = 8 * nBytes - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var rt = 23 === mLen ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
      var i = isLE ? 0 : nBytes - 1;
      var d = isLE ? 1 : -1;
      var s = value < 0 || 0 === value && 1 / value < 0 ? 1 : 0;
      value = Math.abs(value);
      if (isNaN(value) || Infinity === value) {
        m = isNaN(value) ? 1 : 0;
        e = eMax;
      } else {
        e = Math.floor(Math.log(value) / Math.LN2);
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--;
          c *= 2;
        }
        value += e + eBias >= 1 ? rt / c : rt * Math.pow(2, 1 - eBias);
        if (value * c >= 2) {
          e++;
          c /= 2;
        }
        if (e + eBias >= eMax) {
          m = 0;
          e = eMax;
        } else if (e + eBias >= 1) {
          m = (value * c - 1) * Math.pow(2, mLen);
          e += eBias;
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
          e = 0;
        }
      }
      for (;mLen >= 8; buffer[offset + i] = 255 & m, i += d, m /= 256, mLen -= 8) ;
      e = e << mLen | m;
      eLen += mLen;
      for (;eLen > 0; buffer[offset + i] = 255 & e, i += d, e /= 256, eLen -= 8) ;
      buffer[offset + i - d] |= 128 * s;
    };
  }, {} ],
  100: [ function(require, module, exports) {
    var indexOf = [].indexOf;
    module.exports = function(arr, obj) {
      if (indexOf) return arr.indexOf(obj);
      for (var i = 0; i < arr.length; ++i) if (arr[i] === obj) return i;
      return -1;
    };
  }, {} ],
  101: [ function(require, module, exports) {
    "function" === typeof Object.create ? module.exports = function inherits(ctor, superCtor) {
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    } : module.exports = function inherits(ctor, superCtor) {
      ctor.super_ = superCtor;
      var TempCtor = function() {};
      TempCtor.prototype = superCtor.prototype;
      ctor.prototype = new TempCtor();
      ctor.prototype.constructor = ctor;
    };
  }, {} ],
  102: [ function(require, module, exports) {
    module.exports = function(obj) {
      return null != obj && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer);
    };
    function isBuffer(obj) {
      return !!obj.constructor && "function" === typeof obj.constructor.isBuffer && obj.constructor.isBuffer(obj);
    }
    function isSlowBuffer(obj) {
      return "function" === typeof obj.readFloatLE && "function" === typeof obj.slice && isBuffer(obj.slice(0, 0));
    }
  }, {} ],
  103: [ function(require, module, exports) {
    (function(Buffer) {
      "use strict";
      var inherits = require("inherits");
      var HashBase = require("hash-base");
      var ARRAY16 = new Array(16);
      function MD5() {
        HashBase.call(this, 64);
        this._a = 1732584193;
        this._b = 4023233417;
        this._c = 2562383102;
        this._d = 271733878;
      }
      inherits(MD5, HashBase);
      MD5.prototype._update = function() {
        var M = ARRAY16;
        for (var i = 0; i < 16; ++i) M[i] = this._block.readInt32LE(4 * i);
        var a = this._a;
        var b = this._b;
        var c = this._c;
        var d = this._d;
        a = fnF(a, b, c, d, M[0], 3614090360, 7);
        d = fnF(d, a, b, c, M[1], 3905402710, 12);
        c = fnF(c, d, a, b, M[2], 606105819, 17);
        b = fnF(b, c, d, a, M[3], 3250441966, 22);
        a = fnF(a, b, c, d, M[4], 4118548399, 7);
        d = fnF(d, a, b, c, M[5], 1200080426, 12);
        c = fnF(c, d, a, b, M[6], 2821735955, 17);
        b = fnF(b, c, d, a, M[7], 4249261313, 22);
        a = fnF(a, b, c, d, M[8], 1770035416, 7);
        d = fnF(d, a, b, c, M[9], 2336552879, 12);
        c = fnF(c, d, a, b, M[10], 4294925233, 17);
        b = fnF(b, c, d, a, M[11], 2304563134, 22);
        a = fnF(a, b, c, d, M[12], 1804603682, 7);
        d = fnF(d, a, b, c, M[13], 4254626195, 12);
        c = fnF(c, d, a, b, M[14], 2792965006, 17);
        b = fnF(b, c, d, a, M[15], 1236535329, 22);
        a = fnG(a, b, c, d, M[1], 4129170786, 5);
        d = fnG(d, a, b, c, M[6], 3225465664, 9);
        c = fnG(c, d, a, b, M[11], 643717713, 14);
        b = fnG(b, c, d, a, M[0], 3921069994, 20);
        a = fnG(a, b, c, d, M[5], 3593408605, 5);
        d = fnG(d, a, b, c, M[10], 38016083, 9);
        c = fnG(c, d, a, b, M[15], 3634488961, 14);
        b = fnG(b, c, d, a, M[4], 3889429448, 20);
        a = fnG(a, b, c, d, M[9], 568446438, 5);
        d = fnG(d, a, b, c, M[14], 3275163606, 9);
        c = fnG(c, d, a, b, M[3], 4107603335, 14);
        b = fnG(b, c, d, a, M[8], 1163531501, 20);
        a = fnG(a, b, c, d, M[13], 2850285829, 5);
        d = fnG(d, a, b, c, M[2], 4243563512, 9);
        c = fnG(c, d, a, b, M[7], 1735328473, 14);
        b = fnG(b, c, d, a, M[12], 2368359562, 20);
        a = fnH(a, b, c, d, M[5], 4294588738, 4);
        d = fnH(d, a, b, c, M[8], 2272392833, 11);
        c = fnH(c, d, a, b, M[11], 1839030562, 16);
        b = fnH(b, c, d, a, M[14], 4259657740, 23);
        a = fnH(a, b, c, d, M[1], 2763975236, 4);
        d = fnH(d, a, b, c, M[4], 1272893353, 11);
        c = fnH(c, d, a, b, M[7], 4139469664, 16);
        b = fnH(b, c, d, a, M[10], 3200236656, 23);
        a = fnH(a, b, c, d, M[13], 681279174, 4);
        d = fnH(d, a, b, c, M[0], 3936430074, 11);
        c = fnH(c, d, a, b, M[3], 3572445317, 16);
        b = fnH(b, c, d, a, M[6], 76029189, 23);
        a = fnH(a, b, c, d, M[9], 3654602809, 4);
        d = fnH(d, a, b, c, M[12], 3873151461, 11);
        c = fnH(c, d, a, b, M[15], 530742520, 16);
        b = fnH(b, c, d, a, M[2], 3299628645, 23);
        a = fnI(a, b, c, d, M[0], 4096336452, 6);
        d = fnI(d, a, b, c, M[7], 1126891415, 10);
        c = fnI(c, d, a, b, M[14], 2878612391, 15);
        b = fnI(b, c, d, a, M[5], 4237533241, 21);
        a = fnI(a, b, c, d, M[12], 1700485571, 6);
        d = fnI(d, a, b, c, M[3], 2399980690, 10);
        c = fnI(c, d, a, b, M[10], 4293915773, 15);
        b = fnI(b, c, d, a, M[1], 2240044497, 21);
        a = fnI(a, b, c, d, M[8], 1873313359, 6);
        d = fnI(d, a, b, c, M[15], 4264355552, 10);
        c = fnI(c, d, a, b, M[6], 2734768916, 15);
        b = fnI(b, c, d, a, M[13], 1309151649, 21);
        a = fnI(a, b, c, d, M[4], 4149444226, 6);
        d = fnI(d, a, b, c, M[11], 3174756917, 10);
        c = fnI(c, d, a, b, M[2], 718787259, 15);
        b = fnI(b, c, d, a, M[9], 3951481745, 21);
        this._a = this._a + a | 0;
        this._b = this._b + b | 0;
        this._c = this._c + c | 0;
        this._d = this._d + d | 0;
      };
      MD5.prototype._digest = function() {
        this._block[this._blockOffset++] = 128;
        if (this._blockOffset > 56) {
          this._block.fill(0, this._blockOffset, 64);
          this._update();
          this._blockOffset = 0;
        }
        this._block.fill(0, this._blockOffset, 56);
        this._block.writeUInt32LE(this._length[0], 56);
        this._block.writeUInt32LE(this._length[1], 60);
        this._update();
        var buffer = new Buffer(16);
        buffer.writeInt32LE(this._a, 0);
        buffer.writeInt32LE(this._b, 4);
        buffer.writeInt32LE(this._c, 8);
        buffer.writeInt32LE(this._d, 12);
        return buffer;
      };
      function rotl(x, n) {
        return x << n | x >>> 32 - n;
      }
      function fnF(a, b, c, d, m, k, s) {
        return rotl(a + (b & c | ~b & d) + m + k | 0, s) + b | 0;
      }
      function fnG(a, b, c, d, m, k, s) {
        return rotl(a + (b & d | c & ~d) + m + k | 0, s) + b | 0;
      }
      function fnH(a, b, c, d, m, k, s) {
        return rotl(a + (b ^ c ^ d) + m + k | 0, s) + b | 0;
      }
      function fnI(a, b, c, d, m, k, s) {
        return rotl(a + (c ^ (b | ~d)) + m + k | 0, s) + b | 0;
      }
      module.exports = MD5;
    }).call(this, require("buffer").Buffer);
  }, {
    buffer: 47,
    "hash-base": 85,
    inherits: 101
  } ],
  104: [ function(require, module, exports) {
    var bn = require("bn.js");
    var brorand = require("brorand");
    function MillerRabin(rand) {
      this.rand = rand || new brorand.Rand();
    }
    module.exports = MillerRabin;
    MillerRabin.create = function create(rand) {
      return new MillerRabin(rand);
    };
    MillerRabin.prototype._randbelow = function _randbelow(n) {
      var len = n.bitLength();
      var min_bytes = Math.ceil(len / 8);
      do {
        var a = new bn(this.rand.generate(min_bytes));
      } while (a.cmp(n) >= 0);
      return a;
    };
    MillerRabin.prototype._randrange = function _randrange(start, stop) {
      var size = stop.sub(start);
      return start.add(this._randbelow(size));
    };
    MillerRabin.prototype.test = function test(n, k, cb) {
      var len = n.bitLength();
      var red = bn.mont(n);
      var rone = new bn(1).toRed(red);
      k || (k = Math.max(1, len / 48 | 0));
      var n1 = n.subn(1);
      for (var s = 0; !n1.testn(s); s++) ;
      var d = n.shrn(s);
      var rn1 = n1.toRed(red);
      var prime = true;
      for (;k > 0; k--) {
        var a = this._randrange(new bn(2), n1);
        cb && cb(a);
        var x = a.toRed(red).redPow(d);
        if (0 === x.cmp(rone) || 0 === x.cmp(rn1)) continue;
        for (var i = 1; i < s; i++) {
          x = x.redSqr();
          if (0 === x.cmp(rone)) return false;
          if (0 === x.cmp(rn1)) break;
        }
        if (i === s) return false;
      }
      return prime;
    };
    MillerRabin.prototype.getDivisor = function getDivisor(n, k) {
      var len = n.bitLength();
      var red = bn.mont(n);
      var rone = new bn(1).toRed(red);
      k || (k = Math.max(1, len / 48 | 0));
      var n1 = n.subn(1);
      for (var s = 0; !n1.testn(s); s++) ;
      var d = n.shrn(s);
      var rn1 = n1.toRed(red);
      for (;k > 0; k--) {
        var a = this._randrange(new bn(2), n1);
        var g = n.gcd(a);
        if (0 !== g.cmpn(1)) return g;
        var x = a.toRed(red).redPow(d);
        if (0 === x.cmp(rone) || 0 === x.cmp(rn1)) continue;
        for (var i = 1; i < s; i++) {
          x = x.redSqr();
          if (0 === x.cmp(rone)) return x.fromRed().subn(1).gcd(n);
          if (0 === x.cmp(rn1)) break;
        }
        if (i === s) {
          x = x.redSqr();
          return x.fromRed().subn(1).gcd(n);
        }
      }
      return false;
    };
  }, {
    "bn.js": 16,
    brorand: 17
  } ],
  105: [ function(require, module, exports) {
    module.exports = assert;
    function assert(val, msg) {
      if (!val) throw new Error(msg || "Assertion failed");
    }
    assert.equal = function assertEqual(l, r, msg) {
      if (l != r) throw new Error(msg || "Assertion failed: " + l + " != " + r);
    };
  }, {} ],
  106: [ function(require, module, exports) {
    "use strict";
    var utils = exports;
    function toArray(msg, enc) {
      if (Array.isArray(msg)) return msg.slice();
      if (!msg) return [];
      var res = [];
      if ("string" !== typeof msg) {
        for (var i = 0; i < msg.length; i++) res[i] = 0 | msg[i];
        return res;
      }
      if ("hex" === enc) {
        msg = msg.replace(/[^a-z0-9]+/gi, "");
        msg.length % 2 !== 0 && (msg = "0" + msg);
        for (var i = 0; i < msg.length; i += 2) res.push(parseInt(msg[i] + msg[i + 1], 16));
      } else for (var i = 0; i < msg.length; i++) {
        var c = msg.charCodeAt(i);
        var hi = c >> 8;
        var lo = 255 & c;
        hi ? res.push(hi, lo) : res.push(lo);
      }
      return res;
    }
    utils.toArray = toArray;
    function zero2(word) {
      return 1 === word.length ? "0" + word : word;
    }
    utils.zero2 = zero2;
    function toHex(msg) {
      var res = "";
      for (var i = 0; i < msg.length; i++) res += zero2(msg[i].toString(16));
      return res;
    }
    utils.toHex = toHex;
    utils.encode = function encode(arr, enc) {
      return "hex" === enc ? toHex(arr) : arr;
    };
  }, {} ],
  107: [ function(require, module, exports) {
    module.exports = {
      "2.16.840.1.101.3.4.1.1": "aes-128-ecb",
      "2.16.840.1.101.3.4.1.2": "aes-128-cbc",
      "2.16.840.1.101.3.4.1.3": "aes-128-ofb",
      "2.16.840.1.101.3.4.1.4": "aes-128-cfb",
      "2.16.840.1.101.3.4.1.21": "aes-192-ecb",
      "2.16.840.1.101.3.4.1.22": "aes-192-cbc",
      "2.16.840.1.101.3.4.1.23": "aes-192-ofb",
      "2.16.840.1.101.3.4.1.24": "aes-192-cfb",
      "2.16.840.1.101.3.4.1.41": "aes-256-ecb",
      "2.16.840.1.101.3.4.1.42": "aes-256-cbc",
      "2.16.840.1.101.3.4.1.43": "aes-256-ofb",
      "2.16.840.1.101.3.4.1.44": "aes-256-cfb"
    };
  }, {} ],
  108: [ function(require, module, exports) {
    "use strict";
    var asn1 = require("asn1.js");
    exports.certificate = require("./certificate");
    var RSAPrivateKey = asn1.define("RSAPrivateKey", function() {
      this.seq().obj(this.key("version").int(), this.key("modulus").int(), this.key("publicExponent").int(), this.key("privateExponent").int(), this.key("prime1").int(), this.key("prime2").int(), this.key("exponent1").int(), this.key("exponent2").int(), this.key("coefficient").int());
    });
    exports.RSAPrivateKey = RSAPrivateKey;
    var RSAPublicKey = asn1.define("RSAPublicKey", function() {
      this.seq().obj(this.key("modulus").int(), this.key("publicExponent").int());
    });
    exports.RSAPublicKey = RSAPublicKey;
    var PublicKey = asn1.define("SubjectPublicKeyInfo", function() {
      this.seq().obj(this.key("algorithm").use(AlgorithmIdentifier), this.key("subjectPublicKey").bitstr());
    });
    exports.PublicKey = PublicKey;
    var AlgorithmIdentifier = asn1.define("AlgorithmIdentifier", function() {
      this.seq().obj(this.key("algorithm").objid(), this.key("none").null_().optional(), this.key("curve").objid().optional(), this.key("params").seq().obj(this.key("p").int(), this.key("q").int(), this.key("g").int()).optional());
    });
    var PrivateKeyInfo = asn1.define("PrivateKeyInfo", function() {
      this.seq().obj(this.key("version").int(), this.key("algorithm").use(AlgorithmIdentifier), this.key("subjectPrivateKey").octstr());
    });
    exports.PrivateKey = PrivateKeyInfo;
    var EncryptedPrivateKeyInfo = asn1.define("EncryptedPrivateKeyInfo", function() {
      this.seq().obj(this.key("algorithm").seq().obj(this.key("id").objid(), this.key("decrypt").seq().obj(this.key("kde").seq().obj(this.key("id").objid(), this.key("kdeparams").seq().obj(this.key("salt").octstr(), this.key("iters").int())), this.key("cipher").seq().obj(this.key("algo").objid(), this.key("iv").octstr()))), this.key("subjectPrivateKey").octstr());
    });
    exports.EncryptedPrivateKey = EncryptedPrivateKeyInfo;
    var DSAPrivateKey = asn1.define("DSAPrivateKey", function() {
      this.seq().obj(this.key("version").int(), this.key("p").int(), this.key("q").int(), this.key("g").int(), this.key("pub_key").int(), this.key("priv_key").int());
    });
    exports.DSAPrivateKey = DSAPrivateKey;
    exports.DSAparam = asn1.define("DSAparam", function() {
      this.int();
    });
    var ECPrivateKey = asn1.define("ECPrivateKey", function() {
      this.seq().obj(this.key("version").int(), this.key("privateKey").octstr(), this.key("parameters").optional().explicit(0).use(ECParameters), this.key("publicKey").optional().explicit(1).bitstr());
    });
    exports.ECPrivateKey = ECPrivateKey;
    var ECParameters = asn1.define("ECParameters", function() {
      this.choice({
        namedCurve: this.objid()
      });
    });
    exports.signature = asn1.define("signature", function() {
      this.seq().obj(this.key("r").int(), this.key("s").int());
    });
  }, {
    "./certificate": 109,
    "asn1.js": 1
  } ],
  109: [ function(require, module, exports) {
    "use strict";
    var asn = require("asn1.js");
    var Time = asn.define("Time", function() {
      this.choice({
        utcTime: this.utctime(),
        generalTime: this.gentime()
      });
    });
    var AttributeTypeValue = asn.define("AttributeTypeValue", function() {
      this.seq().obj(this.key("type").objid(), this.key("value").any());
    });
    var AlgorithmIdentifier = asn.define("AlgorithmIdentifier", function() {
      this.seq().obj(this.key("algorithm").objid(), this.key("parameters").optional());
    });
    var SubjectPublicKeyInfo = asn.define("SubjectPublicKeyInfo", function() {
      this.seq().obj(this.key("algorithm").use(AlgorithmIdentifier), this.key("subjectPublicKey").bitstr());
    });
    var RelativeDistinguishedName = asn.define("RelativeDistinguishedName", function() {
      this.setof(AttributeTypeValue);
    });
    var RDNSequence = asn.define("RDNSequence", function() {
      this.seqof(RelativeDistinguishedName);
    });
    var Name = asn.define("Name", function() {
      this.choice({
        rdnSequence: this.use(RDNSequence)
      });
    });
    var Validity = asn.define("Validity", function() {
      this.seq().obj(this.key("notBefore").use(Time), this.key("notAfter").use(Time));
    });
    var Extension = asn.define("Extension", function() {
      this.seq().obj(this.key("extnID").objid(), this.key("critical").bool().def(false), this.key("extnValue").octstr());
    });
    var TBSCertificate = asn.define("TBSCertificate", function() {
      this.seq().obj(this.key("version").explicit(0).int(), this.key("serialNumber").int(), this.key("signature").use(AlgorithmIdentifier), this.key("issuer").use(Name), this.key("validity").use(Validity), this.key("subject").use(Name), this.key("subjectPublicKeyInfo").use(SubjectPublicKeyInfo), this.key("issuerUniqueID").implicit(1).bitstr().optional(), this.key("subjectUniqueID").implicit(2).bitstr().optional(), this.key("extensions").explicit(3).seqof(Extension).optional());
    });
    var X509Certificate = asn.define("X509Certificate", function() {
      this.seq().obj(this.key("tbsCertificate").use(TBSCertificate), this.key("signatureAlgorithm").use(AlgorithmIdentifier), this.key("signatureValue").bitstr());
    });
    module.exports = X509Certificate;
  }, {
    "asn1.js": 1
  } ],
  110: [ function(require, module, exports) {
    (function(Buffer) {
      var findProc = /Proc-Type: 4,ENCRYPTED[\n\r]+DEK-Info: AES-((?:128)|(?:192)|(?:256))-CBC,([0-9A-H]+)[\n\r]+([0-9A-z\n\r\+\/\=]+)[\n\r]+/m;
      var startRegex = /^-----BEGIN ((?:.* KEY)|CERTIFICATE)-----/m;
      var fullRegex = /^-----BEGIN ((?:.* KEY)|CERTIFICATE)-----([0-9A-z\n\r\+\/\=]+)-----END \1-----$/m;
      var evp = require("evp_bytestokey");
      var ciphers = require("browserify-aes");
      module.exports = function(okey, password) {
        var key = okey.toString();
        var match = key.match(findProc);
        var decrypted;
        if (match) {
          var suite = "aes" + match[1];
          var iv = new Buffer(match[2], "hex");
          var cipherText = new Buffer(match[3].replace(/[\r\n]/g, ""), "base64");
          var cipherKey = evp(password, iv.slice(0, 8), parseInt(match[1], 10)).key;
          var out = [];
          var cipher = ciphers.createDecipheriv(suite, cipherKey, iv);
          out.push(cipher.update(cipherText));
          out.push(cipher.final());
          decrypted = Buffer.concat(out);
        } else {
          var match2 = key.match(fullRegex);
          decrypted = new Buffer(match2[2].replace(/[\r\n]/g, ""), "base64");
        }
        var tag = key.match(startRegex)[1];
        return {
          tag: tag,
          data: decrypted
        };
      };
    }).call(this, require("buffer").Buffer);
  }, {
    "browserify-aes": 21,
    buffer: 47,
    evp_bytestokey: 84
  } ],
  111: [ function(require, module, exports) {
    (function(Buffer) {
      var asn1 = require("./asn1");
      var aesid = require("./aesid.json");
      var fixProc = require("./fixProc");
      var ciphers = require("browserify-aes");
      var compat = require("pbkdf2");
      module.exports = parseKeys;
      function parseKeys(buffer) {
        var password;
        if ("object" === typeof buffer && !Buffer.isBuffer(buffer)) {
          password = buffer.passphrase;
          buffer = buffer.key;
        }
        "string" === typeof buffer && (buffer = new Buffer(buffer));
        var stripped = fixProc(buffer, password);
        var type = stripped.tag;
        var data = stripped.data;
        var subtype, ndata;
        switch (type) {
         case "CERTIFICATE":
          ndata = asn1.certificate.decode(data, "der").tbsCertificate.subjectPublicKeyInfo;

         case "PUBLIC KEY":
          ndata || (ndata = asn1.PublicKey.decode(data, "der"));
          subtype = ndata.algorithm.algorithm.join(".");
          switch (subtype) {
           case "1.2.840.113549.1.1.1":
            return asn1.RSAPublicKey.decode(ndata.subjectPublicKey.data, "der");

           case "1.2.840.10045.2.1":
            ndata.subjectPrivateKey = ndata.subjectPublicKey;
            return {
              type: "ec",
              data: ndata
            };

           case "1.2.840.10040.4.1":
            ndata.algorithm.params.pub_key = asn1.DSAparam.decode(ndata.subjectPublicKey.data, "der");
            return {
              type: "dsa",
              data: ndata.algorithm.params
            };

           default:
            throw new Error("unknown key id " + subtype);
          }
          throw new Error("unknown key type " + type);

         case "ENCRYPTED PRIVATE KEY":
          data = asn1.EncryptedPrivateKey.decode(data, "der");
          data = decrypt(data, password);

         case "PRIVATE KEY":
          ndata = asn1.PrivateKey.decode(data, "der");
          subtype = ndata.algorithm.algorithm.join(".");
          switch (subtype) {
           case "1.2.840.113549.1.1.1":
            return asn1.RSAPrivateKey.decode(ndata.subjectPrivateKey, "der");

           case "1.2.840.10045.2.1":
            return {
              curve: ndata.algorithm.curve,
              privateKey: asn1.ECPrivateKey.decode(ndata.subjectPrivateKey, "der").privateKey
            };

           case "1.2.840.10040.4.1":
            ndata.algorithm.params.priv_key = asn1.DSAparam.decode(ndata.subjectPrivateKey, "der");
            return {
              type: "dsa",
              params: ndata.algorithm.params
            };

           default:
            throw new Error("unknown key id " + subtype);
          }
          throw new Error("unknown key type " + type);

         case "RSA PUBLIC KEY":
          return asn1.RSAPublicKey.decode(data, "der");

         case "RSA PRIVATE KEY":
          return asn1.RSAPrivateKey.decode(data, "der");

         case "DSA PRIVATE KEY":
          return {
            type: "dsa",
            params: asn1.DSAPrivateKey.decode(data, "der")
          };

         case "EC PRIVATE KEY":
          data = asn1.ECPrivateKey.decode(data, "der");
          return {
            curve: data.parameters.value,
            privateKey: data.privateKey
          };

         default:
          throw new Error("unknown key type " + type);
        }
      }
      parseKeys.signature = asn1.signature;
      function decrypt(data, password) {
        var salt = data.algorithm.decrypt.kde.kdeparams.salt;
        var iters = parseInt(data.algorithm.decrypt.kde.kdeparams.iters.toString(), 10);
        var algo = aesid[data.algorithm.decrypt.cipher.algo.join(".")];
        var iv = data.algorithm.decrypt.cipher.iv;
        var cipherText = data.subjectPrivateKey;
        var keylen = parseInt(algo.split("-")[1], 10) / 8;
        var key = compat.pbkdf2Sync(password, salt, iters, keylen);
        var cipher = ciphers.createDecipheriv(algo, key, iv);
        var out = [];
        out.push(cipher.update(cipherText));
        out.push(cipher.final());
        return Buffer.concat(out);
      }
    }).call(this, require("buffer").Buffer);
  }, {
    "./aesid.json": 107,
    "./asn1": 108,
    "./fixProc": 110,
    "browserify-aes": 21,
    buffer: 47,
    pbkdf2: 113
  } ],
  112: [ function(require, module, exports) {
    (function(process) {
      function normalizeArray(parts, allowAboveRoot) {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if ("." === last) parts.splice(i, 1); else if (".." === last) {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        if (allowAboveRoot) for (;up--; up) parts.unshift("..");
        return parts;
      }
      exports.resolve = function() {
        var resolvedPath = "", resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = i >= 0 ? arguments[i] : process.cwd();
          if ("string" !== typeof path) throw new TypeError("Arguments to path.resolve must be strings");
          if (!path) continue;
          resolvedPath = path + "/" + resolvedPath;
          resolvedAbsolute = "/" === path.charAt(0);
        }
        resolvedPath = normalizeArray(filter(resolvedPath.split("/"), function(p) {
          return !!p;
        }), !resolvedAbsolute).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
      };
      exports.normalize = function(path) {
        var isAbsolute = exports.isAbsolute(path), trailingSlash = "/" === substr(path, -1);
        path = normalizeArray(filter(path.split("/"), function(p) {
          return !!p;
        }), !isAbsolute).join("/");
        path || isAbsolute || (path = ".");
        path && trailingSlash && (path += "/");
        return (isAbsolute ? "/" : "") + path;
      };
      exports.isAbsolute = function(path) {
        return "/" === path.charAt(0);
      };
      exports.join = function() {
        var paths = Array.prototype.slice.call(arguments, 0);
        return exports.normalize(filter(paths, function(p, index) {
          if ("string" !== typeof p) throw new TypeError("Arguments to path.join must be strings");
          return p;
        }).join("/"));
      };
      exports.relative = function(from, to) {
        from = exports.resolve(from).substr(1);
        to = exports.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (;start < arr.length; start++) if ("" !== arr[start]) break;
          var end = arr.length - 1;
          for (;end >= 0; end--) if ("" !== arr[end]) break;
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) if (fromParts[i] !== toParts[i]) {
          samePartsLength = i;
          break;
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) outputParts.push("..");
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/");
      };
      exports.sep = "/";
      exports.delimiter = ":";
      exports.dirname = function(path) {
        "string" !== typeof path && (path += "");
        if (0 === path.length) return ".";
        var code = path.charCodeAt(0);
        var hasRoot = 47 === code;
        var end = -1;
        var matchedSlash = true;
        for (var i = path.length - 1; i >= 1; --i) {
          code = path.charCodeAt(i);
          if (47 === code) {
            if (!matchedSlash) {
              end = i;
              break;
            }
          } else matchedSlash = false;
        }
        if (-1 === end) return hasRoot ? "/" : ".";
        if (hasRoot && 1 === end) return "/";
        return path.slice(0, end);
      };
      function basename(path) {
        "string" !== typeof path && (path += "");
        var start = 0;
        var end = -1;
        var matchedSlash = true;
        var i;
        for (i = path.length - 1; i >= 0; --i) if (47 === path.charCodeAt(i)) {
          if (!matchedSlash) {
            start = i + 1;
            break;
          }
        } else if (-1 === end) {
          matchedSlash = false;
          end = i + 1;
        }
        if (-1 === end) return "";
        return path.slice(start, end);
      }
      exports.basename = function(path, ext) {
        var f = basename(path);
        ext && f.substr(-1 * ext.length) === ext && (f = f.substr(0, f.length - ext.length));
        return f;
      };
      exports.extname = function(path) {
        "string" !== typeof path && (path += "");
        var startDot = -1;
        var startPart = 0;
        var end = -1;
        var matchedSlash = true;
        var preDotState = 0;
        for (var i = path.length - 1; i >= 0; --i) {
          var code = path.charCodeAt(i);
          if (47 === code) {
            if (!matchedSlash) {
              startPart = i + 1;
              break;
            }
            continue;
          }
          if (-1 === end) {
            matchedSlash = false;
            end = i + 1;
          }
          46 === code ? -1 === startDot ? startDot = i : 1 !== preDotState && (preDotState = 1) : -1 !== startDot && (preDotState = -1);
        }
        if (-1 === startDot || -1 === end || 0 === preDotState || 1 === preDotState && startDot === end - 1 && startDot === startPart + 1) return "";
        return path.slice(startDot, end);
      };
      function filter(xs, f) {
        if (xs.filter) return xs.filter(f);
        var res = [];
        for (var i = 0; i < xs.length; i++) f(xs[i], i, xs) && res.push(xs[i]);
        return res;
      }
      var substr = "b" === "ab".substr(-1) ? function(str, start, len) {
        return str.substr(start, len);
      } : function(str, start, len) {
        start < 0 && (start = str.length + start);
        return str.substr(start, len);
      };
    }).call(this, require("_process"));
  }, {
    _process: 119
  } ],
  113: [ function(require, module, exports) {
    exports.pbkdf2 = require("./lib/async");
    exports.pbkdf2Sync = require("./lib/sync");
  }, {
    "./lib/async": 114,
    "./lib/sync": 117
  } ],
  114: [ function(require, module, exports) {
    (function(process, global) {
      var checkParameters = require("./precondition");
      var defaultEncoding = require("./default-encoding");
      var sync = require("./sync");
      var Buffer = require("safe-buffer").Buffer;
      var ZERO_BUF;
      var subtle = global.crypto && global.crypto.subtle;
      var toBrowser = {
        sha: "SHA-1",
        "sha-1": "SHA-1",
        sha1: "SHA-1",
        sha256: "SHA-256",
        "sha-256": "SHA-256",
        sha384: "SHA-384",
        "sha-384": "SHA-384",
        "sha-512": "SHA-512",
        sha512: "SHA-512"
      };
      var checks = [];
      function checkNative(algo) {
        if (global.process && !global.process.browser) return Promise.resolve(false);
        if (!subtle || !subtle.importKey || !subtle.deriveBits) return Promise.resolve(false);
        if (void 0 !== checks[algo]) return checks[algo];
        ZERO_BUF = ZERO_BUF || Buffer.alloc(8);
        var prom = browserPbkdf2(ZERO_BUF, ZERO_BUF, 10, 128, algo).then(function() {
          return true;
        }).catch(function() {
          return false;
        });
        checks[algo] = prom;
        return prom;
      }
      function browserPbkdf2(password, salt, iterations, length, algo) {
        return subtle.importKey("raw", password, {
          name: "PBKDF2"
        }, false, [ "deriveBits" ]).then(function(key) {
          return subtle.deriveBits({
            name: "PBKDF2",
            salt: salt,
            iterations: iterations,
            hash: {
              name: algo
            }
          }, key, length << 3);
        }).then(function(res) {
          return Buffer.from(res);
        });
      }
      function resolvePromise(promise, callback) {
        promise.then(function(out) {
          process.nextTick(function() {
            callback(null, out);
          });
        }, function(e) {
          process.nextTick(function() {
            callback(e);
          });
        });
      }
      module.exports = function(password, salt, iterations, keylen, digest, callback) {
        if ("function" === typeof digest) {
          callback = digest;
          digest = void 0;
        }
        digest = digest || "sha1";
        var algo = toBrowser[digest.toLowerCase()];
        if (!algo || "function" !== typeof global.Promise) return process.nextTick(function() {
          var out;
          try {
            out = sync(password, salt, iterations, keylen, digest);
          } catch (e) {
            return callback(e);
          }
          callback(null, out);
        });
        checkParameters(password, salt, iterations, keylen);
        if ("function" !== typeof callback) throw new Error("No callback provided to pbkdf2");
        Buffer.isBuffer(password) || (password = Buffer.from(password, defaultEncoding));
        Buffer.isBuffer(salt) || (salt = Buffer.from(salt, defaultEncoding));
        resolvePromise(checkNative(algo).then(function(resp) {
          if (resp) return browserPbkdf2(password, salt, iterations, keylen, algo);
          return sync(password, salt, iterations, keylen, digest);
        }), callback);
      };
    }).call(this, require("_process"), "undefined" !== typeof global ? global : "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : {});
  }, {
    "./default-encoding": 115,
    "./precondition": 116,
    "./sync": 117,
    _process: 119,
    "safe-buffer": 144
  } ],
  115: [ function(require, module, exports) {
    (function(process) {
      var defaultEncoding;
      if (process.browser) defaultEncoding = "utf-8"; else {
        var pVersionMajor = parseInt(process.version.split(".")[0].slice(1), 10);
        defaultEncoding = pVersionMajor >= 6 ? "utf-8" : "binary";
      }
      module.exports = defaultEncoding;
    }).call(this, require("_process"));
  }, {
    _process: 119
  } ],
  116: [ function(require, module, exports) {
    (function(Buffer) {
      var MAX_ALLOC = Math.pow(2, 30) - 1;
      function checkBuffer(buf, name) {
        if ("string" !== typeof buf && !Buffer.isBuffer(buf)) throw new TypeError(name + " must be a buffer or string");
      }
      module.exports = function(password, salt, iterations, keylen) {
        checkBuffer(password, "Password");
        checkBuffer(salt, "Salt");
        if ("number" !== typeof iterations) throw new TypeError("Iterations not a number");
        if (iterations < 0) throw new TypeError("Bad iterations");
        if ("number" !== typeof keylen) throw new TypeError("Key length not a number");
        if (keylen < 0 || keylen > MAX_ALLOC || keylen !== keylen) throw new TypeError("Bad key length");
      };
    }).call(this, {
      isBuffer: require("../../is-buffer/index.js")
    });
  }, {
    "../../is-buffer/index.js": 102
  } ],
  117: [ function(require, module, exports) {
    var md5 = require("create-hash/md5");
    var rmd160 = require("ripemd160");
    var sha = require("sha.js");
    var checkParameters = require("./precondition");
    var defaultEncoding = require("./default-encoding");
    var Buffer = require("safe-buffer").Buffer;
    var ZEROS = Buffer.alloc(128);
    var sizes = {
      md5: 16,
      sha1: 20,
      sha224: 28,
      sha256: 32,
      sha384: 48,
      sha512: 64,
      rmd160: 20,
      ripemd160: 20
    };
    function Hmac(alg, key, saltLen) {
      var hash = getDigest(alg);
      var blocksize = "sha512" === alg || "sha384" === alg ? 128 : 64;
      key.length > blocksize ? key = hash(key) : key.length < blocksize && (key = Buffer.concat([ key, ZEROS ], blocksize));
      var ipad = Buffer.allocUnsafe(blocksize + sizes[alg]);
      var opad = Buffer.allocUnsafe(blocksize + sizes[alg]);
      for (var i = 0; i < blocksize; i++) {
        ipad[i] = 54 ^ key[i];
        opad[i] = 92 ^ key[i];
      }
      var ipad1 = Buffer.allocUnsafe(blocksize + saltLen + 4);
      ipad.copy(ipad1, 0, 0, blocksize);
      this.ipad1 = ipad1;
      this.ipad2 = ipad;
      this.opad = opad;
      this.alg = alg;
      this.blocksize = blocksize;
      this.hash = hash;
      this.size = sizes[alg];
    }
    Hmac.prototype.run = function(data, ipad) {
      data.copy(ipad, this.blocksize);
      var h = this.hash(ipad);
      h.copy(this.opad, this.blocksize);
      return this.hash(this.opad);
    };
    function getDigest(alg) {
      function shaFunc(data) {
        return sha(alg).update(data).digest();
      }
      if ("rmd160" === alg || "ripemd160" === alg) return rmd160;
      if ("md5" === alg) return md5;
      return shaFunc;
    }
    function pbkdf2(password, salt, iterations, keylen, digest) {
      checkParameters(password, salt, iterations, keylen);
      Buffer.isBuffer(password) || (password = Buffer.from(password, defaultEncoding));
      Buffer.isBuffer(salt) || (salt = Buffer.from(salt, defaultEncoding));
      digest = digest || "sha1";
      var hmac = new Hmac(digest, password, salt.length);
      var DK = Buffer.allocUnsafe(keylen);
      var block1 = Buffer.allocUnsafe(salt.length + 4);
      salt.copy(block1, 0, 0, salt.length);
      var destPos = 0;
      var hLen = sizes[digest];
      var l = Math.ceil(keylen / hLen);
      for (var i = 1; i <= l; i++) {
        block1.writeUInt32BE(i, salt.length);
        var T = hmac.run(block1, hmac.ipad1);
        var U = T;
        for (var j = 1; j < iterations; j++) {
          U = hmac.run(U, hmac.ipad2);
          for (var k = 0; k < hLen; k++) T[k] ^= U[k];
        }
        T.copy(DK, destPos);
        destPos += hLen;
      }
      return DK;
    }
    module.exports = pbkdf2;
  }, {
    "./default-encoding": 115,
    "./precondition": 116,
    "create-hash/md5": 53,
    ripemd160: 143,
    "safe-buffer": 144,
    "sha.js": 146
  } ],
  118: [ function(require, module, exports) {
    (function(process) {
      "use strict";
      !process.version || 0 === process.version.indexOf("v0.") || 0 === process.version.indexOf("v1.") && 0 !== process.version.indexOf("v1.8.") ? module.exports = {
        nextTick: nextTick
      } : module.exports = process;
      function nextTick(fn, arg1, arg2, arg3) {
        if ("function" !== typeof fn) throw new TypeError('"callback" argument must be a function');
        var len = arguments.length;
        var args, i;
        switch (len) {
         case 0:
         case 1:
          return process.nextTick(fn);

         case 2:
          return process.nextTick(function afterTickOne() {
            fn.call(null, arg1);
          });

         case 3:
          return process.nextTick(function afterTickTwo() {
            fn.call(null, arg1, arg2);
          });

         case 4:
          return process.nextTick(function afterTickThree() {
            fn.call(null, arg1, arg2, arg3);
          });

         default:
          args = new Array(len - 1);
          i = 0;
          while (i < args.length) args[i++] = arguments[i];
          return process.nextTick(function afterTick() {
            fn.apply(null, args);
          });
        }
      }
    }).call(this, require("_process"));
  }, {
    _process: 119
  } ],
  119: [ function(require, module, exports) {
    var process = module.exports = {};
    var cachedSetTimeout;
    var cachedClearTimeout;
    function defaultSetTimout() {
      throw new Error("setTimeout has not been defined");
    }
    function defaultClearTimeout() {
      throw new Error("clearTimeout has not been defined");
    }
    (function() {
      try {
        cachedSetTimeout = "function" === typeof setTimeout ? setTimeout : defaultSetTimout;
      } catch (e) {
        cachedSetTimeout = defaultSetTimout;
      }
      try {
        cachedClearTimeout = "function" === typeof clearTimeout ? clearTimeout : defaultClearTimeout;
      } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
      }
    })();
    function runTimeout(fun) {
      if (cachedSetTimeout === setTimeout) return setTimeout(fun, 0);
      if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
      }
      try {
        return cachedSetTimeout(fun, 0);
      } catch (e) {
        try {
          return cachedSetTimeout.call(null, fun, 0);
        } catch (e) {
          return cachedSetTimeout.call(this, fun, 0);
        }
      }
    }
    function runClearTimeout(marker) {
      if (cachedClearTimeout === clearTimeout) return clearTimeout(marker);
      if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
      }
      try {
        return cachedClearTimeout(marker);
      } catch (e) {
        try {
          return cachedClearTimeout.call(null, marker);
        } catch (e) {
          return cachedClearTimeout.call(this, marker);
        }
      }
    }
    var queue = [];
    var draining = false;
    var currentQueue;
    var queueIndex = -1;
    function cleanUpNextTick() {
      if (!draining || !currentQueue) return;
      draining = false;
      currentQueue.length ? queue = currentQueue.concat(queue) : queueIndex = -1;
      queue.length && drainQueue();
    }
    function drainQueue() {
      if (draining) return;
      var timeout = runTimeout(cleanUpNextTick);
      draining = true;
      var len = queue.length;
      while (len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) currentQueue && currentQueue[queueIndex].run();
        queueIndex = -1;
        len = queue.length;
      }
      currentQueue = null;
      draining = false;
      runClearTimeout(timeout);
    }
    process.nextTick = function(fun) {
      var args = new Array(arguments.length - 1);
      if (arguments.length > 1) for (var i = 1; i < arguments.length; i++) args[i - 1] = arguments[i];
      queue.push(new Item(fun, args));
      1 !== queue.length || draining || runTimeout(drainQueue);
    };
    function Item(fun, array) {
      this.fun = fun;
      this.array = array;
    }
    Item.prototype.run = function() {
      this.fun.apply(null, this.array);
    };
    process.title = "browser";
    process.browser = true;
    process.env = {};
    process.argv = [];
    process.version = "";
    process.versions = {};
    function noop() {}
    process.on = noop;
    process.addListener = noop;
    process.once = noop;
    process.off = noop;
    process.removeListener = noop;
    process.removeAllListeners = noop;
    process.emit = noop;
    process.prependListener = noop;
    process.prependOnceListener = noop;
    process.listeners = function(name) {
      return [];
    };
    process.binding = function(name) {
      throw new Error("process.binding is not supported");
    };
    process.cwd = function() {
      return "/";
    };
    process.chdir = function(dir) {
      throw new Error("process.chdir is not supported");
    };
    process.umask = function() {
      return 0;
    };
  }, {} ],
  120: [ function(require, module, exports) {
    exports.publicEncrypt = require("./publicEncrypt");
    exports.privateDecrypt = require("./privateDecrypt");
    exports.privateEncrypt = function privateEncrypt(key, buf) {
      return exports.publicEncrypt(key, buf, true);
    };
    exports.publicDecrypt = function publicDecrypt(key, buf) {
      return exports.privateDecrypt(key, buf, true);
    };
  }, {
    "./privateDecrypt": 122,
    "./publicEncrypt": 123
  } ],
  121: [ function(require, module, exports) {
    (function(Buffer) {
      var createHash = require("create-hash");
      module.exports = function(seed, len) {
        var t = new Buffer("");
        var i = 0, c;
        while (t.length < len) {
          c = i2ops(i++);
          t = Buffer.concat([ t, createHash("sha1").update(seed).update(c).digest() ]);
        }
        return t.slice(0, len);
      };
      function i2ops(c) {
        var out = new Buffer(4);
        out.writeUInt32BE(c, 0);
        return out;
      }
    }).call(this, require("buffer").Buffer);
  }, {
    buffer: 47,
    "create-hash": 52
  } ],
  122: [ function(require, module, exports) {
    (function(Buffer) {
      var parseKeys = require("parse-asn1");
      var mgf = require("./mgf");
      var xor = require("./xor");
      var bn = require("bn.js");
      var crt = require("browserify-rsa");
      var createHash = require("create-hash");
      var withPublic = require("./withPublic");
      module.exports = function privateDecrypt(private_key, enc, reverse) {
        var padding;
        padding = private_key.padding ? private_key.padding : reverse ? 1 : 4;
        var key = parseKeys(private_key);
        var k = key.modulus.byteLength();
        if (enc.length > k || new bn(enc).cmp(key.modulus) >= 0) throw new Error("decryption error");
        var msg;
        msg = reverse ? withPublic(new bn(enc), key) : crt(enc, key);
        var zBuffer = new Buffer(k - msg.length);
        zBuffer.fill(0);
        msg = Buffer.concat([ zBuffer, msg ], k);
        if (4 === padding) return oaep(key, msg);
        if (1 === padding) return pkcs1(key, msg, reverse);
        if (3 === padding) return msg;
        throw new Error("unknown padding");
      };
      function oaep(key, msg) {
        var n = key.modulus;
        var k = key.modulus.byteLength();
        var mLen = msg.length;
        var iHash = createHash("sha1").update(new Buffer("")).digest();
        var hLen = iHash.length;
        var hLen2 = 2 * hLen;
        if (0 !== msg[0]) throw new Error("decryption error");
        var maskedSeed = msg.slice(1, hLen + 1);
        var maskedDb = msg.slice(hLen + 1);
        var seed = xor(maskedSeed, mgf(maskedDb, hLen));
        var db = xor(maskedDb, mgf(seed, k - hLen - 1));
        if (compare(iHash, db.slice(0, hLen))) throw new Error("decryption error");
        var i = hLen;
        while (0 === db[i]) i++;
        if (1 !== db[i++]) throw new Error("decryption error");
        return db.slice(i);
      }
      function pkcs1(key, msg, reverse) {
        var p1 = msg.slice(0, 2);
        var i = 2;
        var status = 0;
        while (0 !== msg[i++]) if (i >= msg.length) {
          status++;
          break;
        }
        var ps = msg.slice(2, i - 1);
        var p2 = msg.slice(i - 1, i);
        ("0002" !== p1.toString("hex") && !reverse || "0001" !== p1.toString("hex") && reverse) && status++;
        ps.length < 8 && status++;
        if (status) throw new Error("decryption error");
        return msg.slice(i);
      }
      function compare(a, b) {
        a = new Buffer(a);
        b = new Buffer(b);
        var dif = 0;
        var len = a.length;
        if (a.length !== b.length) {
          dif++;
          len = Math.min(a.length, b.length);
        }
        var i = -1;
        while (++i < len) dif += a[i] ^ b[i];
        return dif;
      }
    }).call(this, require("buffer").Buffer);
  }, {
    "./mgf": 121,
    "./withPublic": 124,
    "./xor": 125,
    "bn.js": 16,
    "browserify-rsa": 39,
    buffer: 47,
    "create-hash": 52,
    "parse-asn1": 111
  } ],
  123: [ function(require, module, exports) {
    (function(Buffer) {
      var parseKeys = require("parse-asn1");
      var randomBytes = require("randombytes");
      var createHash = require("create-hash");
      var mgf = require("./mgf");
      var xor = require("./xor");
      var bn = require("bn.js");
      var withPublic = require("./withPublic");
      var crt = require("browserify-rsa");
      var constants = {
        RSA_PKCS1_OAEP_PADDING: 4,
        RSA_PKCS1_PADDIN: 1,
        RSA_NO_PADDING: 3
      };
      module.exports = function publicEncrypt(public_key, msg, reverse) {
        var padding;
        padding = public_key.padding ? public_key.padding : reverse ? 1 : 4;
        var key = parseKeys(public_key);
        var paddedMsg;
        if (4 === padding) paddedMsg = oaep(key, msg); else if (1 === padding) paddedMsg = pkcs1(key, msg, reverse); else {
          if (3 !== padding) throw new Error("unknown padding");
          paddedMsg = new bn(msg);
          if (paddedMsg.cmp(key.modulus) >= 0) throw new Error("data too long for modulus");
        }
        return reverse ? crt(paddedMsg, key) : withPublic(paddedMsg, key);
      };
      function oaep(key, msg) {
        var k = key.modulus.byteLength();
        var mLen = msg.length;
        var iHash = createHash("sha1").update(new Buffer("")).digest();
        var hLen = iHash.length;
        var hLen2 = 2 * hLen;
        if (mLen > k - hLen2 - 2) throw new Error("message too long");
        var ps = new Buffer(k - mLen - hLen2 - 2);
        ps.fill(0);
        var dblen = k - hLen - 1;
        var seed = randomBytes(hLen);
        var maskedDb = xor(Buffer.concat([ iHash, ps, new Buffer([ 1 ]), msg ], dblen), mgf(seed, dblen));
        var maskedSeed = xor(seed, mgf(maskedDb, hLen));
        return new bn(Buffer.concat([ new Buffer([ 0 ]), maskedSeed, maskedDb ], k));
      }
      function pkcs1(key, msg, reverse) {
        var mLen = msg.length;
        var k = key.modulus.byteLength();
        if (mLen > k - 11) throw new Error("message too long");
        var ps;
        if (reverse) {
          ps = new Buffer(k - mLen - 3);
          ps.fill(255);
        } else ps = nonZero(k - mLen - 3);
        return new bn(Buffer.concat([ new Buffer([ 0, reverse ? 1 : 2 ]), ps, new Buffer([ 0 ]), msg ], k));
      }
      function nonZero(len, crypto) {
        var out = new Buffer(len);
        var i = 0;
        var cache = randomBytes(2 * len);
        var cur = 0;
        var num;
        while (i < len) {
          if (cur === cache.length) {
            cache = randomBytes(2 * len);
            cur = 0;
          }
          num = cache[cur++];
          num && (out[i++] = num);
        }
        return out;
      }
    }).call(this, require("buffer").Buffer);
  }, {
    "./mgf": 121,
    "./withPublic": 124,
    "./xor": 125,
    "bn.js": 16,
    "browserify-rsa": 39,
    buffer: 47,
    "create-hash": 52,
    "parse-asn1": 111,
    randombytes: 126
  } ],
  124: [ function(require, module, exports) {
    (function(Buffer) {
      var bn = require("bn.js");
      function withPublic(paddedMsg, key) {
        return new Buffer(paddedMsg.toRed(bn.mont(key.modulus)).redPow(new bn(key.publicExponent)).fromRed().toArray());
      }
      module.exports = withPublic;
    }).call(this, require("buffer").Buffer);
  }, {
    "bn.js": 16,
    buffer: 47
  } ],
  125: [ function(require, module, exports) {
    module.exports = function xor(a, b) {
      var len = a.length;
      var i = -1;
      while (++i < len) a[i] ^= b[i];
      return a;
    };
  }, {} ],
  126: [ function(require, module, exports) {
    (function(process, global) {
      "use strict";
      function oldBrowser() {
        throw new Error("Secure random number generation is not supported by this browser.\nUse Chrome, Firefox or Internet Explorer 11");
      }
      var Buffer = require("safe-buffer").Buffer;
      var crypto = global.crypto || global.msCrypto;
      crypto && crypto.getRandomValues ? module.exports = randomBytes : module.exports = oldBrowser;
      function randomBytes(size, cb) {
        if (size > 65536) throw new Error("requested too many random bytes");
        var rawBytes = new global.Uint8Array(size);
        size > 0 && crypto.getRandomValues(rawBytes);
        var bytes = Buffer.from(rawBytes.buffer);
        if ("function" === typeof cb) return process.nextTick(function() {
          cb(null, bytes);
        });
        return bytes;
      }
    }).call(this, require("_process"), "undefined" !== typeof global ? global : "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : {});
  }, {
    _process: 119,
    "safe-buffer": 144
  } ],
  127: [ function(require, module, exports) {
    (function(process, global) {
      "use strict";
      function oldBrowser() {
        throw new Error("secure random number generation not supported by this browser\nuse chrome, FireFox or Internet Explorer 11");
      }
      var safeBuffer = require("safe-buffer");
      var randombytes = require("randombytes");
      var Buffer = safeBuffer.Buffer;
      var kBufferMaxLength = safeBuffer.kMaxLength;
      var crypto = global.crypto || global.msCrypto;
      var kMaxUint32 = Math.pow(2, 32) - 1;
      function assertOffset(offset, length) {
        if ("number" !== typeof offset || offset !== offset) throw new TypeError("offset must be a number");
        if (offset > kMaxUint32 || offset < 0) throw new TypeError("offset must be a uint32");
        if (offset > kBufferMaxLength || offset > length) throw new RangeError("offset out of range");
      }
      function assertSize(size, offset, length) {
        if ("number" !== typeof size || size !== size) throw new TypeError("size must be a number");
        if (size > kMaxUint32 || size < 0) throw new TypeError("size must be a uint32");
        if (size + offset > length || size > kBufferMaxLength) throw new RangeError("buffer too small");
      }
      if (crypto && crypto.getRandomValues || !process.browser) {
        exports.randomFill = randomFill;
        exports.randomFillSync = randomFillSync;
      } else {
        exports.randomFill = oldBrowser;
        exports.randomFillSync = oldBrowser;
      }
      function randomFill(buf, offset, size, cb) {
        if (!Buffer.isBuffer(buf) && !(buf instanceof global.Uint8Array)) throw new TypeError('"buf" argument must be a Buffer or Uint8Array');
        if ("function" === typeof offset) {
          cb = offset;
          offset = 0;
          size = buf.length;
        } else if ("function" === typeof size) {
          cb = size;
          size = buf.length - offset;
        } else if ("function" !== typeof cb) throw new TypeError('"cb" argument must be a function');
        assertOffset(offset, buf.length);
        assertSize(size, offset, buf.length);
        return actualFill(buf, offset, size, cb);
      }
      function actualFill(buf, offset, size, cb) {
        if (process.browser) {
          var ourBuf = buf.buffer;
          var uint = new Uint8Array(ourBuf, offset, size);
          crypto.getRandomValues(uint);
          if (cb) {
            process.nextTick(function() {
              cb(null, buf);
            });
            return;
          }
          return buf;
        }
        if (cb) {
          randombytes(size, function(err, bytes) {
            if (err) return cb(err);
            bytes.copy(buf, offset);
            cb(null, buf);
          });
          return;
        }
        var bytes = randombytes(size);
        bytes.copy(buf, offset);
        return buf;
      }
      function randomFillSync(buf, offset, size) {
        "undefined" === typeof offset && (offset = 0);
        if (!Buffer.isBuffer(buf) && !(buf instanceof global.Uint8Array)) throw new TypeError('"buf" argument must be a Buffer or Uint8Array');
        assertOffset(offset, buf.length);
        void 0 === size && (size = buf.length - offset);
        assertSize(size, offset, buf.length);
        return actualFill(buf, offset, size);
      }
    }).call(this, require("_process"), "undefined" !== typeof global ? global : "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : {});
  }, {
    _process: 119,
    randombytes: 126,
    "safe-buffer": 144
  } ],
  128: [ function(require, module, exports) {
    module.exports = require("./lib/_stream_duplex.js");
  }, {
    "./lib/_stream_duplex.js": 129
  } ],
  129: [ function(require, module, exports) {
    "use strict";
    var pna = require("process-nextick-args");
    var objectKeys = Object.keys || function(obj) {
      var keys = [];
      for (var key in obj) keys.push(key);
      return keys;
    };
    module.exports = Duplex;
    var util = require("core-util-is");
    util.inherits = require("inherits");
    var Readable = require("./_stream_readable");
    var Writable = require("./_stream_writable");
    util.inherits(Duplex, Readable);
    var keys = objectKeys(Writable.prototype);
    for (var v = 0; v < keys.length; v++) {
      var method = keys[v];
      Duplex.prototype[method] || (Duplex.prototype[method] = Writable.prototype[method]);
    }
    function Duplex(options) {
      if (!(this instanceof Duplex)) return new Duplex(options);
      Readable.call(this, options);
      Writable.call(this, options);
      options && false === options.readable && (this.readable = false);
      options && false === options.writable && (this.writable = false);
      this.allowHalfOpen = true;
      options && false === options.allowHalfOpen && (this.allowHalfOpen = false);
      this.once("end", onend);
    }
    Object.defineProperty(Duplex.prototype, "writableHighWaterMark", {
      enumerable: false,
      get: function() {
        return this._writableState.highWaterMark;
      }
    });
    function onend() {
      if (this.allowHalfOpen || this._writableState.ended) return;
      pna.nextTick(onEndNT, this);
    }
    function onEndNT(self) {
      self.end();
    }
    Object.defineProperty(Duplex.prototype, "destroyed", {
      get: function() {
        if (void 0 === this._readableState || void 0 === this._writableState) return false;
        return this._readableState.destroyed && this._writableState.destroyed;
      },
      set: function(value) {
        if (void 0 === this._readableState || void 0 === this._writableState) return;
        this._readableState.destroyed = value;
        this._writableState.destroyed = value;
      }
    });
    Duplex.prototype._destroy = function(err, cb) {
      this.push(null);
      this.end();
      pna.nextTick(cb, err);
    };
  }, {
    "./_stream_readable": 131,
    "./_stream_writable": 133,
    "core-util-is": 50,
    inherits: 101,
    "process-nextick-args": 118
  } ],
  130: [ function(require, module, exports) {
    "use strict";
    module.exports = PassThrough;
    var Transform = require("./_stream_transform");
    var util = require("core-util-is");
    util.inherits = require("inherits");
    util.inherits(PassThrough, Transform);
    function PassThrough(options) {
      if (!(this instanceof PassThrough)) return new PassThrough(options);
      Transform.call(this, options);
    }
    PassThrough.prototype._transform = function(chunk, encoding, cb) {
      cb(null, chunk);
    };
  }, {
    "./_stream_transform": 132,
    "core-util-is": 50,
    inherits: 101
  } ],
  131: [ function(require, module, exports) {
    (function(process, global) {
      "use strict";
      var pna = require("process-nextick-args");
      module.exports = Readable;
      var isArray = require("isarray");
      var Duplex;
      Readable.ReadableState = ReadableState;
      var EE = require("events").EventEmitter;
      var EElistenerCount = function(emitter, type) {
        return emitter.listeners(type).length;
      };
      var Stream = require("./internal/streams/stream");
      var Buffer = require("safe-buffer").Buffer;
      var OurUint8Array = global.Uint8Array || function() {};
      function _uint8ArrayToBuffer(chunk) {
        return Buffer.from(chunk);
      }
      function _isUint8Array(obj) {
        return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
      }
      var util = require("core-util-is");
      util.inherits = require("inherits");
      var debugUtil = require("util");
      var debug = void 0;
      debug = debugUtil && debugUtil.debuglog ? debugUtil.debuglog("stream") : function() {};
      var BufferList = require("./internal/streams/BufferList");
      var destroyImpl = require("./internal/streams/destroy");
      var StringDecoder;
      util.inherits(Readable, Stream);
      var kProxyEvents = [ "error", "close", "destroy", "pause", "resume" ];
      function prependListener(emitter, event, fn) {
        if ("function" === typeof emitter.prependListener) return emitter.prependListener(event, fn);
        emitter._events && emitter._events[event] ? isArray(emitter._events[event]) ? emitter._events[event].unshift(fn) : emitter._events[event] = [ fn, emitter._events[event] ] : emitter.on(event, fn);
      }
      function ReadableState(options, stream) {
        Duplex = Duplex || require("./_stream_duplex");
        options = options || {};
        var isDuplex = stream instanceof Duplex;
        this.objectMode = !!options.objectMode;
        isDuplex && (this.objectMode = this.objectMode || !!options.readableObjectMode);
        var hwm = options.highWaterMark;
        var readableHwm = options.readableHighWaterMark;
        var defaultHwm = this.objectMode ? 16 : 16384;
        this.highWaterMark = hwm || 0 === hwm ? hwm : isDuplex && (readableHwm || 0 === readableHwm) ? readableHwm : defaultHwm;
        this.highWaterMark = Math.floor(this.highWaterMark);
        this.buffer = new BufferList();
        this.length = 0;
        this.pipes = null;
        this.pipesCount = 0;
        this.flowing = null;
        this.ended = false;
        this.endEmitted = false;
        this.reading = false;
        this.sync = true;
        this.needReadable = false;
        this.emittedReadable = false;
        this.readableListening = false;
        this.resumeScheduled = false;
        this.destroyed = false;
        this.defaultEncoding = options.defaultEncoding || "utf8";
        this.awaitDrain = 0;
        this.readingMore = false;
        this.decoder = null;
        this.encoding = null;
        if (options.encoding) {
          StringDecoder || (StringDecoder = require("string_decoder/").StringDecoder);
          this.decoder = new StringDecoder(options.encoding);
          this.encoding = options.encoding;
        }
      }
      function Readable(options) {
        Duplex = Duplex || require("./_stream_duplex");
        if (!(this instanceof Readable)) return new Readable(options);
        this._readableState = new ReadableState(options, this);
        this.readable = true;
        if (options) {
          "function" === typeof options.read && (this._read = options.read);
          "function" === typeof options.destroy && (this._destroy = options.destroy);
        }
        Stream.call(this);
      }
      Object.defineProperty(Readable.prototype, "destroyed", {
        get: function() {
          if (void 0 === this._readableState) return false;
          return this._readableState.destroyed;
        },
        set: function(value) {
          if (!this._readableState) return;
          this._readableState.destroyed = value;
        }
      });
      Readable.prototype.destroy = destroyImpl.destroy;
      Readable.prototype._undestroy = destroyImpl.undestroy;
      Readable.prototype._destroy = function(err, cb) {
        this.push(null);
        cb(err);
      };
      Readable.prototype.push = function(chunk, encoding) {
        var state = this._readableState;
        var skipChunkCheck;
        if (state.objectMode) skipChunkCheck = true; else if ("string" === typeof chunk) {
          encoding = encoding || state.defaultEncoding;
          if (encoding !== state.encoding) {
            chunk = Buffer.from(chunk, encoding);
            encoding = "";
          }
          skipChunkCheck = true;
        }
        return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
      };
      Readable.prototype.unshift = function(chunk) {
        return readableAddChunk(this, chunk, null, true, false);
      };
      function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
        var state = stream._readableState;
        if (null === chunk) {
          state.reading = false;
          onEofChunk(stream, state);
        } else {
          var er;
          skipChunkCheck || (er = chunkInvalid(state, chunk));
          if (er) stream.emit("error", er); else if (state.objectMode || chunk && chunk.length > 0) {
            "string" === typeof chunk || state.objectMode || Object.getPrototypeOf(chunk) === Buffer.prototype || (chunk = _uint8ArrayToBuffer(chunk));
            if (addToFront) state.endEmitted ? stream.emit("error", new Error("stream.unshift() after end event")) : addChunk(stream, state, chunk, true); else if (state.ended) stream.emit("error", new Error("stream.push() after EOF")); else {
              state.reading = false;
              if (state.decoder && !encoding) {
                chunk = state.decoder.write(chunk);
                state.objectMode || 0 !== chunk.length ? addChunk(stream, state, chunk, false) : maybeReadMore(stream, state);
              } else addChunk(stream, state, chunk, false);
            }
          } else addToFront || (state.reading = false);
        }
        return needMoreData(state);
      }
      function addChunk(stream, state, chunk, addToFront) {
        if (state.flowing && 0 === state.length && !state.sync) {
          stream.emit("data", chunk);
          stream.read(0);
        } else {
          state.length += state.objectMode ? 1 : chunk.length;
          addToFront ? state.buffer.unshift(chunk) : state.buffer.push(chunk);
          state.needReadable && emitReadable(stream);
        }
        maybeReadMore(stream, state);
      }
      function chunkInvalid(state, chunk) {
        var er;
        _isUint8Array(chunk) || "string" === typeof chunk || void 0 === chunk || state.objectMode || (er = new TypeError("Invalid non-string/buffer chunk"));
        return er;
      }
      function needMoreData(state) {
        return !state.ended && (state.needReadable || state.length < state.highWaterMark || 0 === state.length);
      }
      Readable.prototype.isPaused = function() {
        return false === this._readableState.flowing;
      };
      Readable.prototype.setEncoding = function(enc) {
        StringDecoder || (StringDecoder = require("string_decoder/").StringDecoder);
        this._readableState.decoder = new StringDecoder(enc);
        this._readableState.encoding = enc;
        return this;
      };
      var MAX_HWM = 8388608;
      function computeNewHighWaterMark(n) {
        if (n >= MAX_HWM) n = MAX_HWM; else {
          n--;
          n |= n >>> 1;
          n |= n >>> 2;
          n |= n >>> 4;
          n |= n >>> 8;
          n |= n >>> 16;
          n++;
        }
        return n;
      }
      function howMuchToRead(n, state) {
        if (n <= 0 || 0 === state.length && state.ended) return 0;
        if (state.objectMode) return 1;
        if (n !== n) return state.flowing && state.length ? state.buffer.head.data.length : state.length;
        n > state.highWaterMark && (state.highWaterMark = computeNewHighWaterMark(n));
        if (n <= state.length) return n;
        if (!state.ended) {
          state.needReadable = true;
          return 0;
        }
        return state.length;
      }
      Readable.prototype.read = function(n) {
        debug("read", n);
        n = parseInt(n, 10);
        var state = this._readableState;
        var nOrig = n;
        0 !== n && (state.emittedReadable = false);
        if (0 === n && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
          debug("read: emitReadable", state.length, state.ended);
          0 === state.length && state.ended ? endReadable(this) : emitReadable(this);
          return null;
        }
        n = howMuchToRead(n, state);
        if (0 === n && state.ended) {
          0 === state.length && endReadable(this);
          return null;
        }
        var doRead = state.needReadable;
        debug("need readable", doRead);
        if (0 === state.length || state.length - n < state.highWaterMark) {
          doRead = true;
          debug("length less than watermark", doRead);
        }
        if (state.ended || state.reading) {
          doRead = false;
          debug("reading or ended", doRead);
        } else if (doRead) {
          debug("do read");
          state.reading = true;
          state.sync = true;
          0 === state.length && (state.needReadable = true);
          this._read(state.highWaterMark);
          state.sync = false;
          state.reading || (n = howMuchToRead(nOrig, state));
        }
        var ret;
        ret = n > 0 ? fromList(n, state) : null;
        if (null === ret) {
          state.needReadable = true;
          n = 0;
        } else state.length -= n;
        if (0 === state.length) {
          state.ended || (state.needReadable = true);
          nOrig !== n && state.ended && endReadable(this);
        }
        null !== ret && this.emit("data", ret);
        return ret;
      };
      function onEofChunk(stream, state) {
        if (state.ended) return;
        if (state.decoder) {
          var chunk = state.decoder.end();
          if (chunk && chunk.length) {
            state.buffer.push(chunk);
            state.length += state.objectMode ? 1 : chunk.length;
          }
        }
        state.ended = true;
        emitReadable(stream);
      }
      function emitReadable(stream) {
        var state = stream._readableState;
        state.needReadable = false;
        if (!state.emittedReadable) {
          debug("emitReadable", state.flowing);
          state.emittedReadable = true;
          state.sync ? pna.nextTick(emitReadable_, stream) : emitReadable_(stream);
        }
      }
      function emitReadable_(stream) {
        debug("emit readable");
        stream.emit("readable");
        flow(stream);
      }
      function maybeReadMore(stream, state) {
        if (!state.readingMore) {
          state.readingMore = true;
          pna.nextTick(maybeReadMore_, stream, state);
        }
      }
      function maybeReadMore_(stream, state) {
        var len = state.length;
        while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
          debug("maybeReadMore read 0");
          stream.read(0);
          if (len === state.length) break;
          len = state.length;
        }
        state.readingMore = false;
      }
      Readable.prototype._read = function(n) {
        this.emit("error", new Error("_read() is not implemented"));
      };
      Readable.prototype.pipe = function(dest, pipeOpts) {
        var src = this;
        var state = this._readableState;
        switch (state.pipesCount) {
         case 0:
          state.pipes = dest;
          break;

         case 1:
          state.pipes = [ state.pipes, dest ];
          break;

         default:
          state.pipes.push(dest);
        }
        state.pipesCount += 1;
        debug("pipe count=%d opts=%j", state.pipesCount, pipeOpts);
        var doEnd = (!pipeOpts || false !== pipeOpts.end) && dest !== process.stdout && dest !== process.stderr;
        var endFn = doEnd ? onend : unpipe;
        state.endEmitted ? pna.nextTick(endFn) : src.once("end", endFn);
        dest.on("unpipe", onunpipe);
        function onunpipe(readable, unpipeInfo) {
          debug("onunpipe");
          if (readable === src && unpipeInfo && false === unpipeInfo.hasUnpiped) {
            unpipeInfo.hasUnpiped = true;
            cleanup();
          }
        }
        function onend() {
          debug("onend");
          dest.end();
        }
        var ondrain = pipeOnDrain(src);
        dest.on("drain", ondrain);
        var cleanedUp = false;
        function cleanup() {
          debug("cleanup");
          dest.removeListener("close", onclose);
          dest.removeListener("finish", onfinish);
          dest.removeListener("drain", ondrain);
          dest.removeListener("error", onerror);
          dest.removeListener("unpipe", onunpipe);
          src.removeListener("end", onend);
          src.removeListener("end", unpipe);
          src.removeListener("data", ondata);
          cleanedUp = true;
          !state.awaitDrain || dest._writableState && !dest._writableState.needDrain || ondrain();
        }
        var increasedAwaitDrain = false;
        src.on("data", ondata);
        function ondata(chunk) {
          debug("ondata");
          increasedAwaitDrain = false;
          var ret = dest.write(chunk);
          if (false === ret && !increasedAwaitDrain) {
            if ((1 === state.pipesCount && state.pipes === dest || state.pipesCount > 1 && -1 !== indexOf(state.pipes, dest)) && !cleanedUp) {
              debug("false write response, pause", src._readableState.awaitDrain);
              src._readableState.awaitDrain++;
              increasedAwaitDrain = true;
            }
            src.pause();
          }
        }
        function onerror(er) {
          debug("onerror", er);
          unpipe();
          dest.removeListener("error", onerror);
          0 === EElistenerCount(dest, "error") && dest.emit("error", er);
        }
        prependListener(dest, "error", onerror);
        function onclose() {
          dest.removeListener("finish", onfinish);
          unpipe();
        }
        dest.once("close", onclose);
        function onfinish() {
          debug("onfinish");
          dest.removeListener("close", onclose);
          unpipe();
        }
        dest.once("finish", onfinish);
        function unpipe() {
          debug("unpipe");
          src.unpipe(dest);
        }
        dest.emit("pipe", src);
        if (!state.flowing) {
          debug("pipe resume");
          src.resume();
        }
        return dest;
      };
      function pipeOnDrain(src) {
        return function() {
          var state = src._readableState;
          debug("pipeOnDrain", state.awaitDrain);
          state.awaitDrain && state.awaitDrain--;
          if (0 === state.awaitDrain && EElistenerCount(src, "data")) {
            state.flowing = true;
            flow(src);
          }
        };
      }
      Readable.prototype.unpipe = function(dest) {
        var state = this._readableState;
        var unpipeInfo = {
          hasUnpiped: false
        };
        if (0 === state.pipesCount) return this;
        if (1 === state.pipesCount) {
          if (dest && dest !== state.pipes) return this;
          dest || (dest = state.pipes);
          state.pipes = null;
          state.pipesCount = 0;
          state.flowing = false;
          dest && dest.emit("unpipe", this, unpipeInfo);
          return this;
        }
        if (!dest) {
          var dests = state.pipes;
          var len = state.pipesCount;
          state.pipes = null;
          state.pipesCount = 0;
          state.flowing = false;
          for (var i = 0; i < len; i++) dests[i].emit("unpipe", this, unpipeInfo);
          return this;
        }
        var index = indexOf(state.pipes, dest);
        if (-1 === index) return this;
        state.pipes.splice(index, 1);
        state.pipesCount -= 1;
        1 === state.pipesCount && (state.pipes = state.pipes[0]);
        dest.emit("unpipe", this, unpipeInfo);
        return this;
      };
      Readable.prototype.on = function(ev, fn) {
        var res = Stream.prototype.on.call(this, ev, fn);
        if ("data" === ev) false !== this._readableState.flowing && this.resume(); else if ("readable" === ev) {
          var state = this._readableState;
          if (!state.endEmitted && !state.readableListening) {
            state.readableListening = state.needReadable = true;
            state.emittedReadable = false;
            state.reading ? state.length && emitReadable(this) : pna.nextTick(nReadingNextTick, this);
          }
        }
        return res;
      };
      Readable.prototype.addListener = Readable.prototype.on;
      function nReadingNextTick(self) {
        debug("readable nexttick read 0");
        self.read(0);
      }
      Readable.prototype.resume = function() {
        var state = this._readableState;
        if (!state.flowing) {
          debug("resume");
          state.flowing = true;
          resume(this, state);
        }
        return this;
      };
      function resume(stream, state) {
        if (!state.resumeScheduled) {
          state.resumeScheduled = true;
          pna.nextTick(resume_, stream, state);
        }
      }
      function resume_(stream, state) {
        if (!state.reading) {
          debug("resume read 0");
          stream.read(0);
        }
        state.resumeScheduled = false;
        state.awaitDrain = 0;
        stream.emit("resume");
        flow(stream);
        state.flowing && !state.reading && stream.read(0);
      }
      Readable.prototype.pause = function() {
        debug("call pause flowing=%j", this._readableState.flowing);
        if (false !== this._readableState.flowing) {
          debug("pause");
          this._readableState.flowing = false;
          this.emit("pause");
        }
        return this;
      };
      function flow(stream) {
        var state = stream._readableState;
        debug("flow", state.flowing);
        while (state.flowing && null !== stream.read()) ;
      }
      Readable.prototype.wrap = function(stream) {
        var _this = this;
        var state = this._readableState;
        var paused = false;
        stream.on("end", function() {
          debug("wrapped end");
          if (state.decoder && !state.ended) {
            var chunk = state.decoder.end();
            chunk && chunk.length && _this.push(chunk);
          }
          _this.push(null);
        });
        stream.on("data", function(chunk) {
          debug("wrapped data");
          state.decoder && (chunk = state.decoder.write(chunk));
          if (state.objectMode && (null === chunk || void 0 === chunk)) return;
          if (!state.objectMode && (!chunk || !chunk.length)) return;
          var ret = _this.push(chunk);
          if (!ret) {
            paused = true;
            stream.pause();
          }
        });
        for (var i in stream) void 0 === this[i] && "function" === typeof stream[i] && (this[i] = function(method) {
          return function() {
            return stream[method].apply(stream, arguments);
          };
        }(i));
        for (var n = 0; n < kProxyEvents.length; n++) stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
        this._read = function(n) {
          debug("wrapped _read", n);
          if (paused) {
            paused = false;
            stream.resume();
          }
        };
        return this;
      };
      Object.defineProperty(Readable.prototype, "readableHighWaterMark", {
        enumerable: false,
        get: function() {
          return this._readableState.highWaterMark;
        }
      });
      Readable._fromList = fromList;
      function fromList(n, state) {
        if (0 === state.length) return null;
        var ret;
        if (state.objectMode) ret = state.buffer.shift(); else if (!n || n >= state.length) {
          ret = state.decoder ? state.buffer.join("") : 1 === state.buffer.length ? state.buffer.head.data : state.buffer.concat(state.length);
          state.buffer.clear();
        } else ret = fromListPartial(n, state.buffer, state.decoder);
        return ret;
      }
      function fromListPartial(n, list, hasStrings) {
        var ret;
        if (n < list.head.data.length) {
          ret = list.head.data.slice(0, n);
          list.head.data = list.head.data.slice(n);
        } else ret = n === list.head.data.length ? list.shift() : hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
        return ret;
      }
      function copyFromBufferString(n, list) {
        var p = list.head;
        var c = 1;
        var ret = p.data;
        n -= ret.length;
        while (p = p.next) {
          var str = p.data;
          var nb = n > str.length ? str.length : n;
          nb === str.length ? ret += str : ret += str.slice(0, n);
          n -= nb;
          if (0 === n) {
            if (nb === str.length) {
              ++c;
              p.next ? list.head = p.next : list.head = list.tail = null;
            } else {
              list.head = p;
              p.data = str.slice(nb);
            }
            break;
          }
          ++c;
        }
        list.length -= c;
        return ret;
      }
      function copyFromBuffer(n, list) {
        var ret = Buffer.allocUnsafe(n);
        var p = list.head;
        var c = 1;
        p.data.copy(ret);
        n -= p.data.length;
        while (p = p.next) {
          var buf = p.data;
          var nb = n > buf.length ? buf.length : n;
          buf.copy(ret, ret.length - n, 0, nb);
          n -= nb;
          if (0 === n) {
            if (nb === buf.length) {
              ++c;
              p.next ? list.head = p.next : list.head = list.tail = null;
            } else {
              list.head = p;
              p.data = buf.slice(nb);
            }
            break;
          }
          ++c;
        }
        list.length -= c;
        return ret;
      }
      function endReadable(stream) {
        var state = stream._readableState;
        if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');
        if (!state.endEmitted) {
          state.ended = true;
          pna.nextTick(endReadableNT, state, stream);
        }
      }
      function endReadableNT(state, stream) {
        if (!state.endEmitted && 0 === state.length) {
          state.endEmitted = true;
          stream.readable = false;
          stream.emit("end");
        }
      }
      function indexOf(xs, x) {
        for (var i = 0, l = xs.length; i < l; i++) if (xs[i] === x) return i;
        return -1;
      }
    }).call(this, require("_process"), "undefined" !== typeof global ? global : "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : {});
  }, {
    "./_stream_duplex": 129,
    "./internal/streams/BufferList": 134,
    "./internal/streams/destroy": 135,
    "./internal/streams/stream": 136,
    _process: 119,
    "core-util-is": 50,
    events: 83,
    inherits: 101,
    isarray: 137,
    "process-nextick-args": 118,
    "safe-buffer": 144,
    "string_decoder/": 138,
    util: 18
  } ],
  132: [ function(require, module, exports) {
    "use strict";
    module.exports = Transform;
    var Duplex = require("./_stream_duplex");
    var util = require("core-util-is");
    util.inherits = require("inherits");
    util.inherits(Transform, Duplex);
    function afterTransform(er, data) {
      var ts = this._transformState;
      ts.transforming = false;
      var cb = ts.writecb;
      if (!cb) return this.emit("error", new Error("write callback called multiple times"));
      ts.writechunk = null;
      ts.writecb = null;
      null != data && this.push(data);
      cb(er);
      var rs = this._readableState;
      rs.reading = false;
      (rs.needReadable || rs.length < rs.highWaterMark) && this._read(rs.highWaterMark);
    }
    function Transform(options) {
      if (!(this instanceof Transform)) return new Transform(options);
      Duplex.call(this, options);
      this._transformState = {
        afterTransform: afterTransform.bind(this),
        needTransform: false,
        transforming: false,
        writecb: null,
        writechunk: null,
        writeencoding: null
      };
      this._readableState.needReadable = true;
      this._readableState.sync = false;
      if (options) {
        "function" === typeof options.transform && (this._transform = options.transform);
        "function" === typeof options.flush && (this._flush = options.flush);
      }
      this.on("prefinish", prefinish);
    }
    function prefinish() {
      var _this = this;
      "function" === typeof this._flush ? this._flush(function(er, data) {
        done(_this, er, data);
      }) : done(this, null, null);
    }
    Transform.prototype.push = function(chunk, encoding) {
      this._transformState.needTransform = false;
      return Duplex.prototype.push.call(this, chunk, encoding);
    };
    Transform.prototype._transform = function(chunk, encoding, cb) {
      throw new Error("_transform() is not implemented");
    };
    Transform.prototype._write = function(chunk, encoding, cb) {
      var ts = this._transformState;
      ts.writecb = cb;
      ts.writechunk = chunk;
      ts.writeencoding = encoding;
      if (!ts.transforming) {
        var rs = this._readableState;
        (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) && this._read(rs.highWaterMark);
      }
    };
    Transform.prototype._read = function(n) {
      var ts = this._transformState;
      if (null !== ts.writechunk && ts.writecb && !ts.transforming) {
        ts.transforming = true;
        this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
      } else ts.needTransform = true;
    };
    Transform.prototype._destroy = function(err, cb) {
      var _this2 = this;
      Duplex.prototype._destroy.call(this, err, function(err2) {
        cb(err2);
        _this2.emit("close");
      });
    };
    function done(stream, er, data) {
      if (er) return stream.emit("error", er);
      null != data && stream.push(data);
      if (stream._writableState.length) throw new Error("Calling transform done when ws.length != 0");
      if (stream._transformState.transforming) throw new Error("Calling transform done when still transforming");
      return stream.push(null);
    }
  }, {
    "./_stream_duplex": 129,
    "core-util-is": 50,
    inherits: 101
  } ],
  133: [ function(require, module, exports) {
    (function(process, global) {
      "use strict";
      var pna = require("process-nextick-args");
      module.exports = Writable;
      function WriteReq(chunk, encoding, cb) {
        this.chunk = chunk;
        this.encoding = encoding;
        this.callback = cb;
        this.next = null;
      }
      function CorkedRequest(state) {
        var _this = this;
        this.next = null;
        this.entry = null;
        this.finish = function() {
          onCorkedFinish(_this, state);
        };
      }
      var asyncWrite = !process.browser && [ "v0.10", "v0.9." ].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
      var Duplex;
      Writable.WritableState = WritableState;
      var util = require("core-util-is");
      util.inherits = require("inherits");
      var internalUtil = {
        deprecate: require("util-deprecate")
      };
      var Stream = require("./internal/streams/stream");
      var Buffer = require("safe-buffer").Buffer;
      var OurUint8Array = global.Uint8Array || function() {};
      function _uint8ArrayToBuffer(chunk) {
        return Buffer.from(chunk);
      }
      function _isUint8Array(obj) {
        return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
      }
      var destroyImpl = require("./internal/streams/destroy");
      util.inherits(Writable, Stream);
      function nop() {}
      function WritableState(options, stream) {
        Duplex = Duplex || require("./_stream_duplex");
        options = options || {};
        var isDuplex = stream instanceof Duplex;
        this.objectMode = !!options.objectMode;
        isDuplex && (this.objectMode = this.objectMode || !!options.writableObjectMode);
        var hwm = options.highWaterMark;
        var writableHwm = options.writableHighWaterMark;
        var defaultHwm = this.objectMode ? 16 : 16384;
        this.highWaterMark = hwm || 0 === hwm ? hwm : isDuplex && (writableHwm || 0 === writableHwm) ? writableHwm : defaultHwm;
        this.highWaterMark = Math.floor(this.highWaterMark);
        this.finalCalled = false;
        this.needDrain = false;
        this.ending = false;
        this.ended = false;
        this.finished = false;
        this.destroyed = false;
        var noDecode = false === options.decodeStrings;
        this.decodeStrings = !noDecode;
        this.defaultEncoding = options.defaultEncoding || "utf8";
        this.length = 0;
        this.writing = false;
        this.corked = 0;
        this.sync = true;
        this.bufferProcessing = false;
        this.onwrite = function(er) {
          onwrite(stream, er);
        };
        this.writecb = null;
        this.writelen = 0;
        this.bufferedRequest = null;
        this.lastBufferedRequest = null;
        this.pendingcb = 0;
        this.prefinished = false;
        this.errorEmitted = false;
        this.bufferedRequestCount = 0;
        this.corkedRequestsFree = new CorkedRequest(this);
      }
      WritableState.prototype.getBuffer = function getBuffer() {
        var current = this.bufferedRequest;
        var out = [];
        while (current) {
          out.push(current);
          current = current.next;
        }
        return out;
      };
      (function() {
        try {
          Object.defineProperty(WritableState.prototype, "buffer", {
            get: internalUtil.deprecate(function() {
              return this.getBuffer();
            }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
          });
        } catch (_) {}
      })();
      var realHasInstance;
      if ("function" === typeof Symbol && Symbol.hasInstance && "function" === typeof Function.prototype[Symbol.hasInstance]) {
        realHasInstance = Function.prototype[Symbol.hasInstance];
        Object.defineProperty(Writable, Symbol.hasInstance, {
          value: function(object) {
            if (realHasInstance.call(this, object)) return true;
            if (this !== Writable) return false;
            return object && object._writableState instanceof WritableState;
          }
        });
      } else realHasInstance = function(object) {
        return object instanceof this;
      };
      function Writable(options) {
        Duplex = Duplex || require("./_stream_duplex");
        if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) return new Writable(options);
        this._writableState = new WritableState(options, this);
        this.writable = true;
        if (options) {
          "function" === typeof options.write && (this._write = options.write);
          "function" === typeof options.writev && (this._writev = options.writev);
          "function" === typeof options.destroy && (this._destroy = options.destroy);
          "function" === typeof options.final && (this._final = options.final);
        }
        Stream.call(this);
      }
      Writable.prototype.pipe = function() {
        this.emit("error", new Error("Cannot pipe, not readable"));
      };
      function writeAfterEnd(stream, cb) {
        var er = new Error("write after end");
        stream.emit("error", er);
        pna.nextTick(cb, er);
      }
      function validChunk(stream, state, chunk, cb) {
        var valid = true;
        var er = false;
        null === chunk ? er = new TypeError("May not write null values to stream") : "string" === typeof chunk || void 0 === chunk || state.objectMode || (er = new TypeError("Invalid non-string/buffer chunk"));
        if (er) {
          stream.emit("error", er);
          pna.nextTick(cb, er);
          valid = false;
        }
        return valid;
      }
      Writable.prototype.write = function(chunk, encoding, cb) {
        var state = this._writableState;
        var ret = false;
        var isBuf = !state.objectMode && _isUint8Array(chunk);
        isBuf && !Buffer.isBuffer(chunk) && (chunk = _uint8ArrayToBuffer(chunk));
        if ("function" === typeof encoding) {
          cb = encoding;
          encoding = null;
        }
        isBuf ? encoding = "buffer" : encoding || (encoding = state.defaultEncoding);
        "function" !== typeof cb && (cb = nop);
        if (state.ended) writeAfterEnd(this, cb); else if (isBuf || validChunk(this, state, chunk, cb)) {
          state.pendingcb++;
          ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
        }
        return ret;
      };
      Writable.prototype.cork = function() {
        var state = this._writableState;
        state.corked++;
      };
      Writable.prototype.uncork = function() {
        var state = this._writableState;
        if (state.corked) {
          state.corked--;
          state.writing || state.corked || state.finished || state.bufferProcessing || !state.bufferedRequest || clearBuffer(this, state);
        }
      };
      Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
        "string" === typeof encoding && (encoding = encoding.toLowerCase());
        if (!([ "hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw" ].indexOf((encoding + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + encoding);
        this._writableState.defaultEncoding = encoding;
        return this;
      };
      function decodeChunk(state, chunk, encoding) {
        state.objectMode || false === state.decodeStrings || "string" !== typeof chunk || (chunk = Buffer.from(chunk, encoding));
        return chunk;
      }
      Object.defineProperty(Writable.prototype, "writableHighWaterMark", {
        enumerable: false,
        get: function() {
          return this._writableState.highWaterMark;
        }
      });
      function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
        if (!isBuf) {
          var newChunk = decodeChunk(state, chunk, encoding);
          if (chunk !== newChunk) {
            isBuf = true;
            encoding = "buffer";
            chunk = newChunk;
          }
        }
        var len = state.objectMode ? 1 : chunk.length;
        state.length += len;
        var ret = state.length < state.highWaterMark;
        ret || (state.needDrain = true);
        if (state.writing || state.corked) {
          var last = state.lastBufferedRequest;
          state.lastBufferedRequest = {
            chunk: chunk,
            encoding: encoding,
            isBuf: isBuf,
            callback: cb,
            next: null
          };
          last ? last.next = state.lastBufferedRequest : state.bufferedRequest = state.lastBufferedRequest;
          state.bufferedRequestCount += 1;
        } else doWrite(stream, state, false, len, chunk, encoding, cb);
        return ret;
      }
      function doWrite(stream, state, writev, len, chunk, encoding, cb) {
        state.writelen = len;
        state.writecb = cb;
        state.writing = true;
        state.sync = true;
        writev ? stream._writev(chunk, state.onwrite) : stream._write(chunk, encoding, state.onwrite);
        state.sync = false;
      }
      function onwriteError(stream, state, sync, er, cb) {
        --state.pendingcb;
        if (sync) {
          pna.nextTick(cb, er);
          pna.nextTick(finishMaybe, stream, state);
          stream._writableState.errorEmitted = true;
          stream.emit("error", er);
        } else {
          cb(er);
          stream._writableState.errorEmitted = true;
          stream.emit("error", er);
          finishMaybe(stream, state);
        }
      }
      function onwriteStateUpdate(state) {
        state.writing = false;
        state.writecb = null;
        state.length -= state.writelen;
        state.writelen = 0;
      }
      function onwrite(stream, er) {
        var state = stream._writableState;
        var sync = state.sync;
        var cb = state.writecb;
        onwriteStateUpdate(state);
        if (er) onwriteError(stream, state, sync, er, cb); else {
          var finished = needFinish(state);
          finished || state.corked || state.bufferProcessing || !state.bufferedRequest || clearBuffer(stream, state);
          sync ? asyncWrite(afterWrite, stream, state, finished, cb) : afterWrite(stream, state, finished, cb);
        }
      }
      function afterWrite(stream, state, finished, cb) {
        finished || onwriteDrain(stream, state);
        state.pendingcb--;
        cb();
        finishMaybe(stream, state);
      }
      function onwriteDrain(stream, state) {
        if (0 === state.length && state.needDrain) {
          state.needDrain = false;
          stream.emit("drain");
        }
      }
      function clearBuffer(stream, state) {
        state.bufferProcessing = true;
        var entry = state.bufferedRequest;
        if (stream._writev && entry && entry.next) {
          var l = state.bufferedRequestCount;
          var buffer = new Array(l);
          var holder = state.corkedRequestsFree;
          holder.entry = entry;
          var count = 0;
          var allBuffers = true;
          while (entry) {
            buffer[count] = entry;
            entry.isBuf || (allBuffers = false);
            entry = entry.next;
            count += 1;
          }
          buffer.allBuffers = allBuffers;
          doWrite(stream, state, true, state.length, buffer, "", holder.finish);
          state.pendingcb++;
          state.lastBufferedRequest = null;
          if (holder.next) {
            state.corkedRequestsFree = holder.next;
            holder.next = null;
          } else state.corkedRequestsFree = new CorkedRequest(state);
          state.bufferedRequestCount = 0;
        } else {
          while (entry) {
            var chunk = entry.chunk;
            var encoding = entry.encoding;
            var cb = entry.callback;
            var len = state.objectMode ? 1 : chunk.length;
            doWrite(stream, state, false, len, chunk, encoding, cb);
            entry = entry.next;
            state.bufferedRequestCount--;
            if (state.writing) break;
          }
          null === entry && (state.lastBufferedRequest = null);
        }
        state.bufferedRequest = entry;
        state.bufferProcessing = false;
      }
      Writable.prototype._write = function(chunk, encoding, cb) {
        cb(new Error("_write() is not implemented"));
      };
      Writable.prototype._writev = null;
      Writable.prototype.end = function(chunk, encoding, cb) {
        var state = this._writableState;
        if ("function" === typeof chunk) {
          cb = chunk;
          chunk = null;
          encoding = null;
        } else if ("function" === typeof encoding) {
          cb = encoding;
          encoding = null;
        }
        null !== chunk && void 0 !== chunk && this.write(chunk, encoding);
        if (state.corked) {
          state.corked = 1;
          this.uncork();
        }
        state.ending || state.finished || endWritable(this, state, cb);
      };
      function needFinish(state) {
        return state.ending && 0 === state.length && null === state.bufferedRequest && !state.finished && !state.writing;
      }
      function callFinal(stream, state) {
        stream._final(function(err) {
          state.pendingcb--;
          err && stream.emit("error", err);
          state.prefinished = true;
          stream.emit("prefinish");
          finishMaybe(stream, state);
        });
      }
      function prefinish(stream, state) {
        if (!state.prefinished && !state.finalCalled) if ("function" === typeof stream._final) {
          state.pendingcb++;
          state.finalCalled = true;
          pna.nextTick(callFinal, stream, state);
        } else {
          state.prefinished = true;
          stream.emit("prefinish");
        }
      }
      function finishMaybe(stream, state) {
        var need = needFinish(state);
        if (need) {
          prefinish(stream, state);
          if (0 === state.pendingcb) {
            state.finished = true;
            stream.emit("finish");
          }
        }
        return need;
      }
      function endWritable(stream, state, cb) {
        state.ending = true;
        finishMaybe(stream, state);
        cb && (state.finished ? pna.nextTick(cb) : stream.once("finish", cb));
        state.ended = true;
        stream.writable = false;
      }
      function onCorkedFinish(corkReq, state, err) {
        var entry = corkReq.entry;
        corkReq.entry = null;
        while (entry) {
          var cb = entry.callback;
          state.pendingcb--;
          cb(err);
          entry = entry.next;
        }
        state.corkedRequestsFree ? state.corkedRequestsFree.next = corkReq : state.corkedRequestsFree = corkReq;
      }
      Object.defineProperty(Writable.prototype, "destroyed", {
        get: function() {
          if (void 0 === this._writableState) return false;
          return this._writableState.destroyed;
        },
        set: function(value) {
          if (!this._writableState) return;
          this._writableState.destroyed = value;
        }
      });
      Writable.prototype.destroy = destroyImpl.destroy;
      Writable.prototype._undestroy = destroyImpl.undestroy;
      Writable.prototype._destroy = function(err, cb) {
        this.end();
        cb(err);
      };
    }).call(this, require("_process"), "undefined" !== typeof global ? global : "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : {});
  }, {
    "./_stream_duplex": 129,
    "./internal/streams/destroy": 135,
    "./internal/streams/stream": 136,
    _process: 119,
    "core-util-is": 50,
    inherits: 101,
    "process-nextick-args": 118,
    "safe-buffer": 144,
    "util-deprecate": 155
  } ],
  134: [ function(require, module, exports) {
    "use strict";
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
    }
    var Buffer = require("safe-buffer").Buffer;
    var util = require("util");
    function copyBuffer(src, target, offset) {
      src.copy(target, offset);
    }
    module.exports = function() {
      function BufferList() {
        _classCallCheck(this, BufferList);
        this.head = null;
        this.tail = null;
        this.length = 0;
      }
      BufferList.prototype.push = function push(v) {
        var entry = {
          data: v,
          next: null
        };
        this.length > 0 ? this.tail.next = entry : this.head = entry;
        this.tail = entry;
        ++this.length;
      };
      BufferList.prototype.unshift = function unshift(v) {
        var entry = {
          data: v,
          next: this.head
        };
        0 === this.length && (this.tail = entry);
        this.head = entry;
        ++this.length;
      };
      BufferList.prototype.shift = function shift() {
        if (0 === this.length) return;
        var ret = this.head.data;
        1 === this.length ? this.head = this.tail = null : this.head = this.head.next;
        --this.length;
        return ret;
      };
      BufferList.prototype.clear = function clear() {
        this.head = this.tail = null;
        this.length = 0;
      };
      BufferList.prototype.join = function join(s) {
        if (0 === this.length) return "";
        var p = this.head;
        var ret = "" + p.data;
        while (p = p.next) ret += s + p.data;
        return ret;
      };
      BufferList.prototype.concat = function concat(n) {
        if (0 === this.length) return Buffer.alloc(0);
        if (1 === this.length) return this.head.data;
        var ret = Buffer.allocUnsafe(n >>> 0);
        var p = this.head;
        var i = 0;
        while (p) {
          copyBuffer(p.data, ret, i);
          i += p.data.length;
          p = p.next;
        }
        return ret;
      };
      return BufferList;
    }();
    util && util.inspect && util.inspect.custom && (module.exports.prototype[util.inspect.custom] = function() {
      var obj = util.inspect({
        length: this.length
      });
      return this.constructor.name + " " + obj;
    });
  }, {
    "safe-buffer": 144,
    util: 18
  } ],
  135: [ function(require, module, exports) {
    "use strict";
    var pna = require("process-nextick-args");
    function destroy(err, cb) {
      var _this = this;
      var readableDestroyed = this._readableState && this._readableState.destroyed;
      var writableDestroyed = this._writableState && this._writableState.destroyed;
      if (readableDestroyed || writableDestroyed) {
        cb ? cb(err) : !err || this._writableState && this._writableState.errorEmitted || pna.nextTick(emitErrorNT, this, err);
        return this;
      }
      this._readableState && (this._readableState.destroyed = true);
      this._writableState && (this._writableState.destroyed = true);
      this._destroy(err || null, function(err) {
        if (!cb && err) {
          pna.nextTick(emitErrorNT, _this, err);
          _this._writableState && (_this._writableState.errorEmitted = true);
        } else cb && cb(err);
      });
      return this;
    }
    function undestroy() {
      if (this._readableState) {
        this._readableState.destroyed = false;
        this._readableState.reading = false;
        this._readableState.ended = false;
        this._readableState.endEmitted = false;
      }
      if (this._writableState) {
        this._writableState.destroyed = false;
        this._writableState.ended = false;
        this._writableState.ending = false;
        this._writableState.finished = false;
        this._writableState.errorEmitted = false;
      }
    }
    function emitErrorNT(self, err) {
      self.emit("error", err);
    }
    module.exports = {
      destroy: destroy,
      undestroy: undestroy
    };
  }, {
    "process-nextick-args": 118
  } ],
  136: [ function(require, module, exports) {
    module.exports = require("events").EventEmitter;
  }, {
    events: 83
  } ],
  137: [ function(require, module, exports) {
    arguments[4][48][0].apply(exports, arguments);
  }, {
    dup: 48
  } ],
  138: [ function(require, module, exports) {
    "use strict";
    var Buffer = require("safe-buffer").Buffer;
    var isEncoding = Buffer.isEncoding || function(encoding) {
      encoding = "" + encoding;
      switch (encoding && encoding.toLowerCase()) {
       case "hex":
       case "utf8":
       case "utf-8":
       case "ascii":
       case "binary":
       case "base64":
       case "ucs2":
       case "ucs-2":
       case "utf16le":
       case "utf-16le":
       case "raw":
        return true;

       default:
        return false;
      }
    };
    function _normalizeEncoding(enc) {
      if (!enc) return "utf8";
      var retried;
      while (true) switch (enc) {
       case "utf8":
       case "utf-8":
        return "utf8";

       case "ucs2":
       case "ucs-2":
       case "utf16le":
       case "utf-16le":
        return "utf16le";

       case "latin1":
       case "binary":
        return "latin1";

       case "base64":
       case "ascii":
       case "hex":
        return enc;

       default:
        if (retried) return;
        enc = ("" + enc).toLowerCase();
        retried = true;
      }
    }
    function normalizeEncoding(enc) {
      var nenc = _normalizeEncoding(enc);
      if ("string" !== typeof nenc && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error("Unknown encoding: " + enc);
      return nenc || enc;
    }
    exports.StringDecoder = StringDecoder;
    function StringDecoder(encoding) {
      this.encoding = normalizeEncoding(encoding);
      var nb;
      switch (this.encoding) {
       case "utf16le":
        this.text = utf16Text;
        this.end = utf16End;
        nb = 4;
        break;

       case "utf8":
        this.fillLast = utf8FillLast;
        nb = 4;
        break;

       case "base64":
        this.text = base64Text;
        this.end = base64End;
        nb = 3;
        break;

       default:
        this.write = simpleWrite;
        this.end = simpleEnd;
        return;
      }
      this.lastNeed = 0;
      this.lastTotal = 0;
      this.lastChar = Buffer.allocUnsafe(nb);
    }
    StringDecoder.prototype.write = function(buf) {
      if (0 === buf.length) return "";
      var r;
      var i;
      if (this.lastNeed) {
        r = this.fillLast(buf);
        if (void 0 === r) return "";
        i = this.lastNeed;
        this.lastNeed = 0;
      } else i = 0;
      if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
      return r || "";
    };
    StringDecoder.prototype.end = utf8End;
    StringDecoder.prototype.text = utf8Text;
    StringDecoder.prototype.fillLast = function(buf) {
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
      this.lastNeed -= buf.length;
    };
    function utf8CheckByte(byte) {
      if (byte <= 127) return 0;
      if (byte >> 5 === 6) return 2;
      if (byte >> 4 === 14) return 3;
      if (byte >> 3 === 30) return 4;
      return byte >> 6 === 2 ? -1 : -2;
    }
    function utf8CheckIncomplete(self, buf, i) {
      var j = buf.length - 1;
      if (j < i) return 0;
      var nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        nb > 0 && (self.lastNeed = nb - 1);
        return nb;
      }
      if (--j < i || -2 === nb) return 0;
      nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        nb > 0 && (self.lastNeed = nb - 2);
        return nb;
      }
      if (--j < i || -2 === nb) return 0;
      nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        nb > 0 && (2 === nb ? nb = 0 : self.lastNeed = nb - 3);
        return nb;
      }
      return 0;
    }
    function utf8CheckExtraBytes(self, buf, p) {
      if (128 !== (192 & buf[0])) {
        self.lastNeed = 0;
        return "\ufffd";
      }
      if (self.lastNeed > 1 && buf.length > 1) {
        if (128 !== (192 & buf[1])) {
          self.lastNeed = 1;
          return "\ufffd";
        }
        if (self.lastNeed > 2 && buf.length > 2 && 128 !== (192 & buf[2])) {
          self.lastNeed = 2;
          return "\ufffd";
        }
      }
    }
    function utf8FillLast(buf) {
      var p = this.lastTotal - this.lastNeed;
      var r = utf8CheckExtraBytes(this, buf, p);
      if (void 0 !== r) return r;
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, p, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, p, 0, buf.length);
      this.lastNeed -= buf.length;
    }
    function utf8Text(buf, i) {
      var total = utf8CheckIncomplete(this, buf, i);
      if (!this.lastNeed) return buf.toString("utf8", i);
      this.lastTotal = total;
      var end = buf.length - (total - this.lastNeed);
      buf.copy(this.lastChar, 0, end);
      return buf.toString("utf8", i, end);
    }
    function utf8End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) return r + "\ufffd";
      return r;
    }
    function utf16Text(buf, i) {
      if ((buf.length - i) % 2 === 0) {
        var r = buf.toString("utf16le", i);
        if (r) {
          var c = r.charCodeAt(r.length - 1);
          if (c >= 55296 && c <= 56319) {
            this.lastNeed = 2;
            this.lastTotal = 4;
            this.lastChar[0] = buf[buf.length - 2];
            this.lastChar[1] = buf[buf.length - 1];
            return r.slice(0, -1);
          }
        }
        return r;
      }
      this.lastNeed = 1;
      this.lastTotal = 2;
      this.lastChar[0] = buf[buf.length - 1];
      return buf.toString("utf16le", i, buf.length - 1);
    }
    function utf16End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) {
        var end = this.lastTotal - this.lastNeed;
        return r + this.lastChar.toString("utf16le", 0, end);
      }
      return r;
    }
    function base64Text(buf, i) {
      var n = (buf.length - i) % 3;
      if (0 === n) return buf.toString("base64", i);
      this.lastNeed = 3 - n;
      this.lastTotal = 3;
      if (1 === n) this.lastChar[0] = buf[buf.length - 1]; else {
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
      }
      return buf.toString("base64", i, buf.length - n);
    }
    function base64End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) return r + this.lastChar.toString("base64", 0, 3 - this.lastNeed);
      return r;
    }
    function simpleWrite(buf) {
      return buf.toString(this.encoding);
    }
    function simpleEnd(buf) {
      return buf && buf.length ? this.write(buf) : "";
    }
  }, {
    "safe-buffer": 144
  } ],
  139: [ function(require, module, exports) {
    module.exports = require("./readable").PassThrough;
  }, {
    "./readable": 140
  } ],
  140: [ function(require, module, exports) {
    exports = module.exports = require("./lib/_stream_readable.js");
    exports.Stream = exports;
    exports.Readable = exports;
    exports.Writable = require("./lib/_stream_writable.js");
    exports.Duplex = require("./lib/_stream_duplex.js");
    exports.Transform = require("./lib/_stream_transform.js");
    exports.PassThrough = require("./lib/_stream_passthrough.js");
  }, {
    "./lib/_stream_duplex.js": 129,
    "./lib/_stream_passthrough.js": 130,
    "./lib/_stream_readable.js": 131,
    "./lib/_stream_transform.js": 132,
    "./lib/_stream_writable.js": 133
  } ],
  141: [ function(require, module, exports) {
    module.exports = require("./readable").Transform;
  }, {
    "./readable": 140
  } ],
  142: [ function(require, module, exports) {
    module.exports = require("./lib/_stream_writable.js");
  }, {
    "./lib/_stream_writable.js": 133
  } ],
  143: [ function(require, module, exports) {
    "use strict";
    var Buffer = require("buffer").Buffer;
    var inherits = require("inherits");
    var HashBase = require("hash-base");
    var ARRAY16 = new Array(16);
    var zl = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8, 3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2, 4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13 ];
    var zr = [ 5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2, 15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14, 12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11 ];
    var sl = [ 11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12, 11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12, 9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6 ];
    var sr = [ 8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11, 9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8, 8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11 ];
    var hl = [ 0, 1518500249, 1859775393, 2400959708, 2840853838 ];
    var hr = [ 1352829926, 1548603684, 1836072691, 2053994217, 0 ];
    function RIPEMD160() {
      HashBase.call(this, 64);
      this._a = 1732584193;
      this._b = 4023233417;
      this._c = 2562383102;
      this._d = 271733878;
      this._e = 3285377520;
    }
    inherits(RIPEMD160, HashBase);
    RIPEMD160.prototype._update = function() {
      var words = ARRAY16;
      for (var j = 0; j < 16; ++j) words[j] = this._block.readInt32LE(4 * j);
      var al = 0 | this._a;
      var bl = 0 | this._b;
      var cl = 0 | this._c;
      var dl = 0 | this._d;
      var el = 0 | this._e;
      var ar = 0 | this._a;
      var br = 0 | this._b;
      var cr = 0 | this._c;
      var dr = 0 | this._d;
      var er = 0 | this._e;
      for (var i = 0; i < 80; i += 1) {
        var tl;
        var tr;
        if (i < 16) {
          tl = fn1(al, bl, cl, dl, el, words[zl[i]], hl[0], sl[i]);
          tr = fn5(ar, br, cr, dr, er, words[zr[i]], hr[0], sr[i]);
        } else if (i < 32) {
          tl = fn2(al, bl, cl, dl, el, words[zl[i]], hl[1], sl[i]);
          tr = fn4(ar, br, cr, dr, er, words[zr[i]], hr[1], sr[i]);
        } else if (i < 48) {
          tl = fn3(al, bl, cl, dl, el, words[zl[i]], hl[2], sl[i]);
          tr = fn3(ar, br, cr, dr, er, words[zr[i]], hr[2], sr[i]);
        } else if (i < 64) {
          tl = fn4(al, bl, cl, dl, el, words[zl[i]], hl[3], sl[i]);
          tr = fn2(ar, br, cr, dr, er, words[zr[i]], hr[3], sr[i]);
        } else {
          tl = fn5(al, bl, cl, dl, el, words[zl[i]], hl[4], sl[i]);
          tr = fn1(ar, br, cr, dr, er, words[zr[i]], hr[4], sr[i]);
        }
        al = el;
        el = dl;
        dl = rotl(cl, 10);
        cl = bl;
        bl = tl;
        ar = er;
        er = dr;
        dr = rotl(cr, 10);
        cr = br;
        br = tr;
      }
      var t = this._b + cl + dr | 0;
      this._b = this._c + dl + er | 0;
      this._c = this._d + el + ar | 0;
      this._d = this._e + al + br | 0;
      this._e = this._a + bl + cr | 0;
      this._a = t;
    };
    RIPEMD160.prototype._digest = function() {
      this._block[this._blockOffset++] = 128;
      if (this._blockOffset > 56) {
        this._block.fill(0, this._blockOffset, 64);
        this._update();
        this._blockOffset = 0;
      }
      this._block.fill(0, this._blockOffset, 56);
      this._block.writeUInt32LE(this._length[0], 56);
      this._block.writeUInt32LE(this._length[1], 60);
      this._update();
      var buffer = Buffer.alloc ? Buffer.alloc(20) : new Buffer(20);
      buffer.writeInt32LE(this._a, 0);
      buffer.writeInt32LE(this._b, 4);
      buffer.writeInt32LE(this._c, 8);
      buffer.writeInt32LE(this._d, 12);
      buffer.writeInt32LE(this._e, 16);
      return buffer;
    };
    function rotl(x, n) {
      return x << n | x >>> 32 - n;
    }
    function fn1(a, b, c, d, e, m, k, s) {
      return rotl(a + (b ^ c ^ d) + m + k | 0, s) + e | 0;
    }
    function fn2(a, b, c, d, e, m, k, s) {
      return rotl(a + (b & c | ~b & d) + m + k | 0, s) + e | 0;
    }
    function fn3(a, b, c, d, e, m, k, s) {
      return rotl(a + ((b | ~c) ^ d) + m + k | 0, s) + e | 0;
    }
    function fn4(a, b, c, d, e, m, k, s) {
      return rotl(a + (b & d | c & ~d) + m + k | 0, s) + e | 0;
    }
    function fn5(a, b, c, d, e, m, k, s) {
      return rotl(a + (b ^ (c | ~d)) + m + k | 0, s) + e | 0;
    }
    module.exports = RIPEMD160;
  }, {
    buffer: 47,
    "hash-base": 85,
    inherits: 101
  } ],
  144: [ function(require, module, exports) {
    var buffer = require("buffer");
    var Buffer = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) dst[key] = src[key];
    }
    if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) module.exports = buffer; else {
      copyProps(buffer, exports);
      exports.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer(arg, encodingOrOffset, length);
    }
    copyProps(Buffer, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if ("number" === typeof arg) throw new TypeError("Argument must not be a number");
      return Buffer(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if ("number" !== typeof size) throw new TypeError("Argument must be a number");
      var buf = Buffer(size);
      void 0 !== fill ? "string" === typeof encoding ? buf.fill(fill, encoding) : buf.fill(fill) : buf.fill(0);
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if ("number" !== typeof size) throw new TypeError("Argument must be a number");
      return Buffer(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if ("number" !== typeof size) throw new TypeError("Argument must be a number");
      return buffer.SlowBuffer(size);
    };
  }, {
    buffer: 47
  } ],
  145: [ function(require, module, exports) {
    var Buffer = require("safe-buffer").Buffer;
    function Hash(blockSize, finalSize) {
      this._block = Buffer.alloc(blockSize);
      this._finalSize = finalSize;
      this._blockSize = blockSize;
      this._len = 0;
    }
    Hash.prototype.update = function(data, enc) {
      if ("string" === typeof data) {
        enc = enc || "utf8";
        data = Buffer.from(data, enc);
      }
      var block = this._block;
      var blockSize = this._blockSize;
      var length = data.length;
      var accum = this._len;
      for (var offset = 0; offset < length; ) {
        var assigned = accum % blockSize;
        var remainder = Math.min(length - offset, blockSize - assigned);
        for (var i = 0; i < remainder; i++) block[assigned + i] = data[offset + i];
        accum += remainder;
        offset += remainder;
        accum % blockSize === 0 && this._update(block);
      }
      this._len += length;
      return this;
    };
    Hash.prototype.digest = function(enc) {
      var rem = this._len % this._blockSize;
      this._block[rem] = 128;
      this._block.fill(0, rem + 1);
      if (rem >= this._finalSize) {
        this._update(this._block);
        this._block.fill(0);
      }
      var bits = 8 * this._len;
      if (bits <= 4294967295) this._block.writeUInt32BE(bits, this._blockSize - 4); else {
        var lowBits = (4294967295 & bits) >>> 0;
        var highBits = (bits - lowBits) / 4294967296;
        this._block.writeUInt32BE(highBits, this._blockSize - 8);
        this._block.writeUInt32BE(lowBits, this._blockSize - 4);
      }
      this._update(this._block);
      var hash = this._hash();
      return enc ? hash.toString(enc) : hash;
    };
    Hash.prototype._update = function() {
      throw new Error("_update must be implemented by subclass");
    };
    module.exports = Hash;
  }, {
    "safe-buffer": 144
  } ],
  146: [ function(require, module, exports) {
    var exports = module.exports = function SHA(algorithm) {
      algorithm = algorithm.toLowerCase();
      var Algorithm = exports[algorithm];
      if (!Algorithm) throw new Error(algorithm + " is not supported (we accept pull requests)");
      return new Algorithm();
    };
    exports.sha = require("./sha");
    exports.sha1 = require("./sha1");
    exports.sha224 = require("./sha224");
    exports.sha256 = require("./sha256");
    exports.sha384 = require("./sha384");
    exports.sha512 = require("./sha512");
  }, {
    "./sha": 147,
    "./sha1": 148,
    "./sha224": 149,
    "./sha256": 150,
    "./sha384": 151,
    "./sha512": 152
  } ],
  147: [ function(require, module, exports) {
    var inherits = require("inherits");
    var Hash = require("./hash");
    var Buffer = require("safe-buffer").Buffer;
    var K = [ 1518500249, 1859775393, -1894007588, -899497514 ];
    var W = new Array(80);
    function Sha() {
      this.init();
      this._w = W;
      Hash.call(this, 64, 56);
    }
    inherits(Sha, Hash);
    Sha.prototype.init = function() {
      this._a = 1732584193;
      this._b = 4023233417;
      this._c = 2562383102;
      this._d = 271733878;
      this._e = 3285377520;
      return this;
    };
    function rotl5(num) {
      return num << 5 | num >>> 27;
    }
    function rotl30(num) {
      return num << 30 | num >>> 2;
    }
    function ft(s, b, c, d) {
      if (0 === s) return b & c | ~b & d;
      if (2 === s) return b & c | b & d | c & d;
      return b ^ c ^ d;
    }
    Sha.prototype._update = function(M) {
      var W = this._w;
      var a = 0 | this._a;
      var b = 0 | this._b;
      var c = 0 | this._c;
      var d = 0 | this._d;
      var e = 0 | this._e;
      for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(4 * i);
      for (;i < 80; ++i) W[i] = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
      for (var j = 0; j < 80; ++j) {
        var s = ~~(j / 20);
        var t = rotl5(a) + ft(s, b, c, d) + e + W[j] + K[s] | 0;
        e = d;
        d = c;
        c = rotl30(b);
        b = a;
        a = t;
      }
      this._a = a + this._a | 0;
      this._b = b + this._b | 0;
      this._c = c + this._c | 0;
      this._d = d + this._d | 0;
      this._e = e + this._e | 0;
    };
    Sha.prototype._hash = function() {
      var H = Buffer.allocUnsafe(20);
      H.writeInt32BE(0 | this._a, 0);
      H.writeInt32BE(0 | this._b, 4);
      H.writeInt32BE(0 | this._c, 8);
      H.writeInt32BE(0 | this._d, 12);
      H.writeInt32BE(0 | this._e, 16);
      return H;
    };
    module.exports = Sha;
  }, {
    "./hash": 145,
    inherits: 101,
    "safe-buffer": 144
  } ],
  148: [ function(require, module, exports) {
    var inherits = require("inherits");
    var Hash = require("./hash");
    var Buffer = require("safe-buffer").Buffer;
    var K = [ 1518500249, 1859775393, -1894007588, -899497514 ];
    var W = new Array(80);
    function Sha1() {
      this.init();
      this._w = W;
      Hash.call(this, 64, 56);
    }
    inherits(Sha1, Hash);
    Sha1.prototype.init = function() {
      this._a = 1732584193;
      this._b = 4023233417;
      this._c = 2562383102;
      this._d = 271733878;
      this._e = 3285377520;
      return this;
    };
    function rotl1(num) {
      return num << 1 | num >>> 31;
    }
    function rotl5(num) {
      return num << 5 | num >>> 27;
    }
    function rotl30(num) {
      return num << 30 | num >>> 2;
    }
    function ft(s, b, c, d) {
      if (0 === s) return b & c | ~b & d;
      if (2 === s) return b & c | b & d | c & d;
      return b ^ c ^ d;
    }
    Sha1.prototype._update = function(M) {
      var W = this._w;
      var a = 0 | this._a;
      var b = 0 | this._b;
      var c = 0 | this._c;
      var d = 0 | this._d;
      var e = 0 | this._e;
      for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(4 * i);
      for (;i < 80; ++i) W[i] = rotl1(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16]);
      for (var j = 0; j < 80; ++j) {
        var s = ~~(j / 20);
        var t = rotl5(a) + ft(s, b, c, d) + e + W[j] + K[s] | 0;
        e = d;
        d = c;
        c = rotl30(b);
        b = a;
        a = t;
      }
      this._a = a + this._a | 0;
      this._b = b + this._b | 0;
      this._c = c + this._c | 0;
      this._d = d + this._d | 0;
      this._e = e + this._e | 0;
    };
    Sha1.prototype._hash = function() {
      var H = Buffer.allocUnsafe(20);
      H.writeInt32BE(0 | this._a, 0);
      H.writeInt32BE(0 | this._b, 4);
      H.writeInt32BE(0 | this._c, 8);
      H.writeInt32BE(0 | this._d, 12);
      H.writeInt32BE(0 | this._e, 16);
      return H;
    };
    module.exports = Sha1;
  }, {
    "./hash": 145,
    inherits: 101,
    "safe-buffer": 144
  } ],
  149: [ function(require, module, exports) {
    var inherits = require("inherits");
    var Sha256 = require("./sha256");
    var Hash = require("./hash");
    var Buffer = require("safe-buffer").Buffer;
    var W = new Array(64);
    function Sha224() {
      this.init();
      this._w = W;
      Hash.call(this, 64, 56);
    }
    inherits(Sha224, Sha256);
    Sha224.prototype.init = function() {
      this._a = 3238371032;
      this._b = 914150663;
      this._c = 812702999;
      this._d = 4144912697;
      this._e = 4290775857;
      this._f = 1750603025;
      this._g = 1694076839;
      this._h = 3204075428;
      return this;
    };
    Sha224.prototype._hash = function() {
      var H = Buffer.allocUnsafe(28);
      H.writeInt32BE(this._a, 0);
      H.writeInt32BE(this._b, 4);
      H.writeInt32BE(this._c, 8);
      H.writeInt32BE(this._d, 12);
      H.writeInt32BE(this._e, 16);
      H.writeInt32BE(this._f, 20);
      H.writeInt32BE(this._g, 24);
      return H;
    };
    module.exports = Sha224;
  }, {
    "./hash": 145,
    "./sha256": 150,
    inherits: 101,
    "safe-buffer": 144
  } ],
  150: [ function(require, module, exports) {
    var inherits = require("inherits");
    var Hash = require("./hash");
    var Buffer = require("safe-buffer").Buffer;
    var K = [ 1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298 ];
    var W = new Array(64);
    function Sha256() {
      this.init();
      this._w = W;
      Hash.call(this, 64, 56);
    }
    inherits(Sha256, Hash);
    Sha256.prototype.init = function() {
      this._a = 1779033703;
      this._b = 3144134277;
      this._c = 1013904242;
      this._d = 2773480762;
      this._e = 1359893119;
      this._f = 2600822924;
      this._g = 528734635;
      this._h = 1541459225;
      return this;
    };
    function ch(x, y, z) {
      return z ^ x & (y ^ z);
    }
    function maj(x, y, z) {
      return x & y | z & (x | y);
    }
    function sigma0(x) {
      return (x >>> 2 | x << 30) ^ (x >>> 13 | x << 19) ^ (x >>> 22 | x << 10);
    }
    function sigma1(x) {
      return (x >>> 6 | x << 26) ^ (x >>> 11 | x << 21) ^ (x >>> 25 | x << 7);
    }
    function gamma0(x) {
      return (x >>> 7 | x << 25) ^ (x >>> 18 | x << 14) ^ x >>> 3;
    }
    function gamma1(x) {
      return (x >>> 17 | x << 15) ^ (x >>> 19 | x << 13) ^ x >>> 10;
    }
    Sha256.prototype._update = function(M) {
      var W = this._w;
      var a = 0 | this._a;
      var b = 0 | this._b;
      var c = 0 | this._c;
      var d = 0 | this._d;
      var e = 0 | this._e;
      var f = 0 | this._f;
      var g = 0 | this._g;
      var h = 0 | this._h;
      for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(4 * i);
      for (;i < 64; ++i) W[i] = gamma1(W[i - 2]) + W[i - 7] + gamma0(W[i - 15]) + W[i - 16] | 0;
      for (var j = 0; j < 64; ++j) {
        var T1 = h + sigma1(e) + ch(e, f, g) + K[j] + W[j] | 0;
        var T2 = sigma0(a) + maj(a, b, c) | 0;
        h = g;
        g = f;
        f = e;
        e = d + T1 | 0;
        d = c;
        c = b;
        b = a;
        a = T1 + T2 | 0;
      }
      this._a = a + this._a | 0;
      this._b = b + this._b | 0;
      this._c = c + this._c | 0;
      this._d = d + this._d | 0;
      this._e = e + this._e | 0;
      this._f = f + this._f | 0;
      this._g = g + this._g | 0;
      this._h = h + this._h | 0;
    };
    Sha256.prototype._hash = function() {
      var H = Buffer.allocUnsafe(32);
      H.writeInt32BE(this._a, 0);
      H.writeInt32BE(this._b, 4);
      H.writeInt32BE(this._c, 8);
      H.writeInt32BE(this._d, 12);
      H.writeInt32BE(this._e, 16);
      H.writeInt32BE(this._f, 20);
      H.writeInt32BE(this._g, 24);
      H.writeInt32BE(this._h, 28);
      return H;
    };
    module.exports = Sha256;
  }, {
    "./hash": 145,
    inherits: 101,
    "safe-buffer": 144
  } ],
  151: [ function(require, module, exports) {
    var inherits = require("inherits");
    var SHA512 = require("./sha512");
    var Hash = require("./hash");
    var Buffer = require("safe-buffer").Buffer;
    var W = new Array(160);
    function Sha384() {
      this.init();
      this._w = W;
      Hash.call(this, 128, 112);
    }
    inherits(Sha384, SHA512);
    Sha384.prototype.init = function() {
      this._ah = 3418070365;
      this._bh = 1654270250;
      this._ch = 2438529370;
      this._dh = 355462360;
      this._eh = 1731405415;
      this._fh = 2394180231;
      this._gh = 3675008525;
      this._hh = 1203062813;
      this._al = 3238371032;
      this._bl = 914150663;
      this._cl = 812702999;
      this._dl = 4144912697;
      this._el = 4290775857;
      this._fl = 1750603025;
      this._gl = 1694076839;
      this._hl = 3204075428;
      return this;
    };
    Sha384.prototype._hash = function() {
      var H = Buffer.allocUnsafe(48);
      function writeInt64BE(h, l, offset) {
        H.writeInt32BE(h, offset);
        H.writeInt32BE(l, offset + 4);
      }
      writeInt64BE(this._ah, this._al, 0);
      writeInt64BE(this._bh, this._bl, 8);
      writeInt64BE(this._ch, this._cl, 16);
      writeInt64BE(this._dh, this._dl, 24);
      writeInt64BE(this._eh, this._el, 32);
      writeInt64BE(this._fh, this._fl, 40);
      return H;
    };
    module.exports = Sha384;
  }, {
    "./hash": 145,
    "./sha512": 152,
    inherits: 101,
    "safe-buffer": 144
  } ],
  152: [ function(require, module, exports) {
    var inherits = require("inherits");
    var Hash = require("./hash");
    var Buffer = require("safe-buffer").Buffer;
    var K = [ 1116352408, 3609767458, 1899447441, 602891725, 3049323471, 3964484399, 3921009573, 2173295548, 961987163, 4081628472, 1508970993, 3053834265, 2453635748, 2937671579, 2870763221, 3664609560, 3624381080, 2734883394, 310598401, 1164996542, 607225278, 1323610764, 1426881987, 3590304994, 1925078388, 4068182383, 2162078206, 991336113, 2614888103, 633803317, 3248222580, 3479774868, 3835390401, 2666613458, 4022224774, 944711139, 264347078, 2341262773, 604807628, 2007800933, 770255983, 1495990901, 1249150122, 1856431235, 1555081692, 3175218132, 1996064986, 2198950837, 2554220882, 3999719339, 2821834349, 766784016, 2952996808, 2566594879, 3210313671, 3203337956, 3336571891, 1034457026, 3584528711, 2466948901, 113926993, 3758326383, 338241895, 168717936, 666307205, 1188179964, 773529912, 1546045734, 1294757372, 1522805485, 1396182291, 2643833823, 1695183700, 2343527390, 1986661051, 1014477480, 2177026350, 1206759142, 2456956037, 344077627, 2730485921, 1290863460, 2820302411, 3158454273, 3259730800, 3505952657, 3345764771, 106217008, 3516065817, 3606008344, 3600352804, 1432725776, 4094571909, 1467031594, 275423344, 851169720, 430227734, 3100823752, 506948616, 1363258195, 659060556, 3750685593, 883997877, 3785050280, 958139571, 3318307427, 1322822218, 3812723403, 1537002063, 2003034995, 1747873779, 3602036899, 1955562222, 1575990012, 2024104815, 1125592928, 2227730452, 2716904306, 2361852424, 442776044, 2428436474, 593698344, 2756734187, 3733110249, 3204031479, 2999351573, 3329325298, 3815920427, 3391569614, 3928383900, 3515267271, 566280711, 3940187606, 3454069534, 4118630271, 4000239992, 116418474, 1914138554, 174292421, 2731055270, 289380356, 3203993006, 460393269, 320620315, 685471733, 587496836, 852142971, 1086792851, 1017036298, 365543100, 1126000580, 2618297676, 1288033470, 3409855158, 1501505948, 4234509866, 1607167915, 987167468, 1816402316, 1246189591 ];
    var W = new Array(160);
    function Sha512() {
      this.init();
      this._w = W;
      Hash.call(this, 128, 112);
    }
    inherits(Sha512, Hash);
    Sha512.prototype.init = function() {
      this._ah = 1779033703;
      this._bh = 3144134277;
      this._ch = 1013904242;
      this._dh = 2773480762;
      this._eh = 1359893119;
      this._fh = 2600822924;
      this._gh = 528734635;
      this._hh = 1541459225;
      this._al = 4089235720;
      this._bl = 2227873595;
      this._cl = 4271175723;
      this._dl = 1595750129;
      this._el = 2917565137;
      this._fl = 725511199;
      this._gl = 4215389547;
      this._hl = 327033209;
      return this;
    };
    function Ch(x, y, z) {
      return z ^ x & (y ^ z);
    }
    function maj(x, y, z) {
      return x & y | z & (x | y);
    }
    function sigma0(x, xl) {
      return (x >>> 28 | xl << 4) ^ (xl >>> 2 | x << 30) ^ (xl >>> 7 | x << 25);
    }
    function sigma1(x, xl) {
      return (x >>> 14 | xl << 18) ^ (x >>> 18 | xl << 14) ^ (xl >>> 9 | x << 23);
    }
    function Gamma0(x, xl) {
      return (x >>> 1 | xl << 31) ^ (x >>> 8 | xl << 24) ^ x >>> 7;
    }
    function Gamma0l(x, xl) {
      return (x >>> 1 | xl << 31) ^ (x >>> 8 | xl << 24) ^ (x >>> 7 | xl << 25);
    }
    function Gamma1(x, xl) {
      return (x >>> 19 | xl << 13) ^ (xl >>> 29 | x << 3) ^ x >>> 6;
    }
    function Gamma1l(x, xl) {
      return (x >>> 19 | xl << 13) ^ (xl >>> 29 | x << 3) ^ (x >>> 6 | xl << 26);
    }
    function getCarry(a, b) {
      return a >>> 0 < b >>> 0 ? 1 : 0;
    }
    Sha512.prototype._update = function(M) {
      var W = this._w;
      var ah = 0 | this._ah;
      var bh = 0 | this._bh;
      var ch = 0 | this._ch;
      var dh = 0 | this._dh;
      var eh = 0 | this._eh;
      var fh = 0 | this._fh;
      var gh = 0 | this._gh;
      var hh = 0 | this._hh;
      var al = 0 | this._al;
      var bl = 0 | this._bl;
      var cl = 0 | this._cl;
      var dl = 0 | this._dl;
      var el = 0 | this._el;
      var fl = 0 | this._fl;
      var gl = 0 | this._gl;
      var hl = 0 | this._hl;
      for (var i = 0; i < 32; i += 2) {
        W[i] = M.readInt32BE(4 * i);
        W[i + 1] = M.readInt32BE(4 * i + 4);
      }
      for (;i < 160; i += 2) {
        var xh = W[i - 30];
        var xl = W[i - 30 + 1];
        var gamma0 = Gamma0(xh, xl);
        var gamma0l = Gamma0l(xl, xh);
        xh = W[i - 4];
        xl = W[i - 4 + 1];
        var gamma1 = Gamma1(xh, xl);
        var gamma1l = Gamma1l(xl, xh);
        var Wi7h = W[i - 14];
        var Wi7l = W[i - 14 + 1];
        var Wi16h = W[i - 32];
        var Wi16l = W[i - 32 + 1];
        var Wil = gamma0l + Wi7l | 0;
        var Wih = gamma0 + Wi7h + getCarry(Wil, gamma0l) | 0;
        Wil = Wil + gamma1l | 0;
        Wih = Wih + gamma1 + getCarry(Wil, gamma1l) | 0;
        Wil = Wil + Wi16l | 0;
        Wih = Wih + Wi16h + getCarry(Wil, Wi16l) | 0;
        W[i] = Wih;
        W[i + 1] = Wil;
      }
      for (var j = 0; j < 160; j += 2) {
        Wih = W[j];
        Wil = W[j + 1];
        var majh = maj(ah, bh, ch);
        var majl = maj(al, bl, cl);
        var sigma0h = sigma0(ah, al);
        var sigma0l = sigma0(al, ah);
        var sigma1h = sigma1(eh, el);
        var sigma1l = sigma1(el, eh);
        var Kih = K[j];
        var Kil = K[j + 1];
        var chh = Ch(eh, fh, gh);
        var chl = Ch(el, fl, gl);
        var t1l = hl + sigma1l | 0;
        var t1h = hh + sigma1h + getCarry(t1l, hl) | 0;
        t1l = t1l + chl | 0;
        t1h = t1h + chh + getCarry(t1l, chl) | 0;
        t1l = t1l + Kil | 0;
        t1h = t1h + Kih + getCarry(t1l, Kil) | 0;
        t1l = t1l + Wil | 0;
        t1h = t1h + Wih + getCarry(t1l, Wil) | 0;
        var t2l = sigma0l + majl | 0;
        var t2h = sigma0h + majh + getCarry(t2l, sigma0l) | 0;
        hh = gh;
        hl = gl;
        gh = fh;
        gl = fl;
        fh = eh;
        fl = el;
        el = dl + t1l | 0;
        eh = dh + t1h + getCarry(el, dl) | 0;
        dh = ch;
        dl = cl;
        ch = bh;
        cl = bl;
        bh = ah;
        bl = al;
        al = t1l + t2l | 0;
        ah = t1h + t2h + getCarry(al, t1l) | 0;
      }
      this._al = this._al + al | 0;
      this._bl = this._bl + bl | 0;
      this._cl = this._cl + cl | 0;
      this._dl = this._dl + dl | 0;
      this._el = this._el + el | 0;
      this._fl = this._fl + fl | 0;
      this._gl = this._gl + gl | 0;
      this._hl = this._hl + hl | 0;
      this._ah = this._ah + ah + getCarry(this._al, al) | 0;
      this._bh = this._bh + bh + getCarry(this._bl, bl) | 0;
      this._ch = this._ch + ch + getCarry(this._cl, cl) | 0;
      this._dh = this._dh + dh + getCarry(this._dl, dl) | 0;
      this._eh = this._eh + eh + getCarry(this._el, el) | 0;
      this._fh = this._fh + fh + getCarry(this._fl, fl) | 0;
      this._gh = this._gh + gh + getCarry(this._gl, gl) | 0;
      this._hh = this._hh + hh + getCarry(this._hl, hl) | 0;
    };
    Sha512.prototype._hash = function() {
      var H = Buffer.allocUnsafe(64);
      function writeInt64BE(h, l, offset) {
        H.writeInt32BE(h, offset);
        H.writeInt32BE(l, offset + 4);
      }
      writeInt64BE(this._ah, this._al, 0);
      writeInt64BE(this._bh, this._bl, 8);
      writeInt64BE(this._ch, this._cl, 16);
      writeInt64BE(this._dh, this._dl, 24);
      writeInt64BE(this._eh, this._el, 32);
      writeInt64BE(this._fh, this._fl, 40);
      writeInt64BE(this._gh, this._gl, 48);
      writeInt64BE(this._hh, this._hl, 56);
      return H;
    };
    module.exports = Sha512;
  }, {
    "./hash": 145,
    inherits: 101,
    "safe-buffer": 144
  } ],
  153: [ function(require, module, exports) {
    module.exports = Stream;
    var EE = require("events").EventEmitter;
    var inherits = require("inherits");
    inherits(Stream, EE);
    Stream.Readable = require("readable-stream/readable.js");
    Stream.Writable = require("readable-stream/writable.js");
    Stream.Duplex = require("readable-stream/duplex.js");
    Stream.Transform = require("readable-stream/transform.js");
    Stream.PassThrough = require("readable-stream/passthrough.js");
    Stream.Stream = Stream;
    function Stream() {
      EE.call(this);
    }
    Stream.prototype.pipe = function(dest, options) {
      var source = this;
      function ondata(chunk) {
        dest.writable && false === dest.write(chunk) && source.pause && source.pause();
      }
      source.on("data", ondata);
      function ondrain() {
        source.readable && source.resume && source.resume();
      }
      dest.on("drain", ondrain);
      if (!dest._isStdio && (!options || false !== options.end)) {
        source.on("end", onend);
        source.on("close", onclose);
      }
      var didOnEnd = false;
      function onend() {
        if (didOnEnd) return;
        didOnEnd = true;
        dest.end();
      }
      function onclose() {
        if (didOnEnd) return;
        didOnEnd = true;
        "function" === typeof dest.destroy && dest.destroy();
      }
      function onerror(er) {
        cleanup();
        if (0 === EE.listenerCount(this, "error")) throw er;
      }
      source.on("error", onerror);
      dest.on("error", onerror);
      function cleanup() {
        source.removeListener("data", ondata);
        dest.removeListener("drain", ondrain);
        source.removeListener("end", onend);
        source.removeListener("close", onclose);
        source.removeListener("error", onerror);
        dest.removeListener("error", onerror);
        source.removeListener("end", cleanup);
        source.removeListener("close", cleanup);
        dest.removeListener("close", cleanup);
      }
      source.on("end", cleanup);
      source.on("close", cleanup);
      dest.on("close", cleanup);
      dest.emit("pipe", source);
      return dest;
    };
  }, {
    events: 83,
    inherits: 101,
    "readable-stream/duplex.js": 128,
    "readable-stream/passthrough.js": 139,
    "readable-stream/readable.js": 140,
    "readable-stream/transform.js": 141,
    "readable-stream/writable.js": 142
  } ],
  154: [ function(require, module, exports) {
    var Buffer = require("buffer").Buffer;
    var isBufferEncoding = Buffer.isEncoding || function(encoding) {
      switch (encoding && encoding.toLowerCase()) {
       case "hex":
       case "utf8":
       case "utf-8":
       case "ascii":
       case "binary":
       case "base64":
       case "ucs2":
       case "ucs-2":
       case "utf16le":
       case "utf-16le":
       case "raw":
        return true;

       default:
        return false;
      }
    };
    function assertEncoding(encoding) {
      if (encoding && !isBufferEncoding(encoding)) throw new Error("Unknown encoding: " + encoding);
    }
    var StringDecoder = exports.StringDecoder = function(encoding) {
      this.encoding = (encoding || "utf8").toLowerCase().replace(/[-_]/, "");
      assertEncoding(encoding);
      switch (this.encoding) {
       case "utf8":
        this.surrogateSize = 3;
        break;

       case "ucs2":
       case "utf16le":
        this.surrogateSize = 2;
        this.detectIncompleteChar = utf16DetectIncompleteChar;
        break;

       case "base64":
        this.surrogateSize = 3;
        this.detectIncompleteChar = base64DetectIncompleteChar;
        break;

       default:
        this.write = passThroughWrite;
        return;
      }
      this.charBuffer = new Buffer(6);
      this.charReceived = 0;
      this.charLength = 0;
    };
    StringDecoder.prototype.write = function(buffer) {
      var charStr = "";
      while (this.charLength) {
        var available = buffer.length >= this.charLength - this.charReceived ? this.charLength - this.charReceived : buffer.length;
        buffer.copy(this.charBuffer, this.charReceived, 0, available);
        this.charReceived += available;
        if (this.charReceived < this.charLength) return "";
        buffer = buffer.slice(available, buffer.length);
        charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);
        var charCode = charStr.charCodeAt(charStr.length - 1);
        if (charCode >= 55296 && charCode <= 56319) {
          this.charLength += this.surrogateSize;
          charStr = "";
          continue;
        }
        this.charReceived = this.charLength = 0;
        if (0 === buffer.length) return charStr;
        break;
      }
      this.detectIncompleteChar(buffer);
      var end = buffer.length;
      if (this.charLength) {
        buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
        end -= this.charReceived;
      }
      charStr += buffer.toString(this.encoding, 0, end);
      var end = charStr.length - 1;
      var charCode = charStr.charCodeAt(end);
      if (charCode >= 55296 && charCode <= 56319) {
        var size = this.surrogateSize;
        this.charLength += size;
        this.charReceived += size;
        this.charBuffer.copy(this.charBuffer, size, 0, size);
        buffer.copy(this.charBuffer, 0, 0, size);
        return charStr.substring(0, end);
      }
      return charStr;
    };
    StringDecoder.prototype.detectIncompleteChar = function(buffer) {
      var i = buffer.length >= 3 ? 3 : buffer.length;
      for (;i > 0; i--) {
        var c = buffer[buffer.length - i];
        if (1 == i && c >> 5 == 6) {
          this.charLength = 2;
          break;
        }
        if (i <= 2 && c >> 4 == 14) {
          this.charLength = 3;
          break;
        }
        if (i <= 3 && c >> 3 == 30) {
          this.charLength = 4;
          break;
        }
      }
      this.charReceived = i;
    };
    StringDecoder.prototype.end = function(buffer) {
      var res = "";
      buffer && buffer.length && (res = this.write(buffer));
      if (this.charReceived) {
        var cr = this.charReceived;
        var buf = this.charBuffer;
        var enc = this.encoding;
        res += buf.slice(0, cr).toString(enc);
      }
      return res;
    };
    function passThroughWrite(buffer) {
      return buffer.toString(this.encoding);
    }
    function utf16DetectIncompleteChar(buffer) {
      this.charReceived = buffer.length % 2;
      this.charLength = this.charReceived ? 2 : 0;
    }
    function base64DetectIncompleteChar(buffer) {
      this.charReceived = buffer.length % 3;
      this.charLength = this.charReceived ? 3 : 0;
    }
  }, {
    buffer: 47
  } ],
  155: [ function(require, module, exports) {
    (function(global) {
      module.exports = deprecate;
      function deprecate(fn, msg) {
        if (config("noDeprecation")) return fn;
        var warned = false;
        function deprecated() {
          if (!warned) {
            if (config("throwDeprecation")) throw new Error(msg);
            config("traceDeprecation") ? console.trace(msg) : console.warn(msg);
            warned = true;
          }
          return fn.apply(this, arguments);
        }
        return deprecated;
      }
      function config(name) {
        try {
          if (!global.localStorage) return false;
        } catch (_) {
          return false;
        }
        var val = global.localStorage[name];
        if (null == val) return false;
        return "true" === String(val).toLowerCase();
      }
    }).call(this, "undefined" !== typeof global ? global : "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : {});
  }, {} ],
  156: [ function(require, module, exports) {
    var indexOf = require("indexof");
    var Object_keys = function(obj) {
      if (Object.keys) return Object.keys(obj);
      var res = [];
      for (var key in obj) res.push(key);
      return res;
    };
    var forEach = function(xs, fn) {
      if (xs.forEach) return xs.forEach(fn);
      for (var i = 0; i < xs.length; i++) fn(xs[i], i, xs);
    };
    var defineProp = function() {
      try {
        Object.defineProperty({}, "_", {});
        return function(obj, name, value) {
          Object.defineProperty(obj, name, {
            writable: true,
            enumerable: false,
            configurable: true,
            value: value
          });
        };
      } catch (e) {
        return function(obj, name, value) {
          obj[name] = value;
        };
      }
    }();
    var globals = [ "Array", "Boolean", "Date", "Error", "EvalError", "Function", "Infinity", "JSON", "Math", "NaN", "Number", "Object", "RangeError", "ReferenceError", "RegExp", "String", "SyntaxError", "TypeError", "URIError", "decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent", "escape", "eval", "isFinite", "isNaN", "parseFloat", "parseInt", "undefined", "unescape" ];
    function Context() {}
    Context.prototype = {};
    var Script = exports.Script = function NodeScript(code) {
      if (!(this instanceof Script)) return new Script(code);
      this.code = code;
    };
    Script.prototype.runInContext = function(context) {
      if (!(context instanceof Context)) throw new TypeError("needs a 'context' argument.");
      var iframe = document.createElement("iframe");
      iframe.style || (iframe.style = {});
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      var win = iframe.contentWindow;
      var wEval = win.eval, wExecScript = win.execScript;
      if (!wEval && wExecScript) {
        wExecScript.call(win, "null");
        wEval = win.eval;
      }
      forEach(Object_keys(context), function(key) {
        win[key] = context[key];
      });
      forEach(globals, function(key) {
        context[key] && (win[key] = context[key]);
      });
      var winKeys = Object_keys(win);
      var res = wEval.call(win, this.code);
      forEach(Object_keys(win), function(key) {
        (key in context || -1 === indexOf(winKeys, key)) && (context[key] = win[key]);
      });
      forEach(globals, function(key) {
        key in context || defineProp(context, key, win[key]);
      });
      document.body.removeChild(iframe);
      return res;
    };
    Script.prototype.runInThisContext = function() {
      return eval(this.code);
    };
    Script.prototype.runInNewContext = function(context) {
      var ctx = Script.createContext(context);
      var res = this.runInContext(ctx);
      forEach(Object_keys(ctx), function(key) {
        context[key] = ctx[key];
      });
      return res;
    };
    forEach(Object_keys(Script.prototype), function(name) {
      exports[name] = Script[name] = function(code) {
        var s = Script(code);
        return s[name].apply(s, [].slice.call(arguments, 1));
      };
    });
    exports.createScript = function(code) {
      return exports.Script(code);
    };
    exports.createContext = Script.createContext = function(context) {
      var copy = new Context();
      "object" === typeof context && forEach(Object_keys(context), function(key) {
        copy[key] = context[key];
      });
      return copy;
    };
  }, {
    indexof: 100
  } ],
  Atom: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "1820dFmZhJKNadR5MeGariK", "Atom");
    "use strict";
    var Atom = {
      createAtom: function createAtom() {
        console.log("!---- AtomFrame ----!");
        cc.Atom = {};
        var timerMgr = require("AtomFrame/timerMgr");
        cc.Atom.timerMgr = new timerMgr();
        var md5 = require("AtomFrame/md5");
        cc.Atom.md5 = new md5();
        var gameState = require("AtomFrame/gameState");
        cc.Atom.gameState = new gameState();
        var gameConfMgr = require("AtomFrame/gameConfMgr");
        cc.Atom.gameConfMgr = new gameConfMgr();
        var eventMgr = require("AtomFrame/eventMgr");
        cc.Atom.eventMgr = new eventMgr();
        var msgMgr = require("AtomFrame/msgMgr");
        cc.Atom.msgMgr = new msgMgr();
        var spriteMgr = require("AtomFrame/spriteMgr");
        cc.Atom.spriteMgr = new spriteMgr();
        var audioMgr = require("AtomFrame/audioMgr");
        cc.Atom.audioMgr = new audioMgr();
        var prefabMgr = require("AtomFrame/prefabMgr");
        cc.Atom.prefabMgr = new prefabMgr();
        var effectMgr = require("AtomFrame/effectMgr");
        cc.Atom.effectMgr = new effectMgr();
        var animateMgr = require("AtomFrame/animateMgr");
        cc.Atom.animateMgr = new animateMgr();
        var resMgr = require("AtomFrame/resMgr");
        cc.Atom.resMgr = new resMgr();
        var UIMgr = require("AtomFrame/UIMgr");
        cc.Atom.UIMgr = new UIMgr();
        var comFunMgr = require("AtomFrame/comFunMgr");
        cc.Atom.comFunMgr = new comFunMgr();
        var gameDataMgr = require("AtomFrame/gameDataMgr");
        cc.Atom.gameDataMgr = new gameDataMgr();
        var gameNetMgr = require("AtomFrame/gameNetMgr");
        cc.Atom.gameNetMgr = new gameNetMgr();
        var socketMgr = require("AtomFrame/socketMgr");
        cc.Atom.socketMgr = new socketMgr();
        var hotUpdateMgr = require("AtomFrame/hotUpdateMgr");
        cc.Atom.hotUpdateMgr = new hotUpdateMgr();
      }
    };
    module.exports = Atom;
    cc._RF.pop();
  }, {
    "AtomFrame/UIMgr": void 0,
    "AtomFrame/animateMgr": void 0,
    "AtomFrame/audioMgr": void 0,
    "AtomFrame/comFunMgr": void 0,
    "AtomFrame/effectMgr": void 0,
    "AtomFrame/eventMgr": void 0,
    "AtomFrame/gameConfMgr": void 0,
    "AtomFrame/gameDataMgr": void 0,
    "AtomFrame/gameNetMgr": void 0,
    "AtomFrame/gameState": void 0,
    "AtomFrame/hotUpdateMgr": void 0,
    "AtomFrame/md5": void 0,
    "AtomFrame/msgMgr": void 0,
    "AtomFrame/prefabMgr": void 0,
    "AtomFrame/resMgr": void 0,
    "AtomFrame/socketMgr": void 0,
    "AtomFrame/spriteMgr": void 0,
    "AtomFrame/timerMgr": void 0
  } ],
  BonesBase: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "1adf3fUtHtDG6MuWGq9Dbcd", "BonesBase");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "BonesBase",
        DefaultAni: null
      },
      onLoad: function onLoad() {
        this._armatureDisPlay = this.getComponent(dragonBones.ArmatureDisplay);
        this._armature = this._armatureDisPlay.armature();
        this._armatureDisPlay.addEventListener(dragonBones.EventObject.FADE_IN_COMPLETE, this.animationEventHandler, this);
        this._armatureDisPlay.addEventListener(dragonBones.EventObject.FADE_OUT_COMPLETE, this.animationEventHandler, this);
        this._armatureDisPlay.addEventListener(dragonBones.EventObject.COMPLETE, this.animationEventHandler, this);
        this._armatureDisPlay.addEventListener(dragonBones.EventObject.ANIMATION_FRAME_EVENT, this.animationEventHandler, this);
        this._armatureDisPlay.addEventListener(dragonBones.EventObject.BONE_FRAME_EVENT, this.animationEventHandler, this);
        this._armatureDisPlay.addEventListener(dragonBones.EventObject.FRAME_EVENT, this.animationEventHandler, this);
        this._armatureDisPlay.addEventListener(dragonBones.EventObject.LOOP_COMPLETE, this.animationEventHandler, this);
      },
      animationEventHandler: function animationEventHandler(event) {
        if (events.type == dragonBones.EventObject.FADE_IN_COMPLETE) {
          console.log(" FADE_IN_COMPLETE ", event.detail.animationName);
          this.onFadeInComplete(events);
        } else if (events.type == dragonBones.EventObject.FADE_OUT_COMPLETE) {
          console.log(" FADE_OUT_COMPLETE ", event.detail.animationName);
          this.onFadeOutComplete(events);
        } else if (events.type == dragonBones.EventObject.COMPLETE) {
          console.log(" COMPLETE ", event.detail.animationName);
          this.onAniComplete(events);
        } else if (events.type == dragonBones.EventObject.ANIMATION_FRAME_EVENT) {
          console.log(" ANIMATION_FRAME_EVENT ", event.detail.animationName);
          this.onAniFrameEvent(events);
        } else if (events.type == dragonBones.EventObject.BONE_FRAME_EVENT) {
          console.log(" BONE_FRAME_EVENT ", event.detail.animationName);
          this.onBoneFrameEvent(events);
        } else if (events.type == dragonBones.EventObject.FRAME_EVENT) {
          console.log(" FRAME_EVENT ", event.detail.animationName);
          this.onFrameEvent(events);
        } else if (events.type == dragonBones.EventObject.LOOP_COMPLETE) {
          console.log(" LOOP_COMPLETE ", event.detail.animationName);
          this.onLoopComplete(events);
        }
      },
      onAniComplete: function onAniComplete(events) {},
      onFadeInComplete: function onFadeInComplete(events) {},
      onFadeOutComplete: function onFadeOutComplete(events) {},
      onAniFrameEvent: function onAniFrameEvent(events) {},
      onBoneFrameEvent: function onBoneFrameEvent(events) {},
      onFrameEvent: function onFrameEvent(events) {},
      onLoopComplete: function onLoopComplete(events) {},
      playAnimation: function playAnimation(name, playtimes) {
        if (null == name && 0 == name.length) {
          console.log(" ### BonesBase playAnimation name null !!!");
          return;
        }
        null == playtimes && (playtimes = -1);
        this._armatureDisPlay.playAnimation(name, playtimes);
      }
    });
    cc._RF.pop();
  }, {} ],
  BrickDelegate: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "070a7IN9YFNF60eU/Dl4jjv", "BrickDelegate");
    "use strict";
    var ObjType = cc.Enum({
      baseBrick: 0,
      buffBrick: 1,
      player: 2
    });
    cc.Class({
      extends: cc.Component,
      properties: {
        brickData: null,
        objType: {
          default: ObjType.baseBrick,
          type: cc.Enum(ObjType)
        }
      },
      onLoad: function onLoad() {},
      start: function start() {},
      update: function update(dt) {},
      getBrickData: function getBrickData() {
        return this.brickData;
      },
      setBrickData: function setBrickData(value) {
        this.brickData = value;
        this.buffui = this.node.getChildByName("buff");
        this.trapui = this.node.getChildByName("trap");
        this.wallui = this.node.getChildByName("wall");
        this.buffui.active = value.brickType == cc.Atom.gameConfMgr.BRICKS.BUFF;
        this.trapui.active = value.brickType == cc.Atom.gameConfMgr.BRICKS.TRAP;
        this.wallui.active = value.brickType == cc.Atom.gameConfMgr.BRICKS.WALL;
      },
      getGameObjType: function getGameObjType() {
        return this.objType;
      }
    });
    cc._RF.pop();
  }, {} ],
  HelloWorld: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "280c3rsZJJKnZ9RqbALVwtK", "HelloWorld");
    "use strict";
    var _typeof = "function" === typeof Symbol && "symbol" === typeof Symbol.iterator ? function(obj) {
      return typeof obj;
    } : function(obj) {
      return obj && "function" === typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
    cc.Class({
      extends: cc.Component,
      properties: {
        label: {
          default: null,
          type: cc.Label
        },
        btnLoad: {
          default: null,
          type: cc.Button
        },
        text: "Hello, World!"
      },
      onLoad: function onLoad() {
        var _this = this;
        this.label.string = this.text;
        var atom = require("AtomFrame/Atom");
        atom.createAtom();
        cc.Atom.gameConfMgr.TAG = "66666";
        console.log("gameConfMgr version", cc.Atom.gameConfMgr.getInfo("version"));
        console.log("gameConfMgr gamemode", cc.Atom.gameConfMgr.getInfo("gamemode"));
        cc.Atom.gameConfMgr.setInfo("version", "1.2.0");
        cc.Atom.gameConfMgr.setInfo("gamemode", "game");
        console.log("gameConfMgr version", cc.Atom.gameConfMgr.getInfo("version"));
        console.log("gameConfMgr gamemode", cc.Atom.gameConfMgr.getInfo("gamemode"));
        cc.Atom.eventMgr.listen("_showMsg", function(obj, data) {
          "string" == typeof data ? _this.label.string = data : console.log("data_ type: ", "undefined" === typeof data ? "undefined" : _typeof(data));
        }, this);
        cc.Atom.gameDataMgr.setData("HP_NUM", 1e3);
        cc.Atom.gameDataMgr.setData("MP_NUM", 2e3);
      },
      onHW1: function onHW1() {
        cc.Atom.eventMgr.notify("_onHW1", "\u6765\u81ea hello world \u573a\u666f\u7684\u6d88\u606f1");
      },
      onHW2: function onHW2() {
        cc.Atom.eventMgr.notify("_onHW2", "\u6765\u81ea hello world \u573a\u666f\u7684\u6d88\u606f2");
      },
      onLoadCommon: function onLoadCommon() {
        var _this2 = this;
        cc.Atom.resMgr.loadResByKey("common", function(index, total, err) {
          if (null != err || -1 == index) {
            console.log("=== \u52a0\u8f7d\u8d44\u6e90\u51fa\u73b0\u5f02\u5e38\uff1a ", err);
            return;
          }
          console.log(" \u8d44\u6e90\u52a0\u8f7d\u8fdb\u5ea6 \uff1a ", index, total);
          if (index == total) {
            var btn = _this2.btnLoad.getComponent(cc.Button);
            btn.normalSprite = cc.Atom.spriteMgr.loadSpriteWithUrl("http://pic.qiantucdn.com/58pic/15/47/80/13s58PICQVG_1024.png", function(sprite) {
              if (sprite) {
                console.log("\u4fee\u6539\u4e3a\u7f51\u7edc\u56fe\u7247");
                btn.normalSprite = sprite;
              }
            });
            btn.pressedSprite = cc.Atom.spriteMgr.getSpriteFrame("btn_blue");
            btn.hoverSprite = cc.Atom.spriteMgr.getSpriteFrame("btn_blue");
            btn.disabledSprite = cc.Atom.spriteMgr.getSpriteFrame("btn_blue");
          }
        });
      }
    });
    cc._RF.pop();
  }, {
    "AtomFrame/Atom": void 0
  } ],
  JJGameController: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "f2bcfh4j+lBOKEauDOgI0eM", "JJGameController");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        mapLayer: {
          default: null,
          type: cc.Node
        },
        uiLayer: {
          default: null,
          type: cc.Node
        }
      },
      onLoad: function onLoad() {
        var _this = this;
        cc.Atom.gameState.setGameStop();
        cc.Atom.eventMgr.listen("onStartGame", function(obj, data) {
          _this.onStartGame();
        }, this);
        cc.Atom.eventMgr.listen("onGameOver", function(obj, data) {
          _this.onGameOver(data);
        }, this);
        cc.Atom.eventMgr.listen("onPause", function(obj, data) {
          _this.onPause(data);
        }, this);
        cc.Atom.eventMgr.listen("onReStart", function(obj, data) {
          _this.onReStart(data);
        }, this);
      },
      start: function start() {
        this.addTouchEvent();
      },
      onDestroy: function onDestroy() {
        cc.Atom.eventMgr.unListenByObj(this);
      },
      onStartGame: function onStartGame() {
        console.log(">>>> onStartGame ");
        this.gameUpdateInterval = cc.Atom.gameConfMgr.getInfo("gameUpdateInterval");
        this.gameSpeed = cc.Atom.gameConfMgr.getInfo("gameSpeed");
        this.maxSteps = cc.Atom.gameConfMgr.getInfo("maxSteps");
        this.indexOffset = cc.Atom.gameConfMgr.getInfo("indexOffset");
        var topbar = cc.Atom.prefabMgr.getPrefabObj("topStatuBar");
        topbar.parent = this.node;
        this.topbar = topbar;
        this.addBrick();
        cc.Atom.gameState.setGameIng();
      },
      addTouchEvent: function addTouchEvent() {
        var self = this;
        this.node.on(cc.Node.EventType.TOUCH_START, function(event) {
          console.log(">>>>>> TOUCH_START");
          if (!cc.Atom.gameState.isGameIng()) return;
          var posi = event.touch._point;
          var width = cc.Atom.gameDataMgr.getData("brickWidth");
          var brickNum = cc.Atom.gameConfMgr.getInfo("brickNum");
          var turnSpeed = cc.Atom.gameConfMgr.getInfo("turnSpeed");
          var minx = (1 - (brickNum + 1) / 2) * width;
          var maxx = (brickNum - (brickNum + 1) / 2) * width;
          var action;
          if (posi.x < self.node.width / 2) {
            var x = self.player.x - width;
            x < minx && (x = minx);
            action = cc.moveTo(turnSpeed, cc.p(x, self.player.y));
          } else {
            var x = self.player.x + width;
            x > maxx && (x = maxx);
            action = cc.moveTo(turnSpeed, cc.p(x, self.player.y));
          }
          self.player.runAction(action);
        });
        this.node.on(cc.Node.EventType.TOUCH_MOVE, function(event) {
          console.log(">>>>>> TOUCH_MOVE");
        });
        this.node.on(cc.Node.EventType.TOUCH_END, function(event) {
          console.log(">>>>>> TOUCH_END");
        });
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, function(event) {
          console.log(">>>>>> TOUCH_CANCEL");
        });
      },
      onGameOver: function onGameOver(data) {
        this.player.stopAllActions();
        console.log(">>> player over");
        if (data) var _type = data._type;
      },
      onReStart: function onReStart() {
        cc.Atom.gameState.setGameStop();
        this.mapLayer.removeAllChildren();
        this.topbar.removeFromParent();
        this.onStartGame();
      },
      onPause: function onPause(_bool) {
        if (true == _bool) {
          console.log(">>> show pause_ui ");
          var pause_ui = cc.Atom.prefabMgr.getPrefabObj("paruse_ui");
          pause_ui.parent = this.uiLayer;
          pause_ui.zIndex = 150;
          cc.Atom.gameState.setGamePause();
        } else cc.Atom.gameState.setGameIng();
      },
      addBrick: function addBrick() {
        this.indexTag = 0;
        this.player_indexTag = 0;
        this.minterval = 0;
        this.mapController = this.mapLayer.getComponent("MapController");
        for (var i = 1; i <= this.maxSteps / this.indexOffset; i++) {
          var bricklist = this.mapController.makeBrickNodes(i);
          for (var j = 0; j < bricklist.length; j++) {
            var node = bricklist[j];
            if (node) {
              var width = node.width;
              var height = node.height;
              var x = (j + 1 - (bricklist.length + 1) / 2) * width;
              var y = i * height - height / 2;
              node.parent = this.mapLayer;
              node.x = x;
              node.y = y;
              cc.Atom.gameDataMgr.setData("brickWidth", width);
              cc.Atom.gameDataMgr.setData("brickHeight", height);
            }
          }
        }
        var player = cc.Atom.prefabMgr.getPrefabObj("player_obj");
        player.name = "player";
        player.parent = this.mapLayer;
        player.y = player.height / 2 + 3 * player.height;
        player.zIndex = 100;
        this.player = player;
        this.player_indexTag = Math.ceil(cc.Atom.gameConfMgr.getInfo("brickNum") / 2);
        cc.Atom.gameDataMgr.setData("isPlayerMove", true);
      },
      update: function update(dt) {
        cc.Atom.gameState.isGameIng() && this.mapController.mapUpdate(this.mapLayer, dt);
      }
    });
    cc._RF.pop();
  }, {} ],
  JJHallMain: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "4eee41AqbNNAYdNqc5+Pvyk", "JJHallMain");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {},
      onLoad: function onLoad() {
        var _this = this;
        cc.Atom.eventMgr.listen("onHallMain", function(obj, data) {
          _this.onHallMain();
        }, this);
      },
      start: function start() {},
      onDestroy: function onDestroy() {
        cc.Atom.eventMgr.unListenByObj(this);
      },
      onHallMain: function onHallMain() {},
      onBtnStart: function onBtnStart() {
        console.log(this.desc, " ---- Hall2Game");
        cc.Atom.gameState.setGameInRoom();
        cc.director.loadScene("JJGame/Scene/JJGameMain");
      },
      onBtnStore: function onBtnStore() {},
      onBtnAbout: function onBtnAbout() {},
      onBtnSet: function onBtnSet() {}
    });
    cc._RF.pop();
  }, {} ],
  MapController: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "321d8jUoHZMfYtl4MYSbmjE", "MapController");
    "use strict";
    var _typeof = "function" === typeof Symbol && "symbol" === typeof Symbol.iterator ? function(obj) {
      return typeof obj;
    } : function(obj) {
      return obj && "function" === typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "MapController"
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
      makeBrick: function makeBrick() {
        var brickNum = cc.Atom.gameConfMgr.getInfo("brickNum");
        var bricList = [];
        for (var i = 0; i < brickNum; i++) {
          var item = {};
          item.brickType = this.aiBrickType();
          item.brickNum = brickNum;
          bricList[i] = item;
        }
        return bricList;
      },
      aiBrickType: function aiBrickType() {
        var ran = Math.round(10 * Math.random());
        console.log(">>>>>>> aiBrickType ran %d", ran);
        if (ran < 1) return cc.Atom.gameConfMgr.BRICKS.TRAP;
        return cc.Atom.gameConfMgr.BRICKS.BASE;
      },
      makeBrickNodes: function makeBrickNodes(index_tag) {
        var bricList_data = this.makeBrick();
        var brickNodeList = [];
        for (var i = 0; i < bricList_data.length; i++) {
          var item = bricList_data[i];
          var node = cc.Atom.prefabMgr.getPrefabObj("brick");
          console.log(">>> prefab obj type :" + ("undefined" === typeof node ? "undefined" : _typeof(node)));
          if (null != node) {
            node.name = item.brickType == cc.Atom.gameConfMgr.BRICKS.BASE ? "brick" : "component_brick";
            node.zIndex = 50;
            var brickScript = node.getComponent("BrickDelegate");
            brickScript.setBrickData(item);
            brickNodeList[i] = node;
          } else console.log(">>>> ERR makeBrickNodes node not a prefab object !!!");
        }
        return brickNodeList;
      },
      mapUpdate: function mapUpdate(target, dt) {
        var makeNew = false;
        var position_max = 0;
        var move = cc.Atom.gameConfMgr.getInfo("gameUpdateMove") * dt;
        var player = target.getChildByName("player");
        if (true == cc.Atom.gameDataMgr.getData("isPlayerMove")) {
          if (player) {
            player.y = player.y + move;
            var brick = target.getChildByName("brick");
            var height = brick.height;
            if (player.y >= 3 * height) {
              player.y = 3 * height + height / 2;
              cc.Atom.gameDataMgr.setData("isPlayerMove", false);
            }
          }
        } else {
          var bricks = target.getChildren();
          console.log(">>>> map brick number : %d", bricks.length);
          for (var i = 0; i < bricks.length; i++) {
            var item = bricks[i];
            "brick" != item.name && "component_brick" != item.name || (item.y = item.y - move);
          }
          for (var m = bricks.length - 1; m >= 0; m--) {
            var node = bricks[m];
            if ("brick" == node.name || "component_brick" == node.name) {
              if (node.y < -node.height / 2) {
                makeNew = true;
                node.removeFromParent();
              }
              node.y > position_max && (position_max = node.y);
            }
          }
        }
        var nbricks = target.getChildren();
        var px = player.x;
        var py = player.y;
        var hitOffset = cc.Atom.gameConfMgr.getInfo("hitOffset");
        for (var bi = 0; bi < nbricks.length; bi++) {
          var item = nbricks[bi];
          if ("component_brick" == item.name && Math.abs(item.x - px) < item.width - hitOffset && Math.abs(item.y - py) < item.height - hitOffset) {
            console.log(">>>> player hit");
            var script = item.getComponent("BrickDelegate");
            var _type = script.getBrickData().brickType;
            if (_type == cc.Atom.gameConfMgr.BRICKS.TRAP) {
              console.log(">>>> over");
              cc.Atom.gameState.setGameOver();
              cc.Atom.eventMgr.notify("onGameOver", {
                _type: _type
              });
            }
          }
        }
        if (true == makeNew) {
          var nodelist = this.makeBrickNodes();
          for (var j = 0; j < nodelist.length; j++) {
            var brick = nodelist[j];
            if (brick) {
              var width = brick.width;
              var height = brick.height;
              var x = (j + 1 - (nodelist.length + 1) / 2) * width;
              var y = position_max + height;
              brick.parent = target;
              brick.x = x;
              brick.y = y;
            }
          }
        }
      }
    });
    cc._RF.pop();
  }, {} ],
  UIMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "69c4cYv+NBH5ZYoxGkZkQW+", "UIMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "UIMgr"
      },
      ctor: function ctor() {
        console.log("-new:" + this.TAG);
      },
      onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
      },
      onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
      }
    });
    cc._RF.pop();
  }, {} ],
  animateMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "511f1JGezdPq516OYU3i6Yl", "animateMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "animateMgr"
      },
      ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.aniBuff = {};
      },
      onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
      },
      onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
      },
      addAniClip: function addAniClip(key, obj) {
        if (null == key || !obj instanceof cc.AnimationClip) {
          console.log(" ------ \u7c7b\u578b\u5f02\u5e38 ", key);
          return;
        }
        this.aniBuff[key] = obj;
      },
      getAniClip: function getAniClip(key) {
        if (null == key) return null;
        return this.aniBuff[key];
      },
      cleanAniClip: function cleanAniClip(key) {
        this.aniBuff[key] = null;
      },
      playAni: function playAni(target, key) {
        if (null == target || null == key) {
          console.log(" ------ \u64ad\u653e\u52a8\u753b\u5bf9\u8c61\u4e0d\u80fd\u4e3a\u7a7a");
          return;
        }
        var clip = this.aniBuff[key];
        if (null == clip || !clip instanceof cc.AnimationClip) {
          console.log(" ------ Clip\u5f02\u5e38", key);
          return;
        }
        var aniCom = target.getComponent(cc.Animation);
        if (null == aniCom) {
          target.addComponent(cc.Animation);
          aniCom = target.getComponent(cc.Animation);
        }
        aniCom.addClip(clip, "ani");
        aniCom.play("ani");
      }
    });
    cc._RF.pop();
  }, {} ],
  audioMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "1a21fbaOgxPXKnwrLSJKDYn", "audioMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "audioMgr"
      },
      ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.bgmAudioID = -1;
        this.soundSearchPath = "sounds/";
      },
      onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
      },
      onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
      },
      setSoundSearchDir: function setSoundSearchDir(dirname) {
        this.soundSearchPath = dirname + "/";
      },
      getUrl: function getUrl(name) {
        var path = "resources/" + this.soundSearchPath + name;
        return cc.url.raw(path);
      },
      playMusic: function playMusic(audioName, callback) {
        if (-1 != this.bgmAudioID) {
          cc.audioEngine.stop(this.bgmAudioID);
          console.log(" audio : stopMusic");
        }
        var musicVolume = cc.Atom.gameConfMgr.getInfo("musicVolume");
        var _path = this.getUrl(audioName);
        console.log(" audio : ", _path, musicVolume);
        this.bgmAudioID = cc.audioEngine.play(_path, true, musicVolume);
        callback && cc.audioEngine.setFinishCallback(this.bgmAudioID, callback);
      },
      playEffect: function playEffect(audioName, callback) {
        var effectVolume = cc.Atom.gameConfMgr.getInfo("effectVolume");
        var _path = this.getUrl(audioName);
        console.log(" audio : ", _path, effectVolume);
        var effectid = cc.audioEngine.play(_path, false, effectVolume);
        callback && cc.audioEngine.setFinishCallback(this.bgmAudioID, callback);
      },
      setMusicVolume: function setMusicVolume(volume) {
        console.log(" music volume :", volume);
        var musicVolume = cc.Atom.gameConfMgr.getInfo("musicVolume");
        if (musicVolume == volume) return;
        cc.Atom.gameConfMgr.setInfo("musicVolume", volume);
        cc.audioEngine.setVolume(this.bgmAudioID, volume);
      },
      setEffectVolume: function setEffectVolume(volume) {
        console.log(" effect volume :", volume);
        cc.Atom.gameConfMgr.setInfo("effectVolume", volume);
      },
      pauseAll: function pauseAll() {
        cc.audioEngine.pauseAll();
      },
      resumeAll: function resumeAll() {
        cc.audioEngine.resumeAll();
      },
      stopAll: function stopAll() {
        cc.audioEngine.stopAll();
      },
      unCacheAll: function unCacheAll() {
        cc.audioEngine.uncacheAll();
      },
      preload: function preload(path, callback) {
        var call = callback || function() {
          console.log(" ---- preload call !");
        };
        cc.audioEngine.preload(path, call);
      },
      setMaxAudioInstance: function setMaxAudioInstance(size) {
        cc.audioEngine.setMaxAudioInstance(size);
      },
      setMaxWebAudioSize: function setMaxWebAudioSize(size) {
        cc.audioEngine.setMaxWebAudioSize(size);
      }
    });
    cc._RF.pop();
  }, {} ],
  btnController: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "571cdSsfXdEkoyrfZjAyVZ2", "btnController");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        spNode: {
          default: null,
          type: cc.Prefab
        },
        desc: "this is btnController"
      },
      onLoad: function onLoad() {
        var _this = this;
        console.log("LOAD --- ", this.desc);
        cc.Atom.eventMgr.listen("_onHW1", function(obj, data) {
          console.log("########### _onHW1 ", _this.desc, data);
        }, this);
        cc.Atom.eventMgr.listen("_onHW2", function(obj, data) {
          console.log("########### _onHW2 ", _this.desc, data);
        }, this);
        cc.Atom.prefabMgr.loadAllPrefab([ {
          key: "spNode",
          path: "prefabs/spNode"
        } ], function(index) {
          console.log(index, "loadfinish");
        });
      },
      onBtnHttpGet: function onBtnHttpGet() {
        cc.Atom.gameNetMgr.httpGet("http://www.baidu.com", function(_bool, _respone, _status) {
          true == _bool ? cc.Atom.eventMgr.notify("_showMsg", _respone) : cc.Atom.eventMgr.notify("_showMsg", "HTTP FAILED : STATUS ", _respone, _status);
        });
      },
      onBtnHttpPost: function onBtnHttpPost() {
        cc.Atom.gameNetMgr.httpPost("http://www.baidu.com", function(_bool, _respone, _status) {
          true == _bool ? cc.Atom.eventMgr.notify("_showMsg", _respone) : cc.Atom.eventMgr.notify("_showMsg", "HTTP FAILED : STATUS ", _respone, _status);
        });
      },
      onBtnHttpTimeOut: function onBtnHttpTimeOut() {
        cc.Atom.gameNetMgr.httpGet("http://www.ba222idu.com", function(_bool, _respone, _status) {
          true == _bool ? cc.Atom.eventMgr.notify("_showMsg", _respone) : cc.Atom.eventMgr.notify("_showMsg", "HTTP FAILED : STATUS ", _respone, _status);
        });
      },
      onBtnNotify: function onBtnNotify() {
        cc.Atom.eventMgr.notify("_showMsg", this.desc);
      },
      onBtnRemoveObjNotify: function onBtnRemoveObjNotify() {
        cc.Atom.eventMgr.unListenByObj(this);
      },
      onBtnRemoveEventNotify: function onBtnRemoveEventNotify() {
        cc.Atom.eventMgr.unListenAllByKey("_onHW1");
      },
      onBtnCreateTimerRe: function onBtnCreateTimerRe() {
        var _this2 = this;
        cc.Atom.timerMgr.registerTask("task1", cc.Atom.timerMgr.TASK_TYPE_RE, function() {
          console.log(_this2.desc, " ---- task1");
        }, 1);
        cc.Atom.timerMgr.registerTask("task3", cc.Atom.timerMgr.TASK_TYPE_RE, function() {
          console.log(_this2.desc, " ---- task3");
        }, 1);
        cc.Atom.timerMgr.registerTask("task5", cc.Atom.timerMgr.TASK_TYPE_RE, function() {
          console.log(_this2.desc, " ---- task5");
        }, 1);
        cc.Atom.timerMgr.registerTask("task7", cc.Atom.timerMgr.TASK_TYPE_RE, function() {
          console.log(_this2.desc, " ---- task7");
        }, 1);
      },
      onBtnCreateTimerOne: function onBtnCreateTimerOne() {
        var _this3 = this;
        cc.Atom.timerMgr.registerTask("task2", cc.Atom.timerMgr.TASK_TYPE_ONE, function() {
          console.log(_this3.desc, " ---- task2");
        }, 1);
        cc.Atom.timerMgr.registerTask("task4", cc.Atom.timerMgr.TASK_TYPE_ONE, function() {
          console.log(_this3.desc, " ---- task4");
        }, 1);
        cc.Atom.timerMgr.registerTask("task6", cc.Atom.timerMgr.TASK_TYPE_ONE, function() {
          console.log(_this3.desc, " ---- task6");
        }, 1);
      },
      onBtnClearAllTask: function onBtnClearAllTask() {
        cc.Atom.timerMgr.cleanAllTask();
      },
      onBtnCreateNode: function onBtnCreateNode() {
        this.nodelist = [];
        for (var index = 0; index < 1e3; index++) {
          var node = cc.Atom.prefabMgr.getPrefabObj("spNode");
          node.parent = cc.director.getScene();
          node.setPosition(100, 100);
          var label = node.getChildByName("index_label");
          var text = label.getComponent(cc.Label);
          text.string = index;
          this.nodelist.push(node);
        }
      },
      onBtnRemoveNode: function onBtnRemoveNode() {
        for (var index = 0; index < this.nodelist.length; index++) {
          var element = this.nodelist[index];
          cc.Atom.prefabMgr.holdPrefabObj("spNode", element);
        }
      },
      onBtnShowGameData: function onBtnShowGameData() {
        console.log("gameConfMgr version", cc.Atom.gameConfMgr.getInfo("version"));
        console.log("gameConfMgr gamemode", cc.Atom.gameConfMgr.getInfo("gamemode"));
        console.log("gameDataMgr HP_NUM", cc.Atom.gameDataMgr.getData("HP_NUM"));
        console.log("gameDataMgr MP_NUM", cc.Atom.gameDataMgr.getData("MP_NUM"));
      },
      onBtnOpenGameScene: function onBtnOpenGameScene() {
        cc.director.loadScene("Scene/gameScene");
      }
    });
    cc._RF.pop();
  }, {} ],
  bytebuffer: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "22940i2S0FN9IJHNbSYgryR", "bytebuffer");
    "use strict";
    var _typeof = "function" === typeof Symbol && "symbol" === typeof Symbol.iterator ? function(obj) {
      return typeof obj;
    } : function(obj) {
      return obj && "function" === typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
    (function(global, factory) {
      "function" === typeof define && define["amd"] ? define([ "long" ], factory) : "function" === typeof require && "object" === ("undefined" === typeof module ? "undefined" : _typeof(module)) && module && module["exports"] ? module["exports"] = function() {
        var Long;
        try {
          Long = require("long");
        } catch (e) {}
        return factory(Long);
      }() : (global["dcodeIO"] = global["dcodeIO"] || {})["ByteBuffer"] = factory(global["dcodeIO"]["Long"]);
    })(void 0, function(Long) {
      var ByteBuffer = function ByteBuffer(capacity, littleEndian, noAssert) {
        "undefined" === typeof capacity && (capacity = ByteBuffer.DEFAULT_CAPACITY);
        "undefined" === typeof littleEndian && (littleEndian = ByteBuffer.DEFAULT_ENDIAN);
        "undefined" === typeof noAssert && (noAssert = ByteBuffer.DEFAULT_NOASSERT);
        if (!noAssert) {
          capacity |= 0;
          if (capacity < 0) throw RangeError("Illegal capacity");
          littleEndian = !!littleEndian;
          noAssert = !!noAssert;
        }
        this.buffer = 0 === capacity ? EMPTY_BUFFER : new ArrayBuffer(capacity);
        this.view = 0 === capacity ? null : new Uint8Array(this.buffer);
        this.offset = 0;
        this.markedOffset = -1;
        this.limit = capacity;
        this.littleEndian = littleEndian;
        this.noAssert = noAssert;
      };
      ByteBuffer.VERSION = "5.0.1";
      ByteBuffer.LITTLE_ENDIAN = true;
      ByteBuffer.BIG_ENDIAN = false;
      ByteBuffer.DEFAULT_CAPACITY = 16;
      ByteBuffer.DEFAULT_ENDIAN = ByteBuffer.BIG_ENDIAN;
      ByteBuffer.DEFAULT_NOASSERT = false;
      ByteBuffer.Long = Long || null;
      var ByteBufferPrototype = ByteBuffer.prototype;
      ByteBufferPrototype.__isByteBuffer__;
      Object.defineProperty(ByteBufferPrototype, "__isByteBuffer__", {
        value: true,
        enumerable: false,
        configurable: false
      });
      var EMPTY_BUFFER = new ArrayBuffer(0);
      var stringFromCharCode = String.fromCharCode;
      function stringSource(s) {
        var i = 0;
        return function() {
          return i < s.length ? s.charCodeAt(i++) : null;
        };
      }
      function stringDestination() {
        var cs = [], ps = [];
        return function() {
          if (0 === arguments.length) return ps.join("") + stringFromCharCode.apply(String, cs);
          cs.length + arguments.length > 1024 && (ps.push(stringFromCharCode.apply(String, cs)), 
          cs.length = 0);
          Array.prototype.push.apply(cs, arguments);
        };
      }
      ByteBuffer.accessor = function() {
        return Uint8Array;
      };
      ByteBuffer.allocate = function(capacity, littleEndian, noAssert) {
        return new ByteBuffer(capacity, littleEndian, noAssert);
      };
      ByteBuffer.concat = function(buffers, encoding, littleEndian, noAssert) {
        if ("boolean" === typeof encoding || "string" !== typeof encoding) {
          noAssert = littleEndian;
          littleEndian = encoding;
          encoding = void 0;
        }
        var capacity = 0;
        for (var i = 0, k = buffers.length, length; i < k; ++i) {
          ByteBuffer.isByteBuffer(buffers[i]) || (buffers[i] = ByteBuffer.wrap(buffers[i], encoding));
          length = buffers[i].limit - buffers[i].offset;
          length > 0 && (capacity += length);
        }
        if (0 === capacity) return new ByteBuffer(0, littleEndian, noAssert);
        var bb = new ByteBuffer(capacity, littleEndian, noAssert), bi;
        i = 0;
        while (i < k) {
          bi = buffers[i++];
          length = bi.limit - bi.offset;
          if (length <= 0) continue;
          bb.view.set(bi.view.subarray(bi.offset, bi.limit), bb.offset);
          bb.offset += length;
        }
        bb.limit = bb.offset;
        bb.offset = 0;
        return bb;
      };
      ByteBuffer.isByteBuffer = function(bb) {
        return true === (bb && bb["__isByteBuffer__"]);
      };
      ByteBuffer.type = function() {
        return ArrayBuffer;
      };
      ByteBuffer.wrap = function(buffer, encoding, littleEndian, noAssert) {
        if ("string" !== typeof encoding) {
          noAssert = littleEndian;
          littleEndian = encoding;
          encoding = void 0;
        }
        if ("string" === typeof buffer) {
          "undefined" === typeof encoding && (encoding = "utf8");
          switch (encoding) {
           case "base64":
            return ByteBuffer.fromBase64(buffer, littleEndian);

           case "hex":
            return ByteBuffer.fromHex(buffer, littleEndian);

           case "binary":
            return ByteBuffer.fromBinary(buffer, littleEndian);

           case "utf8":
            return ByteBuffer.fromUTF8(buffer, littleEndian);

           case "debug":
            return ByteBuffer.fromDebug(buffer, littleEndian);

           default:
            throw Error("Unsupported encoding: " + encoding);
          }
        }
        if (null === buffer || "object" !== ("undefined" === typeof buffer ? "undefined" : _typeof(buffer))) throw TypeError("Illegal buffer");
        var bb;
        if (ByteBuffer.isByteBuffer(buffer)) {
          bb = ByteBufferPrototype.clone.call(buffer);
          bb.markedOffset = -1;
          return bb;
        }
        if (buffer instanceof Uint8Array) {
          bb = new ByteBuffer(0, littleEndian, noAssert);
          if (buffer.length > 0) {
            bb.buffer = buffer.buffer;
            bb.offset = buffer.byteOffset;
            bb.limit = buffer.byteOffset + buffer.byteLength;
            bb.view = new Uint8Array(buffer.buffer);
          }
        } else if (buffer instanceof ArrayBuffer) {
          bb = new ByteBuffer(0, littleEndian, noAssert);
          if (buffer.byteLength > 0) {
            bb.buffer = buffer;
            bb.offset = 0;
            bb.limit = buffer.byteLength;
            bb.view = buffer.byteLength > 0 ? new Uint8Array(buffer) : null;
          }
        } else {
          if ("[object Array]" !== Object.prototype.toString.call(buffer)) throw TypeError("Illegal buffer");
          bb = new ByteBuffer(buffer.length, littleEndian, noAssert);
          bb.limit = buffer.length;
          for (var i = 0; i < buffer.length; ++i) bb.view[i] = buffer[i];
        }
        return bb;
      };
      ByteBufferPrototype.writeBitSet = function(value, offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if (!(value instanceof Array)) throw TypeError("Illegal BitSet: Not an array");
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
        }
        var start = offset, bits = value.length, bytes = bits >> 3, bit = 0, k;
        offset += this.writeVarint32(bits, offset);
        while (bytes--) {
          k = 1 & !!value[bit++] | (1 & !!value[bit++]) << 1 | (1 & !!value[bit++]) << 2 | (1 & !!value[bit++]) << 3 | (1 & !!value[bit++]) << 4 | (1 & !!value[bit++]) << 5 | (1 & !!value[bit++]) << 6 | (1 & !!value[bit++]) << 7;
          this.writeByte(k, offset++);
        }
        if (bit < bits) {
          var m = 0;
          k = 0;
          while (bit < bits) k |= (1 & !!value[bit++]) << m++;
          this.writeByte(k, offset++);
        }
        if (relative) {
          this.offset = offset;
          return this;
        }
        return offset - start;
      };
      ByteBufferPrototype.readBitSet = function(offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        var ret = this.readVarint32(offset), bits = ret.value, bytes = bits >> 3, bit = 0, value = [], k;
        offset += ret.length;
        while (bytes--) {
          k = this.readByte(offset++);
          value[bit++] = !!(1 & k);
          value[bit++] = !!(2 & k);
          value[bit++] = !!(4 & k);
          value[bit++] = !!(8 & k);
          value[bit++] = !!(16 & k);
          value[bit++] = !!(32 & k);
          value[bit++] = !!(64 & k);
          value[bit++] = !!(128 & k);
        }
        if (bit < bits) {
          var m = 0;
          k = this.readByte(offset++);
          while (bit < bits) value[bit++] = !!(k >> m++ & 1);
        }
        relative && (this.offset = offset);
        return value;
      };
      ByteBufferPrototype.readBytes = function(length, offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + length > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + length + ") <= " + this.buffer.byteLength);
        }
        var slice = this.slice(offset, offset + length);
        relative && (this.offset += length);
        return slice;
      };
      ByteBufferPrototype.writeBytes = ByteBufferPrototype.append;
      ByteBufferPrototype.writeInt8 = function(value, offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof value || value % 1 !== 0) throw TypeError("Illegal value: " + value + " (not an integer)");
          value |= 0;
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
        }
        offset += 1;
        var capacity0 = this.buffer.byteLength;
        offset > capacity0 && this.resize((capacity0 *= 2) > offset ? capacity0 : offset);
        offset -= 1;
        this.view[offset] = value;
        relative && (this.offset += 1);
        return this;
      };
      ByteBufferPrototype.writeByte = ByteBufferPrototype.writeInt8;
      ByteBufferPrototype.readInt8 = function(offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 1 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+1) <= " + this.buffer.byteLength);
        }
        var value = this.view[offset];
        128 === (128 & value) && (value = -(255 - value + 1));
        relative && (this.offset += 1);
        return value;
      };
      ByteBufferPrototype.readByte = ByteBufferPrototype.readInt8;
      ByteBufferPrototype.writeUint8 = function(value, offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof value || value % 1 !== 0) throw TypeError("Illegal value: " + value + " (not an integer)");
          value >>>= 0;
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
        }
        offset += 1;
        var capacity1 = this.buffer.byteLength;
        offset > capacity1 && this.resize((capacity1 *= 2) > offset ? capacity1 : offset);
        offset -= 1;
        this.view[offset] = value;
        relative && (this.offset += 1);
        return this;
      };
      ByteBufferPrototype.writeUInt8 = ByteBufferPrototype.writeUint8;
      ByteBufferPrototype.readUint8 = function(offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 1 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+1) <= " + this.buffer.byteLength);
        }
        var value = this.view[offset];
        relative && (this.offset += 1);
        return value;
      };
      ByteBufferPrototype.readUInt8 = ByteBufferPrototype.readUint8;
      ByteBufferPrototype.writeInt16 = function(value, offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof value || value % 1 !== 0) throw TypeError("Illegal value: " + value + " (not an integer)");
          value |= 0;
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
        }
        offset += 2;
        var capacity2 = this.buffer.byteLength;
        offset > capacity2 && this.resize((capacity2 *= 2) > offset ? capacity2 : offset);
        offset -= 2;
        if (this.littleEndian) {
          this.view[offset + 1] = (65280 & value) >>> 8;
          this.view[offset] = 255 & value;
        } else {
          this.view[offset] = (65280 & value) >>> 8;
          this.view[offset + 1] = 255 & value;
        }
        relative && (this.offset += 2);
        return this;
      };
      ByteBufferPrototype.writeShort = ByteBufferPrototype.writeInt16;
      ByteBufferPrototype.readInt16 = function(offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 2 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+2) <= " + this.buffer.byteLength);
        }
        var value = 0;
        if (this.littleEndian) {
          value = this.view[offset];
          value |= this.view[offset + 1] << 8;
        } else {
          value = this.view[offset] << 8;
          value |= this.view[offset + 1];
        }
        32768 === (32768 & value) && (value = -(65535 - value + 1));
        relative && (this.offset += 2);
        return value;
      };
      ByteBufferPrototype.readShort = ByteBufferPrototype.readInt16;
      ByteBufferPrototype.writeUint16 = function(value, offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof value || value % 1 !== 0) throw TypeError("Illegal value: " + value + " (not an integer)");
          value >>>= 0;
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
        }
        offset += 2;
        var capacity3 = this.buffer.byteLength;
        offset > capacity3 && this.resize((capacity3 *= 2) > offset ? capacity3 : offset);
        offset -= 2;
        if (this.littleEndian) {
          this.view[offset + 1] = (65280 & value) >>> 8;
          this.view[offset] = 255 & value;
        } else {
          this.view[offset] = (65280 & value) >>> 8;
          this.view[offset + 1] = 255 & value;
        }
        relative && (this.offset += 2);
        return this;
      };
      ByteBufferPrototype.writeUInt16 = ByteBufferPrototype.writeUint16;
      ByteBufferPrototype.readUint16 = function(offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 2 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+2) <= " + this.buffer.byteLength);
        }
        var value = 0;
        if (this.littleEndian) {
          value = this.view[offset];
          value |= this.view[offset + 1] << 8;
        } else {
          value = this.view[offset] << 8;
          value |= this.view[offset + 1];
        }
        relative && (this.offset += 2);
        return value;
      };
      ByteBufferPrototype.readUInt16 = ByteBufferPrototype.readUint16;
      ByteBufferPrototype.writeInt32 = function(value, offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof value || value % 1 !== 0) throw TypeError("Illegal value: " + value + " (not an integer)");
          value |= 0;
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
        }
        offset += 4;
        var capacity4 = this.buffer.byteLength;
        offset > capacity4 && this.resize((capacity4 *= 2) > offset ? capacity4 : offset);
        offset -= 4;
        if (this.littleEndian) {
          this.view[offset + 3] = value >>> 24 & 255;
          this.view[offset + 2] = value >>> 16 & 255;
          this.view[offset + 1] = value >>> 8 & 255;
          this.view[offset] = 255 & value;
        } else {
          this.view[offset] = value >>> 24 & 255;
          this.view[offset + 1] = value >>> 16 & 255;
          this.view[offset + 2] = value >>> 8 & 255;
          this.view[offset + 3] = 255 & value;
        }
        relative && (this.offset += 4);
        return this;
      };
      ByteBufferPrototype.writeInt = ByteBufferPrototype.writeInt32;
      ByteBufferPrototype.readInt32 = function(offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 4 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+4) <= " + this.buffer.byteLength);
        }
        var value = 0;
        if (this.littleEndian) {
          value = this.view[offset + 2] << 16;
          value |= this.view[offset + 1] << 8;
          value |= this.view[offset];
          value += this.view[offset + 3] << 24 >>> 0;
        } else {
          value = this.view[offset + 1] << 16;
          value |= this.view[offset + 2] << 8;
          value |= this.view[offset + 3];
          value += this.view[offset] << 24 >>> 0;
        }
        value |= 0;
        relative && (this.offset += 4);
        return value;
      };
      ByteBufferPrototype.readInt = ByteBufferPrototype.readInt32;
      ByteBufferPrototype.writeUint32 = function(value, offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof value || value % 1 !== 0) throw TypeError("Illegal value: " + value + " (not an integer)");
          value >>>= 0;
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
        }
        offset += 4;
        var capacity5 = this.buffer.byteLength;
        offset > capacity5 && this.resize((capacity5 *= 2) > offset ? capacity5 : offset);
        offset -= 4;
        if (this.littleEndian) {
          this.view[offset + 3] = value >>> 24 & 255;
          this.view[offset + 2] = value >>> 16 & 255;
          this.view[offset + 1] = value >>> 8 & 255;
          this.view[offset] = 255 & value;
        } else {
          this.view[offset] = value >>> 24 & 255;
          this.view[offset + 1] = value >>> 16 & 255;
          this.view[offset + 2] = value >>> 8 & 255;
          this.view[offset + 3] = 255 & value;
        }
        relative && (this.offset += 4);
        return this;
      };
      ByteBufferPrototype.writeUInt32 = ByteBufferPrototype.writeUint32;
      ByteBufferPrototype.readUint32 = function(offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 4 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+4) <= " + this.buffer.byteLength);
        }
        var value = 0;
        if (this.littleEndian) {
          value = this.view[offset + 2] << 16;
          value |= this.view[offset + 1] << 8;
          value |= this.view[offset];
          value += this.view[offset + 3] << 24 >>> 0;
        } else {
          value = this.view[offset + 1] << 16;
          value |= this.view[offset + 2] << 8;
          value |= this.view[offset + 3];
          value += this.view[offset] << 24 >>> 0;
        }
        relative && (this.offset += 4);
        return value;
      };
      ByteBufferPrototype.readUInt32 = ByteBufferPrototype.readUint32;
      if (Long) {
        ByteBufferPrototype.writeInt64 = function(value, offset) {
          var relative = "undefined" === typeof offset;
          relative && (offset = this.offset);
          if (!this.noAssert) {
            if ("number" === typeof value) value = Long.fromNumber(value); else if ("string" === typeof value) value = Long.fromString(value); else if (!(value && value instanceof Long)) throw TypeError("Illegal value: " + value + " (not an integer or Long)");
            if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
            offset >>>= 0;
            if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
          }
          "number" === typeof value ? value = Long.fromNumber(value) : "string" === typeof value && (value = Long.fromString(value));
          offset += 8;
          var capacity6 = this.buffer.byteLength;
          offset > capacity6 && this.resize((capacity6 *= 2) > offset ? capacity6 : offset);
          offset -= 8;
          var lo = value.low, hi = value.high;
          if (this.littleEndian) {
            this.view[offset + 3] = lo >>> 24 & 255;
            this.view[offset + 2] = lo >>> 16 & 255;
            this.view[offset + 1] = lo >>> 8 & 255;
            this.view[offset] = 255 & lo;
            offset += 4;
            this.view[offset + 3] = hi >>> 24 & 255;
            this.view[offset + 2] = hi >>> 16 & 255;
            this.view[offset + 1] = hi >>> 8 & 255;
            this.view[offset] = 255 & hi;
          } else {
            this.view[offset] = hi >>> 24 & 255;
            this.view[offset + 1] = hi >>> 16 & 255;
            this.view[offset + 2] = hi >>> 8 & 255;
            this.view[offset + 3] = 255 & hi;
            offset += 4;
            this.view[offset] = lo >>> 24 & 255;
            this.view[offset + 1] = lo >>> 16 & 255;
            this.view[offset + 2] = lo >>> 8 & 255;
            this.view[offset + 3] = 255 & lo;
          }
          relative && (this.offset += 8);
          return this;
        };
        ByteBufferPrototype.writeLong = ByteBufferPrototype.writeInt64;
        ByteBufferPrototype.readInt64 = function(offset) {
          var relative = "undefined" === typeof offset;
          relative && (offset = this.offset);
          if (!this.noAssert) {
            if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
            offset >>>= 0;
            if (offset < 0 || offset + 8 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+8) <= " + this.buffer.byteLength);
          }
          var lo = 0, hi = 0;
          if (this.littleEndian) {
            lo = this.view[offset + 2] << 16;
            lo |= this.view[offset + 1] << 8;
            lo |= this.view[offset];
            lo += this.view[offset + 3] << 24 >>> 0;
            offset += 4;
            hi = this.view[offset + 2] << 16;
            hi |= this.view[offset + 1] << 8;
            hi |= this.view[offset];
            hi += this.view[offset + 3] << 24 >>> 0;
          } else {
            hi = this.view[offset + 1] << 16;
            hi |= this.view[offset + 2] << 8;
            hi |= this.view[offset + 3];
            hi += this.view[offset] << 24 >>> 0;
            offset += 4;
            lo = this.view[offset + 1] << 16;
            lo |= this.view[offset + 2] << 8;
            lo |= this.view[offset + 3];
            lo += this.view[offset] << 24 >>> 0;
          }
          var value = new Long(lo, hi, false);
          relative && (this.offset += 8);
          return value;
        };
        ByteBufferPrototype.readLong = ByteBufferPrototype.readInt64;
        ByteBufferPrototype.writeUint64 = function(value, offset) {
          var relative = "undefined" === typeof offset;
          relative && (offset = this.offset);
          if (!this.noAssert) {
            if ("number" === typeof value) value = Long.fromNumber(value); else if ("string" === typeof value) value = Long.fromString(value); else if (!(value && value instanceof Long)) throw TypeError("Illegal value: " + value + " (not an integer or Long)");
            if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
            offset >>>= 0;
            if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
          }
          "number" === typeof value ? value = Long.fromNumber(value) : "string" === typeof value && (value = Long.fromString(value));
          offset += 8;
          var capacity7 = this.buffer.byteLength;
          offset > capacity7 && this.resize((capacity7 *= 2) > offset ? capacity7 : offset);
          offset -= 8;
          var lo = value.low, hi = value.high;
          if (this.littleEndian) {
            this.view[offset + 3] = lo >>> 24 & 255;
            this.view[offset + 2] = lo >>> 16 & 255;
            this.view[offset + 1] = lo >>> 8 & 255;
            this.view[offset] = 255 & lo;
            offset += 4;
            this.view[offset + 3] = hi >>> 24 & 255;
            this.view[offset + 2] = hi >>> 16 & 255;
            this.view[offset + 1] = hi >>> 8 & 255;
            this.view[offset] = 255 & hi;
          } else {
            this.view[offset] = hi >>> 24 & 255;
            this.view[offset + 1] = hi >>> 16 & 255;
            this.view[offset + 2] = hi >>> 8 & 255;
            this.view[offset + 3] = 255 & hi;
            offset += 4;
            this.view[offset] = lo >>> 24 & 255;
            this.view[offset + 1] = lo >>> 16 & 255;
            this.view[offset + 2] = lo >>> 8 & 255;
            this.view[offset + 3] = 255 & lo;
          }
          relative && (this.offset += 8);
          return this;
        };
        ByteBufferPrototype.writeUInt64 = ByteBufferPrototype.writeUint64;
        ByteBufferPrototype.readUint64 = function(offset) {
          var relative = "undefined" === typeof offset;
          relative && (offset = this.offset);
          if (!this.noAssert) {
            if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
            offset >>>= 0;
            if (offset < 0 || offset + 8 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+8) <= " + this.buffer.byteLength);
          }
          var lo = 0, hi = 0;
          if (this.littleEndian) {
            lo = this.view[offset + 2] << 16;
            lo |= this.view[offset + 1] << 8;
            lo |= this.view[offset];
            lo += this.view[offset + 3] << 24 >>> 0;
            offset += 4;
            hi = this.view[offset + 2] << 16;
            hi |= this.view[offset + 1] << 8;
            hi |= this.view[offset];
            hi += this.view[offset + 3] << 24 >>> 0;
          } else {
            hi = this.view[offset + 1] << 16;
            hi |= this.view[offset + 2] << 8;
            hi |= this.view[offset + 3];
            hi += this.view[offset] << 24 >>> 0;
            offset += 4;
            lo = this.view[offset + 1] << 16;
            lo |= this.view[offset + 2] << 8;
            lo |= this.view[offset + 3];
            lo += this.view[offset] << 24 >>> 0;
          }
          var value = new Long(lo, hi, true);
          relative && (this.offset += 8);
          return value;
        };
        ByteBufferPrototype.readUInt64 = ByteBufferPrototype.readUint64;
      }
      function ieee754_read(buffer, offset, isLE, mLen, nBytes) {
        var e, m, eLen = 8 * nBytes - mLen - 1, eMax = (1 << eLen) - 1, eBias = eMax >> 1, nBits = -7, i = isLE ? nBytes - 1 : 0, d = isLE ? -1 : 1, s = buffer[offset + i];
        i += d;
        e = s & (1 << -nBits) - 1;
        s >>= -nBits;
        nBits += eLen;
        for (;nBits > 0; e = 256 * e + buffer[offset + i], i += d, nBits -= 8) ;
        m = e & (1 << -nBits) - 1;
        e >>= -nBits;
        nBits += mLen;
        for (;nBits > 0; m = 256 * m + buffer[offset + i], i += d, nBits -= 8) ;
        if (0 === e) e = 1 - eBias; else {
          if (e === eMax) return m ? NaN : Infinity * (s ? -1 : 1);
          m += Math.pow(2, mLen);
          e -= eBias;
        }
        return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
      }
      function ieee754_write(buffer, value, offset, isLE, mLen, nBytes) {
        var e, m, c, eLen = 8 * nBytes - mLen - 1, eMax = (1 << eLen) - 1, eBias = eMax >> 1, rt = 23 === mLen ? Math.pow(2, -24) - Math.pow(2, -77) : 0, i = isLE ? 0 : nBytes - 1, d = isLE ? 1 : -1, s = value < 0 || 0 === value && 1 / value < 0 ? 1 : 0;
        value = Math.abs(value);
        if (isNaN(value) || Infinity === value) {
          m = isNaN(value) ? 1 : 0;
          e = eMax;
        } else {
          e = Math.floor(Math.log(value) / Math.LN2);
          if (value * (c = Math.pow(2, -e)) < 1) {
            e--;
            c *= 2;
          }
          value += e + eBias >= 1 ? rt / c : rt * Math.pow(2, 1 - eBias);
          if (value * c >= 2) {
            e++;
            c /= 2;
          }
          if (e + eBias >= eMax) {
            m = 0;
            e = eMax;
          } else if (e + eBias >= 1) {
            m = (value * c - 1) * Math.pow(2, mLen);
            e += eBias;
          } else {
            m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
            e = 0;
          }
        }
        for (;mLen >= 8; buffer[offset + i] = 255 & m, i += d, m /= 256, mLen -= 8) ;
        e = e << mLen | m;
        eLen += mLen;
        for (;eLen > 0; buffer[offset + i] = 255 & e, i += d, e /= 256, eLen -= 8) ;
        buffer[offset + i - d] |= 128 * s;
      }
      ByteBufferPrototype.writeFloat32 = function(value, offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof value) throw TypeError("Illegal value: " + value + " (not a number)");
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
        }
        offset += 4;
        var capacity8 = this.buffer.byteLength;
        offset > capacity8 && this.resize((capacity8 *= 2) > offset ? capacity8 : offset);
        offset -= 4;
        ieee754_write(this.view, value, offset, this.littleEndian, 23, 4);
        relative && (this.offset += 4);
        return this;
      };
      ByteBufferPrototype.writeFloat = ByteBufferPrototype.writeFloat32;
      ByteBufferPrototype.readFloat32 = function(offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 4 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+4) <= " + this.buffer.byteLength);
        }
        var value = ieee754_read(this.view, offset, this.littleEndian, 23, 4);
        relative && (this.offset += 4);
        return value;
      };
      ByteBufferPrototype.readFloat = ByteBufferPrototype.readFloat32;
      ByteBufferPrototype.writeFloat64 = function(value, offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof value) throw TypeError("Illegal value: " + value + " (not a number)");
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
        }
        offset += 8;
        var capacity9 = this.buffer.byteLength;
        offset > capacity9 && this.resize((capacity9 *= 2) > offset ? capacity9 : offset);
        offset -= 8;
        ieee754_write(this.view, value, offset, this.littleEndian, 52, 8);
        relative && (this.offset += 8);
        return this;
      };
      ByteBufferPrototype.writeDouble = ByteBufferPrototype.writeFloat64;
      ByteBufferPrototype.readFloat64 = function(offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 8 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+8) <= " + this.buffer.byteLength);
        }
        var value = ieee754_read(this.view, offset, this.littleEndian, 52, 8);
        relative && (this.offset += 8);
        return value;
      };
      ByteBufferPrototype.readDouble = ByteBufferPrototype.readFloat64;
      ByteBuffer.MAX_VARINT32_BYTES = 5;
      ByteBuffer.calculateVarint32 = function(value) {
        value >>>= 0;
        return value < 128 ? 1 : value < 16384 ? 2 : value < 1 << 21 ? 3 : value < 1 << 28 ? 4 : 5;
      };
      ByteBuffer.zigZagEncode32 = function(n) {
        return ((n |= 0) << 1 ^ n >> 31) >>> 0;
      };
      ByteBuffer.zigZagDecode32 = function(n) {
        return n >>> 1 ^ -(1 & n) | 0;
      };
      ByteBufferPrototype.writeVarint32 = function(value, offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof value || value % 1 !== 0) throw TypeError("Illegal value: " + value + " (not an integer)");
          value |= 0;
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
        }
        var size = ByteBuffer.calculateVarint32(value), b;
        offset += size;
        var capacity10 = this.buffer.byteLength;
        offset > capacity10 && this.resize((capacity10 *= 2) > offset ? capacity10 : offset);
        offset -= size;
        value >>>= 0;
        while (value >= 128) {
          b = 127 & value | 128;
          this.view[offset++] = b;
          value >>>= 7;
        }
        this.view[offset++] = value;
        if (relative) {
          this.offset = offset;
          return this;
        }
        return size;
      };
      ByteBufferPrototype.writeVarint32ZigZag = function(value, offset) {
        return this.writeVarint32(ByteBuffer.zigZagEncode32(value), offset);
      };
      ByteBufferPrototype.readVarint32 = function(offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 1 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+1) <= " + this.buffer.byteLength);
        }
        var c = 0, value = 0, b;
        do {
          if (!this.noAssert && offset > this.limit) {
            var err = Error("Truncated");
            err["truncated"] = true;
            throw err;
          }
          b = this.view[offset++];
          c < 5 && (value |= (127 & b) << 7 * c);
          ++c;
        } while (0 !== (128 & b));
        value |= 0;
        if (relative) {
          this.offset = offset;
          return value;
        }
        return {
          value: value,
          length: c
        };
      };
      ByteBufferPrototype.readVarint32ZigZag = function(offset) {
        var val = this.readVarint32(offset);
        "object" === ("undefined" === typeof val ? "undefined" : _typeof(val)) ? val["value"] = ByteBuffer.zigZagDecode32(val["value"]) : val = ByteBuffer.zigZagDecode32(val);
        return val;
      };
      if (Long) {
        ByteBuffer.MAX_VARINT64_BYTES = 10;
        ByteBuffer.calculateVarint64 = function(value) {
          "number" === typeof value ? value = Long.fromNumber(value) : "string" === typeof value && (value = Long.fromString(value));
          var part0 = value.toInt() >>> 0, part1 = value.shiftRightUnsigned(28).toInt() >>> 0, part2 = value.shiftRightUnsigned(56).toInt() >>> 0;
          return 0 == part2 ? 0 == part1 ? part0 < 16384 ? part0 < 128 ? 1 : 2 : part0 < 1 << 21 ? 3 : 4 : part1 < 16384 ? part1 < 128 ? 5 : 6 : part1 < 1 << 21 ? 7 : 8 : part2 < 128 ? 9 : 10;
        };
        ByteBuffer.zigZagEncode64 = function(value) {
          "number" === typeof value ? value = Long.fromNumber(value, false) : "string" === typeof value ? value = Long.fromString(value, false) : false !== value.unsigned && (value = value.toSigned());
          return value.shiftLeft(1).xor(value.shiftRight(63)).toUnsigned();
        };
        ByteBuffer.zigZagDecode64 = function(value) {
          "number" === typeof value ? value = Long.fromNumber(value, false) : "string" === typeof value ? value = Long.fromString(value, false) : false !== value.unsigned && (value = value.toSigned());
          return value.shiftRightUnsigned(1).xor(value.and(Long.ONE).toSigned().negate()).toSigned();
        };
        ByteBufferPrototype.writeVarint64 = function(value, offset) {
          var relative = "undefined" === typeof offset;
          relative && (offset = this.offset);
          if (!this.noAssert) {
            if ("number" === typeof value) value = Long.fromNumber(value); else if ("string" === typeof value) value = Long.fromString(value); else if (!(value && value instanceof Long)) throw TypeError("Illegal value: " + value + " (not an integer or Long)");
            if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
            offset >>>= 0;
            if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
          }
          "number" === typeof value ? value = Long.fromNumber(value, false) : "string" === typeof value ? value = Long.fromString(value, false) : false !== value.unsigned && (value = value.toSigned());
          var size = ByteBuffer.calculateVarint64(value), part0 = value.toInt() >>> 0, part1 = value.shiftRightUnsigned(28).toInt() >>> 0, part2 = value.shiftRightUnsigned(56).toInt() >>> 0;
          offset += size;
          var capacity11 = this.buffer.byteLength;
          offset > capacity11 && this.resize((capacity11 *= 2) > offset ? capacity11 : offset);
          offset -= size;
          switch (size) {
           case 10:
            this.view[offset + 9] = part2 >>> 7 & 1;

           case 9:
            this.view[offset + 8] = 9 !== size ? 128 | part2 : 127 & part2;

           case 8:
            this.view[offset + 7] = 8 !== size ? part1 >>> 21 | 128 : part1 >>> 21 & 127;

           case 7:
            this.view[offset + 6] = 7 !== size ? part1 >>> 14 | 128 : part1 >>> 14 & 127;

           case 6:
            this.view[offset + 5] = 6 !== size ? part1 >>> 7 | 128 : part1 >>> 7 & 127;

           case 5:
            this.view[offset + 4] = 5 !== size ? 128 | part1 : 127 & part1;

           case 4:
            this.view[offset + 3] = 4 !== size ? part0 >>> 21 | 128 : part0 >>> 21 & 127;

           case 3:
            this.view[offset + 2] = 3 !== size ? part0 >>> 14 | 128 : part0 >>> 14 & 127;

           case 2:
            this.view[offset + 1] = 2 !== size ? part0 >>> 7 | 128 : part0 >>> 7 & 127;

           case 1:
            this.view[offset] = 1 !== size ? 128 | part0 : 127 & part0;
          }
          if (relative) {
            this.offset += size;
            return this;
          }
          return size;
        };
        ByteBufferPrototype.writeVarint64ZigZag = function(value, offset) {
          return this.writeVarint64(ByteBuffer.zigZagEncode64(value), offset);
        };
        ByteBufferPrototype.readVarint64 = function(offset) {
          var relative = "undefined" === typeof offset;
          relative && (offset = this.offset);
          if (!this.noAssert) {
            if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
            offset >>>= 0;
            if (offset < 0 || offset + 1 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+1) <= " + this.buffer.byteLength);
          }
          var start = offset, part0 = 0, part1 = 0, part2 = 0, b = 0;
          b = this.view[offset++];
          part0 = 127 & b;
          if (128 & b) {
            b = this.view[offset++];
            part0 |= (127 & b) << 7;
            if (128 & b || this.noAssert && "undefined" === typeof b) {
              b = this.view[offset++];
              part0 |= (127 & b) << 14;
              if (128 & b || this.noAssert && "undefined" === typeof b) {
                b = this.view[offset++];
                part0 |= (127 & b) << 21;
                if (128 & b || this.noAssert && "undefined" === typeof b) {
                  b = this.view[offset++];
                  part1 = 127 & b;
                  if (128 & b || this.noAssert && "undefined" === typeof b) {
                    b = this.view[offset++];
                    part1 |= (127 & b) << 7;
                    if (128 & b || this.noAssert && "undefined" === typeof b) {
                      b = this.view[offset++];
                      part1 |= (127 & b) << 14;
                      if (128 & b || this.noAssert && "undefined" === typeof b) {
                        b = this.view[offset++];
                        part1 |= (127 & b) << 21;
                        if (128 & b || this.noAssert && "undefined" === typeof b) {
                          b = this.view[offset++];
                          part2 = 127 & b;
                          if (128 & b || this.noAssert && "undefined" === typeof b) {
                            b = this.view[offset++];
                            part2 |= (127 & b) << 7;
                            if (128 & b || this.noAssert && "undefined" === typeof b) throw Error("Buffer overrun");
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          var value = Long.fromBits(part0 | part1 << 28, part1 >>> 4 | part2 << 24, false);
          if (relative) {
            this.offset = offset;
            return value;
          }
          return {
            value: value,
            length: offset - start
          };
        };
        ByteBufferPrototype.readVarint64ZigZag = function(offset) {
          var val = this.readVarint64(offset);
          val && val["value"] instanceof Long ? val["value"] = ByteBuffer.zigZagDecode64(val["value"]) : val = ByteBuffer.zigZagDecode64(val);
          return val;
        };
      }
      ByteBufferPrototype.writeCString = function(str, offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        var i, k = str.length;
        if (!this.noAssert) {
          if ("string" !== typeof str) throw TypeError("Illegal str: Not a string");
          for (i = 0; i < k; ++i) if (0 === str.charCodeAt(i)) throw RangeError("Illegal str: Contains NULL-characters");
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
        }
        k = utfx.calculateUTF16asUTF8(stringSource(str))[1];
        offset += k + 1;
        var capacity12 = this.buffer.byteLength;
        offset > capacity12 && this.resize((capacity12 *= 2) > offset ? capacity12 : offset);
        offset -= k + 1;
        utfx.encodeUTF16toUTF8(stringSource(str), function(b) {
          this.view[offset++] = b;
        }.bind(this));
        this.view[offset++] = 0;
        if (relative) {
          this.offset = offset;
          return this;
        }
        return k;
      };
      ByteBufferPrototype.readCString = function(offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 1 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+1) <= " + this.buffer.byteLength);
        }
        var start = offset, temp;
        var sd, b = -1;
        utfx.decodeUTF8toUTF16(function() {
          if (0 === b) return null;
          if (offset >= this.limit) throw RangeError("Illegal range: Truncated data, " + offset + " < " + this.limit);
          b = this.view[offset++];
          return 0 === b ? null : b;
        }.bind(this), sd = stringDestination(), true);
        if (relative) {
          this.offset = offset;
          return sd();
        }
        return {
          string: sd(),
          length: offset - start
        };
      };
      ByteBufferPrototype.writeIString = function(str, offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("string" !== typeof str) throw TypeError("Illegal str: Not a string");
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
        }
        var start = offset, k;
        k = utfx.calculateUTF16asUTF8(stringSource(str), this.noAssert)[1];
        offset += 4 + k;
        var capacity13 = this.buffer.byteLength;
        offset > capacity13 && this.resize((capacity13 *= 2) > offset ? capacity13 : offset);
        offset -= 4 + k;
        if (this.littleEndian) {
          this.view[offset + 3] = k >>> 24 & 255;
          this.view[offset + 2] = k >>> 16 & 255;
          this.view[offset + 1] = k >>> 8 & 255;
          this.view[offset] = 255 & k;
        } else {
          this.view[offset] = k >>> 24 & 255;
          this.view[offset + 1] = k >>> 16 & 255;
          this.view[offset + 2] = k >>> 8 & 255;
          this.view[offset + 3] = 255 & k;
        }
        offset += 4;
        utfx.encodeUTF16toUTF8(stringSource(str), function(b) {
          this.view[offset++] = b;
        }.bind(this));
        if (offset !== start + 4 + k) throw RangeError("Illegal range: Truncated data, " + offset + " == " + (offset + 4 + k));
        if (relative) {
          this.offset = offset;
          return this;
        }
        return offset - start;
      };
      ByteBufferPrototype.readIString = function(offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 4 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+4) <= " + this.buffer.byteLength);
        }
        var start = offset;
        var len = this.readUint32(offset);
        var str = this.readUTF8String(len, ByteBuffer.METRICS_BYTES, offset += 4);
        offset += str["length"];
        if (relative) {
          this.offset = offset;
          return str["string"];
        }
        return {
          string: str["string"],
          length: offset - start
        };
      };
      ByteBuffer.METRICS_CHARS = "c";
      ByteBuffer.METRICS_BYTES = "b";
      ByteBufferPrototype.writeUTF8String = function(str, offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
        }
        var k;
        var start = offset;
        k = utfx.calculateUTF16asUTF8(stringSource(str))[1];
        offset += k;
        var capacity14 = this.buffer.byteLength;
        offset > capacity14 && this.resize((capacity14 *= 2) > offset ? capacity14 : offset);
        offset -= k;
        utfx.encodeUTF16toUTF8(stringSource(str), function(b) {
          this.view[offset++] = b;
        }.bind(this));
        if (relative) {
          this.offset = offset;
          return this;
        }
        return offset - start;
      };
      ByteBufferPrototype.writeString = ByteBufferPrototype.writeUTF8String;
      ByteBuffer.calculateUTF8Chars = function(str) {
        return utfx.calculateUTF16asUTF8(stringSource(str))[0];
      };
      ByteBuffer.calculateUTF8Bytes = function(str) {
        return utfx.calculateUTF16asUTF8(stringSource(str))[1];
      };
      ByteBuffer.calculateString = ByteBuffer.calculateUTF8Bytes;
      ByteBufferPrototype.readUTF8String = function(length, metrics, offset) {
        if ("number" === typeof metrics) {
          offset = metrics;
          metrics = void 0;
        }
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        "undefined" === typeof metrics && (metrics = ByteBuffer.METRICS_CHARS);
        if (!this.noAssert) {
          if ("number" !== typeof length || length % 1 !== 0) throw TypeError("Illegal length: " + length + " (not an integer)");
          length |= 0;
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
        }
        var i = 0, start = offset, sd;
        if (metrics === ByteBuffer.METRICS_CHARS) {
          sd = stringDestination();
          utfx.decodeUTF8(function() {
            return i < length && offset < this.limit ? this.view[offset++] : null;
          }.bind(this), function(cp) {
            ++i;
            utfx.UTF8toUTF16(cp, sd);
          });
          if (i !== length) throw RangeError("Illegal range: Truncated data, " + i + " == " + length);
          if (relative) {
            this.offset = offset;
            return sd();
          }
          return {
            string: sd(),
            length: offset - start
          };
        }
        if (metrics === ByteBuffer.METRICS_BYTES) {
          if (!this.noAssert) {
            if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
            offset >>>= 0;
            if (offset < 0 || offset + length > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+" + length + ") <= " + this.buffer.byteLength);
          }
          var k = offset + length;
          utfx.decodeUTF8toUTF16(function() {
            return offset < k ? this.view[offset++] : null;
          }.bind(this), sd = stringDestination(), this.noAssert);
          if (offset !== k) throw RangeError("Illegal range: Truncated data, " + offset + " == " + k);
          if (relative) {
            this.offset = offset;
            return sd();
          }
          return {
            string: sd(),
            length: offset - start
          };
        }
        throw TypeError("Unsupported metrics: " + metrics);
      };
      ByteBufferPrototype.readString = ByteBufferPrototype.readUTF8String;
      ByteBufferPrototype.writeVString = function(str, offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("string" !== typeof str) throw TypeError("Illegal str: Not a string");
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
        }
        var start = offset, k, l;
        k = utfx.calculateUTF16asUTF8(stringSource(str), this.noAssert)[1];
        l = ByteBuffer.calculateVarint32(k);
        offset += l + k;
        var capacity15 = this.buffer.byteLength;
        offset > capacity15 && this.resize((capacity15 *= 2) > offset ? capacity15 : offset);
        offset -= l + k;
        offset += this.writeVarint32(k, offset);
        utfx.encodeUTF16toUTF8(stringSource(str), function(b) {
          this.view[offset++] = b;
        }.bind(this));
        if (offset !== start + k + l) throw RangeError("Illegal range: Truncated data, " + offset + " == " + (offset + k + l));
        if (relative) {
          this.offset = offset;
          return this;
        }
        return offset - start;
      };
      ByteBufferPrototype.readVString = function(offset) {
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 1 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+1) <= " + this.buffer.byteLength);
        }
        var start = offset;
        var len = this.readVarint32(offset);
        var str = this.readUTF8String(len["value"], ByteBuffer.METRICS_BYTES, offset += len["length"]);
        offset += str["length"];
        if (relative) {
          this.offset = offset;
          return str["string"];
        }
        return {
          string: str["string"],
          length: offset - start
        };
      };
      ByteBufferPrototype.append = function(source, encoding, offset) {
        if ("number" === typeof encoding || "string" !== typeof encoding) {
          offset = encoding;
          encoding = void 0;
        }
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
        }
        source instanceof ByteBuffer || (source = ByteBuffer.wrap(source, encoding));
        var length = source.limit - source.offset;
        if (length <= 0) return this;
        offset += length;
        var capacity16 = this.buffer.byteLength;
        offset > capacity16 && this.resize((capacity16 *= 2) > offset ? capacity16 : offset);
        offset -= length;
        this.view.set(source.view.subarray(source.offset, source.limit), offset);
        source.offset += length;
        relative && (this.offset += length);
        return this;
      };
      ByteBufferPrototype.appendTo = function(target, offset) {
        target.append(this, offset);
        return this;
      };
      ByteBufferPrototype.assert = function(assert) {
        this.noAssert = !assert;
        return this;
      };
      ByteBufferPrototype.capacity = function() {
        return this.buffer.byteLength;
      };
      ByteBufferPrototype.clear = function() {
        this.offset = 0;
        this.limit = this.buffer.byteLength;
        this.markedOffset = -1;
        return this;
      };
      ByteBufferPrototype.clone = function(copy) {
        var bb = new ByteBuffer(0, this.littleEndian, this.noAssert);
        if (copy) {
          bb.buffer = new ArrayBuffer(this.buffer.byteLength);
          bb.view = new Uint8Array(bb.buffer);
        } else {
          bb.buffer = this.buffer;
          bb.view = this.view;
        }
        bb.offset = this.offset;
        bb.markedOffset = this.markedOffset;
        bb.limit = this.limit;
        return bb;
      };
      ByteBufferPrototype.compact = function(begin, end) {
        "undefined" === typeof begin && (begin = this.offset);
        "undefined" === typeof end && (end = this.limit);
        if (!this.noAssert) {
          if ("number" !== typeof begin || begin % 1 !== 0) throw TypeError("Illegal begin: Not an integer");
          begin >>>= 0;
          if ("number" !== typeof end || end % 1 !== 0) throw TypeError("Illegal end: Not an integer");
          end >>>= 0;
          if (begin < 0 || begin > end || end > this.buffer.byteLength) throw RangeError("Illegal range: 0 <= " + begin + " <= " + end + " <= " + this.buffer.byteLength);
        }
        if (0 === begin && end === this.buffer.byteLength) return this;
        var len = end - begin;
        if (0 === len) {
          this.buffer = EMPTY_BUFFER;
          this.view = null;
          this.markedOffset >= 0 && (this.markedOffset -= begin);
          this.offset = 0;
          this.limit = 0;
          return this;
        }
        var buffer = new ArrayBuffer(len);
        var view = new Uint8Array(buffer);
        view.set(this.view.subarray(begin, end));
        this.buffer = buffer;
        this.view = view;
        this.markedOffset >= 0 && (this.markedOffset -= begin);
        this.offset = 0;
        this.limit = len;
        return this;
      };
      ByteBufferPrototype.copy = function(begin, end) {
        "undefined" === typeof begin && (begin = this.offset);
        "undefined" === typeof end && (end = this.limit);
        if (!this.noAssert) {
          if ("number" !== typeof begin || begin % 1 !== 0) throw TypeError("Illegal begin: Not an integer");
          begin >>>= 0;
          if ("number" !== typeof end || end % 1 !== 0) throw TypeError("Illegal end: Not an integer");
          end >>>= 0;
          if (begin < 0 || begin > end || end > this.buffer.byteLength) throw RangeError("Illegal range: 0 <= " + begin + " <= " + end + " <= " + this.buffer.byteLength);
        }
        if (begin === end) return new ByteBuffer(0, this.littleEndian, this.noAssert);
        var capacity = end - begin, bb = new ByteBuffer(capacity, this.littleEndian, this.noAssert);
        bb.offset = 0;
        bb.limit = capacity;
        bb.markedOffset >= 0 && (bb.markedOffset -= begin);
        this.copyTo(bb, 0, begin, end);
        return bb;
      };
      ByteBufferPrototype.copyTo = function(target, targetOffset, sourceOffset, sourceLimit) {
        var relative, targetRelative;
        if (!this.noAssert && !ByteBuffer.isByteBuffer(target)) throw TypeError("Illegal target: Not a ByteBuffer");
        targetOffset = (targetRelative = "undefined" === typeof targetOffset) ? target.offset : 0 | targetOffset;
        sourceOffset = (relative = "undefined" === typeof sourceOffset) ? this.offset : 0 | sourceOffset;
        sourceLimit = "undefined" === typeof sourceLimit ? this.limit : 0 | sourceLimit;
        if (targetOffset < 0 || targetOffset > target.buffer.byteLength) throw RangeError("Illegal target range: 0 <= " + targetOffset + " <= " + target.buffer.byteLength);
        if (sourceOffset < 0 || sourceLimit > this.buffer.byteLength) throw RangeError("Illegal source range: 0 <= " + sourceOffset + " <= " + this.buffer.byteLength);
        var len = sourceLimit - sourceOffset;
        if (0 === len) return target;
        target.ensureCapacity(targetOffset + len);
        target.view.set(this.view.subarray(sourceOffset, sourceLimit), targetOffset);
        relative && (this.offset += len);
        targetRelative && (target.offset += len);
        return this;
      };
      ByteBufferPrototype.ensureCapacity = function(capacity) {
        var current = this.buffer.byteLength;
        if (current < capacity) return this.resize((current *= 2) > capacity ? current : capacity);
        return this;
      };
      ByteBufferPrototype.fill = function(value, begin, end) {
        var relative = "undefined" === typeof begin;
        relative && (begin = this.offset);
        "string" === typeof value && value.length > 0 && (value = value.charCodeAt(0));
        "undefined" === typeof begin && (begin = this.offset);
        "undefined" === typeof end && (end = this.limit);
        if (!this.noAssert) {
          if ("number" !== typeof value || value % 1 !== 0) throw TypeError("Illegal value: " + value + " (not an integer)");
          value |= 0;
          if ("number" !== typeof begin || begin % 1 !== 0) throw TypeError("Illegal begin: Not an integer");
          begin >>>= 0;
          if ("number" !== typeof end || end % 1 !== 0) throw TypeError("Illegal end: Not an integer");
          end >>>= 0;
          if (begin < 0 || begin > end || end > this.buffer.byteLength) throw RangeError("Illegal range: 0 <= " + begin + " <= " + end + " <= " + this.buffer.byteLength);
        }
        if (begin >= end) return this;
        while (begin < end) this.view[begin++] = value;
        relative && (this.offset = begin);
        return this;
      };
      ByteBufferPrototype.flip = function() {
        this.limit = this.offset;
        this.offset = 0;
        return this;
      };
      ByteBufferPrototype.mark = function(offset) {
        offset = "undefined" === typeof offset ? this.offset : offset;
        if (!this.noAssert) {
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
        }
        this.markedOffset = offset;
        return this;
      };
      ByteBufferPrototype.order = function(littleEndian) {
        if (!this.noAssert && "boolean" !== typeof littleEndian) throw TypeError("Illegal littleEndian: Not a boolean");
        this.littleEndian = !!littleEndian;
        return this;
      };
      ByteBufferPrototype.LE = function(littleEndian) {
        this.littleEndian = "undefined" === typeof littleEndian || !!littleEndian;
        return this;
      };
      ByteBufferPrototype.BE = function(bigEndian) {
        this.littleEndian = "undefined" !== typeof bigEndian && !bigEndian;
        return this;
      };
      ByteBufferPrototype.prepend = function(source, encoding, offset) {
        if ("number" === typeof encoding || "string" !== typeof encoding) {
          offset = encoding;
          encoding = void 0;
        }
        var relative = "undefined" === typeof offset;
        relative && (offset = this.offset);
        if (!this.noAssert) {
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: " + offset + " (not an integer)");
          offset >>>= 0;
          if (offset < 0 || offset + 0 > this.buffer.byteLength) throw RangeError("Illegal offset: 0 <= " + offset + " (+0) <= " + this.buffer.byteLength);
        }
        source instanceof ByteBuffer || (source = ByteBuffer.wrap(source, encoding));
        var len = source.limit - source.offset;
        if (len <= 0) return this;
        var diff = len - offset;
        if (diff > 0) {
          var buffer = new ArrayBuffer(this.buffer.byteLength + diff);
          var view = new Uint8Array(buffer);
          view.set(this.view.subarray(offset, this.buffer.byteLength), len);
          this.buffer = buffer;
          this.view = view;
          this.offset += diff;
          this.markedOffset >= 0 && (this.markedOffset += diff);
          this.limit += diff;
          offset += diff;
        } else var arrayView = new Uint8Array(this.buffer);
        this.view.set(source.view.subarray(source.offset, source.limit), offset - len);
        source.offset = source.limit;
        relative && (this.offset -= len);
        return this;
      };
      ByteBufferPrototype.prependTo = function(target, offset) {
        target.prepend(this, offset);
        return this;
      };
      ByteBufferPrototype.printDebug = function(out) {
        "function" !== typeof out && (out = console.log.bind(console));
        out(this.toString() + "\n-------------------------------------------------------------------\n" + this.toDebug(true));
      };
      ByteBufferPrototype.remaining = function() {
        return this.limit - this.offset;
      };
      ByteBufferPrototype.reset = function() {
        if (this.markedOffset >= 0) {
          this.offset = this.markedOffset;
          this.markedOffset = -1;
        } else this.offset = 0;
        return this;
      };
      ByteBufferPrototype.resize = function(capacity) {
        if (!this.noAssert) {
          if ("number" !== typeof capacity || capacity % 1 !== 0) throw TypeError("Illegal capacity: " + capacity + " (not an integer)");
          capacity |= 0;
          if (capacity < 0) throw RangeError("Illegal capacity: 0 <= " + capacity);
        }
        if (this.buffer.byteLength < capacity) {
          var buffer = new ArrayBuffer(capacity);
          var view = new Uint8Array(buffer);
          view.set(this.view);
          this.buffer = buffer;
          this.view = view;
        }
        return this;
      };
      ByteBufferPrototype.reverse = function(begin, end) {
        "undefined" === typeof begin && (begin = this.offset);
        "undefined" === typeof end && (end = this.limit);
        if (!this.noAssert) {
          if ("number" !== typeof begin || begin % 1 !== 0) throw TypeError("Illegal begin: Not an integer");
          begin >>>= 0;
          if ("number" !== typeof end || end % 1 !== 0) throw TypeError("Illegal end: Not an integer");
          end >>>= 0;
          if (begin < 0 || begin > end || end > this.buffer.byteLength) throw RangeError("Illegal range: 0 <= " + begin + " <= " + end + " <= " + this.buffer.byteLength);
        }
        if (begin === end) return this;
        Array.prototype.reverse.call(this.view.subarray(begin, end));
        return this;
      };
      ByteBufferPrototype.skip = function(length) {
        if (!this.noAssert) {
          if ("number" !== typeof length || length % 1 !== 0) throw TypeError("Illegal length: " + length + " (not an integer)");
          length |= 0;
        }
        var offset = this.offset + length;
        if (!this.noAssert && (offset < 0 || offset > this.buffer.byteLength)) throw RangeError("Illegal length: 0 <= " + this.offset + " + " + length + " <= " + this.buffer.byteLength);
        this.offset = offset;
        return this;
      };
      ByteBufferPrototype.slice = function(begin, end) {
        "undefined" === typeof begin && (begin = this.offset);
        "undefined" === typeof end && (end = this.limit);
        if (!this.noAssert) {
          if ("number" !== typeof begin || begin % 1 !== 0) throw TypeError("Illegal begin: Not an integer");
          begin >>>= 0;
          if ("number" !== typeof end || end % 1 !== 0) throw TypeError("Illegal end: Not an integer");
          end >>>= 0;
          if (begin < 0 || begin > end || end > this.buffer.byteLength) throw RangeError("Illegal range: 0 <= " + begin + " <= " + end + " <= " + this.buffer.byteLength);
        }
        var bb = this.clone();
        bb.offset = begin;
        bb.limit = end;
        return bb;
      };
      ByteBufferPrototype.toBuffer = function(forceCopy) {
        var offset = this.offset, limit = this.limit;
        if (!this.noAssert) {
          if ("number" !== typeof offset || offset % 1 !== 0) throw TypeError("Illegal offset: Not an integer");
          offset >>>= 0;
          if ("number" !== typeof limit || limit % 1 !== 0) throw TypeError("Illegal limit: Not an integer");
          limit >>>= 0;
          if (offset < 0 || offset > limit || limit > this.buffer.byteLength) throw RangeError("Illegal range: 0 <= " + offset + " <= " + limit + " <= " + this.buffer.byteLength);
        }
        if (!forceCopy && 0 === offset && limit === this.buffer.byteLength) return this.buffer;
        if (offset === limit) return EMPTY_BUFFER;
        var buffer = new ArrayBuffer(limit - offset);
        new Uint8Array(buffer).set(new Uint8Array(this.buffer).subarray(offset, limit), 0);
        return buffer;
      };
      ByteBufferPrototype.toArrayBuffer = ByteBufferPrototype.toBuffer;
      ByteBufferPrototype.toString = function(encoding, begin, end) {
        if ("undefined" === typeof encoding) return "ByteBufferAB(offset=" + this.offset + ",markedOffset=" + this.markedOffset + ",limit=" + this.limit + ",capacity=" + this.capacity() + ")";
        "number" === typeof encoding && (encoding = "utf8", begin = encoding, end = begin);
        switch (encoding) {
         case "utf8":
          return this.toUTF8(begin, end);

         case "base64":
          return this.toBase64(begin, end);

         case "hex":
          return this.toHex(begin, end);

         case "binary":
          return this.toBinary(begin, end);

         case "debug":
          return this.toDebug();

         case "columns":
          return this.toColumns();

         default:
          throw Error("Unsupported encoding: " + encoding);
        }
      };
      var lxiv = function() {
        var lxiv = {};
        var aout = [ 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 43, 47 ];
        var ain = [];
        for (var i = 0, k = aout.length; i < k; ++i) ain[aout[i]] = i;
        lxiv.encode = function(src, dst) {
          var b, t;
          while (null !== (b = src())) {
            dst(aout[b >> 2 & 63]);
            t = (3 & b) << 4;
            if (null !== (b = src())) {
              t |= b >> 4 & 15;
              dst(aout[63 & (t | b >> 4 & 15)]);
              t = (15 & b) << 2;
              null !== (b = src()) ? (dst(aout[63 & (t | b >> 6 & 3)]), dst(aout[63 & b])) : (dst(aout[63 & t]), 
              dst(61));
            } else dst(aout[63 & t]), dst(61), dst(61);
          }
        };
        lxiv.decode = function(src, dst) {
          var c, t1, t2;
          function fail(c) {
            throw Error("Illegal character code: " + c);
          }
          while (null !== (c = src())) {
            t1 = ain[c];
            "undefined" === typeof t1 && fail(c);
            if (null !== (c = src())) {
              t2 = ain[c];
              "undefined" === typeof t2 && fail(c);
              dst(t1 << 2 >>> 0 | (48 & t2) >> 4);
              if (null !== (c = src())) {
                t1 = ain[c];
                if ("undefined" === typeof t1) {
                  if (61 === c) break;
                  fail(c);
                }
                dst((15 & t2) << 4 >>> 0 | (60 & t1) >> 2);
                if (null !== (c = src())) {
                  t2 = ain[c];
                  if ("undefined" === typeof t2) {
                    if (61 === c) break;
                    fail(c);
                  }
                  dst((3 & t1) << 6 >>> 0 | t2);
                }
              }
            }
          }
        };
        lxiv.test = function(str) {
          return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(str);
        };
        return lxiv;
      }();
      ByteBufferPrototype.toBase64 = function(begin, end) {
        "undefined" === typeof begin && (begin = this.offset);
        "undefined" === typeof end && (end = this.limit);
        begin |= 0;
        end |= 0;
        if (begin < 0 || end > this.capacity || begin > end) throw RangeError("begin, end");
        var sd;
        lxiv.encode(function() {
          return begin < end ? this.view[begin++] : null;
        }.bind(this), sd = stringDestination());
        return sd();
      };
      ByteBuffer.fromBase64 = function(str, littleEndian) {
        if ("string" !== typeof str) throw TypeError("str");
        var bb = new ByteBuffer(str.length / 4 * 3, littleEndian), i = 0;
        lxiv.decode(stringSource(str), function(b) {
          bb.view[i++] = b;
        });
        bb.limit = i;
        return bb;
      };
      ByteBuffer.btoa = function(str) {
        return ByteBuffer.fromBinary(str).toBase64();
      };
      ByteBuffer.atob = function(b64) {
        return ByteBuffer.fromBase64(b64).toBinary();
      };
      ByteBufferPrototype.toBinary = function(begin, end) {
        "undefined" === typeof begin && (begin = this.offset);
        "undefined" === typeof end && (end = this.limit);
        begin |= 0;
        end |= 0;
        if (begin < 0 || end > this.capacity() || begin > end) throw RangeError("begin, end");
        if (begin === end) return "";
        var chars = [], parts = [];
        while (begin < end) {
          chars.push(this.view[begin++]);
          chars.length >= 1024 && (parts.push(String.fromCharCode.apply(String, chars)), chars = []);
        }
        return parts.join("") + String.fromCharCode.apply(String, chars);
      };
      ByteBuffer.fromBinary = function(str, littleEndian) {
        if ("string" !== typeof str) throw TypeError("str");
        var i = 0, k = str.length, charCode, bb = new ByteBuffer(k, littleEndian);
        while (i < k) {
          charCode = str.charCodeAt(i);
          if (charCode > 255) throw RangeError("illegal char code: " + charCode);
          bb.view[i++] = charCode;
        }
        bb.limit = k;
        return bb;
      };
      ByteBufferPrototype.toDebug = function(columns) {
        var i = -1, k = this.buffer.byteLength, b, hex = "", asc = "", out = "";
        while (i < k) {
          if (-1 !== i) {
            b = this.view[i];
            hex += b < 16 ? "0" + b.toString(16).toUpperCase() : b.toString(16).toUpperCase();
            columns && (asc += b > 32 && b < 127 ? String.fromCharCode(b) : ".");
          }
          ++i;
          if (columns && i > 0 && i % 16 === 0 && i !== k) {
            while (hex.length < 51) hex += " ";
            out += hex + asc + "\n";
            hex = asc = "";
          }
          i === this.offset && i === this.limit ? hex += i === this.markedOffset ? "!" : "|" : i === this.offset ? hex += i === this.markedOffset ? "[" : "<" : i === this.limit ? hex += i === this.markedOffset ? "]" : ">" : hex += i === this.markedOffset ? "'" : columns || 0 !== i && i !== k ? " " : "";
        }
        if (columns && " " !== hex) {
          while (hex.length < 51) hex += " ";
          out += hex + asc + "\n";
        }
        return columns ? out : hex;
      };
      ByteBuffer.fromDebug = function(str, littleEndian, noAssert) {
        var k = str.length, bb = new ByteBuffer((k + 1) / 3 | 0, littleEndian, noAssert);
        var i = 0, j = 0, ch, b, rs = false, ho = false, hm = false, hl = false, fail = false;
        while (i < k) {
          switch (ch = str.charAt(i++)) {
           case "!":
            if (!noAssert) {
              if (ho || hm || hl) {
                fail = true;
                break;
              }
              ho = hm = hl = true;
            }
            bb.offset = bb.markedOffset = bb.limit = j;
            rs = false;
            break;

           case "|":
            if (!noAssert) {
              if (ho || hl) {
                fail = true;
                break;
              }
              ho = hl = true;
            }
            bb.offset = bb.limit = j;
            rs = false;
            break;

           case "[":
            if (!noAssert) {
              if (ho || hm) {
                fail = true;
                break;
              }
              ho = hm = true;
            }
            bb.offset = bb.markedOffset = j;
            rs = false;
            break;

           case "<":
            if (!noAssert) {
              if (ho) {
                fail = true;
                break;
              }
              ho = true;
            }
            bb.offset = j;
            rs = false;
            break;

           case "]":
            if (!noAssert) {
              if (hl || hm) {
                fail = true;
                break;
              }
              hl = hm = true;
            }
            bb.limit = bb.markedOffset = j;
            rs = false;
            break;

           case ">":
            if (!noAssert) {
              if (hl) {
                fail = true;
                break;
              }
              hl = true;
            }
            bb.limit = j;
            rs = false;
            break;

           case "'":
            if (!noAssert) {
              if (hm) {
                fail = true;
                break;
              }
              hm = true;
            }
            bb.markedOffset = j;
            rs = false;
            break;

           case " ":
            rs = false;
            break;

           default:
            if (!noAssert && rs) {
              fail = true;
              break;
            }
            b = parseInt(ch + str.charAt(i++), 16);
            if (!noAssert && (isNaN(b) || b < 0 || b > 255)) throw TypeError("Illegal str: Not a debug encoded string");
            bb.view[j++] = b;
            rs = true;
          }
          if (fail) throw TypeError("Illegal str: Invalid symbol at " + i);
        }
        if (!noAssert) {
          if (!ho || !hl) throw TypeError("Illegal str: Missing offset or limit");
          if (j < bb.buffer.byteLength) throw TypeError("Illegal str: Not a debug encoded string (is it hex?) " + j + " < " + k);
        }
        return bb;
      };
      ByteBufferPrototype.toHex = function(begin, end) {
        begin = "undefined" === typeof begin ? this.offset : begin;
        end = "undefined" === typeof end ? this.limit : end;
        if (!this.noAssert) {
          if ("number" !== typeof begin || begin % 1 !== 0) throw TypeError("Illegal begin: Not an integer");
          begin >>>= 0;
          if ("number" !== typeof end || end % 1 !== 0) throw TypeError("Illegal end: Not an integer");
          end >>>= 0;
          if (begin < 0 || begin > end || end > this.buffer.byteLength) throw RangeError("Illegal range: 0 <= " + begin + " <= " + end + " <= " + this.buffer.byteLength);
        }
        var out = new Array(end - begin), b;
        while (begin < end) {
          b = this.view[begin++];
          b < 16 ? out.push("0", b.toString(16)) : out.push(b.toString(16));
        }
        return out.join("");
      };
      ByteBuffer.fromHex = function(str, littleEndian, noAssert) {
        if (!noAssert) {
          if ("string" !== typeof str) throw TypeError("Illegal str: Not a string");
          if (str.length % 2 !== 0) throw TypeError("Illegal str: Length not a multiple of 2");
        }
        var k = str.length, bb = new ByteBuffer(k / 2 | 0, littleEndian), b;
        for (var i = 0, j = 0; i < k; i += 2) {
          b = parseInt(str.substring(i, i + 2), 16);
          if (!noAssert && (!isFinite(b) || b < 0 || b > 255)) throw TypeError("Illegal str: Contains non-hex characters");
          bb.view[j++] = b;
        }
        bb.limit = j;
        return bb;
      };
      var utfx = function() {
        var utfx = {};
        utfx.MAX_CODEPOINT = 1114111;
        utfx.encodeUTF8 = function(src, dst) {
          var cp = null;
          "number" === typeof src && (cp = src, src = function src() {
            return null;
          });
          while (null !== cp || null !== (cp = src())) {
            cp < 128 ? dst(127 & cp) : cp < 2048 ? (dst(cp >> 6 & 31 | 192), dst(63 & cp | 128)) : cp < 65536 ? (dst(cp >> 12 & 15 | 224), 
            dst(cp >> 6 & 63 | 128), dst(63 & cp | 128)) : (dst(cp >> 18 & 7 | 240), dst(cp >> 12 & 63 | 128), 
            dst(cp >> 6 & 63 | 128), dst(63 & cp | 128));
            cp = null;
          }
        };
        utfx.decodeUTF8 = function(src, dst) {
          var a, b, c, d, fail = function fail(b) {
            b = b.slice(0, b.indexOf(null));
            var err = Error(b.toString());
            err.name = "TruncatedError";
            err["bytes"] = b;
            throw err;
          };
          while (null !== (a = src())) if (0 === (128 & a)) dst(a); else if (192 === (224 & a)) null === (b = src()) && fail([ a, b ]), 
          dst((31 & a) << 6 | 63 & b); else if (224 === (240 & a)) (null === (b = src()) || null === (c = src())) && fail([ a, b, c ]), 
          dst((15 & a) << 12 | (63 & b) << 6 | 63 & c); else {
            if (240 !== (248 & a)) throw RangeError("Illegal starting byte: " + a);
            (null === (b = src()) || null === (c = src()) || null === (d = src())) && fail([ a, b, c, d ]), 
            dst((7 & a) << 18 | (63 & b) << 12 | (63 & c) << 6 | 63 & d);
          }
        };
        utfx.UTF16toUTF8 = function(src, dst) {
          var c1, c2 = null;
          while (true) {
            if (null === (c1 = null !== c2 ? c2 : src())) break;
            if (c1 >= 55296 && c1 <= 57343 && null !== (c2 = src()) && c2 >= 56320 && c2 <= 57343) {
              dst(1024 * (c1 - 55296) + c2 - 56320 + 65536);
              c2 = null;
              continue;
            }
            dst(c1);
          }
          null !== c2 && dst(c2);
        };
        utfx.UTF8toUTF16 = function(src, dst) {
          var cp = null;
          "number" === typeof src && (cp = src, src = function src() {
            return null;
          });
          while (null !== cp || null !== (cp = src())) {
            cp <= 65535 ? dst(cp) : (cp -= 65536, dst(55296 + (cp >> 10)), dst(cp % 1024 + 56320));
            cp = null;
          }
        };
        utfx.encodeUTF16toUTF8 = function(src, dst) {
          utfx.UTF16toUTF8(src, function(cp) {
            utfx.encodeUTF8(cp, dst);
          });
        };
        utfx.decodeUTF8toUTF16 = function(src, dst) {
          utfx.decodeUTF8(src, function(cp) {
            utfx.UTF8toUTF16(cp, dst);
          });
        };
        utfx.calculateCodePoint = function(cp) {
          return cp < 128 ? 1 : cp < 2048 ? 2 : cp < 65536 ? 3 : 4;
        };
        utfx.calculateUTF8 = function(src) {
          var cp, l = 0;
          while (null !== (cp = src())) l += cp < 128 ? 1 : cp < 2048 ? 2 : cp < 65536 ? 3 : 4;
          return l;
        };
        utfx.calculateUTF16asUTF8 = function(src) {
          var n = 0, l = 0;
          utfx.UTF16toUTF8(src, function(cp) {
            ++n;
            l += cp < 128 ? 1 : cp < 2048 ? 2 : cp < 65536 ? 3 : 4;
          });
          return [ n, l ];
        };
        return utfx;
      }();
      ByteBufferPrototype.toUTF8 = function(begin, end) {
        "undefined" === typeof begin && (begin = this.offset);
        "undefined" === typeof end && (end = this.limit);
        if (!this.noAssert) {
          if ("number" !== typeof begin || begin % 1 !== 0) throw TypeError("Illegal begin: Not an integer");
          begin >>>= 0;
          if ("number" !== typeof end || end % 1 !== 0) throw TypeError("Illegal end: Not an integer");
          end >>>= 0;
          if (begin < 0 || begin > end || end > this.buffer.byteLength) throw RangeError("Illegal range: 0 <= " + begin + " <= " + end + " <= " + this.buffer.byteLength);
        }
        var sd;
        try {
          utfx.decodeUTF8toUTF16(function() {
            return begin < end ? this.view[begin++] : null;
          }.bind(this), sd = stringDestination());
        } catch (e) {
          if (begin !== end) throw RangeError("Illegal range: Truncated data, " + begin + " != " + end);
        }
        return sd();
      };
      ByteBuffer.fromUTF8 = function(str, littleEndian, noAssert) {
        if (!noAssert && "string" !== typeof str) throw TypeError("Illegal str: Not a string");
        var bb = new ByteBuffer(utfx.calculateUTF16asUTF8(stringSource(str), true)[1], littleEndian, noAssert), i = 0;
        utfx.encodeUTF16toUTF8(stringSource(str), function(b) {
          bb.view[i++] = b;
        });
        bb.limit = i;
        return bb;
      };
      return ByteBuffer;
    });
    cc._RF.pop();
  }, {
    long: "long"
  } ],
  comFunMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "beca2iYY29I6JoZ61QmJuHK", "comFunMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "comFunMgr"
      },
      ctor: function ctor() {
        console.log("-new:" + this.TAG);
      },
      onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
      },
      onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
      }
    });
    cc._RF.pop();
  }, {} ],
  effectMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "bf362Wr1pJO3b62zKb2ubUy", "effectMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "effectMgr"
      },
      ctor: function ctor() {
        console.log("-new:" + this.TAG);
      },
      onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
      },
      onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
      }
    });
    cc._RF.pop();
  }, {} ],
  eventMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "e68becmCV1Et73aUPZ4jp7W", "eventMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "eventMgr"
      },
      ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.eventBuff = {};
        this.fezzedEventBuff = {};
      },
      onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
      },
      onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
      },
      listen: function listen(_eventName, _callfunc, _target) {
        null == this.eventBuff[_eventName] && (this.eventBuff[_eventName] = []);
        var item = {};
        item.target = _target;
        item.callfunc = _callfunc;
        this.eventBuff[_eventName].push(item);
      },
      unListenAllByKey: function unListenAllByKey(_eventName) {
        this.eventBuff[_eventName] = null;
      },
      unListenByObj: function unListenByObj(_target) {
        for (var key in this.eventBuff) if (this.eventBuff.hasOwnProperty(key)) {
          var itemlist = this.eventBuff[key];
          if (null != itemlist) for (var index = itemlist.length - 1; index >= 0; index--) {
            var element = itemlist[index];
            null != element && element.target === _target && itemlist.splice(index, 1);
          }
        }
      },
      unListen: function unListen(_eventName, _target) {
        var itemlist = this.eventBuff[_eventName];
        if (null != itemlist) for (var index = 0; index < itemlist.length; index++) {
          var element = itemlist[index];
          if (null != element && element.target == _target) {
            itemlist.splice(index, 1);
            index--;
          }
        }
      },
      notify: function notify(_eventName, data) {
        var itemlist = this.eventBuff[_eventName];
        if (null != itemlist) for (var index = 0; index < itemlist.length; index++) {
          var element = itemlist[index];
          element.callfunc(element.target, data);
        } else console.log("_event null : ", _eventName);
      }
    });
    cc._RF.pop();
  }, {} ],
  fileMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "7fa1fbewl1Mw4YyUBg6Ax3c", "fileMgr");
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
      readFileFromRes: function readFileFromRes(path, callback) {
        if (null == path) {
          console.log(" ------ \u8bfb\u53d6\u7a7a\u7684\u6587\u4ef6\u8def\u5f84");
          return;
        }
        cc.loader.loadRes(path, function(err, data) {
          if (err) {
            console.log(err.message || err);
            return callback ? callback(null) : null;
          }
          return callback ? callback(data) : null;
        });
      },
      write2FileRes: function write2FileRes(data, path) {
        if (cc.sys.isNative) {
          if (null == path || null == data) {
            console.log(" ------ \u5199\u5165\u7684\u5185\u5bb9\u8def\u5f84\u4e0d\u80fd\u4e3a\u7a7a");
            return;
          }
          var wpath = cc.url.raw(path);
          jsb.fileUtils.writeStringToFile(data, wpath);
        } else console.log(" ----- \u4e0d\u662f\u539f\u751f\u5ba2\u6237\u7aef\u7a0b\u5e8f");
      },
      writeObj2FileRes: function writeObj2FileRes(obj, path) {
        if (cc.sys.isNative) {
          if (null == path || null == obj) {
            console.log(" ------ \u5199\u5165\u7684\u5bf9\u8c61\u8def\u5f84\u4e0d\u80fd\u4e3a\u7a7a");
            return;
          }
          "Object" != typeof obj && console.log(" ------ \u4f60\u5199\u5165\u7684\u4e0d\u662f\u4e00\u4e2a\u5bf9\u8c61\u3002\u8bf7\u7528 write2FileRes");
          var wpath = cc.url.raw(path);
          var _data = JSON.stringify(obj);
          jsb.fileUtils.writeStringToFile(_data, wpath);
        } else console.log(" ----- \u4e0d\u662f\u539f\u751f\u5ba2\u6237\u7aef\u7a0b\u5e8f");
      },
      readFile: function readFile(path) {
        if (null == path) {
          console.log(" ------ \u8bfb\u53d6\u7a7a\u7684\u6587\u4ef6\u8def\u5f84");
          return;
        }
        if (cc.sys.isNative) {
          var _repath = path;
          if (null == _repath.match("/")) {
            _repath = this.fullPathForFileName(path);
            console.log(" ------ \u8bfb\u53d6\u6587\u4ef6 ", _repath);
          }
          return jsb.fileUtils.getStringFromFile(_repath);
        }
        console.log(" ----- \u4e0d\u662f\u539f\u751f\u5ba2\u6237\u7aef\u7a0b\u5e8f");
      },
      write2File: function write2File(str_data, path) {
        if (cc.sys.isNative) {
          if (null == str_data || null == path) {
            console.log(" ------ \u6587\u4ef6\u5199\u5165\u5185\u5bb9\u8def\u5f84\u4e0d\u80fd\u4e3a\u7a7a", str_data, path);
            return false;
          }
          var _path = path;
          if (null == _path.match("/")) {
            _path = jsb.fileUtils.getWritablePath() + path;
            console.log(" ------ \u6587\u4ef6\u88ab\u5b58\u50a8\u5230 writablePath ", _path);
          }
          return jsb.fileUtils.writeStringToFile(str_data, _path);
        }
        console.log(" ------ \u6587\u4ef6\u5199\u64cd\u4f5c\u9700\u8981\u5728 \u8bbe\u5907\u4e0a\u4f7f\u7528");
        return false;
      },
      writeObj2File: function writeObj2File(obj, path) {
        if (cc.sys.isNative) {
          if (null == obj || null == path) {
            console.log(" ------ \u6587\u4ef6\u5199\u5165\u5bf9\u8c61\u8def\u5f84\u4e0d\u80fd\u4e3a\u7a7a", obj, path);
            return false;
          }
          var _path = path;
          if (null == _path.match("/")) {
            _path = jsb.fileUtils.getWritablePath() + path;
            console.log(" ------ \u6587\u4ef6\u88ab\u5b58\u50a8\u5230 writablePath ", _path);
            return false;
          }
          return jsb.fileUtils.writeToFile(JSON.stringify(obj), _path);
        }
        console.log(" ------ \u6587\u4ef6\u5199\u64cd\u4f5c\u9700\u8981\u5728 \u8bbe\u5907\u4e0a\u4f7f\u7528");
        return false;
      },
      fullPathForFileName: function fullPathForFileName(name) {
        if (cc.sys.isNative) return jsb.fileUtils.fullPathForFileName(name);
        console.log(" ------ \u6587\u4ef6\u5199\u64cd\u4f5c\u9700\u8981\u5728 \u8bbe\u5907\u4e0a\u4f7f\u7528");
        return false;
      },
      fullPathForRelativeFile: function name(path, name) {
        if (cc.sys.isNative) return jsb.fileUtils.fullPathForRelativeFile(path, name);
        console.log(" ------ \u6587\u4ef6\u5199\u64cd\u4f5c\u9700\u8981\u5728 \u8bbe\u5907\u4e0a\u4f7f\u7528");
        return false;
      },
      getWritablePath: function getWritablePath() {
        if (cc.sys.isNative) return jsb.fileUtils.getWritablePath();
        console.log(" ------ \u6587\u4ef6\u5199\u64cd\u4f5c\u9700\u8981\u5728 \u8bbe\u5907\u4e0a\u4f7f\u7528");
        return false;
      },
      isFileExist: function isFileExist(path) {
        if (cc.sys.isNative) return jsb.fileUtils.isFileExist(path);
        console.log(" ------ \u6587\u4ef6\u5199\u64cd\u4f5c\u9700\u8981\u5728 \u8bbe\u5907\u4e0a\u4f7f\u7528");
        return false;
      },
      isDirectoryExist: function isDirectoryExist(path) {
        if (cc.sys.isNative) return jsb.fileUtils.isDirectoryExist(path);
        console.log(" ------ \u6587\u4ef6\u5199\u64cd\u4f5c\u9700\u8981\u5728 \u8bbe\u5907\u4e0a\u4f7f\u7528");
        return false;
      },
      removeFile: function removeFile(path) {
        if (cc.sys.isNative) return jsb.fileUtils.removeFile(path);
        console.log(" ------ \u6587\u4ef6\u5199\u64cd\u4f5c\u9700\u8981\u5728 \u8bbe\u5907\u4e0a\u4f7f\u7528");
        return false;
      },
      removeDirectory: function removeDirectory(path) {
        if (cc.sys.isNative) {
          if (this.isDirectoryExist(path)) return jsb.fileUtils.removeDirectory(path);
          console.log(" ----- \u76ee\u5f55\u4e0d\u5b58\u5728 \u65e0\u9700\u5220\u9664");
          return true;
        }
        console.log(" ------ \u6587\u4ef6\u5199\u64cd\u4f5c\u9700\u8981\u5728 \u8bbe\u5907\u4e0a\u4f7f\u7528");
        return false;
      },
      renameFile: function renameFile(path, oldname, newname) {
        if (cc.sys.isNative) return jsb.fileUtils.renameFile(path, oldname, newname);
        console.log(" ------ \u6587\u4ef6\u5199\u64cd\u4f5c\u9700\u8981\u5728 \u8bbe\u5907\u4e0a\u4f7f\u7528");
        return false;
      }
    });
    cc._RF.pop();
  }, {} ],
  gameConfMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "e0f4fkPoTdFzpZn42iADXHR", "gameConfMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "gameConfMgr"
      },
      ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.infoBuff = {};
        this.infoBuff["version"] = "0.0.0";
        this.infoBuff["musicVolume"] = .2;
        this.infoBuff["effectVolume"] = .2;
        this.infoBuff["gameUpdateInterval"] = 1;
        this.infoBuff["gameSpeed"] = 1;
        this.infoBuff["gameUpdateMove"] = 120;
        this.infoBuff["maxSteps"] = 170;
        this.infoBuff["indexOffset"] = 10;
        this.infoBuff["brickNum"] = 9;
        this.infoBuff["hitOffset"] = 12;
        this.infoBuff["turnSpeed"] = .2;
        var bricks = cc.Enum({
          BASE: 100,
          TRAP: 101,
          BUFF: 102,
          WALL: 103
        });
        this.BRICKS = bricks;
      },
      init: function init() {},
      onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
      },
      onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
      },
      setInfo: function setInfo(_key, _value) {
        this.infoBuff[_key] = _value;
      },
      getInfo: function getInfo(_key) {
        return this.infoBuff[_key];
      },
      storageLocalData: function storageLocalData(key, data) {
        if (null == key || null == data) {
          console.log(" ------ \u5b58\u50a8\u7684key/\u6570\u636e\u4e0d\u80fd\u7a7a");
          return;
        }
        data instanceof Object ? cc.sys.localStorage.setItem(key, JSON.stringify(data)) : cc.sys.localStorage.setItem(key, data);
      },
      getLocalData: function getLocalData(key) {
        var data = cc.sys.localStorage.getItem(key);
        var objdata = JSON.parse(data);
        return objdata || data;
      },
      removeLocalData: function removeLocalData(key) {
        cc.sys.localStorage.removeItem(key);
      }
    });
    cc._RF.pop();
  }, {} ],
  gameDataMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "8eabfKht7BPfLTFiN0wWOap", "gameDataMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "gameDataMgr"
      },
      ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.dataBuff = {};
      },
      onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
      },
      onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
      },
      setData: function setData(_key, _value) {
        this.dataBuff[_key] = _value;
      },
      getData: function getData(_key) {
        return this.dataBuff[_key];
      }
    });
    cc._RF.pop();
  }, {} ],
  gameNetMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "07d22Vx2b9MbomuikVMUX+q", "gameNetMgr");
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
        if ("Object" == typeof obj) {
          var _str = "?";
          for (var key in obj) if (obj.hasOwnProperty(key)) {
            var element = obj[key];
            "?" != _str && (_str += "&");
            str += key + "=" + element;
          }
          return "?" == _str ? "" : _str;
        }
        return "";
      },
      httpGet: function httpGet(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.timeout = 5e3;
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.setRequestHeader("charset", "UTF-8");
        xhr.onreadystatechange = function() {
          if (4 == xhr.readyState && xhr.status >= 200 && xhr.status < 400) {
            var response = xhr.responseText;
            callback(true, response, xhr.status);
          } else callback(false, "", xhr.status);
        };
        xhr.ontimeout = function(err) {
          console.log("TIME OUT !!!");
          callback(false, err, -1);
        };
        xhr.open("GET", url, true);
        xhr.send();
      },
      httpPost: function httpPost(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.timeout = 5e3;
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.setRequestHeader("charset", "UTF-8");
        xhr.onreadystatechange = function() {
          if (4 == xhr.readyState && xhr.status >= 200 && xhr.status < 400) {
            var response = xhr.responseText;
            callback(true, response, xhr.status);
          } else callback(false, "", xhr.status);
        };
        xhr.ontimeout = function(err) {
          console.log("TIME OUT !!!");
          callback(false, err, -1);
        };
        xhr.open("POST", url, true);
        xhr.send();
      },
      httpPut: function httpPut(url, data) {
        var xhr = new XMLHttpRequest();
        xhr.timeout = 5e3;
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.setRequestHeader("charset", "UTF-8");
        xhr.onreadystatechange = function() {
          if (4 == xhr.readyState && xhr.status >= 200 && xhr.status < 400) {
            var response = xhr.responseText;
            console.log(response);
          }
        };
        xhr.ontimeout = function(err) {
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
  }, {} ],
  gameScene: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "1e384rk/1NNPriDsn0Y9JpK", "gameScene");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {},
      onLoad: function onLoad() {
        console.log("gameConfMgr version", cc.Atom.gameConfMgr.getInfo("version"));
        console.log("gameConfMgr gamemode", cc.Atom.gameConfMgr.getInfo("gamemode"));
        var node = cc.Atom.spriteMgr.createSprite("common2", "image-common2-zhunbeizhong");
        node.setPosition(100, 100);
        node.parent = this.node;
        cc.Atom.audioMgr.setSoundSearchDir("common/audio");
      },
      obBtnOpenHelloWorld: function obBtnOpenHelloWorld() {
        cc.director.loadScene("Scene/helloworld");
      },
      onPlayMusic: function onPlayMusic() {
        cc.Atom.audioMgr.playMusic("loginMusic.mp3");
      },
      onPlayEffect: function onPlayEffect() {
        cc.Atom.audioMgr.playEffect("1gang.mp3");
      },
      onStopAll: function onStopAll() {
        cc.Atom.audioMgr.stopAll();
      },
      onSetVolumeEffect: function onSetVolumeEffect() {
        cc.Atom.audioMgr.setEffectVolume(1);
      },
      onSetVolumeMusic: function onSetVolumeMusic() {
        cc.Atom.audioMgr.setMusicVolume(1);
      },
      onWriteFile: function onWriteFile() {
        cc.Atom.fileMgr.write2File("/Users/yajing/Desktop/websocket_node/##########kfile", "/Users/yajing/Desktop/websocket_node/kfile.txt");
      },
      onReadFile: function onReadFile() {
        cc.Atom.fileMgr.readFile("/Users/yajing/Desktop/websocket_node/kfile.txt", function(data) {
          console.log(" -- \u8fd9\u662f\u8bfb\u53d6\u51fa\u6765\u7684\u6587\u4ef6\u5185\u5bb9\uff1a ", data);
        });
        cc.Atom.fileMgr.readFile("/Users/yajing/Desktop/websocket_node/world.txt", function(data) {
          console.log(" -- \u8fd9\u662f\u8bfb\u53d6\u51fa\u6765\u7684\u6587\u4ef6\u5185\u5bb9world\uff1a ", data);
        });
      },
      onWriteObjFile: function onWriteObjFile() {
        cc.Atom.fileMgr.write2File({
          hello: "world"
        }, "/Users/yajing/Desktop/websocket_node/world.txt");
      },
      onMd5Str: function onMd5Str() {
        console.log(cc.Atom.md5.md5Str("cocos_creator"));
        console.log(cc.Atom.md5.md5Str("cocos_creator_hello"));
      },
      onFileMd5: function onFileMd5() {
        console.log(cc.Atom.md5.md5File("/Users/yajing/Desktop/websocket_node/world.txt"));
      }
    });
    cc._RF.pop();
  }, {} ],
  gameState: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "fc606XvEctJPIT0gcPxcUYb", "gameState");
    "use strict";
    var GameState = {
      default: 0,
      logo: 1,
      login: 2,
      hall: 3,
      room: 4
    };
    var GameIngState = {
      default: 0,
      pause: 1,
      gameing: 2,
      gamestop: 3,
      gameover: 4
    };
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "gameState"
      },
      ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.gameState = GameState.default;
        this.gameIngState = GameIngState.default;
      },
      onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
      },
      onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
      },
      setGameInLogo: function setGameInLogo() {
        this.gameState = GameState.logo;
      },
      isGameInLogo: function isGameInLogo() {
        return this.gameState == GameState.logo;
      },
      setGameInLogin: function setGameInLogin() {
        this.gameState = GameState.login;
      },
      isGameInLogin: function isGameInLogin() {
        return this.gameState == GameState.login;
      },
      setGameInHall: function setGameInHall() {
        this.gameState = GameState.hall;
      },
      isGameInHall: function isGameInHall() {
        return this.gameState == GameState.hall;
      },
      setGameInRoom: function setGameInRoom() {
        this.gameState = GameState.room;
      },
      isGameInRoom: function isGameInRoom() {
        return this.gameState == GameState.room;
      },
      setGamePause: function setGamePause() {
        this.gameIngState = GameIngState.pause;
      },
      isGamePause: function isGamePause() {
        return this.gameIngState == GameIngState.pause;
      },
      setGameStop: function setGameStop() {
        this.gameIngState = GameIngState.gamestop;
      },
      isGameStop: function isGameStop() {
        return this.gameIngState == GameIngState.gamestop;
      },
      setGameIng: function setGameIng() {
        this.gameIngState = GameIngState.gameing;
      },
      isGameIng: function isGameIng() {
        return this.gameIngState == GameIngState.gameing;
      },
      setGameOver: function setGameOver() {
        this.gameIngState = GameIngState.gameover;
      },
      isGameOver: function isGameOver() {
        return this.gameIngState == GameIngState.gameover;
      }
    });
    cc._RF.pop();
  }, {} ],
  hotUpdateMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "5d4b44k5zBHl5KZbVdpqQ8E", "hotUpdateMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "hotUpdateMgr"
      },
      ctor: function ctor() {
        console.log("-new:" + this.TAG);
      },
      onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
      },
      onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
      }
    });
    cc._RF.pop();
  }, {} ],
  long: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "e768cKPL3RAl6vI1O6AQRNP", "long");
    "use strict";
    var _typeof = "function" === typeof Symbol && "symbol" === typeof Symbol.iterator ? function(obj) {
      return typeof obj;
    } : function(obj) {
      return obj && "function" === typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
    (function(global, factory) {
      "function" === typeof define && define["amd"] ? define([], factory) : "function" === typeof require && "object" === ("undefined" === typeof module ? "undefined" : _typeof(module)) && module && module["exports"] ? module["exports"] = factory() : (global["dcodeIO"] = global["dcodeIO"] || {})["Long"] = factory();
    })(void 0, function() {
      function Long(low, high, unsigned) {
        this.low = 0 | low;
        this.high = 0 | high;
        this.unsigned = !!unsigned;
      }
      Long.prototype.__isLong__;
      Object.defineProperty(Long.prototype, "__isLong__", {
        value: true,
        enumerable: false,
        configurable: false
      });
      function isLong(obj) {
        return true === (obj && obj["__isLong__"]);
      }
      Long.isLong = isLong;
      var INT_CACHE = {};
      var UINT_CACHE = {};
      function fromInt(value, unsigned) {
        var obj, cachedObj, cache;
        if (unsigned) {
          value >>>= 0;
          if (cache = 0 <= value && value < 256) {
            cachedObj = UINT_CACHE[value];
            if (cachedObj) return cachedObj;
          }
          obj = fromBits(value, (0 | value) < 0 ? -1 : 0, true);
          cache && (UINT_CACHE[value] = obj);
          return obj;
        }
        value |= 0;
        if (cache = -128 <= value && value < 128) {
          cachedObj = INT_CACHE[value];
          if (cachedObj) return cachedObj;
        }
        obj = fromBits(value, value < 0 ? -1 : 0, false);
        cache && (INT_CACHE[value] = obj);
        return obj;
      }
      Long.fromInt = fromInt;
      function fromNumber(value, unsigned) {
        if (isNaN(value) || !isFinite(value)) return unsigned ? UZERO : ZERO;
        if (unsigned) {
          if (value < 0) return UZERO;
          if (value >= TWO_PWR_64_DBL) return MAX_UNSIGNED_VALUE;
        } else {
          if (value <= -TWO_PWR_63_DBL) return MIN_VALUE;
          if (value + 1 >= TWO_PWR_63_DBL) return MAX_VALUE;
        }
        if (value < 0) return fromNumber(-value, unsigned).neg();
        return fromBits(value % TWO_PWR_32_DBL | 0, value / TWO_PWR_32_DBL | 0, unsigned);
      }
      Long.fromNumber = fromNumber;
      function fromBits(lowBits, highBits, unsigned) {
        return new Long(lowBits, highBits, unsigned);
      }
      Long.fromBits = fromBits;
      var pow_dbl = Math.pow;
      function fromString(str, unsigned, radix) {
        if (0 === str.length) throw Error("empty string");
        if ("NaN" === str || "Infinity" === str || "+Infinity" === str || "-Infinity" === str) return ZERO;
        "number" === typeof unsigned ? (radix = unsigned, unsigned = false) : unsigned = !!unsigned;
        radix = radix || 10;
        if (radix < 2 || 36 < radix) throw RangeError("radix");
        var p;
        if ((p = str.indexOf("-")) > 0) throw Error("interior hyphen");
        if (0 === p) return fromString(str.substring(1), unsigned, radix).neg();
        var radixToPower = fromNumber(pow_dbl(radix, 8));
        var result = ZERO;
        for (var i = 0; i < str.length; i += 8) {
          var size = Math.min(8, str.length - i), value = parseInt(str.substring(i, i + size), radix);
          if (size < 8) {
            var power = fromNumber(pow_dbl(radix, size));
            result = result.mul(power).add(fromNumber(value));
          } else {
            result = result.mul(radixToPower);
            result = result.add(fromNumber(value));
          }
        }
        result.unsigned = unsigned;
        return result;
      }
      Long.fromString = fromString;
      function fromValue(val) {
        if (val instanceof Long) return val;
        if ("number" === typeof val) return fromNumber(val);
        if ("string" === typeof val) return fromString(val);
        return fromBits(val.low, val.high, val.unsigned);
      }
      Long.fromValue = fromValue;
      var TWO_PWR_16_DBL = 65536;
      var TWO_PWR_24_DBL = 1 << 24;
      var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
      var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
      var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
      var TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);
      var ZERO = fromInt(0);
      Long.ZERO = ZERO;
      var UZERO = fromInt(0, true);
      Long.UZERO = UZERO;
      var ONE = fromInt(1);
      Long.ONE = ONE;
      var UONE = fromInt(1, true);
      Long.UONE = UONE;
      var NEG_ONE = fromInt(-1);
      Long.NEG_ONE = NEG_ONE;
      var MAX_VALUE = fromBits(-1, 2147483647, false);
      Long.MAX_VALUE = MAX_VALUE;
      var MAX_UNSIGNED_VALUE = fromBits(-1, -1, true);
      Long.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;
      var MIN_VALUE = fromBits(0, -2147483648, false);
      Long.MIN_VALUE = MIN_VALUE;
      var LongPrototype = Long.prototype;
      LongPrototype.toInt = function toInt() {
        return this.unsigned ? this.low >>> 0 : this.low;
      };
      LongPrototype.toNumber = function toNumber() {
        if (this.unsigned) return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
        return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
      };
      LongPrototype.toString = function toString(radix) {
        radix = radix || 10;
        if (radix < 2 || 36 < radix) throw RangeError("radix");
        if (this.isZero()) return "0";
        if (this.isNegative()) {
          if (this.eq(MIN_VALUE)) {
            var radixLong = fromNumber(radix), div = this.div(radixLong), rem1 = div.mul(radixLong).sub(this);
            return div.toString(radix) + rem1.toInt().toString(radix);
          }
          return "-" + this.neg().toString(radix);
        }
        var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned), rem = this;
        var result = "";
        while (true) {
          var remDiv = rem.div(radixToPower), intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0, digits = intval.toString(radix);
          rem = remDiv;
          if (rem.isZero()) return digits + result;
          while (digits.length < 6) digits = "0" + digits;
          result = "" + digits + result;
        }
      };
      LongPrototype.getHighBits = function getHighBits() {
        return this.high;
      };
      LongPrototype.getHighBitsUnsigned = function getHighBitsUnsigned() {
        return this.high >>> 0;
      };
      LongPrototype.getLowBits = function getLowBits() {
        return this.low;
      };
      LongPrototype.getLowBitsUnsigned = function getLowBitsUnsigned() {
        return this.low >>> 0;
      };
      LongPrototype.getNumBitsAbs = function getNumBitsAbs() {
        if (this.isNegative()) return this.eq(MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
        var val = 0 != this.high ? this.high : this.low;
        for (var bit = 31; bit > 0; bit--) if (0 != (val & 1 << bit)) break;
        return 0 != this.high ? bit + 33 : bit + 1;
      };
      LongPrototype.isZero = function isZero() {
        return 0 === this.high && 0 === this.low;
      };
      LongPrototype.isNegative = function isNegative() {
        return !this.unsigned && this.high < 0;
      };
      LongPrototype.isPositive = function isPositive() {
        return this.unsigned || this.high >= 0;
      };
      LongPrototype.isOdd = function isOdd() {
        return 1 === (1 & this.low);
      };
      LongPrototype.isEven = function isEven() {
        return 0 === (1 & this.low);
      };
      LongPrototype.equals = function equals(other) {
        isLong(other) || (other = fromValue(other));
        if (this.unsigned !== other.unsigned && this.high >>> 31 === 1 && other.high >>> 31 === 1) return false;
        return this.high === other.high && this.low === other.low;
      };
      LongPrototype.eq = LongPrototype.equals;
      LongPrototype.notEquals = function notEquals(other) {
        return !this.eq(other);
      };
      LongPrototype.neq = LongPrototype.notEquals;
      LongPrototype.lessThan = function lessThan(other) {
        return this.comp(other) < 0;
      };
      LongPrototype.lt = LongPrototype.lessThan;
      LongPrototype.lessThanOrEqual = function lessThanOrEqual(other) {
        return this.comp(other) <= 0;
      };
      LongPrototype.lte = LongPrototype.lessThanOrEqual;
      LongPrototype.greaterThan = function greaterThan(other) {
        return this.comp(other) > 0;
      };
      LongPrototype.gt = LongPrototype.greaterThan;
      LongPrototype.greaterThanOrEqual = function greaterThanOrEqual(other) {
        return this.comp(other) >= 0;
      };
      LongPrototype.gte = LongPrototype.greaterThanOrEqual;
      LongPrototype.compare = function compare(other) {
        isLong(other) || (other = fromValue(other));
        if (this.eq(other)) return 0;
        var thisNeg = this.isNegative(), otherNeg = other.isNegative();
        if (thisNeg && !otherNeg) return -1;
        if (!thisNeg && otherNeg) return 1;
        if (!this.unsigned) return this.sub(other).isNegative() ? -1 : 1;
        return other.high >>> 0 > this.high >>> 0 || other.high === this.high && other.low >>> 0 > this.low >>> 0 ? -1 : 1;
      };
      LongPrototype.comp = LongPrototype.compare;
      LongPrototype.negate = function negate() {
        if (!this.unsigned && this.eq(MIN_VALUE)) return MIN_VALUE;
        return this.not().add(ONE);
      };
      LongPrototype.neg = LongPrototype.negate;
      LongPrototype.add = function add(addend) {
        isLong(addend) || (addend = fromValue(addend));
        var a48 = this.high >>> 16;
        var a32 = 65535 & this.high;
        var a16 = this.low >>> 16;
        var a00 = 65535 & this.low;
        var b48 = addend.high >>> 16;
        var b32 = 65535 & addend.high;
        var b16 = addend.low >>> 16;
        var b00 = 65535 & addend.low;
        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
        c00 += a00 + b00;
        c16 += c00 >>> 16;
        c00 &= 65535;
        c16 += a16 + b16;
        c32 += c16 >>> 16;
        c16 &= 65535;
        c32 += a32 + b32;
        c48 += c32 >>> 16;
        c32 &= 65535;
        c48 += a48 + b48;
        c48 &= 65535;
        return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
      };
      LongPrototype.subtract = function subtract(subtrahend) {
        isLong(subtrahend) || (subtrahend = fromValue(subtrahend));
        return this.add(subtrahend.neg());
      };
      LongPrototype.sub = LongPrototype.subtract;
      LongPrototype.multiply = function multiply(multiplier) {
        if (this.isZero()) return ZERO;
        isLong(multiplier) || (multiplier = fromValue(multiplier));
        if (multiplier.isZero()) return ZERO;
        if (this.eq(MIN_VALUE)) return multiplier.isOdd() ? MIN_VALUE : ZERO;
        if (multiplier.eq(MIN_VALUE)) return this.isOdd() ? MIN_VALUE : ZERO;
        if (this.isNegative()) return multiplier.isNegative() ? this.neg().mul(multiplier.neg()) : this.neg().mul(multiplier).neg();
        if (multiplier.isNegative()) return this.mul(multiplier.neg()).neg();
        if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24)) return fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned);
        var a48 = this.high >>> 16;
        var a32 = 65535 & this.high;
        var a16 = this.low >>> 16;
        var a00 = 65535 & this.low;
        var b48 = multiplier.high >>> 16;
        var b32 = 65535 & multiplier.high;
        var b16 = multiplier.low >>> 16;
        var b00 = 65535 & multiplier.low;
        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
        c00 += a00 * b00;
        c16 += c00 >>> 16;
        c00 &= 65535;
        c16 += a16 * b00;
        c32 += c16 >>> 16;
        c16 &= 65535;
        c16 += a00 * b16;
        c32 += c16 >>> 16;
        c16 &= 65535;
        c32 += a32 * b00;
        c48 += c32 >>> 16;
        c32 &= 65535;
        c32 += a16 * b16;
        c48 += c32 >>> 16;
        c32 &= 65535;
        c32 += a00 * b32;
        c48 += c32 >>> 16;
        c32 &= 65535;
        c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
        c48 &= 65535;
        return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
      };
      LongPrototype.mul = LongPrototype.multiply;
      LongPrototype.divide = function divide(divisor) {
        isLong(divisor) || (divisor = fromValue(divisor));
        if (divisor.isZero()) throw Error("division by zero");
        if (this.isZero()) return this.unsigned ? UZERO : ZERO;
        var approx, rem, res;
        if (this.unsigned) {
          divisor.unsigned || (divisor = divisor.toUnsigned());
          if (divisor.gt(this)) return UZERO;
          if (divisor.gt(this.shru(1))) return UONE;
          res = UZERO;
        } else {
          if (this.eq(MIN_VALUE)) {
            if (divisor.eq(ONE) || divisor.eq(NEG_ONE)) return MIN_VALUE;
            if (divisor.eq(MIN_VALUE)) return ONE;
            var halfThis = this.shr(1);
            approx = halfThis.div(divisor).shl(1);
            if (approx.eq(ZERO)) return divisor.isNegative() ? ONE : NEG_ONE;
            rem = this.sub(divisor.mul(approx));
            res = approx.add(rem.div(divisor));
            return res;
          }
          if (divisor.eq(MIN_VALUE)) return this.unsigned ? UZERO : ZERO;
          if (this.isNegative()) {
            if (divisor.isNegative()) return this.neg().div(divisor.neg());
            return this.neg().div(divisor).neg();
          }
          if (divisor.isNegative()) return this.div(divisor.neg()).neg();
          res = ZERO;
        }
        rem = this;
        while (rem.gte(divisor)) {
          approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));
          var log2 = Math.ceil(Math.log(approx) / Math.LN2), delta = log2 <= 48 ? 1 : pow_dbl(2, log2 - 48), approxRes = fromNumber(approx), approxRem = approxRes.mul(divisor);
          while (approxRem.isNegative() || approxRem.gt(rem)) {
            approx -= delta;
            approxRes = fromNumber(approx, this.unsigned);
            approxRem = approxRes.mul(divisor);
          }
          approxRes.isZero() && (approxRes = ONE);
          res = res.add(approxRes);
          rem = rem.sub(approxRem);
        }
        return res;
      };
      LongPrototype.div = LongPrototype.divide;
      LongPrototype.modulo = function modulo(divisor) {
        isLong(divisor) || (divisor = fromValue(divisor));
        return this.sub(this.div(divisor).mul(divisor));
      };
      LongPrototype.mod = LongPrototype.modulo;
      LongPrototype.not = function not() {
        return fromBits(~this.low, ~this.high, this.unsigned);
      };
      LongPrototype.and = function and(other) {
        isLong(other) || (other = fromValue(other));
        return fromBits(this.low & other.low, this.high & other.high, this.unsigned);
      };
      LongPrototype.or = function or(other) {
        isLong(other) || (other = fromValue(other));
        return fromBits(this.low | other.low, this.high | other.high, this.unsigned);
      };
      LongPrototype.xor = function xor(other) {
        isLong(other) || (other = fromValue(other));
        return fromBits(this.low ^ other.low, this.high ^ other.high, this.unsigned);
      };
      LongPrototype.shiftLeft = function shiftLeft(numBits) {
        isLong(numBits) && (numBits = numBits.toInt());
        return 0 === (numBits &= 63) ? this : numBits < 32 ? fromBits(this.low << numBits, this.high << numBits | this.low >>> 32 - numBits, this.unsigned) : fromBits(0, this.low << numBits - 32, this.unsigned);
      };
      LongPrototype.shl = LongPrototype.shiftLeft;
      LongPrototype.shiftRight = function shiftRight(numBits) {
        isLong(numBits) && (numBits = numBits.toInt());
        return 0 === (numBits &= 63) ? this : numBits < 32 ? fromBits(this.low >>> numBits | this.high << 32 - numBits, this.high >> numBits, this.unsigned) : fromBits(this.high >> numBits - 32, this.high >= 0 ? 0 : -1, this.unsigned);
      };
      LongPrototype.shr = LongPrototype.shiftRight;
      LongPrototype.shiftRightUnsigned = function shiftRightUnsigned(numBits) {
        isLong(numBits) && (numBits = numBits.toInt());
        numBits &= 63;
        if (0 === numBits) return this;
        var high = this.high;
        if (numBits < 32) {
          var low = this.low;
          return fromBits(low >>> numBits | high << 32 - numBits, high >>> numBits, this.unsigned);
        }
        return fromBits(32 === numBits ? high : high >>> numBits - 32, 0, this.unsigned);
      };
      LongPrototype.shru = LongPrototype.shiftRightUnsigned;
      LongPrototype.toSigned = function toSigned() {
        if (!this.unsigned) return this;
        return fromBits(this.low, this.high, false);
      };
      LongPrototype.toUnsigned = function toUnsigned() {
        if (this.unsigned) return this;
        return fromBits(this.low, this.high, true);
      };
      return Long;
    });
    cc._RF.pop();
  }, {} ],
  md5: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "ec9afjlZq1PWbetv1Lz0C4r", "md5");
    "use strict";
    var crypto = require("crypto");
    var fs = require("fs");
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
      md5File: function md5File(path) {
        if (!fs.statSync(path).isFile()) return null;
        return this.md5.update(fs.readFileSync(path, "utf-8")).digest("hex");
      },
      md5Str: function md5Str(data) {
        return this.md5.update(data).digest("hex");
      }
    });
    cc._RF.pop();
  }, {
    crypto: 56,
    fs: void 0
  } ],
  memoryDetector: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "5452fhfSO9EcbquE1vu+NjU", "memoryDetector");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "MemoryDetector"
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
      showMemoryStatus: function showMemoryStatus() {
        if (cc.sys.isNative) return;
        var _memLabel = null;
        var profiler = cc.profiler;
        profiler.showStats();
        var createMemLabel = function createMemLabel() {
          _memLabel = document.createElement("div");
          profiler._fps = document.getElementById("fps");
          profiler._fps.style.height = "100px";
          var style = _memLabel.style;
          style.color = "rgb(0, 255, 255)";
          style.font = "bold 12px Helvetica, Arial";
          style.lineHeight = "20px;";
          style.width = "100%";
          profiler._fps.appendChild(_memLabel);
        };
        createMemLabel();
        var afterVisit = function afterVisit() {
          var count = 0;
          var totalBytes = 0;
          var locTexrues = cc.textureCache._textures;
          for (var key in locTexrues) {
            var selTexture = locTexrues[key];
            count++;
            totalBytes += selTexture.getPixelWidth() * selTexture.getPixelHeight() * 4;
          }
          var locTextureColorsCache = cc.textureCache._textureColorsCache;
          for (var _key in locTextureColorsCache) {
            var selCanvasColorsArr = locTextureColorsCache[_key];
            for (var selCanvasKey in selCanvasColorsArr) {
              var selCanvas = selCanvasColorsArr[selCanvasKey];
              count++;
              totalBytes += selCanvas.width * selCanvas.height * 4;
            }
          }
          _memLabel.innerHTML = "  Memory  " + (totalBytes / 1048576).toFixed(2) + " M";
        };
        cc.director.on(cc.Director.EVENT_AFTER_VISIT, afterVisit);
        this._inited = true;
      }
    });
    cc._RF.pop();
  }, {} ],
  msgMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "086f3J5M0lJgpspKYb/dO8F", "msgMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "msgMgr",
        TOAST_LONG: 4,
        TOAST_SHORT: 2
      },
      ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.msgBuff = {};
        this.msgBuff[""] = "";
      },
      onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
      },
      onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
      },
      showToast: function showToast(msg, interval) {},
      showAlert: function showAlert(msg, btnTitle, callback) {},
      showSelectAlert: function showSelectAlert(msg, leftBtnTitle, leftCallback, rightBtnTitle, rightCallback) {},
      showLoading: function showLoading(msg) {},
      hidLoading: function hidLoading() {}
    });
    cc._RF.pop();
  }, {} ],
  pauseLayerDelegate: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "abaf7W52EJJCbD4dshuwhhT", "pauseLayerDelegate");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {},
      onLoad: function onLoad() {},
      start: function start() {},
      onResume: function onResume() {
        this.node.removeFromParent();
        cc.Atom.eventMgr.notify("onPause", false);
      },
      onOut: function onOut() {
        this.node.removeFromParent();
        cc.Atom.gameState.setGameInHall();
        cc.director.loadScene("JJGame/Scene/JJHallMain");
      },
      onReStart: function onReStart() {
        this.node.removeFromParent();
        cc.Atom.eventMgr.notify("onReStart", null);
      }
    });
    cc._RF.pop();
  }, {} ],
  platformMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "4e114Osu1JAqYb04qeaafFz", "platformMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "platformMgr"
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
      checkNativeMethod: function checkNativeMethod() {}
    });
    cc._RF.pop();
  }, {} ],
  prefabMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "5329fOe+dBHnotLZs9fKwcd", "prefabMgr");
    "use strict";
    var _typeof = "function" === typeof Symbol && "symbol" === typeof Symbol.iterator ? function(obj) {
      return typeof obj;
    } : function(obj) {
      return obj && "function" === typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "prefabMgr"
      },
      ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.prefabPool = {};
        this.resPrefab = {};
      },
      onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
      },
      onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
      },
      loadAllPrefab: function loadAllPrefab(resData, callback) {
        var _this = this;
        if (null != resData && "object" == ("undefined" === typeof resData ? "undefined" : _typeof(resData))) for (var index = 0; index < resData.length; index++) {
          var element = resData[index];
          var path = element.path;
          var key = element.key;
          cc.loader.loadRes(path, function(err, prefab) {
            if (err) {
              console.log(">>> loadAllPrefab err !!");
              cc.error(err.message || err);
              return;
            }
            _this.resPrefab[key] = prefab;
            callback(index);
          });
        } else console.log("null resData !!");
      },
      addPrefabObj: function addPrefabObj(prefabKey, prefab) {
        if (null == prefabKey || !prefabKey instanceof cc.Prefab) {
          console.log(" ------- \u7c7b\u578b\u5f02\u5e38 ", prefabKey);
          return;
        }
        this.resPrefab[prefabKey] = prefab;
      },
      getPrefabObj: function getPrefabObj(prefabKey) {
        if ("string" != typeof prefabKey) {
          console.log(" the prefabMgr need the  prefab path : ", "undefined" === typeof path ? "undefined" : _typeof(path));
          return;
        }
        if (null == this.resPrefab[prefabKey]) {
          console.log(prefabKey, " do not loaded , load the prefab resource frist !!!");
          return;
        }
        if (null == this.prefabPool[prefabKey]) return cc.instantiate(this.resPrefab[prefabKey]);
        var nodepool = this.prefabPool[prefabKey];
        if (null != nodepool) return nodepool.get();
        return null;
      },
      holdPrefabObj: function holdPrefabObj(prefabKey, obj) {
        null == this.prefabPool[prefabKey] && (this.prefabPool[prefabKey] = new cc.NodePool());
        this.prefabPool[prefabKey].put(obj);
      },
      releasePrefabObj: function releasePrefabObj(path) {
        null != this.prefabPool[path] && this.prefabPool[path].clear();
      },
      releaseAllPrefabObj: function releaseAllPrefabObj() {
        for (var key in this.prefabPool) if (this.prefabPool.hasOwnProperty(key)) {
          var nodepool = this.prefabPool[key];
          nodepool.clear();
        }
      }
    });
    cc._RF.pop();
  }, {} ],
  protobuf: [ function(require, module, exports) {
    (function(process) {
      "use strict";
      cc._RF.push(module, "4ff53AsQuRLoLDBgy4KlGm1", "protobuf");
      "use strict";
      var _typeof = "function" === typeof Symbol && "symbol" === typeof Symbol.iterator ? function(obj) {
        return typeof obj;
      } : function(obj) {
        return obj && "function" === typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
      (function(global, factory) {
        "function" === typeof define && define["amd"] ? define([ "bytebuffer" ], factory) : "function" === typeof require && "object" === ("undefined" === typeof module ? "undefined" : _typeof(module)) && module && module["exports"] ? module["exports"] = factory(require("bytebuffer"), true) : (global["dcodeIO"] = global["dcodeIO"] || {})["ProtoBuf"] = factory(global["dcodeIO"]["ByteBuffer"]);
      })(void 0, function(ByteBuffer, isCommonJS) {
        var ProtoBuf = {};
        ProtoBuf.ByteBuffer = ByteBuffer;
        ProtoBuf.Long = ByteBuffer.Long || null;
        ProtoBuf.VERSION = "5.0.1";
        ProtoBuf.WIRE_TYPES = {};
        ProtoBuf.WIRE_TYPES.VARINT = 0;
        ProtoBuf.WIRE_TYPES.BITS64 = 1;
        ProtoBuf.WIRE_TYPES.LDELIM = 2;
        ProtoBuf.WIRE_TYPES.STARTGROUP = 3;
        ProtoBuf.WIRE_TYPES.ENDGROUP = 4;
        ProtoBuf.WIRE_TYPES.BITS32 = 5;
        ProtoBuf.PACKABLE_WIRE_TYPES = [ ProtoBuf.WIRE_TYPES.VARINT, ProtoBuf.WIRE_TYPES.BITS64, ProtoBuf.WIRE_TYPES.BITS32 ];
        ProtoBuf.TYPES = {
          int32: {
            name: "int32",
            wireType: ProtoBuf.WIRE_TYPES.VARINT,
            defaultValue: 0
          },
          uint32: {
            name: "uint32",
            wireType: ProtoBuf.WIRE_TYPES.VARINT,
            defaultValue: 0
          },
          sint32: {
            name: "sint32",
            wireType: ProtoBuf.WIRE_TYPES.VARINT,
            defaultValue: 0
          },
          int64: {
            name: "int64",
            wireType: ProtoBuf.WIRE_TYPES.VARINT,
            defaultValue: ProtoBuf.Long ? ProtoBuf.Long.ZERO : void 0
          },
          uint64: {
            name: "uint64",
            wireType: ProtoBuf.WIRE_TYPES.VARINT,
            defaultValue: ProtoBuf.Long ? ProtoBuf.Long.UZERO : void 0
          },
          sint64: {
            name: "sint64",
            wireType: ProtoBuf.WIRE_TYPES.VARINT,
            defaultValue: ProtoBuf.Long ? ProtoBuf.Long.ZERO : void 0
          },
          bool: {
            name: "bool",
            wireType: ProtoBuf.WIRE_TYPES.VARINT,
            defaultValue: false
          },
          double: {
            name: "double",
            wireType: ProtoBuf.WIRE_TYPES.BITS64,
            defaultValue: 0
          },
          string: {
            name: "string",
            wireType: ProtoBuf.WIRE_TYPES.LDELIM,
            defaultValue: ""
          },
          bytes: {
            name: "bytes",
            wireType: ProtoBuf.WIRE_TYPES.LDELIM,
            defaultValue: null
          },
          fixed32: {
            name: "fixed32",
            wireType: ProtoBuf.WIRE_TYPES.BITS32,
            defaultValue: 0
          },
          sfixed32: {
            name: "sfixed32",
            wireType: ProtoBuf.WIRE_TYPES.BITS32,
            defaultValue: 0
          },
          fixed64: {
            name: "fixed64",
            wireType: ProtoBuf.WIRE_TYPES.BITS64,
            defaultValue: ProtoBuf.Long ? ProtoBuf.Long.UZERO : void 0
          },
          sfixed64: {
            name: "sfixed64",
            wireType: ProtoBuf.WIRE_TYPES.BITS64,
            defaultValue: ProtoBuf.Long ? ProtoBuf.Long.ZERO : void 0
          },
          float: {
            name: "float",
            wireType: ProtoBuf.WIRE_TYPES.BITS32,
            defaultValue: 0
          },
          enum: {
            name: "enum",
            wireType: ProtoBuf.WIRE_TYPES.VARINT,
            defaultValue: 0
          },
          message: {
            name: "message",
            wireType: ProtoBuf.WIRE_TYPES.LDELIM,
            defaultValue: null
          },
          group: {
            name: "group",
            wireType: ProtoBuf.WIRE_TYPES.STARTGROUP,
            defaultValue: null
          }
        };
        ProtoBuf.MAP_KEY_TYPES = [ ProtoBuf.TYPES["int32"], ProtoBuf.TYPES["sint32"], ProtoBuf.TYPES["sfixed32"], ProtoBuf.TYPES["uint32"], ProtoBuf.TYPES["fixed32"], ProtoBuf.TYPES["int64"], ProtoBuf.TYPES["sint64"], ProtoBuf.TYPES["sfixed64"], ProtoBuf.TYPES["uint64"], ProtoBuf.TYPES["fixed64"], ProtoBuf.TYPES["bool"], ProtoBuf.TYPES["string"], ProtoBuf.TYPES["bytes"] ];
        ProtoBuf.ID_MIN = 1;
        ProtoBuf.ID_MAX = 536870911;
        ProtoBuf.convertFieldsToCamelCase = false;
        ProtoBuf.populateAccessors = true;
        ProtoBuf.populateDefaults = true;
        ProtoBuf.Util = function() {
          var Util = {};
          Util.IS_NODE = !!("object" === ("undefined" === typeof process ? "undefined" : _typeof(process)) && process + "" === "[object process]" && !process["browser"]);
          Util.XHR = function() {
            var XMLHttpFactories = [ function() {
              return new XMLHttpRequest();
            }, function() {
              return new ActiveXObject("Msxml2.XMLHTTP");
            }, function() {
              return new ActiveXObject("Msxml3.XMLHTTP");
            }, function() {
              return new ActiveXObject("Microsoft.XMLHTTP");
            } ];
            var xhr = null;
            for (var i = 0; i < XMLHttpFactories.length; i++) {
              try {
                xhr = XMLHttpFactories[i]();
              } catch (e) {
                continue;
              }
              break;
            }
            if (!xhr) throw Error("XMLHttpRequest is not supported");
            return xhr;
          };
          Util.fetch = function(path, callback) {
            callback && "function" != typeof callback && (callback = null);
            if (Util.IS_NODE) {
              var fs = require("fs");
              if (callback) fs.readFile(path, function(err, data) {
                callback(err ? null : "" + data);
              }); else try {
                return fs.readFileSync(path);
              } catch (e) {
                return null;
              }
            } else {
              var xhr = Util.XHR();
              xhr.open("GET", path, !!callback);
              xhr.setRequestHeader("Accept", "text/plain");
              "function" === typeof xhr.overrideMimeType && xhr.overrideMimeType("text/plain");
              if (!callback) {
                xhr.send(null);
                if (200 == xhr.status || 0 == xhr.status && "string" === typeof xhr.responseText) return xhr.responseText;
                return null;
              }
              xhr.onreadystatechange = function() {
                if (4 != xhr.readyState) return;
                200 == xhr.status || 0 == xhr.status && "string" === typeof xhr.responseText ? callback(xhr.responseText) : callback(null);
              };
              if (4 == xhr.readyState) return;
              xhr.send(null);
            }
          };
          Util.toCamelCase = function(str) {
            return str.replace(/_([a-zA-Z])/g, function($0, $1) {
              return $1.toUpperCase();
            });
          };
          return Util;
        }();
        ProtoBuf.Lang = {
          DELIM: /[\s\{\}=;:\[\],'"\(\)<>]/g,
          RULE: /^(?:required|optional|repeated|map)$/,
          TYPE: /^(?:double|float|int32|uint32|sint32|int64|uint64|sint64|fixed32|sfixed32|fixed64|sfixed64|bool|string|bytes)$/,
          NAME: /^[a-zA-Z_][a-zA-Z_0-9]*$/,
          TYPEDEF: /^[a-zA-Z][a-zA-Z_0-9]*$/,
          TYPEREF: /^(?:\.?[a-zA-Z_][a-zA-Z_0-9]*)+$/,
          FQTYPEREF: /^(?:\.[a-zA-Z][a-zA-Z_0-9]*)+$/,
          NUMBER: /^-?(?:[1-9][0-9]*|0|0[xX][0-9a-fA-F]+|0[0-7]+|([0-9]*(\.[0-9]*)?([Ee][+-]?[0-9]+)?)|inf|nan)$/,
          NUMBER_DEC: /^(?:[1-9][0-9]*|0)$/,
          NUMBER_HEX: /^0[xX][0-9a-fA-F]+$/,
          NUMBER_OCT: /^0[0-7]+$/,
          NUMBER_FLT: /^([0-9]*(\.[0-9]*)?([Ee][+-]?[0-9]+)?|inf|nan)$/,
          BOOL: /^(?:true|false)$/i,
          ID: /^(?:[1-9][0-9]*|0|0[xX][0-9a-fA-F]+|0[0-7]+)$/,
          NEGID: /^\-?(?:[1-9][0-9]*|0|0[xX][0-9a-fA-F]+|0[0-7]+)$/,
          WHITESPACE: /\s/,
          STRING: /(?:"([^"\\]*(?:\\.[^"\\]*)*)")|(?:'([^'\\]*(?:\\.[^'\\]*)*)')/g,
          STRING_DQ: /(?:"([^"\\]*(?:\\.[^"\\]*)*)")/g,
          STRING_SQ: /(?:'([^'\\]*(?:\\.[^'\\]*)*)')/g
        };
        ProtoBuf.DotProto = function(ProtoBuf, Lang) {
          var DotProto = {};
          var Tokenizer = function Tokenizer(proto) {
            this.source = proto + "";
            this.index = 0;
            this.line = 1;
            this.stack = [];
            this._stringOpen = null;
          };
          var TokenizerPrototype = Tokenizer.prototype;
          TokenizerPrototype._readString = function() {
            var re = '"' === this._stringOpen ? Lang.STRING_DQ : Lang.STRING_SQ;
            re.lastIndex = this.index - 1;
            var match = re.exec(this.source);
            if (!match) throw Error("unterminated string");
            this.index = re.lastIndex;
            this.stack.push(this._stringOpen);
            this._stringOpen = null;
            return match[1];
          };
          TokenizerPrototype.next = function() {
            if (this.stack.length > 0) return this.stack.shift();
            if (this.index >= this.source.length) return null;
            if (null !== this._stringOpen) return this._readString();
            var repeat, prev, next;
            do {
              repeat = false;
              while (Lang.WHITESPACE.test(next = this.source.charAt(this.index))) {
                "\n" === next && ++this.line;
                if (++this.index === this.source.length) return null;
              }
              if ("/" === this.source.charAt(this.index)) {
                ++this.index;
                if ("/" === this.source.charAt(this.index)) {
                  while ("\n" !== this.source.charAt(++this.index)) if (this.index == this.source.length) return null;
                  ++this.index;
                  ++this.line;
                  repeat = true;
                } else {
                  if ("*" !== (next = this.source.charAt(this.index))) return "/";
                  do {
                    "\n" === next && ++this.line;
                    if (++this.index === this.source.length) return null;
                    prev = next;
                    next = this.source.charAt(this.index);
                  } while ("*" !== prev || "/" !== next);
                  ++this.index;
                  repeat = true;
                }
              }
            } while (repeat);
            if (this.index === this.source.length) return null;
            var end = this.index;
            Lang.DELIM.lastIndex = 0;
            var delim = Lang.DELIM.test(this.source.charAt(end++));
            if (!delim) while (end < this.source.length && !Lang.DELIM.test(this.source.charAt(end))) ++end;
            var token = this.source.substring(this.index, this.index = end);
            '"' !== token && "'" !== token || (this._stringOpen = token);
            return token;
          };
          TokenizerPrototype.peek = function() {
            if (0 === this.stack.length) {
              var token = this.next();
              if (null === token) return null;
              this.stack.push(token);
            }
            return this.stack[0];
          };
          TokenizerPrototype.skip = function(expected) {
            var actual = this.next();
            if (actual !== expected) throw Error("illegal '" + actual + "', '" + expected + "' expected");
          };
          TokenizerPrototype.omit = function(expected) {
            if (this.peek() === expected) {
              this.next();
              return true;
            }
            return false;
          };
          TokenizerPrototype.toString = function() {
            return "Tokenizer (" + this.index + "/" + this.source.length + " at line " + this.line + ")";
          };
          DotProto.Tokenizer = Tokenizer;
          var Parser = function Parser(source) {
            this.tn = new Tokenizer(source);
            this.proto3 = false;
          };
          var ParserPrototype = Parser.prototype;
          ParserPrototype.parse = function() {
            var topLevel = {
              name: "[ROOT]",
              package: null,
              messages: [],
              enums: [],
              imports: [],
              options: {},
              services: []
            };
            var token, head = true, weak;
            try {
              while (token = this.tn.next()) switch (token) {
               case "package":
                if (!head || null !== topLevel["package"]) throw Error("unexpected 'package'");
                token = this.tn.next();
                if (!Lang.TYPEREF.test(token)) throw Error("illegal package name: " + token);
                this.tn.skip(";");
                topLevel["package"] = token;
                break;

               case "import":
                if (!head) throw Error("unexpected 'import'");
                token = this.tn.peek();
                ("public" === token || (weak = "weak" === token)) && this.tn.next();
                token = this._readString();
                this.tn.skip(";");
                weak || topLevel["imports"].push(token);
                break;

               case "syntax":
                if (!head) throw Error("unexpected 'syntax'");
                this.tn.skip("=");
                "proto3" === (topLevel["syntax"] = this._readString()) && (this.proto3 = true);
                this.tn.skip(";");
                break;

               case "message":
                this._parseMessage(topLevel, null);
                head = false;
                break;

               case "enum":
                this._parseEnum(topLevel);
                head = false;
                break;

               case "option":
                this._parseOption(topLevel);
                break;

               case "service":
                this._parseService(topLevel);
                break;

               case "extend":
                this._parseExtend(topLevel);
                break;

               default:
                throw Error("unexpected '" + token + "'");
              }
            } catch (e) {
              e.message = "Parse error at line " + this.tn.line + ": " + e.message;
              throw e;
            }
            delete topLevel["name"];
            return topLevel;
          };
          Parser.parse = function(source) {
            return new Parser(source).parse();
          };
          function mkId(value, mayBeNegative) {
            var id = -1, sign = 1;
            if ("-" == value.charAt(0)) {
              sign = -1;
              value = value.substring(1);
            }
            if (Lang.NUMBER_DEC.test(value)) id = parseInt(value); else if (Lang.NUMBER_HEX.test(value)) id = parseInt(value.substring(2), 16); else {
              if (!Lang.NUMBER_OCT.test(value)) throw Error("illegal id value: " + (sign < 0 ? "-" : "") + value);
              id = parseInt(value.substring(1), 8);
            }
            id = sign * id | 0;
            if (!mayBeNegative && id < 0) throw Error("illegal id value: " + (sign < 0 ? "-" : "") + value);
            return id;
          }
          function mkNumber(val) {
            var sign = 1;
            if ("-" == val.charAt(0)) {
              sign = -1;
              val = val.substring(1);
            }
            if (Lang.NUMBER_DEC.test(val)) return sign * parseInt(val, 10);
            if (Lang.NUMBER_HEX.test(val)) return sign * parseInt(val.substring(2), 16);
            if (Lang.NUMBER_OCT.test(val)) return sign * parseInt(val.substring(1), 8);
            if ("inf" === val) return Infinity * sign;
            if ("nan" === val) return NaN;
            if (Lang.NUMBER_FLT.test(val)) return sign * parseFloat(val);
            throw Error("illegal number value: " + (sign < 0 ? "-" : "") + val);
          }
          ParserPrototype._readString = function() {
            var value = "", token, delim;
            do {
              delim = this.tn.next();
              if ("'" !== delim && '"' !== delim) throw Error("illegal string delimiter: " + delim);
              value += this.tn.next();
              this.tn.skip(delim);
              token = this.tn.peek();
            } while ('"' === token || '"' === token);
            return value;
          };
          ParserPrototype._readValue = function(mayBeTypeRef) {
            var token = this.tn.peek(), value;
            if ('"' === token || "'" === token) return this._readString();
            this.tn.next();
            if (Lang.NUMBER.test(token)) return mkNumber(token);
            if (Lang.BOOL.test(token)) return "true" === token.toLowerCase();
            if (mayBeTypeRef && Lang.TYPEREF.test(token)) return token;
            throw Error("illegal value: " + token);
          };
          ParserPrototype._parseOption = function(parent, isList) {
            var token = this.tn.next(), custom = false;
            if ("(" === token) {
              custom = true;
              token = this.tn.next();
            }
            if (!Lang.TYPEREF.test(token)) throw Error("illegal option name: " + token);
            var name = token;
            if (custom) {
              this.tn.skip(")");
              name = "(" + name + ")";
              token = this.tn.peek();
              if (Lang.FQTYPEREF.test(token)) {
                name += token;
                this.tn.next();
              }
            }
            this.tn.skip("=");
            this._parseOptionValue(parent, name);
            isList || this.tn.skip(";");
          };
          function setOption(options, name, value) {
            if ("undefined" === typeof options[name]) options[name] = value; else {
              Array.isArray(options[name]) || (options[name] = [ options[name] ]);
              options[name].push(value);
            }
          }
          ParserPrototype._parseOptionValue = function(parent, name) {
            var token = this.tn.peek();
            if ("{" !== token) setOption(parent["options"], name, this._readValue(true)); else {
              this.tn.skip("{");
              while ("}" !== (token = this.tn.next())) {
                if (!Lang.NAME.test(token)) throw Error("illegal option name: " + name + "." + token);
                this.tn.omit(":") ? setOption(parent["options"], name + "." + token, this._readValue(true)) : this._parseOptionValue(parent, name + "." + token);
              }
            }
          };
          ParserPrototype._parseService = function(parent) {
            var token = this.tn.next();
            if (!Lang.NAME.test(token)) throw Error("illegal service name at line " + this.tn.line + ": " + token);
            var name = token;
            var svc = {
              name: name,
              rpc: {},
              options: {}
            };
            this.tn.skip("{");
            while ("}" !== (token = this.tn.next())) if ("option" === token) this._parseOption(svc); else {
              if ("rpc" !== token) throw Error("illegal service token: " + token);
              this._parseServiceRPC(svc);
            }
            this.tn.omit(";");
            parent["services"].push(svc);
          };
          ParserPrototype._parseServiceRPC = function(svc) {
            var type = "rpc", token = this.tn.next();
            if (!Lang.NAME.test(token)) throw Error("illegal rpc service method name: " + token);
            var name = token;
            var method = {
              request: null,
              response: null,
              request_stream: false,
              response_stream: false,
              options: {}
            };
            this.tn.skip("(");
            token = this.tn.next();
            if ("stream" === token.toLowerCase()) {
              method["request_stream"] = true;
              token = this.tn.next();
            }
            if (!Lang.TYPEREF.test(token)) throw Error("illegal rpc service request type: " + token);
            method["request"] = token;
            this.tn.skip(")");
            token = this.tn.next();
            if ("returns" !== token.toLowerCase()) throw Error("illegal rpc service request type delimiter: " + token);
            this.tn.skip("(");
            token = this.tn.next();
            if ("stream" === token.toLowerCase()) {
              method["response_stream"] = true;
              token = this.tn.next();
            }
            method["response"] = token;
            this.tn.skip(")");
            token = this.tn.peek();
            if ("{" === token) {
              this.tn.next();
              while ("}" !== (token = this.tn.next())) {
                if ("option" !== token) throw Error("illegal rpc service token: " + token);
                this._parseOption(method);
              }
              this.tn.omit(";");
            } else this.tn.skip(";");
            "undefined" === typeof svc[type] && (svc[type] = {});
            svc[type][name] = method;
          };
          ParserPrototype._parseMessage = function(parent, fld) {
            var isGroup = !!fld, token = this.tn.next();
            var msg = {
              name: "",
              fields: [],
              enums: [],
              messages: [],
              options: {},
              services: [],
              oneofs: {}
            };
            if (!Lang.NAME.test(token)) throw Error("illegal " + (isGroup ? "group" : "message") + " name: " + token);
            msg["name"] = token;
            if (isGroup) {
              this.tn.skip("=");
              fld["id"] = mkId(this.tn.next());
              msg["isGroup"] = true;
            }
            token = this.tn.peek();
            "[" === token && fld && this._parseFieldOptions(fld);
            this.tn.skip("{");
            while ("}" !== (token = this.tn.next())) if (Lang.RULE.test(token)) this._parseMessageField(msg, token); else if ("oneof" === token) this._parseMessageOneOf(msg); else if ("enum" === token) this._parseEnum(msg); else if ("message" === token) this._parseMessage(msg); else if ("option" === token) this._parseOption(msg); else if ("service" === token) this._parseService(msg); else if ("extensions" === token) msg.hasOwnProperty("extensions") ? msg["extensions"] = msg["extensions"].concat(this._parseExtensionRanges()) : msg["extensions"] = this._parseExtensionRanges(); else if ("reserved" === token) this._parseIgnored(); else if ("extend" === token) this._parseExtend(msg); else {
              if (!Lang.TYPEREF.test(token)) throw Error("illegal message token: " + token);
              if (!this.proto3) throw Error("illegal field rule: " + token);
              this._parseMessageField(msg, "optional", token);
            }
            this.tn.omit(";");
            parent["messages"].push(msg);
            return msg;
          };
          ParserPrototype._parseIgnored = function() {
            while (";" !== this.tn.peek()) this.tn.next();
            this.tn.skip(";");
          };
          ParserPrototype._parseMessageField = function(msg, rule, type) {
            if (!Lang.RULE.test(rule)) throw Error("illegal message field rule: " + rule);
            var fld = {
              rule: rule,
              type: "",
              name: "",
              options: {},
              id: 0
            };
            var token;
            if ("map" === rule) {
              if (type) throw Error("illegal type: " + type);
              this.tn.skip("<");
              token = this.tn.next();
              if (!Lang.TYPE.test(token) && !Lang.TYPEREF.test(token)) throw Error("illegal message field type: " + token);
              fld["keytype"] = token;
              this.tn.skip(",");
              token = this.tn.next();
              if (!Lang.TYPE.test(token) && !Lang.TYPEREF.test(token)) throw Error("illegal message field: " + token);
              fld["type"] = token;
              this.tn.skip(">");
              token = this.tn.next();
              if (!Lang.NAME.test(token)) throw Error("illegal message field name: " + token);
              fld["name"] = token;
              this.tn.skip("=");
              fld["id"] = mkId(this.tn.next());
              token = this.tn.peek();
              "[" === token && this._parseFieldOptions(fld);
              this.tn.skip(";");
            } else {
              type = "undefined" !== typeof type ? type : this.tn.next();
              if ("group" === type) {
                var grp = this._parseMessage(msg, fld);
                if (!/^[A-Z]/.test(grp["name"])) throw Error("illegal group name: " + grp["name"]);
                fld["type"] = grp["name"];
                fld["name"] = grp["name"].toLowerCase();
                this.tn.omit(";");
              } else {
                if (!Lang.TYPE.test(type) && !Lang.TYPEREF.test(type)) throw Error("illegal message field type: " + type);
                fld["type"] = type;
                token = this.tn.next();
                if (!Lang.NAME.test(token)) throw Error("illegal message field name: " + token);
                fld["name"] = token;
                this.tn.skip("=");
                fld["id"] = mkId(this.tn.next());
                token = this.tn.peek();
                "[" === token && this._parseFieldOptions(fld);
                this.tn.skip(";");
              }
            }
            msg["fields"].push(fld);
            return fld;
          };
          ParserPrototype._parseMessageOneOf = function(msg) {
            var token = this.tn.next();
            if (!Lang.NAME.test(token)) throw Error("illegal oneof name: " + token);
            var name = token, fld;
            var fields = [];
            this.tn.skip("{");
            while ("}" !== (token = this.tn.next())) {
              fld = this._parseMessageField(msg, "optional", token);
              fld["oneof"] = name;
              fields.push(fld["id"]);
            }
            this.tn.omit(";");
            msg["oneofs"][name] = fields;
          };
          ParserPrototype._parseFieldOptions = function(fld) {
            this.tn.skip("[");
            var token, first = true;
            while ("]" !== (token = this.tn.peek())) {
              first || this.tn.skip(",");
              this._parseOption(fld, true);
              first = false;
            }
            this.tn.next();
          };
          ParserPrototype._parseEnum = function(msg) {
            var enm = {
              name: "",
              values: [],
              options: {}
            };
            var token = this.tn.next();
            if (!Lang.NAME.test(token)) throw Error("illegal name: " + token);
            enm["name"] = token;
            this.tn.skip("{");
            while ("}" !== (token = this.tn.next())) if ("option" === token) this._parseOption(enm); else {
              if (!Lang.NAME.test(token)) throw Error("illegal name: " + token);
              this.tn.skip("=");
              var val = {
                name: token,
                id: mkId(this.tn.next(), true)
              };
              token = this.tn.peek();
              "[" === token && this._parseFieldOptions({
                options: {}
              });
              this.tn.skip(";");
              enm["values"].push(val);
            }
            this.tn.omit(";");
            msg["enums"].push(enm);
          };
          ParserPrototype._parseExtensionRanges = function() {
            var ranges = [];
            var token, range, value;
            do {
              range = [];
              while (true) {
                token = this.tn.next();
                switch (token) {
                 case "min":
                  value = ProtoBuf.ID_MIN;
                  break;

                 case "max":
                  value = ProtoBuf.ID_MAX;
                  break;

                 default:
                  value = mkNumber(token);
                }
                range.push(value);
                if (2 === range.length) break;
                if ("to" !== this.tn.peek()) {
                  range.push(value);
                  break;
                }
                this.tn.next();
              }
              ranges.push(range);
            } while (this.tn.omit(","));
            this.tn.skip(";");
            return ranges;
          };
          ParserPrototype._parseExtend = function(parent) {
            var token = this.tn.next();
            if (!Lang.TYPEREF.test(token)) throw Error("illegal extend reference: " + token);
            var ext = {
              ref: token,
              fields: []
            };
            this.tn.skip("{");
            while ("}" !== (token = this.tn.next())) if (Lang.RULE.test(token)) this._parseMessageField(ext, token); else {
              if (!Lang.TYPEREF.test(token)) throw Error("illegal extend token: " + token);
              if (!this.proto3) throw Error("illegal field rule: " + token);
              this._parseMessageField(ext, "optional", token);
            }
            this.tn.omit(";");
            parent["messages"].push(ext);
            return ext;
          };
          ParserPrototype.toString = function() {
            return "Parser at line " + this.tn.line;
          };
          DotProto.Parser = Parser;
          return DotProto;
        }(ProtoBuf, ProtoBuf.Lang);
        ProtoBuf.Reflect = function(ProtoBuf) {
          var Reflect = {};
          var T = function T(builder, parent, name) {
            this.builder = builder;
            this.parent = parent;
            this.name = name;
            this.className;
          };
          var TPrototype = T.prototype;
          TPrototype.fqn = function() {
            var name = this.name, ptr = this;
            do {
              ptr = ptr.parent;
              if (null == ptr) break;
              name = ptr.name + "." + name;
            } while (true);
            return name;
          };
          TPrototype.toString = function(includeClass) {
            return (includeClass ? this.className + " " : "") + this.fqn();
          };
          TPrototype.build = function() {
            throw Error(this.toString(true) + " cannot be built directly");
          };
          Reflect.T = T;
          var Namespace = function Namespace(builder, parent, name, options, syntax) {
            T.call(this, builder, parent, name);
            this.className = "Namespace";
            this.children = [];
            this.options = options || {};
            this.syntax = syntax || "proto2";
          };
          var NamespacePrototype = Namespace.prototype = Object.create(T.prototype);
          NamespacePrototype.getChildren = function(type) {
            type = type || null;
            if (null == type) return this.children.slice();
            var children = [];
            for (var i = 0, k = this.children.length; i < k; ++i) this.children[i] instanceof type && children.push(this.children[i]);
            return children;
          };
          NamespacePrototype.addChild = function(child) {
            var other;
            if (other = this.getChild(child.name)) if (other instanceof Message.Field && other.name !== other.originalName && null === this.getChild(other.originalName)) other.name = other.originalName; else {
              if (!(child instanceof Message.Field && child.name !== child.originalName && null === this.getChild(child.originalName))) throw Error("Duplicate name in namespace " + this.toString(true) + ": " + child.name);
              child.name = child.originalName;
            }
            this.children.push(child);
          };
          NamespacePrototype.getChild = function(nameOrId) {
            var key = "number" === typeof nameOrId ? "id" : "name";
            for (var i = 0, k = this.children.length; i < k; ++i) if (this.children[i][key] === nameOrId) return this.children[i];
            return null;
          };
          NamespacePrototype.resolve = function(qn, excludeNonNamespace) {
            var part = "string" === typeof qn ? qn.split(".") : qn, ptr = this, i = 0;
            if ("" === part[i]) {
              while (null !== ptr.parent) ptr = ptr.parent;
              i++;
            }
            var child;
            do {
              do {
                if (!(ptr instanceof Reflect.Namespace)) {
                  ptr = null;
                  break;
                }
                child = ptr.getChild(part[i]);
                if (!child || !(child instanceof Reflect.T) || excludeNonNamespace && !(child instanceof Reflect.Namespace)) {
                  ptr = null;
                  break;
                }
                ptr = child;
                i++;
              } while (i < part.length);
              if (null != ptr) break;
              if (null !== this.parent) return this.parent.resolve(qn, excludeNonNamespace);
            } while (null != ptr);
            return ptr;
          };
          NamespacePrototype.qn = function(t) {
            var part = [], ptr = t;
            do {
              part.unshift(ptr.name);
              ptr = ptr.parent;
            } while (null !== ptr);
            for (var len = 1; len <= part.length; len++) {
              var qn = part.slice(part.length - len);
              if (t === this.resolve(qn, t instanceof Reflect.Namespace)) return qn.join(".");
            }
            return t.fqn();
          };
          NamespacePrototype.build = function() {
            var ns = {};
            var children = this.children;
            for (var i = 0, k = children.length, child; i < k; ++i) {
              child = children[i];
              child instanceof Namespace && (ns[child.name] = child.build());
            }
            Object.defineProperty && Object.defineProperty(ns, "$options", {
              value: this.buildOpt()
            });
            return ns;
          };
          NamespacePrototype.buildOpt = function() {
            var opt = {}, keys = Object.keys(this.options);
            for (var i = 0, k = keys.length; i < k; ++i) {
              var key = keys[i], val = this.options[keys[i]];
              opt[key] = val;
            }
            return opt;
          };
          NamespacePrototype.getOption = function(name) {
            if ("undefined" === typeof name) return this.options;
            return "undefined" !== typeof this.options[name] ? this.options[name] : null;
          };
          Reflect.Namespace = Namespace;
          var Element = function Element(type, resolvedType, isMapKey, syntax, name) {
            this.type = type;
            this.resolvedType = resolvedType;
            this.isMapKey = isMapKey;
            this.syntax = syntax;
            this.name = name;
            if (isMapKey && ProtoBuf.MAP_KEY_TYPES.indexOf(type) < 0) throw Error("Invalid map key type: " + type.name);
          };
          var ElementPrototype = Element.prototype;
          function mkDefault(type) {
            "string" === typeof type && (type = ProtoBuf.TYPES[type]);
            if ("undefined" === typeof type.defaultValue) throw Error("default value for type " + type.name + " is not supported");
            if (type == ProtoBuf.TYPES["bytes"]) return new ByteBuffer(0);
            return type.defaultValue;
          }
          Element.defaultFieldValue = mkDefault;
          function mkLong(value, unsigned) {
            if (value && "number" === typeof value.low && "number" === typeof value.high && "boolean" === typeof value.unsigned && value.low === value.low && value.high === value.high) return new ProtoBuf.Long(value.low, value.high, "undefined" === typeof unsigned ? value.unsigned : unsigned);
            if ("string" === typeof value) return ProtoBuf.Long.fromString(value, unsigned || false, 10);
            if ("number" === typeof value) return ProtoBuf.Long.fromNumber(value, unsigned || false);
            throw Error("not convertible to Long");
          }
          ElementPrototype.toString = function() {
            return (this.name || "") + (this.isMapKey ? "map" : "value") + " element";
          };
          ElementPrototype.verifyValue = function(value) {
            var self = this;
            function fail(val, msg) {
              throw Error("Illegal value for " + self.toString(true) + " of type " + self.type.name + ": " + val + " (" + msg + ")");
            }
            switch (this.type) {
             case ProtoBuf.TYPES["int32"]:
             case ProtoBuf.TYPES["sint32"]:
             case ProtoBuf.TYPES["sfixed32"]:
              ("number" !== typeof value || value === value && value % 1 !== 0) && fail("undefined" === typeof value ? "undefined" : _typeof(value), "not an integer");
              return value > 4294967295 ? 0 | value : value;

             case ProtoBuf.TYPES["uint32"]:
             case ProtoBuf.TYPES["fixed32"]:
              ("number" !== typeof value || value === value && value % 1 !== 0) && fail("undefined" === typeof value ? "undefined" : _typeof(value), "not an integer");
              return value < 0 ? value >>> 0 : value;

             case ProtoBuf.TYPES["int64"]:
             case ProtoBuf.TYPES["sint64"]:
             case ProtoBuf.TYPES["sfixed64"]:
              if (ProtoBuf.Long) try {
                return mkLong(value, false);
              } catch (e) {
                fail("undefined" === typeof value ? "undefined" : _typeof(value), e.message);
              } else fail("undefined" === typeof value ? "undefined" : _typeof(value), "requires Long.js");

             case ProtoBuf.TYPES["uint64"]:
             case ProtoBuf.TYPES["fixed64"]:
              if (ProtoBuf.Long) try {
                return mkLong(value, true);
              } catch (e) {
                fail("undefined" === typeof value ? "undefined" : _typeof(value), e.message);
              } else fail("undefined" === typeof value ? "undefined" : _typeof(value), "requires Long.js");

             case ProtoBuf.TYPES["bool"]:
              "boolean" !== typeof value && fail("undefined" === typeof value ? "undefined" : _typeof(value), "not a boolean");
              return value;

             case ProtoBuf.TYPES["float"]:
             case ProtoBuf.TYPES["double"]:
              "number" !== typeof value && fail("undefined" === typeof value ? "undefined" : _typeof(value), "not a number");
              return value;

             case ProtoBuf.TYPES["string"]:
              "string" === typeof value || value && value instanceof String || fail("undefined" === typeof value ? "undefined" : _typeof(value), "not a string");
              return "" + value;

             case ProtoBuf.TYPES["bytes"]:
              if (ByteBuffer.isByteBuffer(value)) return value;
              return ByteBuffer.wrap(value, "base64");

             case ProtoBuf.TYPES["enum"]:
              var values = this.resolvedType.getChildren(ProtoBuf.Reflect.Enum.Value);
              for (i = 0; i < values.length; i++) {
                if (values[i].name == value) return values[i].id;
                if (values[i].id == value) return values[i].id;
              }
              if ("proto3" === this.syntax) {
                ("number" !== typeof value || value === value && value % 1 !== 0) && fail("undefined" === typeof value ? "undefined" : _typeof(value), "not an integer");
                (value > 4294967295 || value < 0) && fail("undefined" === typeof value ? "undefined" : _typeof(value), "not in range for uint32");
                return value;
              }
              fail(value, "not a valid enum value");

             case ProtoBuf.TYPES["group"]:
             case ProtoBuf.TYPES["message"]:
              value && "object" === ("undefined" === typeof value ? "undefined" : _typeof(value)) || fail("undefined" === typeof value ? "undefined" : _typeof(value), "object expected");
              if (value instanceof this.resolvedType.clazz) return value;
              if (value instanceof ProtoBuf.Builder.Message) {
                var obj = {};
                for (var i in value) value.hasOwnProperty(i) && (obj[i] = value[i]);
                value = obj;
              }
              return new this.resolvedType.clazz(value);
            }
            throw Error("[INTERNAL] Illegal value for " + this.toString(true) + ": " + value + " (undefined type " + this.type + ")");
          };
          ElementPrototype.calculateLength = function(id, value) {
            if (null === value) return 0;
            var n;
            switch (this.type) {
             case ProtoBuf.TYPES["int32"]:
              return value < 0 ? ByteBuffer.calculateVarint64(value) : ByteBuffer.calculateVarint32(value);

             case ProtoBuf.TYPES["uint32"]:
              return ByteBuffer.calculateVarint32(value);

             case ProtoBuf.TYPES["sint32"]:
              return ByteBuffer.calculateVarint32(ByteBuffer.zigZagEncode32(value));

             case ProtoBuf.TYPES["fixed32"]:
             case ProtoBuf.TYPES["sfixed32"]:
             case ProtoBuf.TYPES["float"]:
              return 4;

             case ProtoBuf.TYPES["int64"]:
             case ProtoBuf.TYPES["uint64"]:
              return ByteBuffer.calculateVarint64(value);

             case ProtoBuf.TYPES["sint64"]:
              return ByteBuffer.calculateVarint64(ByteBuffer.zigZagEncode64(value));

             case ProtoBuf.TYPES["fixed64"]:
             case ProtoBuf.TYPES["sfixed64"]:
              return 8;

             case ProtoBuf.TYPES["bool"]:
              return 1;

             case ProtoBuf.TYPES["enum"]:
              return ByteBuffer.calculateVarint32(value);

             case ProtoBuf.TYPES["double"]:
              return 8;

             case ProtoBuf.TYPES["string"]:
              n = ByteBuffer.calculateUTF8Bytes(value);
              return ByteBuffer.calculateVarint32(n) + n;

             case ProtoBuf.TYPES["bytes"]:
              if (value.remaining() < 0) throw Error("Illegal value for " + this.toString(true) + ": " + value.remaining() + " bytes remaining");
              return ByteBuffer.calculateVarint32(value.remaining()) + value.remaining();

             case ProtoBuf.TYPES["message"]:
              n = this.resolvedType.calculate(value);
              return ByteBuffer.calculateVarint32(n) + n;

             case ProtoBuf.TYPES["group"]:
              n = this.resolvedType.calculate(value);
              return n + ByteBuffer.calculateVarint32(id << 3 | ProtoBuf.WIRE_TYPES.ENDGROUP);
            }
            throw Error("[INTERNAL] Illegal value to encode in " + this.toString(true) + ": " + value + " (unknown type)");
          };
          ElementPrototype.encodeValue = function(id, value, buffer) {
            if (null === value) return buffer;
            switch (this.type) {
             case ProtoBuf.TYPES["int32"]:
              value < 0 ? buffer.writeVarint64(value) : buffer.writeVarint32(value);
              break;

             case ProtoBuf.TYPES["uint32"]:
              buffer.writeVarint32(value);
              break;

             case ProtoBuf.TYPES["sint32"]:
              buffer.writeVarint32ZigZag(value);
              break;

             case ProtoBuf.TYPES["fixed32"]:
              buffer.writeUint32(value);
              break;

             case ProtoBuf.TYPES["sfixed32"]:
              buffer.writeInt32(value);
              break;

             case ProtoBuf.TYPES["int64"]:
             case ProtoBuf.TYPES["uint64"]:
              buffer.writeVarint64(value);
              break;

             case ProtoBuf.TYPES["sint64"]:
              buffer.writeVarint64ZigZag(value);
              break;

             case ProtoBuf.TYPES["fixed64"]:
              buffer.writeUint64(value);
              break;

             case ProtoBuf.TYPES["sfixed64"]:
              buffer.writeInt64(value);
              break;

             case ProtoBuf.TYPES["bool"]:
              "string" === typeof value ? buffer.writeVarint32("false" === value.toLowerCase() ? 0 : !!value) : buffer.writeVarint32(value ? 1 : 0);
              break;

             case ProtoBuf.TYPES["enum"]:
              buffer.writeVarint32(value);
              break;

             case ProtoBuf.TYPES["float"]:
              buffer.writeFloat32(value);
              break;

             case ProtoBuf.TYPES["double"]:
              buffer.writeFloat64(value);
              break;

             case ProtoBuf.TYPES["string"]:
              buffer.writeVString(value);
              break;

             case ProtoBuf.TYPES["bytes"]:
              if (value.remaining() < 0) throw Error("Illegal value for " + this.toString(true) + ": " + value.remaining() + " bytes remaining");
              var prevOffset = value.offset;
              buffer.writeVarint32(value.remaining());
              buffer.append(value);
              value.offset = prevOffset;
              break;

             case ProtoBuf.TYPES["message"]:
              var bb = new ByteBuffer().LE();
              this.resolvedType.encode(value, bb);
              buffer.writeVarint32(bb.offset);
              buffer.append(bb.flip());
              break;

             case ProtoBuf.TYPES["group"]:
              this.resolvedType.encode(value, buffer);
              buffer.writeVarint32(id << 3 | ProtoBuf.WIRE_TYPES.ENDGROUP);
              break;

             default:
              throw Error("[INTERNAL] Illegal value to encode in " + this.toString(true) + ": " + value + " (unknown type)");
            }
            return buffer;
          };
          ElementPrototype.decode = function(buffer, wireType, id) {
            if (wireType != this.type.wireType) throw Error("Unexpected wire type for element");
            var value, nBytes;
            switch (this.type) {
             case ProtoBuf.TYPES["int32"]:
              return 0 | buffer.readVarint32();

             case ProtoBuf.TYPES["uint32"]:
              return buffer.readVarint32() >>> 0;

             case ProtoBuf.TYPES["sint32"]:
              return 0 | buffer.readVarint32ZigZag();

             case ProtoBuf.TYPES["fixed32"]:
              return buffer.readUint32() >>> 0;

             case ProtoBuf.TYPES["sfixed32"]:
              return 0 | buffer.readInt32();

             case ProtoBuf.TYPES["int64"]:
              return buffer.readVarint64();

             case ProtoBuf.TYPES["uint64"]:
              return buffer.readVarint64().toUnsigned();

             case ProtoBuf.TYPES["sint64"]:
              return buffer.readVarint64ZigZag();

             case ProtoBuf.TYPES["fixed64"]:
              return buffer.readUint64();

             case ProtoBuf.TYPES["sfixed64"]:
              return buffer.readInt64();

             case ProtoBuf.TYPES["bool"]:
              return !!buffer.readVarint32();

             case ProtoBuf.TYPES["enum"]:
              return buffer.readVarint32();

             case ProtoBuf.TYPES["float"]:
              return buffer.readFloat();

             case ProtoBuf.TYPES["double"]:
              return buffer.readDouble();

             case ProtoBuf.TYPES["string"]:
              return buffer.readVString();

             case ProtoBuf.TYPES["bytes"]:
              nBytes = buffer.readVarint32();
              if (buffer.remaining() < nBytes) throw Error("Illegal number of bytes for " + this.toString(true) + ": " + nBytes + " required but got only " + buffer.remaining());
              value = buffer.clone();
              value.limit = value.offset + nBytes;
              buffer.offset += nBytes;
              return value;

             case ProtoBuf.TYPES["message"]:
              nBytes = buffer.readVarint32();
              return this.resolvedType.decode(buffer, nBytes);

             case ProtoBuf.TYPES["group"]:
              return this.resolvedType.decode(buffer, -1, id);
            }
            throw Error("[INTERNAL] Illegal decode type");
          };
          ElementPrototype.valueFromString = function(str) {
            if (!this.isMapKey) throw Error("valueFromString() called on non-map-key element");
            switch (this.type) {
             case ProtoBuf.TYPES["int32"]:
             case ProtoBuf.TYPES["sint32"]:
             case ProtoBuf.TYPES["sfixed32"]:
             case ProtoBuf.TYPES["uint32"]:
             case ProtoBuf.TYPES["fixed32"]:
              return this.verifyValue(parseInt(str));

             case ProtoBuf.TYPES["int64"]:
             case ProtoBuf.TYPES["sint64"]:
             case ProtoBuf.TYPES["sfixed64"]:
             case ProtoBuf.TYPES["uint64"]:
             case ProtoBuf.TYPES["fixed64"]:
              return this.verifyValue(str);

             case ProtoBuf.TYPES["bool"]:
              return "true" === str;

             case ProtoBuf.TYPES["string"]:
              return this.verifyValue(str);

             case ProtoBuf.TYPES["bytes"]:
              return ByteBuffer.fromBinary(str);
            }
          };
          ElementPrototype.valueToString = function(value) {
            if (!this.isMapKey) throw Error("valueToString() called on non-map-key element");
            return this.type === ProtoBuf.TYPES["bytes"] ? value.toString("binary") : value.toString();
          };
          Reflect.Element = Element;
          var Message = function Message(builder, parent, name, options, isGroup, syntax) {
            Namespace.call(this, builder, parent, name, options, syntax);
            this.className = "Message";
            this.extensions = void 0;
            this.clazz = null;
            this.isGroup = !!isGroup;
            this._fields = null;
            this._fieldsById = null;
            this._fieldsByName = null;
          };
          var MessagePrototype = Message.prototype = Object.create(Namespace.prototype);
          MessagePrototype.build = function(rebuild) {
            if (this.clazz && !rebuild) return this.clazz;
            var clazz = function(ProtoBuf, T) {
              var fields = T.getChildren(ProtoBuf.Reflect.Message.Field), oneofs = T.getChildren(ProtoBuf.Reflect.Message.OneOf);
              var Message = function Message(values, var_args) {
                ProtoBuf.Builder.Message.call(this);
                for (var i = 0, k = oneofs.length; i < k; ++i) this[oneofs[i].name] = null;
                for (i = 0, k = fields.length; i < k; ++i) {
                  var field = fields[i];
                  this[field.name] = field.repeated ? [] : field.map ? new ProtoBuf.Map(field) : null;
                  !field.required && "proto3" !== T.syntax || null === field.defaultValue || (this[field.name] = field.defaultValue);
                }
                if (arguments.length > 0) {
                  var value;
                  if (1 !== arguments.length || null === values || "object" !== ("undefined" === typeof values ? "undefined" : _typeof(values)) || !("function" !== typeof values.encode || values instanceof Message) || Array.isArray(values) || values instanceof ProtoBuf.Map || ByteBuffer.isByteBuffer(values) || values instanceof ArrayBuffer || ProtoBuf.Long && values instanceof ProtoBuf.Long) for (i = 0, 
                  k = arguments.length; i < k; ++i) "undefined" !== typeof (value = arguments[i]) && this.$set(fields[i].name, value); else this.$set(values);
                }
              };
              var MessagePrototype = Message.prototype = Object.create(ProtoBuf.Builder.Message.prototype);
              MessagePrototype.add = function(key, value, noAssert) {
                var field = T._fieldsByName[key];
                if (!noAssert) {
                  if (!field) throw Error(this + "#" + key + " is undefined");
                  if (!(field instanceof ProtoBuf.Reflect.Message.Field)) throw Error(this + "#" + key + " is not a field: " + field.toString(true));
                  if (!field.repeated) throw Error(this + "#" + key + " is not a repeated field");
                  value = field.verifyValue(value, true);
                }
                null === this[key] && (this[key] = []);
                this[key].push(value);
                return this;
              };
              MessagePrototype.$add = MessagePrototype.add;
              MessagePrototype.set = function(keyOrObj, value, noAssert) {
                if (keyOrObj && "object" === ("undefined" === typeof keyOrObj ? "undefined" : _typeof(keyOrObj))) {
                  noAssert = value;
                  for (var ikey in keyOrObj) keyOrObj.hasOwnProperty(ikey) && "undefined" !== typeof (value = keyOrObj[ikey]) && this.$set(ikey, value, noAssert);
                  return this;
                }
                var field = T._fieldsByName[keyOrObj];
                if (noAssert) this[keyOrObj] = value; else {
                  if (!field) throw Error(this + "#" + keyOrObj + " is not a field: undefined");
                  if (!(field instanceof ProtoBuf.Reflect.Message.Field)) throw Error(this + "#" + keyOrObj + " is not a field: " + field.toString(true));
                  this[field.name] = value = field.verifyValue(value);
                }
                if (field && field.oneof) {
                  var currentField = this[field.oneof.name];
                  if (null !== value) {
                    null !== currentField && currentField !== field.name && (this[currentField] = null);
                    this[field.oneof.name] = field.name;
                  } else currentField === keyOrObj && (this[field.oneof.name] = null);
                }
                return this;
              };
              MessagePrototype.$set = MessagePrototype.set;
              MessagePrototype.get = function(key, noAssert) {
                if (noAssert) return this[key];
                var field = T._fieldsByName[key];
                if (!field || !(field instanceof ProtoBuf.Reflect.Message.Field)) throw Error(this + "#" + key + " is not a field: undefined");
                if (!(field instanceof ProtoBuf.Reflect.Message.Field)) throw Error(this + "#" + key + " is not a field: " + field.toString(true));
                return this[field.name];
              };
              MessagePrototype.$get = MessagePrototype.get;
              for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                if (field instanceof ProtoBuf.Reflect.Message.ExtensionField) continue;
                T.builder.options["populateAccessors"] && function(field) {
                  var Name = field.originalName.replace(/(_[a-zA-Z])/g, function(match) {
                    return match.toUpperCase().replace("_", "");
                  });
                  Name = Name.substring(0, 1).toUpperCase() + Name.substring(1);
                  var name = field.originalName.replace(/([A-Z])/g, function(match) {
                    return "_" + match;
                  });
                  var setter = function setter(value, noAssert) {
                    this[field.name] = noAssert ? value : field.verifyValue(value);
                    return this;
                  };
                  var getter = function getter() {
                    return this[field.name];
                  };
                  null === T.getChild("set" + Name) && (MessagePrototype["set" + Name] = setter);
                  null === T.getChild("set_" + name) && (MessagePrototype["set_" + name] = setter);
                  null === T.getChild("get" + Name) && (MessagePrototype["get" + Name] = getter);
                  null === T.getChild("get_" + name) && (MessagePrototype["get_" + name] = getter);
                }(field);
              }
              MessagePrototype.encode = function(buffer, noVerify) {
                "boolean" === typeof buffer && (noVerify = buffer, buffer = void 0);
                var isNew = false;
                buffer || (buffer = new ByteBuffer(), isNew = true);
                var le = buffer.littleEndian;
                try {
                  T.encode(this, buffer.LE(), noVerify);
                  return (isNew ? buffer.flip() : buffer).LE(le);
                } catch (e) {
                  buffer.LE(le);
                  throw e;
                }
              };
              Message.encode = function(data, buffer, noVerify) {
                return new Message(data).encode(buffer, noVerify);
              };
              MessagePrototype.calculate = function() {
                return T.calculate(this);
              };
              MessagePrototype.encodeDelimited = function(buffer, noVerify) {
                var isNew = false;
                buffer || (buffer = new ByteBuffer(), isNew = true);
                var enc = new ByteBuffer().LE();
                T.encode(this, enc, noVerify).flip();
                buffer.writeVarint32(enc.remaining());
                buffer.append(enc);
                return isNew ? buffer.flip() : buffer;
              };
              MessagePrototype.encodeAB = function() {
                try {
                  return this.encode().toArrayBuffer();
                } catch (e) {
                  e["encoded"] && (e["encoded"] = e["encoded"].toArrayBuffer());
                  throw e;
                }
              };
              MessagePrototype.toArrayBuffer = MessagePrototype.encodeAB;
              MessagePrototype.encodeNB = function() {
                try {
                  return this.encode().toBuffer();
                } catch (e) {
                  e["encoded"] && (e["encoded"] = e["encoded"].toBuffer());
                  throw e;
                }
              };
              MessagePrototype.toBuffer = MessagePrototype.encodeNB;
              MessagePrototype.encode64 = function() {
                try {
                  return this.encode().toBase64();
                } catch (e) {
                  e["encoded"] && (e["encoded"] = e["encoded"].toBase64());
                  throw e;
                }
              };
              MessagePrototype.toBase64 = MessagePrototype.encode64;
              MessagePrototype.encodeHex = function() {
                try {
                  return this.encode().toHex();
                } catch (e) {
                  e["encoded"] && (e["encoded"] = e["encoded"].toHex());
                  throw e;
                }
              };
              MessagePrototype.toHex = MessagePrototype.encodeHex;
              function cloneRaw(obj, binaryAsBase64, longsAsStrings, resolvedType) {
                if (null === obj || "object" !== ("undefined" === typeof obj ? "undefined" : _typeof(obj))) {
                  if (resolvedType && resolvedType instanceof ProtoBuf.Reflect.Enum) {
                    var name = ProtoBuf.Reflect.Enum.getName(resolvedType.object, obj);
                    if (null !== name) return name;
                  }
                  return obj;
                }
                if (ByteBuffer.isByteBuffer(obj)) return binaryAsBase64 ? obj.toBase64() : obj.toBuffer();
                if (ProtoBuf.Long.isLong(obj)) return longsAsStrings ? obj.toString() : ProtoBuf.Long.fromValue(obj);
                var clone;
                if (Array.isArray(obj)) {
                  clone = [];
                  obj.forEach(function(v, k) {
                    clone[k] = cloneRaw(v, binaryAsBase64, longsAsStrings, resolvedType);
                  });
                  return clone;
                }
                clone = {};
                if (obj instanceof ProtoBuf.Map) {
                  var it = obj.entries();
                  for (var e = it.next(); !e.done; e = it.next()) clone[obj.keyElem.valueToString(e.value[0])] = cloneRaw(e.value[1], binaryAsBase64, longsAsStrings, obj.valueElem.resolvedType);
                  return clone;
                }
                var type = obj.$type, field = void 0;
                for (var i in obj) obj.hasOwnProperty(i) && (type && (field = type.getChild(i)) ? clone[i] = cloneRaw(obj[i], binaryAsBase64, longsAsStrings, field.resolvedType) : clone[i] = cloneRaw(obj[i], binaryAsBase64, longsAsStrings));
                return clone;
              }
              MessagePrototype.toRaw = function(binaryAsBase64, longsAsStrings) {
                return cloneRaw(this, !!binaryAsBase64, !!longsAsStrings, this.$type);
              };
              MessagePrototype.encodeJSON = function() {
                return JSON.stringify(cloneRaw(this, true, true, this.$type));
              };
              Message.decode = function(buffer, length, enc) {
                "string" === typeof length && (enc = length, length = -1);
                "string" === typeof buffer ? buffer = ByteBuffer.wrap(buffer, enc || "base64") : ByteBuffer.isByteBuffer(buffer) || (buffer = ByteBuffer.wrap(buffer));
                var le = buffer.littleEndian;
                try {
                  var msg = T.decode(buffer.LE(), length);
                  buffer.LE(le);
                  return msg;
                } catch (e) {
                  buffer.LE(le);
                  throw e;
                }
              };
              Message.decodeDelimited = function(buffer, enc) {
                "string" === typeof buffer ? buffer = ByteBuffer.wrap(buffer, enc || "base64") : ByteBuffer.isByteBuffer(buffer) || (buffer = ByteBuffer.wrap(buffer));
                if (buffer.remaining() < 1) return null;
                var off = buffer.offset, len = buffer.readVarint32();
                if (buffer.remaining() < len) {
                  buffer.offset = off;
                  return null;
                }
                try {
                  var msg = T.decode(buffer.slice(buffer.offset, buffer.offset + len).LE());
                  buffer.offset += len;
                  return msg;
                } catch (err) {
                  buffer.offset += len;
                  throw err;
                }
              };
              Message.decode64 = function(str) {
                return Message.decode(str, "base64");
              };
              Message.decodeHex = function(str) {
                return Message.decode(str, "hex");
              };
              Message.decodeJSON = function(str) {
                return new Message(JSON.parse(str));
              };
              MessagePrototype.toString = function() {
                return T.toString();
              };
              var $optionsS;
              var $options;
              var $typeS;
              var $type;
              Object.defineProperty && (Object.defineProperty(Message, "$options", {
                value: T.buildOpt()
              }), Object.defineProperty(MessagePrototype, "$options", {
                value: Message["$options"]
              }), Object.defineProperty(Message, "$type", {
                value: T
              }), Object.defineProperty(MessagePrototype, "$type", {
                value: T
              }));
              return Message;
            }(ProtoBuf, this);
            this._fields = [];
            this._fieldsById = {};
            this._fieldsByName = {};
            for (var i = 0, k = this.children.length, child; i < k; i++) {
              child = this.children[i];
              if (child instanceof Enum || child instanceof Message || child instanceof Service) {
                if (clazz.hasOwnProperty(child.name)) throw Error("Illegal reflect child of " + this.toString(true) + ": " + child.toString(true) + " cannot override static property '" + child.name + "'");
                clazz[child.name] = child.build();
              } else if (child instanceof Message.Field) child.build(), this._fields.push(child), 
              this._fieldsById[child.id] = child, this._fieldsByName[child.name] = child; else if (!(child instanceof Message.OneOf) && !(child instanceof Extension)) throw Error("Illegal reflect child of " + this.toString(true) + ": " + this.children[i].toString(true));
            }
            return this.clazz = clazz;
          };
          MessagePrototype.encode = function(message, buffer, noVerify) {
            var fieldMissing = null, field;
            for (var i = 0, k = this._fields.length, val; i < k; ++i) {
              field = this._fields[i];
              val = message[field.name];
              field.required && null === val ? null === fieldMissing && (fieldMissing = field) : field.encode(noVerify ? val : field.verifyValue(val), buffer, message);
            }
            if (null !== fieldMissing) {
              var err = Error("Missing at least one required field for " + this.toString(true) + ": " + fieldMissing);
              err["encoded"] = buffer;
              throw err;
            }
            return buffer;
          };
          MessagePrototype.calculate = function(message) {
            for (var n = 0, i = 0, k = this._fields.length, field, val; i < k; ++i) {
              field = this._fields[i];
              val = message[field.name];
              if (field.required && null === val) throw Error("Missing at least one required field for " + this.toString(true) + ": " + field);
              n += field.calculate(val, message);
            }
            return n;
          };
          function skipTillGroupEnd(expectedId, buf) {
            var tag = buf.readVarint32(), wireType = 7 & tag, id = tag >>> 3;
            switch (wireType) {
             case ProtoBuf.WIRE_TYPES.VARINT:
              do {
                tag = buf.readUint8();
              } while (128 === (128 & tag));
              break;

             case ProtoBuf.WIRE_TYPES.BITS64:
              buf.offset += 8;
              break;

             case ProtoBuf.WIRE_TYPES.LDELIM:
              tag = buf.readVarint32();
              buf.offset += tag;
              break;

             case ProtoBuf.WIRE_TYPES.STARTGROUP:
              skipTillGroupEnd(id, buf);
              break;

             case ProtoBuf.WIRE_TYPES.ENDGROUP:
              if (id === expectedId) return false;
              throw Error("Illegal GROUPEND after unknown group: " + id + " (" + expectedId + " expected)");

             case ProtoBuf.WIRE_TYPES.BITS32:
              buf.offset += 4;
              break;

             default:
              throw Error("Illegal wire type in unknown group " + expectedId + ": " + wireType);
            }
            return true;
          }
          MessagePrototype.decode = function(buffer, length, expectedGroupEndId) {
            "number" !== typeof length && (length = -1);
            var start = buffer.offset, msg = new this.clazz(), tag, wireType, id, field;
            while (buffer.offset < start + length || -1 === length && buffer.remaining() > 0) {
              tag = buffer.readVarint32();
              wireType = 7 & tag;
              id = tag >>> 3;
              if (wireType === ProtoBuf.WIRE_TYPES.ENDGROUP) {
                if (id !== expectedGroupEndId) throw Error("Illegal group end indicator for " + this.toString(true) + ": " + id + " (" + (expectedGroupEndId ? expectedGroupEndId + " expected" : "not a group") + ")");
                break;
              }
              if (!(field = this._fieldsById[id])) {
                switch (wireType) {
                 case ProtoBuf.WIRE_TYPES.VARINT:
                  buffer.readVarint32();
                  break;

                 case ProtoBuf.WIRE_TYPES.BITS32:
                  buffer.offset += 4;
                  break;

                 case ProtoBuf.WIRE_TYPES.BITS64:
                  buffer.offset += 8;
                  break;

                 case ProtoBuf.WIRE_TYPES.LDELIM:
                  var len = buffer.readVarint32();
                  buffer.offset += len;
                  break;

                 case ProtoBuf.WIRE_TYPES.STARTGROUP:
                  while (skipTillGroupEnd(id, buffer)) ;
                  break;

                 default:
                  throw Error("Illegal wire type for unknown field " + id + " in " + this.toString(true) + "#decode: " + wireType);
                }
                continue;
              }
              if (field.repeated && !field.options["packed"]) msg[field.name].push(field.decode(wireType, buffer)); else if (field.map) {
                var keyval = field.decode(wireType, buffer);
                msg[field.name].set(keyval[0], keyval[1]);
              } else {
                msg[field.name] = field.decode(wireType, buffer);
                if (field.oneof) {
                  var currentField = msg[field.oneof.name];
                  null !== currentField && currentField !== field.name && (msg[currentField] = null);
                  msg[field.oneof.name] = field.name;
                }
              }
            }
            for (var i = 0, k = this._fields.length; i < k; ++i) {
              field = this._fields[i];
              if (null === msg[field.name]) if ("proto3" === this.syntax) msg[field.name] = field.defaultValue; else {
                if (field.required) {
                  var err = Error("Missing at least one required field for " + this.toString(true) + ": " + field.name);
                  err["decoded"] = msg;
                  throw err;
                }
                ProtoBuf.populateDefaults && null !== field.defaultValue && (msg[field.name] = field.defaultValue);
              }
            }
            return msg;
          };
          Reflect.Message = Message;
          var Field = function Field(builder, message, rule, keytype, type, name, id, options, oneof, syntax) {
            T.call(this, builder, message, name);
            this.className = "Message.Field";
            this.required = "required" === rule;
            this.repeated = "repeated" === rule;
            this.map = "map" === rule;
            this.keyType = keytype || null;
            this.type = type;
            this.resolvedType = null;
            this.id = id;
            this.options = options || {};
            this.defaultValue = null;
            this.oneof = oneof || null;
            this.syntax = syntax || "proto2";
            this.originalName = this.name;
            this.element = null;
            this.keyElement = null;
            !this.builder.options["convertFieldsToCamelCase"] || this instanceof Message.ExtensionField || (this.name = ProtoBuf.Util.toCamelCase(this.name));
          };
          var FieldPrototype = Field.prototype = Object.create(T.prototype);
          FieldPrototype.build = function() {
            this.element = new Element(this.type, this.resolvedType, false, this.syntax, this.name);
            this.map && (this.keyElement = new Element(this.keyType, void 0, true, this.syntax, this.name));
            "proto3" !== this.syntax || this.repeated || this.map ? "undefined" !== typeof this.options["default"] && (this.defaultValue = this.verifyValue(this.options["default"])) : this.defaultValue = Element.defaultFieldValue(this.type);
          };
          FieldPrototype.verifyValue = function(value, skipRepeated) {
            skipRepeated = skipRepeated || false;
            var self = this;
            function fail(val, msg) {
              throw Error("Illegal value for " + self.toString(true) + " of type " + self.type.name + ": " + val + " (" + msg + ")");
            }
            if (null === value) {
              this.required && fail("undefined" === typeof value ? "undefined" : _typeof(value), "required");
              "proto3" === this.syntax && this.type !== ProtoBuf.TYPES["message"] && fail("undefined" === typeof value ? "undefined" : _typeof(value), "proto3 field without field presence cannot be null");
              return null;
            }
            var i;
            if (this.repeated && !skipRepeated) {
              Array.isArray(value) || (value = [ value ]);
              var res = [];
              for (i = 0; i < value.length; i++) res.push(this.element.verifyValue(value[i]));
              return res;
            }
            if (this.map && !skipRepeated) {
              if (value instanceof ProtoBuf.Map) return value;
              value instanceof Object || fail("undefined" === typeof value ? "undefined" : _typeof(value), "expected ProtoBuf.Map or raw object for map field");
              return new ProtoBuf.Map(this, value);
            }
            !this.repeated && Array.isArray(value) && fail("undefined" === typeof value ? "undefined" : _typeof(value), "no array expected");
            return this.element.verifyValue(value);
          };
          FieldPrototype.hasWirePresence = function(value, message) {
            if ("proto3" !== this.syntax) return null !== value;
            if (this.oneof && message[this.oneof.name] === this.name) return true;
            switch (this.type) {
             case ProtoBuf.TYPES["int32"]:
             case ProtoBuf.TYPES["sint32"]:
             case ProtoBuf.TYPES["sfixed32"]:
             case ProtoBuf.TYPES["uint32"]:
             case ProtoBuf.TYPES["fixed32"]:
              return 0 !== value;

             case ProtoBuf.TYPES["int64"]:
             case ProtoBuf.TYPES["sint64"]:
             case ProtoBuf.TYPES["sfixed64"]:
             case ProtoBuf.TYPES["uint64"]:
             case ProtoBuf.TYPES["fixed64"]:
              return 0 !== value.low || 0 !== value.high;

             case ProtoBuf.TYPES["bool"]:
              return value;

             case ProtoBuf.TYPES["float"]:
             case ProtoBuf.TYPES["double"]:
              return 0 !== value;

             case ProtoBuf.TYPES["string"]:
              return value.length > 0;

             case ProtoBuf.TYPES["bytes"]:
              return value.remaining() > 0;

             case ProtoBuf.TYPES["enum"]:
              return 0 !== value;

             case ProtoBuf.TYPES["message"]:
              return null !== value;

             default:
              return true;
            }
          };
          FieldPrototype.encode = function(value, buffer, message) {
            if (null === this.type || "object" !== _typeof(this.type)) throw Error("[INTERNAL] Unresolved type in " + this.toString(true) + ": " + this.type);
            if (null === value || this.repeated && 0 == value.length) return buffer;
            try {
              if (this.repeated) {
                var i;
                if (this.options["packed"] && ProtoBuf.PACKABLE_WIRE_TYPES.indexOf(this.type.wireType) >= 0) {
                  buffer.writeVarint32(this.id << 3 | ProtoBuf.WIRE_TYPES.LDELIM);
                  buffer.ensureCapacity(buffer.offset += 1);
                  var start = buffer.offset;
                  for (i = 0; i < value.length; i++) this.element.encodeValue(this.id, value[i], buffer);
                  var len = buffer.offset - start, varintLen = ByteBuffer.calculateVarint32(len);
                  if (varintLen > 1) {
                    var contents = buffer.slice(start, buffer.offset);
                    start += varintLen - 1;
                    buffer.offset = start;
                    buffer.append(contents);
                  }
                  buffer.writeVarint32(len, start - varintLen);
                } else for (i = 0; i < value.length; i++) buffer.writeVarint32(this.id << 3 | this.type.wireType), 
                this.element.encodeValue(this.id, value[i], buffer);
              } else if (this.map) value.forEach(function(val, key, m) {
                var length = ByteBuffer.calculateVarint32(8 | this.keyType.wireType) + this.keyElement.calculateLength(1, key) + ByteBuffer.calculateVarint32(16 | this.type.wireType) + this.element.calculateLength(2, val);
                buffer.writeVarint32(this.id << 3 | ProtoBuf.WIRE_TYPES.LDELIM);
                buffer.writeVarint32(length);
                buffer.writeVarint32(8 | this.keyType.wireType);
                this.keyElement.encodeValue(1, key, buffer);
                buffer.writeVarint32(16 | this.type.wireType);
                this.element.encodeValue(2, val, buffer);
              }, this); else if (this.hasWirePresence(value, message)) {
                buffer.writeVarint32(this.id << 3 | this.type.wireType);
                this.element.encodeValue(this.id, value, buffer);
              }
            } catch (e) {
              throw Error("Illegal value for " + this.toString(true) + ": " + value + " (" + e + ")");
            }
            return buffer;
          };
          FieldPrototype.calculate = function(value, message) {
            value = this.verifyValue(value);
            if (null === this.type || "object" !== _typeof(this.type)) throw Error("[INTERNAL] Unresolved type in " + this.toString(true) + ": " + this.type);
            if (null === value || this.repeated && 0 == value.length) return 0;
            var n = 0;
            try {
              if (this.repeated) {
                var i, ni;
                if (this.options["packed"] && ProtoBuf.PACKABLE_WIRE_TYPES.indexOf(this.type.wireType) >= 0) {
                  n += ByteBuffer.calculateVarint32(this.id << 3 | ProtoBuf.WIRE_TYPES.LDELIM);
                  ni = 0;
                  for (i = 0; i < value.length; i++) ni += this.element.calculateLength(this.id, value[i]);
                  n += ByteBuffer.calculateVarint32(ni);
                  n += ni;
                } else for (i = 0; i < value.length; i++) n += ByteBuffer.calculateVarint32(this.id << 3 | this.type.wireType), 
                n += this.element.calculateLength(this.id, value[i]);
              } else if (this.map) value.forEach(function(val, key, m) {
                var length = ByteBuffer.calculateVarint32(8 | this.keyType.wireType) + this.keyElement.calculateLength(1, key) + ByteBuffer.calculateVarint32(16 | this.type.wireType) + this.element.calculateLength(2, val);
                n += ByteBuffer.calculateVarint32(this.id << 3 | ProtoBuf.WIRE_TYPES.LDELIM);
                n += ByteBuffer.calculateVarint32(length);
                n += length;
              }, this); else if (this.hasWirePresence(value, message)) {
                n += ByteBuffer.calculateVarint32(this.id << 3 | this.type.wireType);
                n += this.element.calculateLength(this.id, value);
              }
            } catch (e) {
              throw Error("Illegal value for " + this.toString(true) + ": " + value + " (" + e + ")");
            }
            return n;
          };
          FieldPrototype.decode = function(wireType, buffer, skipRepeated) {
            var value, nBytes;
            var wireTypeOK = !this.map && wireType == this.type.wireType || !skipRepeated && this.repeated && this.options["packed"] && wireType == ProtoBuf.WIRE_TYPES.LDELIM || this.map && wireType == ProtoBuf.WIRE_TYPES.LDELIM;
            if (!wireTypeOK) throw Error("Illegal wire type for field " + this.toString(true) + ": " + wireType + " (" + this.type.wireType + " expected)");
            if (wireType == ProtoBuf.WIRE_TYPES.LDELIM && this.repeated && this.options["packed"] && ProtoBuf.PACKABLE_WIRE_TYPES.indexOf(this.type.wireType) >= 0 && !skipRepeated) {
              nBytes = buffer.readVarint32();
              nBytes = buffer.offset + nBytes;
              var values = [];
              while (buffer.offset < nBytes) values.push(this.decode(this.type.wireType, buffer, true));
              return values;
            }
            if (this.map) {
              var key = Element.defaultFieldValue(this.keyType);
              value = Element.defaultFieldValue(this.type);
              nBytes = buffer.readVarint32();
              if (buffer.remaining() < nBytes) throw Error("Illegal number of bytes for " + this.toString(true) + ": " + nBytes + " required but got only " + buffer.remaining());
              var msgbuf = buffer.clone();
              msgbuf.limit = msgbuf.offset + nBytes;
              buffer.offset += nBytes;
              while (msgbuf.remaining() > 0) {
                var tag = msgbuf.readVarint32();
                wireType = 7 & tag;
                var id = tag >>> 3;
                if (1 === id) key = this.keyElement.decode(msgbuf, wireType, id); else {
                  if (2 !== id) throw Error("Unexpected tag in map field key/value submessage");
                  value = this.element.decode(msgbuf, wireType, id);
                }
              }
              return [ key, value ];
            }
            return this.element.decode(buffer, wireType, this.id);
          };
          Reflect.Message.Field = Field;
          var ExtensionField = function ExtensionField(builder, message, rule, type, name, id, options) {
            Field.call(this, builder, message, rule, null, type, name, id, options);
            this.extension;
          };
          ExtensionField.prototype = Object.create(Field.prototype);
          Reflect.Message.ExtensionField = ExtensionField;
          var OneOf = function OneOf(builder, message, name) {
            T.call(this, builder, message, name);
            this.fields = [];
          };
          Reflect.Message.OneOf = OneOf;
          var Enum = function Enum(builder, parent, name, options, syntax) {
            Namespace.call(this, builder, parent, name, options, syntax);
            this.className = "Enum";
            this.object = null;
          };
          Enum.getName = function(enm, value) {
            var keys = Object.keys(enm);
            for (var i = 0, key; i < keys.length; ++i) if (enm[key = keys[i]] === value) return key;
            return null;
          };
          var EnumPrototype = Enum.prototype = Object.create(Namespace.prototype);
          EnumPrototype.build = function(rebuild) {
            if (this.object && !rebuild) return this.object;
            var enm = new ProtoBuf.Builder.Enum(), values = this.getChildren(Enum.Value);
            for (var i = 0, k = values.length; i < k; ++i) enm[values[i]["name"]] = values[i]["id"];
            Object.defineProperty && Object.defineProperty(enm, "$options", {
              value: this.buildOpt(),
              enumerable: false
            });
            return this.object = enm;
          };
          Reflect.Enum = Enum;
          var Value = function Value(builder, enm, name, id) {
            T.call(this, builder, enm, name);
            this.className = "Enum.Value";
            this.id = id;
          };
          Value.prototype = Object.create(T.prototype);
          Reflect.Enum.Value = Value;
          var Extension = function Extension(builder, parent, name, field) {
            T.call(this, builder, parent, name);
            this.field = field;
          };
          Extension.prototype = Object.create(T.prototype);
          Reflect.Extension = Extension;
          var Service = function Service(builder, root, name, options) {
            Namespace.call(this, builder, root, name, options);
            this.className = "Service";
            this.clazz = null;
          };
          var ServicePrototype = Service.prototype = Object.create(Namespace.prototype);
          ServicePrototype.build = function(rebuild) {
            if (this.clazz && !rebuild) return this.clazz;
            return this.clazz = function(ProtoBuf, T) {
              var Service = function Service(rpcImpl) {
                ProtoBuf.Builder.Service.call(this);
                this.rpcImpl = rpcImpl || function(name, msg, callback) {
                  setTimeout(callback.bind(this, Error("Not implemented, see: https://github.com/dcodeIO/ProtoBuf.js/wiki/Services")), 0);
                };
              };
              var ServicePrototype = Service.prototype = Object.create(ProtoBuf.Builder.Service.prototype);
              var rpc = T.getChildren(ProtoBuf.Reflect.Service.RPCMethod);
              for (var i = 0; i < rpc.length; i++) (function(method) {
                ServicePrototype[method.name] = function(req, callback) {
                  try {
                    try {
                      req = method.resolvedRequestType.clazz.decode(ByteBuffer.wrap(req));
                    } catch (err) {
                      if (!(err instanceof TypeError)) throw err;
                    }
                    if (null === req || "object" !== ("undefined" === typeof req ? "undefined" : _typeof(req))) throw Error("Illegal arguments");
                    req instanceof method.resolvedRequestType.clazz || (req = new method.resolvedRequestType.clazz(req));
                    this.rpcImpl(method.fqn(), req, function(err, res) {
                      if (err) {
                        callback(err);
                        return;
                      }
                      null === res && (res = "");
                      try {
                        res = method.resolvedResponseType.clazz.decode(res);
                      } catch (notABuffer) {}
                      if (!res || !(res instanceof method.resolvedResponseType.clazz)) {
                        callback(Error("Illegal response type received in service method " + T.name + "#" + method.name));
                        return;
                      }
                      callback(null, res);
                    });
                  } catch (err) {
                    setTimeout(callback.bind(this, err), 0);
                  }
                };
                Service[method.name] = function(rpcImpl, req, callback) {
                  new Service(rpcImpl)[method.name](req, callback);
                };
                Object.defineProperty && (Object.defineProperty(Service[method.name], "$options", {
                  value: method.buildOpt()
                }), Object.defineProperty(ServicePrototype[method.name], "$options", {
                  value: Service[method.name]["$options"]
                }));
              })(rpc[i]);
              var $optionsS;
              var $options;
              var $typeS;
              var $type;
              Object.defineProperty && (Object.defineProperty(Service, "$options", {
                value: T.buildOpt()
              }), Object.defineProperty(ServicePrototype, "$options", {
                value: Service["$options"]
              }), Object.defineProperty(Service, "$type", {
                value: T
              }), Object.defineProperty(ServicePrototype, "$type", {
                value: T
              }));
              return Service;
            }(ProtoBuf, this);
          };
          Reflect.Service = Service;
          var Method = function Method(builder, svc, name, options) {
            T.call(this, builder, svc, name);
            this.className = "Service.Method";
            this.options = options || {};
          };
          var MethodPrototype = Method.prototype = Object.create(T.prototype);
          MethodPrototype.buildOpt = NamespacePrototype.buildOpt;
          Reflect.Service.Method = Method;
          var RPCMethod = function RPCMethod(builder, svc, name, request, response, request_stream, response_stream, options) {
            Method.call(this, builder, svc, name, options);
            this.className = "Service.RPCMethod";
            this.requestName = request;
            this.responseName = response;
            this.requestStream = request_stream;
            this.responseStream = response_stream;
            this.resolvedRequestType = null;
            this.resolvedResponseType = null;
          };
          RPCMethod.prototype = Object.create(Method.prototype);
          Reflect.Service.RPCMethod = RPCMethod;
          return Reflect;
        }(ProtoBuf);
        ProtoBuf.Builder = function(ProtoBuf, Lang, Reflect) {
          var Builder = function Builder(options) {
            this.ns = new Reflect.Namespace(this, null, "");
            this.ptr = this.ns;
            this.resolved = false;
            this.result = null;
            this.files = {};
            this.importRoot = null;
            this.options = options || {};
          };
          var BuilderPrototype = Builder.prototype;
          Builder.isMessage = function(def) {
            if ("string" !== typeof def["name"]) return false;
            if ("undefined" !== typeof def["values"] || "undefined" !== typeof def["rpc"]) return false;
            return true;
          };
          Builder.isMessageField = function(def) {
            if ("string" !== typeof def["rule"] || "string" !== typeof def["name"] || "string" !== typeof def["type"] || "undefined" === typeof def["id"]) return false;
            return true;
          };
          Builder.isEnum = function(def) {
            if ("string" !== typeof def["name"]) return false;
            if ("undefined" === typeof def["values"] || !Array.isArray(def["values"]) || 0 === def["values"].length) return false;
            return true;
          };
          Builder.isService = function(def) {
            if ("string" !== typeof def["name"] || "object" !== _typeof(def["rpc"]) || !def["rpc"]) return false;
            return true;
          };
          Builder.isExtend = function(def) {
            if ("string" !== typeof def["ref"]) return false;
            return true;
          };
          BuilderPrototype.reset = function() {
            this.ptr = this.ns;
            return this;
          };
          BuilderPrototype.define = function(namespace) {
            if ("string" !== typeof namespace || !Lang.TYPEREF.test(namespace)) throw Error("illegal namespace: " + namespace);
            namespace.split(".").forEach(function(part) {
              var ns = this.ptr.getChild(part);
              null === ns && this.ptr.addChild(ns = new Reflect.Namespace(this, this.ptr, part));
              this.ptr = ns;
            }, this);
            return this;
          };
          BuilderPrototype.create = function(defs) {
            if (!defs) return this;
            if (Array.isArray(defs)) {
              if (0 === defs.length) return this;
              defs = defs.slice();
            } else defs = [ defs ];
            var stack = [ defs ];
            while (stack.length > 0) {
              defs = stack.pop();
              if (!Array.isArray(defs)) throw Error("not a valid namespace: " + JSON.stringify(defs));
              while (defs.length > 0) {
                var def = defs.shift();
                if (Builder.isMessage(def)) {
                  var obj = new Reflect.Message(this, this.ptr, def["name"], def["options"], def["isGroup"], def["syntax"]);
                  var oneofs = {};
                  def["oneofs"] && Object.keys(def["oneofs"]).forEach(function(name) {
                    obj.addChild(oneofs[name] = new Reflect.Message.OneOf(this, obj, name));
                  }, this);
                  def["fields"] && def["fields"].forEach(function(fld) {
                    if (null !== obj.getChild(0 | fld["id"])) throw Error("duplicate or invalid field id in " + obj.name + ": " + fld["id"]);
                    if (fld["options"] && "object" !== _typeof(fld["options"])) throw Error("illegal field options in " + obj.name + "#" + fld["name"]);
                    var oneof = null;
                    if ("string" === typeof fld["oneof"] && !(oneof = oneofs[fld["oneof"]])) throw Error("illegal oneof in " + obj.name + "#" + fld["name"] + ": " + fld["oneof"]);
                    fld = new Reflect.Message.Field(this, obj, fld["rule"], fld["keytype"], fld["type"], fld["name"], fld["id"], fld["options"], oneof, def["syntax"]);
                    oneof && oneof.fields.push(fld);
                    obj.addChild(fld);
                  }, this);
                  var subObj = [];
                  def["enums"] && def["enums"].forEach(function(enm) {
                    subObj.push(enm);
                  });
                  def["messages"] && def["messages"].forEach(function(msg) {
                    subObj.push(msg);
                  });
                  def["services"] && def["services"].forEach(function(svc) {
                    subObj.push(svc);
                  });
                  def["extensions"] && ("number" === typeof def["extensions"][0] ? obj.extensions = [ def["extensions"] ] : obj.extensions = def["extensions"]);
                  this.ptr.addChild(obj);
                  if (subObj.length > 0) {
                    stack.push(defs);
                    defs = subObj;
                    subObj = null;
                    this.ptr = obj;
                    obj = null;
                    continue;
                  }
                  subObj = null;
                } else if (Builder.isEnum(def)) {
                  obj = new Reflect.Enum(this, this.ptr, def["name"], def["options"], def["syntax"]);
                  def["values"].forEach(function(val) {
                    obj.addChild(new Reflect.Enum.Value(this, obj, val["name"], val["id"]));
                  }, this);
                  this.ptr.addChild(obj);
                } else if (Builder.isService(def)) {
                  obj = new Reflect.Service(this, this.ptr, def["name"], def["options"]);
                  Object.keys(def["rpc"]).forEach(function(name) {
                    var mtd = def["rpc"][name];
                    obj.addChild(new Reflect.Service.RPCMethod(this, obj, name, mtd["request"], mtd["response"], !!mtd["request_stream"], !!mtd["response_stream"], mtd["options"]));
                  }, this);
                  this.ptr.addChild(obj);
                } else {
                  if (!Builder.isExtend(def)) throw Error("not a valid definition: " + JSON.stringify(def));
                  obj = this.ptr.resolve(def["ref"], true);
                  if (obj) def["fields"].forEach(function(fld) {
                    if (null !== obj.getChild(0 | fld["id"])) throw Error("duplicate extended field id in " + obj.name + ": " + fld["id"]);
                    if (obj.extensions) {
                      var valid = false;
                      obj.extensions.forEach(function(range) {
                        fld["id"] >= range[0] && fld["id"] <= range[1] && (valid = true);
                      });
                      if (!valid) throw Error("illegal extended field id in " + obj.name + ": " + fld["id"] + " (not within valid ranges)");
                    }
                    var name = fld["name"];
                    this.options["convertFieldsToCamelCase"] && (name = ProtoBuf.Util.toCamelCase(name));
                    var field = new Reflect.Message.ExtensionField(this, obj, fld["rule"], fld["type"], this.ptr.fqn() + "." + name, fld["id"], fld["options"]);
                    var ext = new Reflect.Extension(this, this.ptr, fld["name"], field);
                    field.extension = ext;
                    this.ptr.addChild(ext);
                    obj.addChild(field);
                  }, this); else if (!/\.?google\.protobuf\./.test(def["ref"])) throw Error("extended message " + def["ref"] + " is not defined");
                }
                def = null;
                obj = null;
              }
              defs = null;
              this.ptr = this.ptr.parent;
            }
            this.resolved = false;
            this.result = null;
            return this;
          };
          function propagateSyntax(parent) {
            parent["messages"] && parent["messages"].forEach(function(child) {
              child["syntax"] = parent["syntax"];
              propagateSyntax(child);
            });
            parent["enums"] && parent["enums"].forEach(function(child) {
              child["syntax"] = parent["syntax"];
            });
          }
          BuilderPrototype["import"] = function(json, filename) {
            var delim = "/";
            if ("string" === typeof filename) {
              ProtoBuf.Util.IS_NODE && (filename = require("path")["resolve"](filename));
              if (true === this.files[filename]) return this.reset();
              this.files[filename] = true;
            } else if ("object" === ("undefined" === typeof filename ? "undefined" : _typeof(filename))) {
              var root = filename.root;
              ProtoBuf.Util.IS_NODE && (root = require("path")["resolve"](root));
              (root.indexOf("\\") >= 0 || filename.file.indexOf("\\") >= 0) && (delim = "\\");
              var fname = root + delim + filename.file;
              if (true === this.files[fname]) return this.reset();
              this.files[fname] = true;
            }
            if (json["imports"] && json["imports"].length > 0) {
              var importRoot, resetRoot = false;
              if ("object" === ("undefined" === typeof filename ? "undefined" : _typeof(filename))) {
                this.importRoot = filename["root"];
                resetRoot = true;
                importRoot = this.importRoot;
                filename = filename["file"];
                (importRoot.indexOf("\\") >= 0 || filename.indexOf("\\") >= 0) && (delim = "\\");
              } else if ("string" === typeof filename) if (this.importRoot) importRoot = this.importRoot; else if (filename.indexOf("/") >= 0) {
                importRoot = filename.replace(/\/[^\/]*$/, "");
                "" === importRoot && (importRoot = "/");
              } else if (filename.indexOf("\\") >= 0) {
                importRoot = filename.replace(/\\[^\\]*$/, "");
                delim = "\\";
              } else importRoot = "."; else importRoot = null;
              for (var i = 0; i < json["imports"].length; i++) if ("string" === typeof json["imports"][i]) {
                if (!importRoot) throw Error("cannot determine import root");
                var importFilename = json["imports"][i];
                if ("google/protobuf/descriptor.proto" === importFilename) continue;
                importFilename = importRoot + delim + importFilename;
                if (true === this.files[importFilename]) continue;
                /\.proto$/i.test(importFilename) && !ProtoBuf.DotProto && (importFilename = importFilename.replace(/\.proto$/, ".json"));
                var contents = ProtoBuf.Util.fetch(importFilename);
                if (null === contents) throw Error("failed to import '" + importFilename + "' in '" + filename + "': file not found");
                /\.json$/i.test(importFilename) ? this["import"](JSON.parse(contents + ""), importFilename) : this["import"](ProtoBuf.DotProto.Parser.parse(contents), importFilename);
              } else filename ? /\.(\w+)$/.test(filename) ? this["import"](json["imports"][i], filename.replace(/^(.+)\.(\w+)$/, function($0, $1, $2) {
                return $1 + "_import" + i + "." + $2;
              })) : this["import"](json["imports"][i], filename + "_import" + i) : this["import"](json["imports"][i]);
              resetRoot && (this.importRoot = null);
            }
            json["package"] && this.define(json["package"]);
            json["syntax"] && propagateSyntax(json);
            var base = this.ptr;
            json["options"] && Object.keys(json["options"]).forEach(function(key) {
              base.options[key] = json["options"][key];
            });
            json["messages"] && (this.create(json["messages"]), this.ptr = base);
            json["enums"] && (this.create(json["enums"]), this.ptr = base);
            json["services"] && (this.create(json["services"]), this.ptr = base);
            json["extends"] && this.create(json["extends"]);
            return this.reset();
          };
          BuilderPrototype.resolveAll = function() {
            var res;
            if (null == this.ptr || "object" === _typeof(this.ptr.type)) return this;
            if (this.ptr instanceof Reflect.Namespace) this.ptr.children.forEach(function(child) {
              this.ptr = child;
              this.resolveAll();
            }, this); else if (this.ptr instanceof Reflect.Message.Field) {
              if (Lang.TYPE.test(this.ptr.type)) this.ptr.type = ProtoBuf.TYPES[this.ptr.type]; else {
                if (!Lang.TYPEREF.test(this.ptr.type)) throw Error("illegal type reference in " + this.ptr.toString(true) + ": " + this.ptr.type);
                res = (this.ptr instanceof Reflect.Message.ExtensionField ? this.ptr.extension.parent : this.ptr.parent).resolve(this.ptr.type, true);
                if (!res) throw Error("unresolvable type reference in " + this.ptr.toString(true) + ": " + this.ptr.type);
                this.ptr.resolvedType = res;
                if (res instanceof Reflect.Enum) {
                  this.ptr.type = ProtoBuf.TYPES["enum"];
                  if ("proto3" === this.ptr.syntax && "proto3" !== res.syntax) throw Error("proto3 message cannot reference proto2 enum");
                } else {
                  if (!(res instanceof Reflect.Message)) throw Error("illegal type reference in " + this.ptr.toString(true) + ": " + this.ptr.type);
                  this.ptr.type = res.isGroup ? ProtoBuf.TYPES["group"] : ProtoBuf.TYPES["message"];
                }
              }
              if (this.ptr.map) {
                if (!Lang.TYPE.test(this.ptr.keyType)) throw Error("illegal key type for map field in " + this.ptr.toString(true) + ": " + this.ptr.keyType);
                this.ptr.keyType = ProtoBuf.TYPES[this.ptr.keyType];
              }
            } else if (this.ptr instanceof ProtoBuf.Reflect.Service.Method) {
              if (!(this.ptr instanceof ProtoBuf.Reflect.Service.RPCMethod)) throw Error("illegal service type in " + this.ptr.toString(true));
              res = this.ptr.parent.resolve(this.ptr.requestName, true);
              if (!res || !(res instanceof ProtoBuf.Reflect.Message)) throw Error("Illegal type reference in " + this.ptr.toString(true) + ": " + this.ptr.requestName);
              this.ptr.resolvedRequestType = res;
              res = this.ptr.parent.resolve(this.ptr.responseName, true);
              if (!res || !(res instanceof ProtoBuf.Reflect.Message)) throw Error("Illegal type reference in " + this.ptr.toString(true) + ": " + this.ptr.responseName);
              this.ptr.resolvedResponseType = res;
            } else if (!(this.ptr instanceof ProtoBuf.Reflect.Message.OneOf) && !(this.ptr instanceof ProtoBuf.Reflect.Extension) && !(this.ptr instanceof ProtoBuf.Reflect.Enum.Value)) throw Error("illegal object in namespace: " + _typeof(this.ptr) + ": " + this.ptr);
            return this.reset();
          };
          BuilderPrototype.build = function(path) {
            this.reset();
            this.resolved || (this.resolveAll(), this.resolved = true, this.result = null);
            null === this.result && (this.result = this.ns.build());
            if (!path) return this.result;
            var part = "string" === typeof path ? path.split(".") : path, ptr = this.result;
            for (var i = 0; i < part.length; i++) {
              if (!ptr[part[i]]) {
                ptr = null;
                break;
              }
              ptr = ptr[part[i]];
            }
            return ptr;
          };
          BuilderPrototype.lookup = function(path, excludeNonNamespace) {
            return path ? this.ns.resolve(path, excludeNonNamespace) : this.ns;
          };
          BuilderPrototype.toString = function() {
            return "Builder";
          };
          Builder.Message = function() {};
          Builder.Enum = function() {};
          Builder.Service = function() {};
          return Builder;
        }(ProtoBuf, ProtoBuf.Lang, ProtoBuf.Reflect);
        ProtoBuf.Map = function(ProtoBuf, Reflect) {
          var Map = function Map(field, contents) {
            if (!field.map) throw Error("field is not a map");
            this.field = field;
            this.keyElem = new Reflect.Element(field.keyType, null, true, field.syntax);
            this.valueElem = new Reflect.Element(field.type, field.resolvedType, false, field.syntax);
            this.map = {};
            Object.defineProperty(this, "size", {
              get: function get() {
                return Object.keys(this.map).length;
              }
            });
            if (contents) {
              var keys = Object.keys(contents);
              for (var i = 0; i < keys.length; i++) {
                var key = this.keyElem.valueFromString(keys[i]);
                var val = this.valueElem.verifyValue(contents[keys[i]]);
                this.map[this.keyElem.valueToString(key)] = {
                  key: key,
                  value: val
                };
              }
            }
          };
          var MapPrototype = Map.prototype;
          function arrayIterator(arr) {
            var idx = 0;
            return {
              next: function next() {
                if (idx < arr.length) return {
                  done: false,
                  value: arr[idx++]
                };
                return {
                  done: true
                };
              }
            };
          }
          MapPrototype.clear = function() {
            this.map = {};
          };
          MapPrototype["delete"] = function(key) {
            var keyValue = this.keyElem.valueToString(this.keyElem.verifyValue(key));
            var hadKey = keyValue in this.map;
            delete this.map[keyValue];
            return hadKey;
          };
          MapPrototype.entries = function() {
            var entries = [];
            var strKeys = Object.keys(this.map);
            for (var i = 0, entry; i < strKeys.length; i++) entries.push([ (entry = this.map[strKeys[i]]).key, entry.value ]);
            return arrayIterator(entries);
          };
          MapPrototype.keys = function() {
            var keys = [];
            var strKeys = Object.keys(this.map);
            for (var i = 0; i < strKeys.length; i++) keys.push(this.map[strKeys[i]].key);
            return arrayIterator(keys);
          };
          MapPrototype.values = function() {
            var values = [];
            var strKeys = Object.keys(this.map);
            for (var i = 0; i < strKeys.length; i++) values.push(this.map[strKeys[i]].value);
            return arrayIterator(values);
          };
          MapPrototype.forEach = function(cb, thisArg) {
            var strKeys = Object.keys(this.map);
            for (var i = 0, entry; i < strKeys.length; i++) cb.call(thisArg, (entry = this.map[strKeys[i]]).value, entry.key, this);
          };
          MapPrototype.set = function(key, value) {
            var keyValue = this.keyElem.verifyValue(key);
            var valValue = this.valueElem.verifyValue(value);
            this.map[this.keyElem.valueToString(keyValue)] = {
              key: keyValue,
              value: valValue
            };
            return this;
          };
          MapPrototype.get = function(key) {
            var keyValue = this.keyElem.valueToString(this.keyElem.verifyValue(key));
            if (!(keyValue in this.map)) return;
            return this.map[keyValue].value;
          };
          MapPrototype.has = function(key) {
            var keyValue = this.keyElem.valueToString(this.keyElem.verifyValue(key));
            return keyValue in this.map;
          };
          return Map;
        }(ProtoBuf, ProtoBuf.Reflect);
        ProtoBuf.loadProto = function(proto, builder, filename) {
          ("string" === typeof builder || builder && "string" === typeof builder["file"] && "string" === typeof builder["root"]) && (filename = builder, 
          builder = void 0);
          return ProtoBuf.loadJson(ProtoBuf.DotProto.Parser.parse(proto), builder, filename);
        };
        ProtoBuf.protoFromString = ProtoBuf.loadProto;
        ProtoBuf.loadProtoFile = function(filename, callback, builder) {
          callback && "object" === ("undefined" === typeof callback ? "undefined" : _typeof(callback)) ? (builder = callback, 
          callback = null) : callback && "function" === typeof callback || (callback = null);
          if (callback) return ProtoBuf.Util.fetch("string" === typeof filename ? filename : filename["root"] + "/" + filename["file"], function(contents) {
            if (null === contents) {
              callback(Error("Failed to fetch file"));
              return;
            }
            try {
              callback(null, ProtoBuf.loadProto(contents, builder, filename));
            } catch (e) {
              callback(e);
            }
          });
          var contents = ProtoBuf.Util.fetch("object" === ("undefined" === typeof filename ? "undefined" : _typeof(filename)) ? filename["root"] + "/" + filename["file"] : filename);
          return null === contents ? null : ProtoBuf.loadProto(contents, builder, filename);
        };
        ProtoBuf.protoFromFile = ProtoBuf.loadProtoFile;
        ProtoBuf.newBuilder = function(options) {
          options = options || {};
          "undefined" === typeof options["convertFieldsToCamelCase"] && (options["convertFieldsToCamelCase"] = ProtoBuf.convertFieldsToCamelCase);
          "undefined" === typeof options["populateAccessors"] && (options["populateAccessors"] = ProtoBuf.populateAccessors);
          return new ProtoBuf.Builder(options);
        };
        ProtoBuf.loadJson = function(json, builder, filename) {
          ("string" === typeof builder || builder && "string" === typeof builder["file"] && "string" === typeof builder["root"]) && (filename = builder, 
          builder = null);
          builder && "object" === ("undefined" === typeof builder ? "undefined" : _typeof(builder)) || (builder = ProtoBuf.newBuilder());
          "string" === typeof json && (json = JSON.parse(json));
          builder["import"](json, filename);
          builder.resolveAll();
          return builder;
        };
        ProtoBuf.loadJsonFile = function(filename, callback, builder) {
          callback && "object" === ("undefined" === typeof callback ? "undefined" : _typeof(callback)) ? (builder = callback, 
          callback = null) : callback && "function" === typeof callback || (callback = null);
          if (callback) return ProtoBuf.Util.fetch("string" === typeof filename ? filename : filename["root"] + "/" + filename["file"], function(contents) {
            if (null === contents) {
              callback(Error("Failed to fetch file"));
              return;
            }
            try {
              callback(null, ProtoBuf.loadJson(JSON.parse(contents), builder, filename));
            } catch (e) {
              callback(e);
            }
          });
          var contents = ProtoBuf.Util.fetch("object" === ("undefined" === typeof filename ? "undefined" : _typeof(filename)) ? filename["root"] + "/" + filename["file"] : filename);
          return null === contents ? null : ProtoBuf.loadJson(JSON.parse(contents), builder, filename);
        };
        return ProtoBuf;
      });
      cc._RF.pop();
    }).call(this, require("_process"));
  }, {
    _process: 119,
    bytebuffer: "bytebuffer",
    fs: void 0,
    path: 112
  } ],
  resMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "c558bgfri1COr9yKX+mUFjp", "resMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "resMgr"
      },
      ctor: function ctor() {
        var _this = this;
        console.log("-new:" + this.TAG);
        var url = cc.url.raw("resources/RESJSON.json");
        cc.loader.loadRes("RESJSON", function(err, data) {
          if (err) {
            cc.error(err.message || err);
            return;
          }
          _this.resData = data;
          console.log(">>>> RESJSON :" + JSON.stringify(_this.resData));
        });
      },
      onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
      },
      onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
      },
      loadResByKey: function loadResByKey(key, callfunc) {
        console.log(">>>> RESJSON :" + JSON.stringify(this.resData));
        console.log(">>>> RESJSON :" + JSON.stringify(this.resData["json"][key]));
        if (null != key && null != this.resData["json"][key]) {
          var total = 0;
          var keyres = this.resData["json"][key];
          for (var _value in keyres) keyres.hasOwnProperty(_value) && total++;
          console.log("total res = ", total);
          var num = 0;
          var _loop = function _loop(_index) {
            if (keyres.hasOwnProperty(_index)) {
              var element = keyres[_index];
              var _type = element._type;
              var _resValue = element._value;
              var callback = function callback(err, obj) {
                if (err) {
                  console.log(err.message || err);
                  callfunc ? callfunc(-1, total, element._value) : null;
                  return;
                }
                var _num = ++num;
                if (obj instanceof cc.SpriteAtlas) {
                  console.log("--SpriteAtlas :", _resValue);
                  cc.Atom.spriteMgr.addSpriteAtlas(_index, obj);
                } else if (obj instanceof cc.AnimationClip) {
                  console.log("--AnimationClip :", _resValue);
                  cc.Atom.animateMgr.addAniClip(_index, obj);
                } else if (obj instanceof cc.Prefab) {
                  console.log("--Prefab :", _resValue);
                  cc.Atom.prefabMgr.addPrefabObj(_index, obj);
                } else if (obj instanceof cc.Texture2D) console.log("--Texture2D :", _resValue); else if (obj instanceof cc.SpriteFrame) {
                  console.log("--SpriteFrame :", _resValue);
                  cc.Atom.spriteMgr.addSpriteFrame(_index, obj);
                } else obj instanceof cc.AudioClip ? console.log("--AudioClip :", _resValue) : obj instanceof cc.ParticleAsset ? console.log("--ParticleAsset :", _resValue) : obj instanceof cc.Font ? console.log("--Font :", _resValue) : console.log("--Obj ", _resValue);
                callfunc ? callfunc(_num, total, null) : null;
              };
              "plist" == _type ? cc.loader.loadRes(key + "/" + _resValue, cc.SpriteAtlas, callback) : "sprite" == _type ? cc.loader.loadRes(key + "/" + _resValue, cc.SpriteFrame, callback) : cc.loader.loadRes(key + "/" + _resValue, callback);
            }
          };
          for (var _index in keyres) _loop(_index);
        } else console.log("@@@@ \u6ca1\u6709\u5bf9\u5e94\u7684\u8d44\u6e90 key: ", key);
      },
      releasResByKey: function releasResByKey(key) {
        if (null != key && null != this.resData[key]) {
          var total = 0;
          var keyres = this.resData[key];
          for (var _value in keyres) keyres.hasOwnProperty(_value) && total++;
          console.log("total res need release= ", total);
          for (var _index in keyres) if (keyres.hasOwnProperty(_index)) {
            var element = keyres[_index];
            var _type = element._type;
            var _resValue = element._value;
            "plist" == _type ? cc.loader.releaseRes(key + "/" + _resValue, cc.SpriteAtlas) : "sprite" == _type ? cc.loader.releaseRes(key + "/" + _resValue, cc.SpriteFrame) : cc.loader.releaseRes(key + "/" + _resValue);
            "ani" == _type || ("audio" == _type ? CC.Atom.animateMgr.cleanAniClip(_index) : "font" == _type || "texture" == _type || ("plist" == _type ? cc.Atom.spriteMgr.cleanSpriteAtlas(_index) : "sprite" == _type ? cc.Atom.spriteMgr.cleanSpriteFrame(_index) : "prefab" == _type || "particle" == _type));
          }
        } else console.log("@@@@ \u6ca1\u6709\u5bf9\u5e94\u7684\u8d44\u6e90 key: ", key);
      },
      releasAllRes: function releasAllRes() {
        for (var key in this.resData) this.resData.hasOwnProperty(key) && this.releasResByKey(key);
      }
    });
    cc._RF.pop();
  }, {} ],
  socketMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "ab8cfk3bYdLAbWfel6/6WAz", "socketMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "socketMgr"
      },
      ctor: function ctor() {
        console.log("-new:" + this.TAG);
      },
      onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
      },
      onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
      }
    });
    cc._RF.pop();
  }, {} ],
  spriteMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "84c5e5vWaZCL4oprNnbMjYu", "spriteMgr");
    "use strict";
    function _defineProperty(obj, key, value) {
      key in obj ? Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      }) : obj[key] = value;
      return obj;
    }
    cc.Class(_defineProperty({
      extends: cc.Component,
      properties: {
        TAG: "spriteMgr"
      },
      ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.altasBuff = {};
        this.spriteBuff = {};
      },
      onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
      },
      onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
      },
      loadSpriteWithUrl: function loadSpriteWithUrl(remoteUrl, callback) {
        if (null != remoteUrl) {
          var callfunc = function callfunc(err, texture) {
            if (err) {
              console.log(err.message || err, remoteUrl);
              callback ? callback(null, err) : null;
              return;
            }
            if (texture instanceof cc.Texture2D) {
              console.log("create spriteframe--");
              var sprite = new cc.SpriteFrame();
              sprite.setTexture(texture);
              callback ? callback(sprite) : null;
            } else callback ? callback(null, "not a texture!") : null;
          };
          null == remoteUrl.match(".png") ? cc.loader.load({
            url: remoteUrl,
            type: "png"
          }, callfunc) : cc.loader.load(remoteUrl, callfunc);
        }
      },
      addSpriteFrame: function addSpriteFrame(key, obj) {
        if (null == key || !obj instanceof cc.SpriteFrame) {
          console.log(" -------- \u7c7b\u578b\u5f02\u5e38 ", key);
          return;
        }
        this.spriteBuff[key] = obj;
      },
      addSpriteAtlas: function addSpriteAtlas(key, obj) {
        if (null == key || !obj instanceof cc.SpriteAtlas) {
          console.log(" -------- \u7c7b\u578b\u5f02\u5e38 ", key);
          return;
        }
        this.altasBuff[key] = obj;
      },
      cleanSpriteFrame: function cleanSpriteFrame(key) {
        this.spriteBuff[key] = null;
      },
      cleanSpriteAtlas: function cleanSpriteAtlas(key) {
        this.altasBuff[key] = null;
      },
      getSpriteFrame: function getSpriteFrame(key) {
        if (null == key) {
          console.log(" ------  key \u4e0d\u80fd\u4e3a\u7a7a", key);
          return;
        }
        return this.spriteBuff[key];
      },
      getAtlasSpriteFrame: function getAtlasSpriteFrame(altas, key) {
        if (null == altas || null == key) {
          console.log(" ------ altas key \u4e0d\u80fd\u4e3a\u7a7a", altas, key);
          return;
        }
        if (this.altasBuff[altas]) return this.altasBuff[altas].getSpriteFrame(key);
      },
      createSprite: function createSprite(key) {
        if (null == key) {
          console.log(" ------ \u7a7a\u7684key");
          return;
        }
        var spriteframe = this.spriteBuff[key];
        if (spriteframe) {
          var node = new cc.Node();
          var sprite = node.addComponent(cc.Sprite);
          sprite.spriteFrame = spriteframe;
          return node;
        }
      }
    }, "createSprite", function createSprite(altas, key) {
      if (null == altas || null == key) {
        console.log(" ------ \u7a7a\u7684altas ,key", altas, key);
        return;
      }
      var spriteframe = this.altasBuff[altas].getSpriteFrame(key);
      if (spriteframe) {
        var node = new cc.Node();
        var sprite = node.addComponent(cc.Sprite);
        sprite.spriteFrame = spriteframe;
        return node;
      }
    }));
    cc._RF.pop();
  }, {} ],
  timerMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "a426bFK1/BNb7LEq7baNAPu", "timerMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        TAG: "timerMgr",
        TASK_TYPE_RE: 1,
        TASK_TYPE_ONE: 2
      },
      ctor: function ctor() {
        console.log("-new:" + this.TAG);
        this.tasklist = {};
        var scheduler = cc.director.getScheduler();
        scheduler.schedule(this.mUpdate, this, 0, cc.macro.REPEAT_FOREVER, 0, false);
      },
      onLoad: function onLoad() {
        console.log("-load:" + this.TAG);
      },
      onDestroy: function onDestroy() {
        console.log("-destory:" + this.TAG);
        cc.director.getScheduler().unschedule(this.mUpdate, this);
      },
      mUpdate: function mUpdate(t) {
        for (var key in this.tasklist) if (this.tasklist.hasOwnProperty(key)) {
          var item = this.tasklist[key];
          if (null != item) if (false == item.remove) {
            item.cd_t += t;
            if (item.cd_t > item.time) {
              item.cd_t = 0;
              item.callback();
              console.log("update task : ", key, item.taskType);
              if (item.taskType == this.TASK_TYPE_ONE) {
                item.remove = true;
                console.log("remove task : ", key);
              }
            }
          } else this.tasklist[key] = null;
        }
      },
      registerTask: function registerTask(_taskName, _taskType, _callback, _time) {
        if (null != this.tasklist[_taskName]) {
          console.log(" !!! task already exist :", _taskName);
          return;
        }
        var item = {};
        item.taskName = _taskName;
        item.taskType = _taskType;
        item.callback = _callback;
        item.time = _time;
        item.cd_t = 0;
        item.remove = false;
        this.tasklist[_taskName] = item;
      },
      cleanTask: function cleanTask(_taskName) {
        this.tasklist[_taskName] = null;
      },
      cleanAllTask: function cleanAllTask() {
        this.tasklist = {};
      },
      checkTask: function checkTask(_taskName) {
        return null != this.tasklist[_taskName];
      }
    });
    cc._RF.pop();
  }, {} ],
  topBarDelegate: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "a5f47AiDKRGTI+vfG1km/Pl", "topBarDelegate");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {},
      onLoad: function onLoad() {
        this.score = 0;
        this.score_label = this.node.getChildByName("textScore");
      },
      start: function start() {
        var _this = this;
        cc.Atom.eventMgr.listen("onAddScore", function(obj, data) {
          _this.onAddScore(data);
        }, this);
      },
      onDestroy: function onDestroy() {
        cc.Atom.eventMgr.unListenByObj(this);
      },
      onAddScore: function onAddScore(data) {
        this.score += data;
        this.score_label.string = "SCORE : " + this.score;
      },
      onPause: function onPause() {
        cc.Atom.eventMgr.notify("onPause", true);
      },
      onMusic: function onMusic() {
        var isMusicOn = cc.Atom.gameDataMgr.getData("isMusicOn");
        var isEffectOn = cc.Atom.gameDataMgr.getData("isEffectOn");
        cc.Atom.gameDataMgr.getData("isMusicOn", !(isMusicOn || isEffectOn));
        cc.Atom.gameDataMgr.getData("isEffectOn", !(isMusicOn || isEffectOn));
      }
    });
    cc._RF.pop();
  }, {} ],
  uiLoader: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "b3d3fUWRFtDEpaZLpUvEVQ8", "uiLoader");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {},
      onLoad: function onLoad() {
        var _this = this;
        var logo_bg = this.node.getChildByName("logo_bg");
        var game_bg = this.node.getChildByName("game_bg");
        var press_bar = this.node.getChildByName("progressBar");
        if (null == cc.Atom) {
          console.log(">>> \u521b\u5efa Atom\u5f15\u64ce");
          var atom = require("AtomFrame/Atom");
          atom.createAtom();
          cc.Atom.gameState.setGameInLogo();
        }
        this.press_bar = press_bar;
        var self = this;
        logo_bg.active = cc.Atom.gameState.isGameInLogo();
        game_bg.active = cc.Atom.gameState.isGameInRoom();
        if (cc.Atom.gameState.isGameInLogo()) {
          cc.Atom.timerMgr.registerTask("logo2hall", cc.Atom.timerMgr.TASK_TYPE_ONE, function() {
            console.log(_this.desc, " ---- logo2Game");
            cc.Atom.gameState.setGameInHall();
            cc.director.loadScene("JJGame/Scene/JJHallMain");
          }, 2);
          return;
        }
        if (cc.Atom.gameState.isGameInHall()) return;
        if (cc.Atom.gameState.isGameInRoom()) {
          console.log(">>> uiloader load JJGameRes");
          cc.Atom.resMgr.loadResByKey("JJGameRes", function(index, total, err) {
            if (null != err || -1 == index) {
              console.log("=== \u52a0\u8f7d\u8d44\u6e90\u51fa\u73b0\u5f02\u5e38\uff1a ", err);
              return;
            }
            console.log(" \u8d44\u6e90\u52a0\u8f7d\u8fdb\u5ea6 \uff1a ", index, total);
            _this.press_bar.progress = index / total;
            if (index == total) {
              console.log("=== \u52a0\u8f7d\u5b8c\u6210");
              _this.node.removeFromParent();
              cc.Atom.eventMgr.notify("onStartGame", null);
            }
          });
          return;
        }
      },
      start: function start() {},
      update: function update(dt) {}
    });
    cc._RF.pop();
  }, {
    "AtomFrame/Atom": void 0
  } ]
}, {}, [ "BrickDelegate", "JJGameController", "JJHallMain", "MapController", "uiLoader", "pauseLayerDelegate", "topBarDelegate", "Atom", "bytebuffer", "long", "protobuf", "BonesBase", "UIMgr", "animateMgr", "audioMgr", "comFunMgr", "effectMgr", "eventMgr", "fileMgr", "gameConfMgr", "gameDataMgr", "gameNetMgr", "gameState", "hotUpdateMgr", "md5", "memoryDetector", "msgMgr", "platformMgr", "prefabMgr", "resMgr", "socketMgr", "spriteMgr", "timerMgr", "HelloWorld", "btnController", "gameScene" ]);