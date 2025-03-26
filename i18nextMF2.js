(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.i18nextMF2 = factory());
})(this, (function () { 'use strict';

  function _classCallCheck(a, n) {
    if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
  }
  function _defineProperties(e, r) {
    for (var t = 0; t < r.length; t++) {
      var o = r[t];
      o.enumerable = o.enumerable || false, o.configurable = true, "value" in o && (o.writable = true), Object.defineProperty(e, _toPropertyKey(o.key), o);
    }
  }
  function _createClass(e, r, t) {
    return r && _defineProperties(e.prototype, r), Object.defineProperty(e, "prototype", {
      writable: false
    }), e;
  }
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: true,
      configurable: true,
      writable: true
    }) : e[r] = t, e;
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), true).forEach(function (r) {
        _defineProperty(e, r, t[r]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
        Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
      });
    }
    return e;
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r);
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (String )(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }

  const bidiChars$1 = /^[\u061c\u200e\u200f\u2066-\u2069]+/;
  const nameChars = /^[-.+0-9A-Z_a-z\u{a1}-\u{61b}\u{61d}-\u{167f}\u{1681}-\u{1fff}\u{200b}-\u{200d}\u{2010}-\u{2027}\u{2030}-\u{205e}\u{2060}-\u{2065}\u{206a}-\u{2fff}\u{3001}-\u{d7ff}\u{e000}-\u{fdcf}\u{fdf0}-\u{fffd}\u{10000}-\u{1fffd}\u{20000}-\u{2fffd}\u{30000}-\u{3fffd}\u{40000}-\u{4fffd}\u{50000}-\u{5fffd}\u{60000}-\u{6fffd}\u{70000}-\u{7fffd}\u{80000}-\u{8fffd}\u{90000}-\u{9fffd}\u{a0000}-\u{afffd}\u{b0000}-\u{bfffd}\u{c0000}-\u{cfffd}\u{d0000}-\u{dfffd}\u{e0000}-\u{efffd}\u{f0000}-\u{ffffd}\u{100000}-\u{10fffd}]+/u;
  const notNameStart = /^[-.0-9]/;
  function parseNameValue(source, start) {
      let pos = start;
      const startBidi = source.slice(pos).match(bidiChars$1);
      if (startBidi)
          pos += startBidi[0].length;
      const match = source.slice(pos).match(nameChars);
      if (!match)
          return null;
      const name = match[0];
      if (notNameStart.test(name))
          return null;
      pos += name.length;
      const endBidi = source.slice(pos).match(bidiChars$1);
      if (endBidi)
          pos += endBidi[0].length;
      return { value: name.normalize(), end: pos };
  }
  const parseUnquotedLiteralValue = (source, start) => source.slice(start).match(nameChars)?.[0] ?? '';

  /**
   * Shared symbol used as a key on message data model nodes
   * to reference their CST source.
   *
   * Only set on message data model nodes when parsed by {@link messageFromCST}.
   */
  const cstKey = Symbol.for('CST');

  /**
   * Base error class used by MessageFormat
   *
   * @category Errors
   */
  class MessageError extends Error {
      type;
      constructor(type, message) {
          super(message);
          this.type = type;
      }
  }
  /**
   * Errors in the message syntax.
   *
   * @category Errors
   */
  class MessageSyntaxError extends MessageError {
      start;
      end;
      /** @private */
      constructor(type, start, end, expected) {
          let message = expected ? `Missing ${expected}` : type;
          if (start >= 0)
              message += ` at ${start}`;
          super(type, message);
          this.start = start;
          this.end = end ?? start + 1;
      }
  }
  /**
   * Errors in the message data model.
   *
   * @category Errors
   */
  class MessageDataModelError extends MessageSyntaxError {
      /** @private */
      constructor(type, node) {
          const { start, end } = node[cstKey] ?? { start: -1, end: -1 };
          super(type, start, end);
      }
  }
  /**
   * Message runtime resolution errors
   *
   * @category Errors
   */
  class MessageResolutionError extends MessageError {
      source;
      constructor(type, message, source) {
          super(type, message);
          this.source = source;
      }
  }
  /**
   * Errors in message selection.
   *
   * @category Errors
   */
  class MessageSelectionError extends MessageError {
      cause;
      constructor(type, cause) {
          super(type, `Selection error: ${type}`);
          if (cause !== undefined)
              this.cause = cause;
      }
  }

  const bidiChars = new Set('\u061C\u200E\u200F\u2066\u2067\u2068\u2069');
  const whitespaceChars = new Set('\t\n\r \u3000');
  //// Parser State ////
  let pos;
  let source;
  //// Utilities & Error Wrappers ////
  // These indirections allow for the function names to be mangled,
  // while keeping the error class name intact.
  const MissingSyntax = (pos, expected) => new MessageSyntaxError('missing-syntax', pos, pos + expected.length, expected);
  const SyntaxError = (...args) => new MessageSyntaxError(...args);
  function expect(searchString, consume) {
      if (source.startsWith(searchString, pos)) {
          if (consume)
              pos += searchString.length;
      }
      else {
          throw MissingSyntax(pos, searchString);
      }
  }
  function parseMessage(source_) {
      pos = 0;
      source = source_;
      const decl = declarations();
      if (source.startsWith('.match', pos))
          return selectMessage(decl);
      const quoted = decl.length > 0 || source.startsWith('{{', pos);
      if (!quoted && pos > 0)
          pos = 0;
      const pattern_ = pattern(quoted);
      if (quoted) {
          ws();
          if (pos < source.length) {
              throw SyntaxError('extra-content', pos, source.length);
          }
      }
      return { type: 'message', declarations: decl, pattern: pattern_ };
  }
  function selectMessage(declarations) {
      pos += 6; // '.match'
      ws(true);
      const selectors = [];
      while (source[pos] === '$') {
          selectors.push(variable());
          ws(true);
      }
      if (selectors.length === 0)
          throw SyntaxError('empty-token', pos);
      const variants = [];
      while (pos < source.length) {
          variants.push(variant());
          ws();
      }
      return { type: 'select', declarations, selectors, variants };
  }
  function variant() {
      const keys = [];
      while (pos < source.length) {
          ws(keys.length ? '{' : false);
          const next = source[pos];
          if (next === '{')
              break;
          if (next === '*') {
              keys.push({ type: '*' });
              pos += 1;
          }
          else {
              const key = literal(true);
              key.value = key.value.normalize();
              keys.push(key);
          }
      }
      return { keys, value: pattern(true) };
  }
  function pattern(quoted) {
      if (quoted) {
          if (source.startsWith('{{', pos))
              pos += 2;
          else
              throw MissingSyntax(pos, '{{');
      }
      const pattern = [];
      loop: while (pos < source.length) {
          switch (source[pos]) {
              case '{': {
                  pattern.push(expression(true));
                  break;
              }
              case '}':
                  if (!quoted)
                      throw SyntaxError('parse-error', pos);
                  break loop;
              default: {
                  pattern.push(text());
              }
          }
      }
      if (quoted) {
          if (source.startsWith('}}', pos))
              pos += 2;
          else
              throw MissingSyntax(pos, '}}');
      }
      return pattern;
  }
  function declarations() {
      const declarations = [];
      ws();
      loop: while (source[pos] === '.') {
          const keyword = source.substr(pos, 6);
          switch (keyword) {
              case '.input':
                  declarations.push(inputDeclaration());
                  break;
              case '.local':
                  declarations.push(localDeclaration());
                  break;
              case '.match':
                  break loop;
              default:
                  throw SyntaxError('parse-error', pos);
          }
          ws();
      }
      return declarations;
  }
  function inputDeclaration() {
      pos += 6; // '.input'
      ws();
      expect('{', false);
      const valueStart = pos;
      const value = expression(false);
      if (value.type === 'expression' && value.arg?.type === 'variable') {
          // @ts-expect-error TS isn't catching that value is Expression<VariableRef>
          return { type: 'input', name: value.arg.name, value };
      }
      throw SyntaxError('bad-input-expression', valueStart, pos);
  }
  function localDeclaration() {
      pos += 6; // '.local'
      ws(true);
      expect('$', true);
      const name_ = name();
      ws();
      expect('=', true);
      ws();
      expect('{', false);
      const value = expression(false);
      return { type: 'local', name: name_, value };
  }
  function expression(allowMarkup) {
      const start = pos;
      pos += 1; // '{'
      ws();
      const arg = value(false);
      if (arg)
          ws('}');
      const sigil = source[pos];
      let functionRef;
      let markup;
      switch (sigil) {
          case '@':
          case '}':
              break;
          case ':': {
              pos += 1; // ':'
              functionRef = { type: 'function', name: identifier() };
              const options_ = options();
              if (options_)
                  functionRef.options = options_;
              break;
          }
          case '#':
          case '/': {
              if (arg || !allowMarkup)
                  throw SyntaxError('parse-error', pos);
              pos += 1; // '#' or '/'
              const kind = sigil === '#' ? 'open' : 'close';
              markup = { type: 'markup', kind, name: identifier() };
              const options_ = options();
              if (options_)
                  markup.options = options_;
              break;
          }
          default:
              throw SyntaxError('parse-error', pos);
      }
      const attributes_ = attributes();
      if (markup?.kind === 'open' && source[pos] === '/') {
          markup.kind = 'standalone';
          pos += 1; // '/'
      }
      expect('}', true);
      if (functionRef) {
          const exp = arg
              ? { type: 'expression', arg, functionRef: functionRef }
              : { type: 'expression', functionRef: functionRef };
          if (attributes_)
              exp.attributes = attributes_;
          return exp;
      }
      if (markup) {
          if (attributes_)
              markup.attributes = attributes_;
          return markup;
      }
      if (!arg)
          throw SyntaxError('empty-token', start, pos);
      return attributes_
          ? { type: 'expression', arg, attributes: attributes_ }
          : { type: 'expression', arg };
  }
  /** Requires and consumes leading and trailing whitespace. */
  function options() {
      ws('/}');
      const options = new Map();
      let isEmpty = true;
      while (pos < source.length) {
          const next = source[pos];
          if (next === '@' || next === '/' || next === '}')
              break;
          const start = pos;
          const name_ = identifier();
          if (options.has(name_)) {
              throw SyntaxError('duplicate-option-name', start, pos);
          }
          ws();
          expect('=', true);
          ws();
          options.set(name_, value(true));
          isEmpty = false;
          ws('/}');
      }
      return isEmpty ? null : options;
  }
  function attributes() {
      const attributes = new Map();
      let isEmpty = true;
      while (source[pos] === '@') {
          const start = pos;
          pos += 1; // '@'
          const name_ = identifier();
          if (attributes.has(name_)) {
              throw SyntaxError('duplicate-attribute', start, pos);
          }
          ws('=/}');
          if (source[pos] === '=') {
              pos += 1; // '='
              ws();
              attributes.set(name_, literal(true));
              ws('/}');
          }
          else {
              attributes.set(name_, true);
          }
          isEmpty = false;
      }
      return isEmpty ? null : attributes;
  }
  function text() {
      let value = '';
      let i = pos;
      loop: for (; i < source.length; ++i) {
          switch (source[i]) {
              case '\\': {
                  const esc = source[i + 1];
                  if (!'\\{|}'.includes(esc))
                      throw SyntaxError('bad-escape', i, i + 2);
                  value += source.substring(pos, i) + esc;
                  i += 1;
                  pos = i + 1;
                  break;
              }
              case '{':
              case '}':
                  break loop;
          }
      }
      value += source.substring(pos, i);
      pos = i;
      return value;
  }
  function value(required) {
      return source[pos] === '$' ? variable() : literal(required);
  }
  function variable() {
      pos += 1; // '$'
      return { type: 'variable', name: name() };
  }
  function literal(required) {
      if (source[pos] === '|')
          return quotedLiteral();
      const value = parseUnquotedLiteralValue(source, pos);
      if (!value) {
          if (required)
              throw SyntaxError('empty-token', pos);
          else
              return undefined;
      }
      pos += value.length;
      return { type: 'literal', value };
  }
  function quotedLiteral() {
      pos += 1; // '|'
      let value = '';
      for (let i = pos; i < source.length; ++i) {
          switch (source[i]) {
              case '\\': {
                  const esc = source[i + 1];
                  if (!'\\{|}'.includes(esc))
                      throw SyntaxError('bad-escape', i, i + 2);
                  value += source.substring(pos, i) + esc;
                  i += 1;
                  pos = i + 1;
                  break;
              }
              case '|':
                  value += source.substring(pos, i);
                  pos = i + 1;
                  return { type: 'literal', value };
          }
      }
      throw MissingSyntax(source.length, '|');
  }
  function identifier() {
      const name_ = name();
      if (source[pos] === ':') {
          pos += 1;
          return name_ + ':' + name();
      }
      return name_;
  }
  function name() {
      const name = parseNameValue(source, pos);
      if (!name)
          throw SyntaxError('empty-token', pos);
      pos = name.end;
      return name.value;
  }
  function ws(req = false) {
      let next = source[pos];
      let hasWS = false;
      if (req) {
          while (bidiChars.has(next))
              next = source[++pos];
          while (whitespaceChars.has(next)) {
              next = source[++pos];
              hasWS = true;
          }
      }
      while (bidiChars.has(next) || whitespaceChars.has(next))
          next = source[++pos];
      if (req && !hasWS && (req === true || !req.includes(source[pos]))) {
          throw MissingSyntax(pos, "' '");
      }
  }

  /**
   * Apply visitor functions to message nodes.
   *
   * The visitors are applied in source order, starting from the root.
   * Visitors for nodes that contain other nodes may return a callback function
   * that will be called with no arguments when exiting the node.
   *
   * If set, the `node` visitor is called for all {@link Node} values
   * for which an explicit visitor is not defined.
   *
   * Many visitors will be called with additional arguments
   * identifying some of the context for the visited node.
   *
   * @category Message Data Model
   */
  function visit(msg, visitors) {
      const { node, pattern } = visitors;
      const { functionRef = node, attributes = null, declaration = node, expression = node, key = node, markup = node, options = null, value = node, variant = node } = visitors;
      const handleOptions = (options_, context) => {
          if (options_) {
              const end = options?.(options_, context);
              if (value) {
                  for (const value_ of options_.values()) {
                      value(value_, context, 'option');
                  }
              }
              end?.();
          }
      };
      const handleAttributes = (attributes_, context) => {
          if (attributes_) {
              const end = attributes?.(attributes_, context);
              if (value) {
                  for (const value_ of attributes_.values()) {
                      if (value_ !== true)
                          value(value_, context, 'attribute');
                  }
              }
              end?.();
          }
      };
      const handleElement = (exp, context) => {
          if (typeof exp === 'object') {
              let end;
              switch (exp.type) {
                  case 'expression': {
                      end = expression?.(exp, context);
                      if (exp.arg)
                          value?.(exp.arg, context, 'arg');
                      if (exp.functionRef) {
                          const endA = functionRef?.(exp.functionRef, context, exp.arg);
                          handleOptions(exp.functionRef.options, context);
                          endA?.();
                      }
                      handleAttributes(exp.attributes, context);
                      break;
                  }
                  case 'markup': {
                      end = markup?.(exp, context);
                      handleOptions(exp.options, context);
                      handleAttributes(exp.attributes, context);
                      break;
                  }
              }
              end?.();
          }
      };
      const handlePattern = (pat) => {
          const end = pattern?.(pat);
          for (const el of pat)
              handleElement(el, 'placeholder');
          end?.();
      };
      for (const decl of msg.declarations) {
          const end = declaration?.(decl);
          if (decl.value)
              handleElement(decl.value, 'declaration');
          end?.();
      }
      if (msg.type === 'message') {
          handlePattern(msg.pattern);
      }
      else {
          if (value)
              for (const sel of msg.selectors)
                  value(sel, 'selector', 'arg');
          for (const vari of msg.variants) {
              const end = variant?.(vari);
              if (key)
                  vari.keys.forEach(key);
              handlePattern(vari.value);
              end?.();
          }
      }
  }

  /**
   * Ensure that the `msg` data model is _valid_, calling `onError` on errors.
   * If `onError` is not defined, a {@link MessageDataModelError} will be thrown on error.
   *
   * Detects the following errors:
   *
   * - `'key-mismatch'`: **Variant Key Mismatch**<br>
   *   The number of keys on a _variant_ does not equal the number of _selectors_.
   *
   * - `'missing-fallback'`: **Missing Fallback Variant**<br>
   *   The message does not include a _variant_ with only catch-all keys.
   *
   * - `'missing-selector-annotation'`: **Missing Selector Annotation**<br>
   *   A _selector_ does not contains a _variable_ that directly or indirectly
   *   reference a _declaration_ with a _function_.
   *
   * - `'duplicate-declaration'`: **Duplicate Declaration**<br>
   *   A _variable_ appears in two _declarations_.
   *
   * - `'duplicate-variant'`: **Duplicate Variant**<br>
   *   The same list of _keys_ is used for more than one _variant_.
   *
   * @category Message Data Model
   * @returns The sets of runtime `functions` and `variables` used by the message.
   */
  function validate(msg, onError = (type, node) => {
      throw new MessageDataModelError(type, node);
  }) {
      let selectorCount = 0;
      let missingFallback = null;
      /** Tracks directly & indirectly annotated variables for `missing-selector-annotation` */
      const annotated = new Set();
      /** Tracks declared variables for `duplicate-declaration` */
      const declared = new Set();
      const functions = new Set();
      const localVars = new Set();
      const variables = new Set();
      const variants = new Set();
      let setArgAsDeclared = true;
      visit(msg, {
          declaration(decl) {
              // Skip all ReservedStatement
              if (!decl.name)
                  return undefined;
              if (decl.value.functionRef ||
                  (decl.type === 'local' &&
                      decl.value.arg?.type === 'variable' &&
                      annotated.has(decl.value.arg.name))) {
                  annotated.add(decl.name);
              }
              if (decl.type === 'local')
                  localVars.add(decl.name);
              setArgAsDeclared = decl.type === 'local';
              return () => {
                  if (declared.has(decl.name))
                      onError('duplicate-declaration', decl);
                  else
                      declared.add(decl.name);
              };
          },
          expression({ functionRef }) {
              if (functionRef)
                  functions.add(functionRef.name);
          },
          value(value, context, position) {
              if (value.type !== 'variable')
                  return;
              variables.add(value.name);
              switch (context) {
                  case 'declaration':
                      if (position !== 'arg' || setArgAsDeclared) {
                          declared.add(value.name);
                      }
                      break;
                  case 'selector':
                      selectorCount += 1;
                      missingFallback = value;
                      if (!annotated.has(value.name)) {
                          onError('missing-selector-annotation', value);
                      }
              }
          },
          variant(variant) {
              const { keys } = variant;
              if (keys.length !== selectorCount)
                  onError('key-mismatch', variant);
              const strKeys = JSON.stringify(keys.map(key => (key.type === 'literal' ? key.value : 0)));
              if (variants.has(strKeys))
                  onError('duplicate-variant', variant);
              else
                  variants.add(strKeys);
              missingFallback &&= keys.every(key => key.type === '*') ? null : variant;
          }
      });
      if (missingFallback)
          onError('missing-fallback', missingFallback);
      for (const lv of localVars)
          variables.delete(lv);
      return { functions, variables };
  }

  const LRI = '\u2066';
  const RLI = '\u2067';
  const FSI = '\u2068';
  const PDI = '\u2069';
  // Data source: RECOMMENDED and LIMITED_USE scripts from
  // https://github.com/unicode-org/cldr/blob/1a914d1/common/properties/scriptMetadata.txt
  const RTL = 'Adlm,Arab,Hebr,Mand,Nkoo,Rohg,Syrc,Thaa';
  /** Get a default text direction for `locale`. */
  function getLocaleDir(locale) {
      if (locale) {
          try {
              if (typeof locale === 'string')
                  locale = new Intl.Locale(locale);
              // @ts-expect-error -- New feature, API changed during Stage 3
              const info = locale.getTextInfo?.() ?? locale.textInfo;
              if (info?.direction)
                  return info.direction;
              const script = locale.maximize().script;
              if (script)
                  return RTL.includes(script) ? 'rtl' : 'ltr';
          }
          catch {
              // Use 'auto' on error
          }
      }
      return 'auto';
  }

  /**
   * Utility function for custom functions.
   * Cast a value as a Boolean,
   * unwrapping objects using their `valueOf()` methods.
   * Also accepts `'true'` and `'false'`.
   * Throws a `RangeError` for invalid inputs.
   */
  function asBoolean(value) {
      if (value && typeof value === 'object')
          value = value.valueOf();
      if (typeof value === 'boolean')
          return value;
      if (value && typeof value === 'object')
          value = String(value);
      if (value === 'true')
          return true;
      if (value === 'false')
          return false;
      throw new RangeError('Not a boolean');
  }
  /**
   * Utility function for custom functions.
   * Cast a value as a non-negative integer,
   * unwrapping objects using their `valueOf()` methods.
   * Also accepts JSON string reprentations of integers.
   * Throws a `RangeError` for invalid inputs.
   *
   * The default functions use this to validate _digit size options_.
   */
  function asPositiveInteger(value) {
      if (value && typeof value === 'object')
          value = value.valueOf();
      if (value && typeof value === 'object')
          value = String(value);
      if (typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value)) {
          value = Number(value);
      }
      if (typeof value === 'number' && value >= 0 && Number.isInteger(value)) {
          return value;
      }
      throw new RangeError('Not a positive integer');
  }
  /**
   * Utility function for custom functions.
   * Cast a value as a string,
   * unwrapping objects using their `valueOf()` methods.
   * Throws a `RangeError` for invalid inputs.
   */
  function asString(value) {
      if (value && typeof value === 'object')
          value = value.valueOf();
      if (typeof value === 'string')
          return value;
      if (value && typeof value === 'object')
          return String(value);
      throw new RangeError('Not a string');
  }

  function readNumericOperand(value, source) {
      let options = undefined;
      if (typeof value === 'object') {
          const valueOf = value?.valueOf;
          if (typeof valueOf === 'function') {
              options = value.options;
              value = valueOf.call(value);
          }
      }
      if (typeof value === 'string') {
          try {
              value = JSON.parse(value);
          }
          catch {
              // handled below
          }
      }
      if (typeof value !== 'bigint' && typeof value !== 'number') {
          const msg = 'Input is not numeric';
          throw new MessageResolutionError('bad-operand', msg, source);
      }
      return { value, options };
  }
  function getMessageNumber(ctx, value, options, canSelect) {
      let { dir, locales, source } = ctx;
      // @ts-expect-error We may have been a bit naughty earlier.
      if (options.useGrouping === 'never')
          options.useGrouping = false;
      if (canSelect &&
          'select' in options &&
          !ctx.literalOptionKeys.has('select')) {
          const msg = 'The option select may only be set by a literal value';
          ctx.onError(new MessageResolutionError('bad-option', msg, source));
          canSelect = false;
      }
      let locale;
      let nf;
      let cat;
      let str;
      return {
          type: 'number',
          source,
          get dir() {
              if (dir == null) {
                  locale ??= Intl.NumberFormat.supportedLocalesOf(locales, options)[0];
                  dir = getLocaleDir(locale);
              }
              return dir;
          },
          get options() {
              return { ...options };
          },
          selectKey: canSelect
              ? keys => {
                  const str = String(value);
                  if (keys.has(str))
                      return str;
                  if (options.select === 'exact')
                      return null;
                  const pluralOpt = options.select
                      ? { ...options, select: undefined, type: options.select }
                      : options;
                  // Intl.PluralRules needs a number, not bigint
                  cat ??= new Intl.PluralRules(locales, pluralOpt).select(Number(value));
                  return keys.has(cat) ? cat : null;
              }
              : undefined,
          toParts() {
              nf ??= new Intl.NumberFormat(locales, options);
              const parts = nf.formatToParts(value);
              locale ??= nf.resolvedOptions().locale;
              dir ??= getLocaleDir(locale);
              return dir === 'ltr' || dir === 'rtl'
                  ? [{ type: 'number', source, dir, locale, parts }]
                  : [{ type: 'number', source, locale, parts }];
          },
          toString() {
              nf ??= new Intl.NumberFormat(locales, options);
              str ??= nf.format(value);
              return str;
          },
          valueOf: () => value
      };
  }
  function number(ctx, exprOpt, operand) {
      const input = readNumericOperand(operand, ctx.source);
      const value = input.value;
      const options = Object.assign({}, input.options, {
          localeMatcher: ctx.localeMatcher,
          style: 'decimal'
      });
      for (const [name, optval] of Object.entries(exprOpt)) {
          if (optval === undefined)
              continue;
          try {
              switch (name) {
                  case 'minimumIntegerDigits':
                  case 'minimumFractionDigits':
                  case 'maximumFractionDigits':
                  case 'minimumSignificantDigits':
                  case 'maximumSignificantDigits':
                  case 'roundingIncrement':
                      // @ts-expect-error TS types don't know about roundingIncrement
                      options[name] = asPositiveInteger(optval);
                      break;
                  case 'roundingMode':
                  case 'roundingPriority':
                  case 'select': // Called 'type' in Intl.PluralRules
                  case 'signDisplay':
                  case 'trailingZeroDisplay':
                  case 'useGrouping':
                      // @ts-expect-error Let Intl.NumberFormat construction fail
                      options[name] = asString(optval);
              }
          }
          catch {
              const msg = `Value ${optval} is not valid for :number option ${name}`;
              ctx.onError(new MessageResolutionError('bad-option', msg, ctx.source));
          }
      }
      return getMessageNumber(ctx, value, options, true);
  }
  function integer(ctx, exprOpt, operand) {
      const input = readNumericOperand(operand, ctx.source);
      const value = Number.isFinite(input.value)
          ? Math.round(input.value)
          : input.value;
      const options = Object.assign({}, input.options, {
          //localeMatcher: ctx.localeMatcher,
          maximumFractionDigits: 0,
          minimumFractionDigits: undefined,
          minimumSignificantDigits: undefined,
          style: 'decimal'
      });
      for (const [name, optval] of Object.entries(exprOpt)) {
          if (optval === undefined)
              continue;
          try {
              switch (name) {
                  case 'minimumIntegerDigits':
                  case 'maximumSignificantDigits':
                      options[name] = asPositiveInteger(optval);
                      break;
                  case 'select': // Called 'type' in Intl.PluralRules
                  case 'signDisplay':
                  case 'useGrouping':
                      // @ts-expect-error Let Intl.NumberFormat construction fail
                      options[name] = asString(optval);
              }
          }
          catch {
              const msg = `Value ${optval} is not valid for :integer option ${name}`;
              ctx.onError(new MessageResolutionError('bad-option', msg, ctx.source));
          }
      }
      return getMessageNumber(ctx, value, options, true);
  }

  /**
   * `currency` accepts as input numerical values as well as
   * objects wrapping a numerical value that also include a `currency` property.
   *
   * @beta
   */
  function currency(ctx, exprOpt, operand) {
      const { source } = ctx;
      const input = readNumericOperand(operand, source);
      const options = Object.assign({}, input.options, {
          localeMatcher: ctx.localeMatcher,
          style: 'currency'
      });
      for (const [name, optval] of Object.entries(exprOpt)) {
          if (optval === undefined)
              continue;
          try {
              switch (name) {
                  case 'currency':
                  case 'currencySign':
                  case 'roundingMode':
                  case 'roundingPriority':
                  case 'trailingZeroDisplay':
                  case 'useGrouping':
                      // @ts-expect-error Let Intl.NumberFormat construction fail
                      options[name] = asString(optval);
                      break;
                  case 'minimumIntegerDigits':
                  case 'minimumSignificantDigits':
                  case 'maximumSignificantDigits':
                  case 'roundingIncrement':
                      // @ts-expect-error TS types don't know about roundingIncrement
                      options[name] = asPositiveInteger(optval);
                      break;
                  case 'currencyDisplay': {
                      const strval = asString(optval);
                      if (strval === 'never') {
                          ctx.onError(new MessageResolutionError('unsupported-operation', 'Currency display "never" is not yet supported', source));
                      }
                      else {
                          // @ts-expect-error Let Intl.NumberFormat construction fail
                          options[name] = strval;
                      }
                      break;
                  }
                  case 'fractionDigits': {
                      const strval = asString(optval);
                      if (strval === 'auto') {
                          options.minimumFractionDigits = undefined;
                          options.maximumFractionDigits = undefined;
                      }
                      else {
                          const numval = asPositiveInteger(strval);
                          options.minimumFractionDigits = numval;
                          options.maximumFractionDigits = numval;
                      }
                      break;
                  }
              }
          }
          catch (error) {
              if (error instanceof MessageError) {
                  ctx.onError(error);
              }
              else {
                  const msg = `Value ${optval} is not valid for :currency option ${name}`;
                  ctx.onError(new MessageResolutionError('bad-option', msg, source));
              }
          }
      }
      if (!options.currency) {
          const msg = 'A currency code is required for :currency';
          throw new MessageResolutionError('bad-operand', msg, source);
      }
      return getMessageNumber(ctx, input.value, options, false);
  }

  const styleOptions = new Set(['dateStyle', 'timeStyle']);
  const fieldOptions = new Set([
      'weekday',
      'era',
      'year',
      'month',
      'day',
      'hour',
      'minute',
      'second',
      'fractionalSecondDigits',
      'timeZoneName'
  ]);
  /**
   * `datetime` accepts a Date, number or string as its input
   * and formats it with the same options as
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat | Intl.DateTimeFormat}.
   *
   * @beta
   */
  const datetime = (ctx, options, operand) => dateTimeImplementation(ctx, operand, res => {
      let hasStyle = false;
      let hasFields = false;
      for (const [name, value] of Object.entries(options)) {
          if (value === undefined)
              continue;
          try {
              switch (name) {
                  case 'locale':
                      break;
                  case 'fractionalSecondDigits':
                      res[name] = asPositiveInteger(value);
                      hasFields = true;
                      break;
                  case 'hour12':
                      res[name] = asBoolean(value);
                      break;
                  default:
                      res[name] = asString(value);
                      if (!hasStyle && styleOptions.has(name))
                          hasStyle = true;
                      if (!hasFields && fieldOptions.has(name))
                          hasFields = true;
              }
          }
          catch {
              const msg = `Value ${value} is not valid for :datetime ${name} option`;
              ctx.onError(new MessageResolutionError('bad-option', msg, ctx.source));
          }
      }
      if (!hasStyle && !hasFields) {
          res.dateStyle = 'medium';
          res.timeStyle = 'short';
      }
      else if (hasStyle && hasFields) {
          const msg = 'Style and field options cannot be both set for :datetime';
          throw new MessageResolutionError('bad-option', msg, ctx.source);
      }
  });
  /**
   * `date` accepts a Date, number or string as its input
   * and formats it according to a single "style" option.
   *
   * @beta
   */
  const date = (ctx, options, operand) => dateTimeImplementation(ctx, operand, res => {
      for (const name of Object.keys(res)) {
          if (styleOptions.has(name) || fieldOptions.has(name))
              delete res[name];
      }
      for (const [name, value] of Object.entries(options)) {
          if (value === undefined)
              continue;
          try {
              switch (name) {
                  case 'style':
                      res.dateStyle = asString(value);
                      break;
                  case 'hour12':
                      res[name] = asBoolean(value);
                      break;
                  case 'calendar':
                  case 'timeZone':
                      res[name] = asString(value);
              }
          }
          catch {
              const msg = `Value ${value} is not valid for :date ${name} option`;
              ctx.onError(new MessageResolutionError('bad-option', msg, ctx.source));
          }
      }
      res.dateStyle ??= 'medium';
  });
  /**
   * `time` accepts a Date, number or string as its input
   * and formats it according to a single "style" option.
   *
   * @beta
   */
  const time = (ctx, options, operand) => dateTimeImplementation(ctx, operand, res => {
      for (const name of Object.keys(res)) {
          if (styleOptions.has(name) || fieldOptions.has(name))
              delete res[name];
      }
      for (const [name, value] of Object.entries(options)) {
          if (value === undefined)
              continue;
          try {
              switch (name) {
                  case 'style':
                      res.timeStyle = asString(value);
                      break;
                  case 'hour12':
                      res[name] = asBoolean(value);
                      break;
                  case 'calendar':
                  case 'timeZone':
                      res[name] = asString(value);
              }
          }
          catch {
              const msg = `Value ${value} is not valid for :time ${name} option`;
              ctx.onError(new MessageResolutionError('bad-option', msg, ctx.source));
          }
      }
      res.timeStyle ??= 'short';
  });
  function dateTimeImplementation(ctx, input, parseOptions) {
      const { localeMatcher, locales, source } = ctx;
      const opt = { localeMatcher };
      if (input && typeof input === 'object') {
          if (input && 'options' in input)
              Object.assign(opt, input.options);
          if (!(input instanceof Date) && typeof input.valueOf === 'function') {
              input = input.valueOf();
          }
      }
      let value;
      switch (typeof input) {
          case 'number':
          case 'string':
              value = new Date(input);
              break;
          case 'object':
              value = input;
              break;
      }
      if (!(value instanceof Date) || isNaN(value.getTime())) {
          const msg = 'Input is not a date';
          throw new MessageResolutionError('bad-operand', msg, source);
      }
      parseOptions(opt);
      const date = value;
      let locale;
      let dir = ctx.dir;
      let dtf;
      let str;
      return {
          type: 'datetime',
          source,
          get dir() {
              if (dir == null) {
                  locale ??= Intl.DateTimeFormat.supportedLocalesOf(locales, opt)[0];
                  dir = getLocaleDir(locale);
              }
              return dir;
          },
          get options() {
              return { ...opt };
          },
          toParts() {
              dtf ??= new Intl.DateTimeFormat(locales, opt);
              const parts = dtf.formatToParts(date);
              locale ??= dtf.resolvedOptions().locale;
              dir ??= getLocaleDir(locale);
              return dir === 'ltr' || dir === 'rtl'
                  ? [{ type: 'datetime', source, dir, locale, parts }]
                  : [{ type: 'datetime', source, locale, parts }];
          },
          toString() {
              dtf ??= new Intl.DateTimeFormat(locales, opt);
              str ??= dtf.format(date);
              return str;
          },
          valueOf: () => date
      };
  }

  /**
   * `math` accepts a numeric value as input and adds or subtracts an integer value from it
   *
   * @beta
   */
  function math(ctx, exprOpt, operand) {
      const { source } = ctx;
      let { value, options } = readNumericOperand(operand, source);
      let add;
      let sub;
      try {
          add = 'add' in exprOpt ? asPositiveInteger(exprOpt.add) : -1;
          sub = 'subtract' in exprOpt ? asPositiveInteger(exprOpt.subtract) : -1;
      }
      catch (error) {
          throw new MessageResolutionError('bad-option', String(error), source);
      }
      if (add < 0 === sub < 0) {
          const msg = 'Exactly one of "add" or "subtract" is required as a :math option';
          throw new MessageResolutionError('bad-option', msg, source);
      }
      const delta = add < 0 ? -sub : add;
      if (typeof value === 'number')
          value += delta;
      else
          value += BigInt(delta);
      return number(ctx, {}, { valueOf: () => value, options });
  }

  function string(ctx, _options, operand) {
      const str = operand === undefined ? '' : String(operand);
      const selStr = str.normalize();
      return {
          type: 'string',
          source: ctx.source,
          dir: ctx.dir ?? 'auto',
          selectKey: keys => (keys.has(selStr) ? selStr : null),
          toParts() {
              const { dir, source } = ctx;
              const locale = ctx.locales[0];
              return dir === 'ltr' || dir === 'rtl'
                  ? [{ type: 'string', source, dir, locale, value: str }]
                  : [{ type: 'string', source, locale, value: str }];
          },
          toString: () => str,
          valueOf: () => str
      };
  }

  /**
   * `unit` accepts as input numerical values as well as
   * objects wrapping a numerical value that also include a `unit` property.
   *
   * @beta
   */
  function unit(ctx, exprOpt, operand) {
      const { source } = ctx;
      const input = readNumericOperand(operand, source);
      const options = Object.assign({}, input.options, {
          localeMatcher: ctx.localeMatcher,
          style: 'unit'
      });
      for (const [name, optval] of Object.entries(exprOpt)) {
          if (optval === undefined)
              continue;
          try {
              switch (name) {
                  case 'signDisplay':
                  case 'roundingMode':
                  case 'roundingPriority':
                  case 'trailingZeroDisplay':
                  case 'unit':
                  case 'unitDisplay':
                  case 'useGrouping':
                      // @ts-expect-error Let Intl.NumberFormat construction fail
                      options[name] = asString(optval);
                      break;
                  case 'minimumIntegerDigits':
                  case 'minimumFractionDigits':
                  case 'maximumFractionDigits':
                  case 'minimumSignificantDigits':
                  case 'maximumSignificantDigits':
                  case 'roundingIncrement':
                      // @ts-expect-error TS types don't know about roundingIncrement
                      options[name] = asPositiveInteger(optval);
                      break;
              }
          }
          catch (error) {
              if (error instanceof MessageError) {
                  ctx.onError(error);
              }
              else {
                  const msg = `Value ${optval} is not valid for :currency option ${name}`;
                  ctx.onError(new MessageResolutionError('bad-option', msg, source));
              }
          }
      }
      if (!options.unit) {
          const msg = 'A unit identifier is required for :unit';
          throw new MessageResolutionError('bad-operand', msg, source);
      }
      return getMessageNumber(ctx, input.value, options, false);
  }

  /**
   * Implementations for :number, :string, and other default functions,
   * along with some utilities for building custom function handlers.
   *
   * ```js
   * import { MessageFormat } from 'messageformat';
   * import { DraftFunctions } from 'messageformat/functions';
   *
   * const mf = new MessageFormat(locale, msgSrc, { functions: DraftFunctions });
   * ```
   *
   * @module
   */
  /**
   * Functions classified as REQUIRED by the
   * {@link https://www.unicode.org/reports/tr35/tr35-75/tr35-messageFormat.html#contents-of-part-9-messageformat | LDML 47 MessageFormat specification}.
   */
  let DefaultFunctions = {
      /**
       * Supports formatting and selection as defined in LDML 47 for the
       * {@link https://www.unicode.org/reports/tr35/tr35-75/tr35-messageFormat.html#the-integer-function | :integer function}.
       *
       * The `operand` must be a number, BigInt, or string representing a JSON number,
       * or an object wrapping such a value, with a `valueOf()` accessor and an optional `options` object.
       */
      integer,
      /**
       * Supports formatting and selection as defined in LDML 47 for the
       * {@link https://www.unicode.org/reports/tr35/tr35-75/tr35-messageFormat.html#the-number-function | :number function}.
       *
       * The `operand` must be a number, BigInt, or string representing a JSON number,
       * or an object wrapping such a value, with a `valueOf()` accessor and an optional `options` object.
       */
      number,
      /**
       * Supports formatting and selection as defined in LDML 47 for the
       * {@link https://www.unicode.org/reports/tr35/tr35-75/tr35-messageFormat.html#the-string-function | :string function}.
       *
       * The `operand` must be a stringifiable value.
       * An `undefined` value is resolved as an empty string.
       */
      string
  };
  DefaultFunctions = Object.freeze(Object.assign(Object.create(null), DefaultFunctions));
  /**
   * Functions classified as DRAFT by the
   * {@link https://www.unicode.org/reports/tr35/tr35-75/tr35-messageFormat.html#contents-of-part-9-messageformat | LDML 47 MessageFormat specification}.
   *
   * These are liable to change, and are **_not_** covered by any stability guarantee.
   *
   * ```js
   * import { MessageFormat } from 'messageformat';
   * import { DraftFunctions } from 'messageformat/functions';
   *
   * const mf = new MessageFormat(locale, msgsrc, { functions: DraftFunctions });
   * ```
   *
   * @beta
   */
  let DraftFunctions = {
      /**
       * Supports formatting as defined in LDML 47 for the
       * {@link https://www.unicode.org/reports/tr35/tr35-75/tr35-messageFormat.html#the-currency-function | :currency function}.
       *
       * The `operand` must be a number, BigInt, or string representing a JSON number,
       * or an object wrapping such a value, with a `valueOf()` accessor and an optional `options` object.
       *
       * The `currency` option must be provided by either the operand's `options` or the `exprOpt` expression options.
       */
      currency,
      /**
       * Supports formatting as defined in LDML 47 for the
       * {@link https://www.unicode.org/reports/tr35/tr35-75/tr35-messageFormat.html#the-date-function | :date function}.
       *
       * The `operand` must be a Date, number, or string representing a date,
       * or an object wrapping such a value, with a `valueOf()` accessor and an optional `options` object.
       */
      date,
      /**
       * Supports formatting as defined in LDML 47 for the
       * {@link https://www.unicode.org/reports/tr35/tr35-75/tr35-messageFormat.html#the-datetime-function | :datetime function}.
       *
       * The `operand` must be a Date, number, or string representing a date,
       * or an object wrapping such a value, with a `valueOf()` accessor and an optional `options` object.
       */
      datetime,
      /**
       * Supports formatting and selection as defined in LDML 47 for the
       * {@link https://www.unicode.org/reports/tr35/tr35-75/tr35-messageFormat.html#the-math-function | :math function}.
       *
       * The `operand` must be a number, BigInt, or string representing a JSON number,
       * or an object wrapping such a value, with a `valueOf()` accessor and an optional `options` object.
       */
      math,
      /**
       * Supports formatting as defined in LDML 47 for the
       * {@link https://www.unicode.org/reports/tr35/tr35-75/tr35-messageFormat.html#the-time-function | :time function}.
       *
       * The `operand` must be a Date, number, or string representing a date,
       * or an object wrapping such a value, with a `valueOf()` accessor and an optional `options` object.
       */
      time,
      /**
       * Supports formatting as defined in LDML 47 for the
       * {@link https://www.unicode.org/reports/tr35/tr35-75/tr35-messageFormat.html#the-unit-function | :unit function}.
       *
       * The `operand` must be a number, BigInt, or string representing a JSON number,
       * or an object wrapping such a value, with a `valueOf()` accessor and an optional `options` object.
       *
       * The `unit` option must be provided by either the operand's `options` or the `exprOpt` expression options.
       */
      unit
  };
  DraftFunctions = Object.freeze(Object.assign(Object.create(null), DraftFunctions));

  const BIDI_ISOLATE = Symbol('bidi-isolate');

  const fallback = (source = '�') => ({
      type: 'fallback',
      source,
      toParts: () => [{ type: 'fallback', source }],
      toString: () => `{${source}}`
  });

  const unknown = (source, input) => ({
      type: 'unknown',
      source,
      dir: 'auto',
      toParts: () => [{ type: 'unknown', source, value: input }],
      toString: () => String(input),
      valueOf: () => input
  });

  class MessageFunctionContext {
      #ctx;
      #litKeys;
      dir;
      id;
      source;
      constructor(ctx, source, options) {
          this.#ctx = ctx;
          this.dir = undefined;
          const dirOpt = options?.get('u:dir');
          if (dirOpt) {
              const dir = String(resolveValue(ctx, dirOpt));
              if (dir === 'ltr' || dir === 'rtl' || dir === 'auto') {
                  this.dir = dir;
              }
              else if (dir !== 'inherit') {
                  const msg = 'Unsupported value for u:dir option';
                  const optSource = getValueSource(dirOpt);
                  ctx.onError(new MessageResolutionError('bad-option', msg, optSource));
              }
          }
          const idOpt = options?.get('u:id');
          this.id = idOpt ? String(resolveValue(ctx, idOpt)) : undefined;
          if (options) {
              this.#litKeys = new Set();
              for (const [key, value] of options) {
                  if (value.type === 'literal')
                      this.#litKeys.add(key);
              }
          }
          this.source = source;
      }
      get literalOptionKeys() {
          return new Set(this.#litKeys);
      }
      get localeMatcher() {
          return this.#ctx.localeMatcher;
      }
      get locales() {
          return this.#ctx.locales.map(String);
      }
      get onError() {
          return this.#ctx.onError;
      }
  }

  function resolveFunctionRef(ctx, operand, { name, options }) {
      const source = getValueSource(operand) ?? `:${name}`;
      try {
          const fnInput = operand ? [resolveValue(ctx, operand)] : [];
          const rf = ctx.functions[name];
          if (!rf) {
              throw new MessageError('unknown-function', `Unknown function :${name}`);
          }
          const msgCtx = new MessageFunctionContext(ctx, source, options);
          const opt = resolveOptions(ctx, options);
          let res = rf(msgCtx, opt, ...fnInput);
          if (res === null ||
              (typeof res !== 'object' && typeof res !== 'function') ||
              typeof res.type !== 'string' ||
              typeof res.source !== 'string') {
              throw new MessageError('bad-function-result', `Function :${name} did not return a MessageValue`);
          }
          if (msgCtx.dir)
              res = { ...res, dir: msgCtx.dir, [BIDI_ISOLATE]: true };
          if (msgCtx.id && typeof res.toParts === 'function') {
              return {
                  ...res,
                  toParts() {
                      const parts = res.toParts();
                      for (const part of parts)
                          part.id = msgCtx.id;
                      return parts;
                  }
              };
          }
          return res;
      }
      catch (error) {
          ctx.onError(error);
          return fallback(source);
      }
  }
  function resolveOptions(ctx, options) {
      const opt = Object.create(null);
      if (options) {
          for (const [name, value] of options) {
              if (!name.startsWith('u:'))
                  opt[name] = resolveValue(ctx, value);
          }
      }
      return opt;
  }

  function resolveLiteral(ctx, lit) {
      const msgCtx = new MessageFunctionContext(ctx, `|${lit.value}|`);
      return string(msgCtx, {}, lit.value);
  }

  function resolveExpression(ctx, { arg, functionRef }) {
      if (functionRef) {
          return resolveFunctionRef(ctx, arg, functionRef);
      }
      switch (arg?.type) {
          case 'literal':
              return resolveLiteral(ctx, arg);
          case 'variable':
              return resolveVariableRef(ctx, arg);
          default:
              // @ts-expect-error - should never happen
              throw new Error(`Unsupported expression: ${arg?.type}`);
      }
  }

  /**
   * Declarations aren't resolved until they're requierd,
   * and their resolution order matters for variable resolution.
   * This internal class is used to store any required data,
   * and to allow for `instanceof` detection.
   *
   * @internal
   */
  class UnresolvedExpression {
      expression;
      scope;
      constructor(expression, scope) {
          this.expression = expression;
          this.scope = scope;
      }
  }
  const isScope = (scope) => scope !== null && (typeof scope === 'object' || typeof scope === 'function');
  /**
   * Looks for the longest matching `.` delimited starting substring of name.
   * @returns `undefined` if value not found
   */
  function getValue(scope, name) {
      if (isScope(scope)) {
          if (name in scope)
              return scope[name];
          const parts = name.split('.');
          for (let i = parts.length - 1; i > 0; --i) {
              const head = parts.slice(0, i).join('.');
              if (head in scope) {
                  const tail = parts.slice(i).join('.');
                  return getValue(scope[head], tail);
              }
          }
          for (const [key, value] of Object.entries(scope)) {
              if (key.normalize() === name)
                  return value;
          }
      }
      return undefined;
  }
  /**
   * Get the raw value of a variable.
   * Resolves declarations as necessary
   *
   * @internal
   * @returns `unknown` or `any` for input values;
   *   `MessageValue` for `.input` and `.local` declaration values.
   */
  function lookupVariableRef(ctx, { name }) {
      const value = getValue(ctx.scope, name);
      if (value === undefined) {
          const source = '$' + name;
          const msg = `Variable not available: ${source}`;
          ctx.onError(new MessageResolutionError('unresolved-variable', msg, source));
      }
      else if (value instanceof UnresolvedExpression) {
          const local = resolveExpression(value.scope ? { ...ctx, scope: value.scope } : ctx, value.expression);
          ctx.scope[name] = local;
          ctx.localVars.add(local);
          return local;
      }
      return value;
  }
  function resolveVariableRef(ctx, ref) {
      const source = '$' + ref.name;
      const value = lookupVariableRef(ctx, ref);
      let type = typeof value;
      if (type === 'object') {
          const mv = value;
          if (mv.type === 'fallback')
              return fallback(source);
          if (ctx.localVars.has(mv))
              return mv;
          if (value instanceof Number)
              type = 'number';
          else if (value instanceof String)
              type = 'string';
      }
      switch (type) {
          case 'bigint':
          case 'number': {
              const msgCtx = new MessageFunctionContext(ctx, source);
              return ctx.functions.number(msgCtx, {}, value);
          }
          case 'string': {
              const msgCtx = new MessageFunctionContext(ctx, source);
              return ctx.functions.string(msgCtx, {}, value);
          }
      }
      return value === undefined ? fallback(source) : unknown(source, value);
  }

  function resolveValue(ctx, value) {
      switch (value.type) {
          case 'literal':
              return value.value;
          case 'variable':
              return lookupVariableRef(ctx, value);
          default:
              // @ts-expect-error - should never happen
              throw new Error(`Unsupported value: ${value.type}`);
      }
  }
  function getValueSource(value) {
      switch (value?.type) {
          case 'literal':
              return ('|' + value.value.replaceAll('\\', '\\\\').replaceAll('|', '\\|') + '|');
          case 'variable':
              return '$' + value.name;
          default:
              return undefined;
      }
  }

  function formatMarkup(ctx, { kind, name, options }) {
      const source = kind === 'close' ? `/${name}` : kind === 'open' ? `#${name}` : `#${name}/`;
      const part = { type: 'markup', kind, source, name };
      if (options?.size) {
          part.options = {};
          for (const [name, value] of options) {
              if (name === 'u:dir') {
                  const msg = `The option ${name} is not valid for markup`;
                  const optSource = getValueSource(value);
                  ctx.onError(new MessageResolutionError('bad-option', msg, optSource));
              }
              else {
                  let rv = resolveValue(ctx, value);
                  if (typeof rv === 'object' && typeof rv?.valueOf === 'function') {
                      rv = rv.valueOf();
                  }
                  if (name === 'u:id')
                      part.id = String(rv);
                  else
                      part.options[name] = rv;
              }
          }
      }
      return part;
  }

  function selectPattern(context, message) {
      switch (message.type) {
          case 'message':
              return message.pattern;
          case 'select': {
              const ctx = message.selectors.map(sel => {
                  const selector = resolveVariableRef(context, sel);
                  let selectKey;
                  if (typeof selector.selectKey === 'function') {
                      selectKey = selector.selectKey.bind(selector);
                  }
                  else {
                      context.onError(new MessageSelectionError('bad-selector'));
                      selectKey = () => null;
                  }
                  return {
                      selectKey,
                      best: null,
                      keys: null
                  };
              });
              let candidates = message.variants;
              loop: for (let i = 0; i < ctx.length; ++i) {
                  const sc = ctx[i];
                  if (!sc.keys) {
                      sc.keys = new Set();
                      for (const { keys } of candidates) {
                          const key = keys[i];
                          if (!key)
                              break loop; // key-mismatch error
                          if (key.type !== '*')
                              sc.keys.add(key.value);
                      }
                  }
                  try {
                      sc.best = sc.keys.size ? sc.selectKey(sc.keys) : null;
                  }
                  catch (error) {
                      context.onError(new MessageSelectionError('bad-selector', error));
                      sc.selectKey = () => null;
                      sc.best = null;
                  }
                  // Leave out all candidate variants that aren't the best,
                  // or only the catchall ones, if nothing else matches.
                  candidates = candidates.filter(v => {
                      const k = v.keys[i];
                      if (k.type === '*')
                          return sc.best == null;
                      return sc.best === k.value;
                  });
                  // If we've run out of candidates,
                  // drop the previous best key of the preceding selector,
                  // reset all subsequent key sets,
                  // and restart the loop.
                  if (candidates.length === 0) {
                      if (i === 0)
                          break; // No match; should not happen
                      const prev = ctx[i - 1];
                      if (prev.best == null)
                          prev.keys?.clear();
                      else
                          prev.keys?.delete(prev.best);
                      for (let j = i; j < ctx.length; ++j)
                          ctx[j].keys = null;
                      candidates = message.variants;
                      i = -1;
                  }
              }
              const res = candidates[0];
              if (!res) {
                  // This should not be possible with a valid message.
                  context.onError(new MessageSelectionError('no-match'));
                  return [];
              }
              return res.value;
          }
          default:
              context.onError(new MessageSelectionError('bad-selector'));
              return [];
      }
  }

  /**
   * A message formatter for that implements the
   * {@link https://www.unicode.org/reports/tr35/tr35-75/tr35-messageFormat.html#contents-of-part-9-messageformat | LDML 47 MessageFormat}
   * specification as well as the {@link https://github.com/tc39/proposal-intl-messageformat/ | TC39 Intl.MessageFormat proposal}.
   *
   * @category Formatting
   * @typeParam T - The `type` used by custom message functions, if any.
   *   These extend the {@link DefaultFunctions | default functions}.
   * @typeParam P - The formatted-parts `type` used by any custom message values.
   */
  class MessageFormat {
      #bidiIsolation;
      #dir;
      #localeMatcher;
      #locales;
      #message;
      #functions;
      constructor(locales, source, options) {
          this.#bidiIsolation = options?.bidiIsolation !== 'none';
          this.#localeMatcher = options?.localeMatcher ?? 'best fit';
          this.#locales = Array.isArray(locales)
              ? locales.map(lc => new Intl.Locale(lc))
              : locales
                  ? [new Intl.Locale(locales)]
                  : [];
          this.#dir = options?.dir ?? getLocaleDir(this.#locales[0]);
          this.#message = typeof source === 'string' ? parseMessage(source) : source;
          validate(this.#message);
          this.#functions = options?.functions
              ? Object.assign(Object.create(null), DefaultFunctions, options.functions)
              : DefaultFunctions;
      }
      /**
       * Format a message to a string.
       *
       * ```js
       * import { MessageFormat } from 'messageformat';
       * import { DraftFunctions } from 'messageformat/functions';
       *
       * const msg = 'Hello {$user.name}, today is {$date :date style=long}';
       * const mf = new MessageFormat('en', msg, { functions: DraftFunctions });
       * mf.format({ user: { name: 'Kat' }, date: new Date('2025-03-01') });
       * ```
       *
       * ```js
       * 'Hello Kat, today is March 1, 2025'
       * ```
       *
       * @param msgParams - Values that may be referenced by `$`-prefixed variable references.
       *   To refer to an inner property of an object value,
       *   use `.` as a separator; in case of conflict, the longest starting substring wins.
       * @param onError - Called in case of error.
       *   If not set, errors are by default logged as warnings.
       */
      format(msgParams, onError) {
          const ctx = this.#createContext(msgParams, onError);
          let res = '';
          for (const elem of selectPattern(ctx, this.#message)) {
              if (typeof elem === 'string') {
                  res += elem;
              }
              else if (elem.type === 'markup') {
                  // Handle errors, but discard results
                  formatMarkup(ctx, elem);
              }
              else {
                  let mv;
                  try {
                      mv = resolveExpression(ctx, elem);
                      if (typeof mv.toString === 'function') {
                          if (this.#bidiIsolation &&
                              (this.#dir !== 'ltr' || mv.dir !== 'ltr' || mv[BIDI_ISOLATE])) {
                              const pre = mv.dir === 'ltr' ? LRI : mv.dir === 'rtl' ? RLI : FSI;
                              res += pre + mv.toString() + PDI;
                          }
                          else {
                              res += mv.toString();
                          }
                      }
                      else {
                          const msg = 'Message part is not formattable';
                          throw new MessageError('not-formattable', msg);
                      }
                  }
                  catch (error) {
                      ctx.onError(error);
                      const errStr = `{${mv?.source ?? '�'}}`;
                      res += this.#bidiIsolation ? FSI + errStr + PDI : errStr;
                  }
              }
          }
          return res;
      }
      /**
       * Format a message to a sequence of parts.
       *
       * ```js
       * import { MessageFormat } from 'messageformat';
       * import { DraftFunctions } from 'messageformat/functions';
       *
       * const msg = 'Hello {$user.name}, today is {$date :date style=long}';
       * const mf = new MessageFormat('en', msg, { functions: DraftFunctions });
       * mf.formatToParts({ user: { name: 'Kat' }, date: new Date('2025-03-01') });
       * ```
       *
       * ```js
       * [
       *   { type: 'text', value: 'Hello ' },
       *   { type: 'bidiIsolation', value: '\u2068' },
       *   { type: 'string', source: '$user.name', locale: 'en', value: 'Kat' },
       *   { type: 'bidiIsolation', value: '\u2069' },
       *   { type: 'text', value: ', today is ' },
       *   {
       *     type: 'datetime',
       *     source: '$date',
       *     dir: 'ltr',
       *     locale: 'en',
       *     parts: [
       *       { type: 'month', value: 'March' },
       *       { type: 'literal', value: ' ' },
       *       { type: 'day', value: '1' },
       *       { type: 'literal', value: ', ' },
       *       { type: 'year', value: '2025' }
       *     ]
       *   }
       * ]
       * ```
       *
       * @param msgParams - Values that may be referenced by `$`-prefixed variable references.
       *   To refer to an inner property of an object value,
       *   use `.` as a separator; in case of conflict, the longest starting substring wins.
       * @param onError - Called in case of error.
       *   If not set, errors are by default logged as warnings.
       */
      formatToParts(msgParams, onError) {
          const ctx = this.#createContext(msgParams, onError);
          const parts = [];
          for (const elem of selectPattern(ctx, this.#message)) {
              if (typeof elem === 'string') {
                  parts.push({ type: 'text', value: elem });
              }
              else if (elem.type === 'markup') {
                  parts.push(formatMarkup(ctx, elem));
              }
              else {
                  let mv;
                  try {
                      mv = resolveExpression(ctx, elem);
                      if (typeof mv.toParts === 'function') {
                          // Let's presume that parts that look like MessageNumberPart or MessageStringPart are such.
                          const mp = mv.toParts();
                          if (this.#bidiIsolation &&
                              (this.#dir !== 'ltr' || mv.dir !== 'ltr' || mv[BIDI_ISOLATE])) {
                              const pre = mv.dir === 'ltr' ? LRI : mv.dir === 'rtl' ? RLI : FSI;
                              parts.push({ type: 'bidiIsolation', value: pre }, ...mp, {
                                  type: 'bidiIsolation',
                                  value: PDI
                              });
                          }
                          else {
                              parts.push(...mp);
                          }
                      }
                      else {
                          const msg = 'Message part is not formattable';
                          throw new MessageError('not-formattable', msg);
                      }
                  }
                  catch (error) {
                      ctx.onError(error);
                      const fb = {
                          type: 'fallback',
                          source: mv?.source ?? '�'
                      };
                      if (this.#bidiIsolation) {
                          parts.push({ type: 'bidiIsolation', value: FSI }, fb, {
                              type: 'bidiIsolation',
                              value: PDI
                          });
                      }
                      else {
                          parts.push(fb);
                      }
                  }
              }
          }
          return parts;
      }
      #createContext(msgParams, onError = (error) => {
          // Emit warning for errors by default
          try {
              process.emitWarning(error);
          }
          catch {
              console.warn(error);
          }
      }) {
          const scope = { ...msgParams };
          for (const decl of this.#message.declarations) {
              scope[decl.name] = new UnresolvedExpression(decl.value, decl.type === 'input' ? (msgParams ?? {}) : undefined);
          }
          const ctx = {
              onError,
              localeMatcher: this.#localeMatcher,
              locales: this.#locales,
              localVars: new WeakSet(),
              functions: this.#functions,
              scope
          };
          return ctx;
      }
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
    var _getLastOfPath2 = getLastOfPath(object, path),
      obj = _getLastOfPath2.obj,
      k = _getLastOfPath2.k;
    if (!obj) return undefined;
    return obj[k];
  }

  function getDefaults() {
    return {
      memoize: true,
      memoizeFallback: false,
      bindI18n: '',
      bindI18nStore: '',
      mf2DraftFunctions: false,
      mf2Functions: undefined,
      parseErrorHandler: function parseErrorHandler(err, key, res, _options) {
        return res;
      },
      parseLngForMF2: function parseLngForMF2(lng) {
        return lng;
      }
    };
  }
  var MF2 = /*#__PURE__*/function () {
    function MF2(options) {
      _classCallCheck(this, MF2);
      this.type = 'i18nFormat';
      this.mem = {};
      this.init(null, options);
    }
    return _createClass(MF2, [{
      key: "init",
      value: function init(i18next, options) {
        var _this = this;
        this.options = Object.assign(getDefaults(), this.options, options, i18next && i18next.options && i18next.options.i18nFormat);
        if (i18next) {
          var _this$options = this.options,
            bindI18n = _this$options.bindI18n,
            bindI18nStore = _this$options.bindI18nStore,
            memoize = _this$options.memoize;
          i18next.MessageFormat = Intl.MessageFormat;
          i18next.MF2 = this;
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
      key: "parse",
      value: function parse(msgsrc, options, lng, ns, key, info) {
        var _this2 = this;
        var hadSuccessfulLookup = info && info.resolved && info.resolved.res;
        var memKey = this.options.memoize && "".concat(lng, ".").concat(ns, ".").concat(key.replace(/\./g, '###'));
        var fc;
        if (this.options.memoize) {
          fc = getPath(this.mem, memKey);
        }
        try {
          if (!fc) {
            var locale = this.options.parseLngForMF2(lng);
            var functions = this.options.mf2Functions;
            if (this.options.mf2DraftFunctions) functions = _objectSpread2(_objectSpread2({}, DraftFunctions), functions);
            // without ignoreTag, react-i18next <Trans> translations with <0></0> placeholders
            // will fail to parse, as MessageFormat expects them to be defined in the
            // options passed to fc.format() as { 0: (children) => string }
            // but the replacement of placeholders is done in react-i18next
            fc = new MessageFormat(locale, msgsrc, {
              functions: functions
            });
            if (this.options.memoize && (this.options.memoizeFallback || !info || hadSuccessfulLookup)) setPath(this.mem, memKey, fc);
          }
          return fc.format(options, function (err) {
            return _this2.options.parseErrorHandler(err, key, msgsrc, options);
          });
        } catch (err) {
          return this.options.parseErrorHandler(err, key, msgsrc, options);
        }
      }

      // eslint-disable-next-line class-methods-use-this
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
  }();
  MF2.type = 'i18nFormat';

  return MF2;

}));
