import { MessageFormat } from 'messageformat';
import { DraftFunctions } from 'messageformat/functions';
import { getPath, setPath } from './utils.js';

const DOCS_URL = 'https://www.i18next.com/how-to/using-icu-or-mf2';
const PLURAL_SUFFIXES = ['zero', 'one', 'two', 'few', 'many', 'other'];

function getDefaults() {
  return {
    memoize: true,
    memoizeFallback: false,
    bindI18n: '',
    bindI18nStore: '',
    mf2DraftFunctions: false,
    mf2Functions: undefined,
    bidiIsolation: undefined,
    parseErrorHandler: (err, key, res, _options) => res,
    // the documented name is parseLngForMf2; parseLngForMF2 is still read for backwards compatibility
    parseLngForMf2: undefined,
    parseLngForMF2: undefined,
  };
}

function errorWarning(err, msgsrc, isParseError, where) {
  if (isParseError && msgsrc && typeof msgsrc === 'object') {
    return `${where} resolved to an object or array, but i18next-mf2 does not support returnObjects or joinArrays and returns the raw value unformatted.`;
  }
  // {{ is valid MF2 in complex messages (.input, .local, .match), so only hint at it for a simple message that failed to parse
  if (
    isParseError &&
    typeof msgsrc === 'string' &&
    msgsrc.includes('{{') &&
    !/^\s*\./.test(msgsrc)
  ) {
    return `${where} could not be parsed (${err.message}). It contains "{{": i18next interpolation like {{name}} does not work with MF2, use {$name}.`;
  }
  return `${where} could not be ${isParseError ? 'parsed' : 'formatted'}: ${err.message}`;
}

class MF2 {
  constructor(options) {
    this.type = 'i18nFormat';
    this.mem = {};
    this.warned = new Set();

    this.init(null, options);
  }

  init(i18next, options) {
    this.options = Object.assign(
      getDefaults(),
      this.options,
      options,
      i18next && i18next.options && i18next.options.i18nFormat,
    );

    if (i18next) {
      const { bindI18n, bindI18nStore, memoize } = this.options;

      i18next.MessageFormat = MessageFormat;
      i18next.MF2 = this;
      this.i18next = i18next;
      // the warnings below only run with i18next `debug: true`, like i18next's own warnings
      this.debug = !!(i18next.options && i18next.options.debug);

      if (
        this.debug &&
        i18next.options.interpolation &&
        i18next.options.interpolation.escapeValue !== false
      ) {
        this.warn(
          'interpolation.escapeValue is not applied, values are inserted without HTML escaping. Escape values before passing them to t, or set interpolation.escapeValue: false if your output is escaped elsewhere (e.g. by React).',
        );
      }

      if (memoize) {
        if (bindI18n) {
          i18next.on(bindI18n, () => this.clearCache());
        }

        if (bindI18nStore) {
          i18next.store.on(bindI18nStore, () => this.clearCache());
        }
      }
    }
  }

