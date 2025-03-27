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
    parseErrorHandler: (err, key, res, _options) => res,
    parseLngForMF2: (lng) => lng,
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

      i18next.MessageFormat = Intl.MessageFormat;
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
        const locale = this.options.parseLngForMF2(lng);
        let functions = this.options.mf2Functions;
        if (this.options.mf2DraftFunctions) functions = { ...DraftFunctions, ...functions };
        // without ignoreTag, react-i18next <Trans> translations with <0></0> placeholders
        // will fail to parse, as MessageFormat expects them to be defined in the
        // options passed to fc.format() as { 0: (children) => string }
        // but the replacement of placeholders is done in react-i18next
        fc = new MessageFormat(locale, msgsrc, { functions });
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
