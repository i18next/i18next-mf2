import { MessageFormat } from 'messageformat';
import { DraftFunctions } from 'messageformat/functions';
import { getPath, setPath } from './utils.js';

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

class MF2 {
  constructor(options) {
    this.type = 'i18nFormat';
    this.mem = {};

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
    const memKey = this.options.memoize && `${lng}.${ns}.${key.replace(/\./g, '###')}`;

    let fc;
    if (this.options.memoize) {
      fc = getPath(this.mem, memKey);
    }

    try {
      if (!fc) {
        const parseLng = this.options.parseLngForMf2 || this.options.parseLngForMF2;
        const locale = parseLng ? parseLng(lng) : lng;
        let functions = this.options.mf2Functions;
        if (this.options.mf2DraftFunctions) functions = { ...DraftFunctions, ...functions };
        // react-i18next <Trans> placeholders like <0></0> are plain text in MF2,
        // so they pass through untouched and react-i18next replaces them
        const mfOptions = { functions };
        if (this.options.bidiIsolation) mfOptions.bidiIsolation = this.options.bidiIsolation;
        fc = new MessageFormat(locale, msgsrc, mfOptions);
        if (this.options.memoize && (this.options.memoizeFallback || !info || hadSuccessfulLookup))
          setPath(this.mem, memKey, fc);
      }

      return fc.format(options, (err) => this.options.parseErrorHandler(err, key, msgsrc, options));
    } catch (err) {
      return this.options.parseErrorHandler(err, key, msgsrc, options);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  addLookupKeys(finalKeys, _key, _code, _ns, _options) {
    // no additional keys needed for select or plural
    // so there is no need to add keys to that finalKeys array
    return finalKeys;
  }

  clearCache() {
    this.mem = {};
  }
}

MF2.type = 'i18nFormat';

export default MF2;