  parse(msgsrc, options, lng, ns, key, info) {
    const hadSuccessfulLookup = info && info.resolved && info.resolved.res;
    // an array path, so dots in ns or key do not nest the memo deeper
    const memKey = this.options.memoize && [lng, ns, key];

    let fc;
    if (this.options.memoize) {
      // the memo key does not contain the message, so compare it: a message changed by
      // addResource, reloadResources or HMR is compiled again instead of served stale
      const memo = getPath(this.mem, memKey);
      if (memo && memo.msgsrc === msgsrc) fc = memo.fc;
    }

    const where = this.debug && `key "${key}" (${lng}/${ns})`;
    try {
      if (!fc) {
        if (
          this.debug &&
          typeof msgsrc === 'string' &&
          msgsrc.includes('$t(') &&
          this.firstTime(`nesting ${lng} ${ns} ${key}`)
        ) {
          this.warn(
            `${where} contains "$t(", but i18next-mf2 does not support nesting, the text is output as is.`,
          );
        }
        const parseLng = this.options.parseLngForMf2 || this.options.parseLngForMF2;
        const locale = parseLng ? parseLng(lng) : lng;
        let functions = this.options.mf2Functions;
        if (this.options.mf2DraftFunctions) functions = { ...DraftFunctions, ...functions };
        // react-i18next <Trans> placeholders like <0></0> are plain text in MF2,
        // so they pass through untouched and react-i18next replaces them
        const mfOptions = { functions };
        if (this.options.bidiIsolation) mfOptions.bidiIsolation = this.options.bidiIsolation;
        fc = new MessageFormat(locale, msgsrc, mfOptions);
        // {{name}} from i18next parses as an MF2 quoted pattern and renders "name". This also matches
        // a valid quoted pattern without placeholders ({{ text}}), which is rare enough to accept.
        if (
          this.debug &&
          typeof msgsrc === 'string' &&
          /^\s*\{\{[^{}]*\}\}\s*$/.test(msgsrc) &&
          this.firstTime(`syntax ${lng} ${ns} ${key}`)
        ) {
          this.warn(
            `${where} renders ${msgsrc.trim()} as plain text: i18next interpolation like {{name}} does not work with MF2, use {$name}.`,
          );
        }
        if (this.options.memoize && (this.options.memoizeFallback || !info || hadSuccessfulLookup))
          setPath(this.mem, memKey, { msgsrc, fc });
      }

      // like i18next, values can also be passed in a replace object
      const values =
        options && options.replace && typeof options.replace === 'object'
          ? { ...options, ...options.replace }
          : options;
      return fc.format(values, (err) => {
        if (this.debug && this.firstTime(`error ${lng} ${ns} ${key}`)) {
          this.warn(errorWarning(err, msgsrc, false, where));
        }
        this.options.parseErrorHandler(err, key, msgsrc, options);
      });
    } catch (err) {
      if (this.debug && this.firstTime(`error ${lng} ${ns} ${key}`)) {
        this.warn(errorWarning(err, msgsrc, !fc, where));
      }
      return this.options.parseErrorHandler(err, key, msgsrc, options);
    }
  }

  addLookupKeys(finalKeys, key, code, ns, options) {
    // no additional keys needed for select or plural
    // so there is no need to add keys to that finalKeys array
    if (this.debug && options) this.checkSuffixKeys(key, code, ns, options);
    return finalKeys;
  }

  // i18next would look up key_one, key_male, ... at this point; MF2 does not, so tell if such keys exist
  checkSuffixKeys(key, code, ns, { count, context }) {
    const { pluralSeparator = '_', contextSeparator = '_' } = this.i18next.options;
    const store = this.i18next.services.resourceStore;
    const where = `key "${key}" (${code}/${ns})`;

    if (count !== undefined && this.firstTime(`plural ${code} ${ns} ${key}`)) {
      const found = PLURAL_SUFFIXES.concat(
        PLURAL_SUFFIXES.map((s) => `ordinal${pluralSeparator}${s}`),
      )
        .map((s) => `${key}${pluralSeparator}${s}`)
        .filter((k) => store.getResource(code, ns, k) !== undefined);
      if (found.length) {
        this.warn(
          `${where} was called with count, but i18next-mf2 does not look up plural suffix keys (${found.join(', ')}). Put the plural into the message: .input {$count :number} .match $count one {{{$count} item}} * {{{$count} items}}`,
        );
      }
    }

    const contextKey = `${key}${contextSeparator}${context}`;
    if (
      context !== undefined &&
      context !== '' &&
      this.firstTime(`context ${code} ${ns} ${contextKey}`) &&
      store.getResource(code, ns, contextKey) !== undefined
    ) {
      this.warn(
        `${where} was called with context "${context}", but i18next-mf2 does not look up context keys (${contextKey}). Use a selector in the message: .input {$context :string} .match $context ${context} {{...}} * {{...}}`,
      );
    }
  }

  // true the first time an id is seen, so each warning is logged once
  firstTime(id) {
    if (this.warned.has(id)) return false;
    this.warned.add(id);
    return true;
  }

  warn(message) {
    this.i18next.services.logger.warn(`i18next-mf2: ${message} See ${DOCS_URL}`);
  }

  clearCache() {
    this.mem = {};
  }
}

MF2.type = 'i18nFormat';

export default MF2;
