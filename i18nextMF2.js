(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.i18nextICU = factory());
}(this, (function () { 'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }
  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
      keys.push.apply(keys, symbols);
    }
    return keys;
  }
  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};
      if (i % 2) {
        ownKeys(Object(source), true).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys(Object(source)).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }
    return target;
  }

  function getLastOfPath(object, path, Empty) {
    function cleanKey(key) {
      return key && key.indexOf('###') > -1 ? key.replace(/###/g, '.') : key;
    }
    function canNotTraverseDeeper() {
      return !object || typeof object === 'string';
    }
    var stack = typeof path !== 'string' ? [].concat(path) : path.split('.');
    while (stack.length > 1) {
      if (canNotTraverseDeeper()) return {};
      var key = cleanKey(stack.shift());
      if (!object[key] && Empty) object[key] = new Empty();
      object = object[key];
    }
    if (canNotTraverseDeeper()) return {};
    return {
      obj: object,
      k: cleanKey(stack.shift())
    };
  }
  function setPath(object, path, newValue) {
    var _getLastOfPath = getLastOfPath(object, path, Object),
      obj = _getLastOfPath.obj,
      k = _getLastOfPath.k;
    obj[k] = newValue;
  }
  function getPath(object, path) {
    var _getLastOfPath3 = getLastOfPath(object, path),
      obj = _getLastOfPath3.obj,
      k = _getLastOfPath3.k;
    if (!obj) return undefined;
    return obj[k];
  }
  var arr = [];
  var each = arr.forEach;
  var slice = arr.slice;
  function defaults(obj) {
    each.call(slice.call(arguments, 1), function (source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === undefined) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  }

  function getDefaults() {
    return {
      memoize: true,
      memoizeFallback: false,
      bindI18n: '',
      bindI18nStore: '',
      parseErrorHandler: function parseErrorHandler(err, key, res, options) {
        return res;
      },
      parseLngForMf2: function parseLngForMf2(lng) {
        return lng;
      }
    };
  }
  var Mf2 = /*#__PURE__*/function () {
    function Mf2(options) {
      _classCallCheck(this, Mf2);
      this.type = 'i18nFormat';
      this.mem = {};
      this.init(null, options);
    }
    _createClass(Mf2, [{
      key: "init",
      value: function init(i18next, options) {
        var _this = this;
        var i18nextOptions = i18next && i18next.options && i18next.options.i18nFormat || {};
        this.options = defaults(i18nextOptions, options, this.options || {}, getDefaults());
        this.formats = this.options.formats;
        if (i18next) {
          var _this$options = this.options,
            bindI18n = _this$options.bindI18n,
            bindI18nStore = _this$options.bindI18nStore,
            memoize = _this$options.memoize;
          i18next.MessageFormat = IntlMessageFormat;
          i18next.Mf2 = this;
          if (memoize) {
            if (bindI18n) {
              i18next.on(bindI18n, function () {
                return _this.clearCache();
              });
            }
            if (bindI18nStore) {
              i18next.store.on(bindI18nStore, function () {
                return _this.clearCache();
              });
            }
          }
        }
      }
    }, {
      key: "addUserDefinedFormats",
      value: function addUserDefinedFormats(formats) {
        this.formats = this.formats ? _objectSpread2(_objectSpread2({}, this.formats), formats) : formats;
      }
    }, {
      key: "parse",
      value: function parse(res, options, lng, ns, key, info) {
        var hadSuccessfulLookup = info && info.resolved && info.resolved.res;
        var memKey = this.options.memoize && "".concat(lng, ".").concat(ns, ".").concat(key.replace(/\./g, '###'));
        var fc;
        if (this.options.memoize) {
          fc = getPath(this.mem, memKey);
        }
        try {
          if (!fc) {
            var transformedLng = this.options.parseLngForMf2(lng);
            // without ignoreTag, react-i18next <Trans> translations with <0></0> placeholders
            // will fail to parse, as IntlMessageFormat expects them to be defined in the
            // options passed to fc.format() as { 0: (children) => string }
            // but the replacement of placeholders is done in react-i18next
            fc = new Intl.MessageFormat(res, transformedLng);
            if (this.options.memoize && (this.options.memoizeFallback || !info || hadSuccessfulLookup)) setPath(this.mem, memKey, fc);
          }
          return fc.format(options);
        } catch (err) {
          return this.options.parseErrorHandler(err, key, res, options);
        }
      }
    }, {
      key: "addLookupKeys",
      value: function addLookupKeys(finalKeys, _key, _code, _ns, _options) {
        // no additional keys needed for select or plural
        // so there is no need to add keys to that finalKeys array
        return finalKeys;
      }
    }, {
      key: "clearCache",
      value: function clearCache() {
        this.mem = {};
      }
    }]);
    return Mf2;
  }();
  Mf2.type = 'i18nFormat';

  return Mf2;

})));
