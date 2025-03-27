import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18next from 'i18next';
import MF2src from '../src';
import MF2dist from '../i18nextMF2.js';
import MF2min from '../i18nextMF2.min.js';

let hasIntl;
try {
  const locales = ['en', 'ar-EG'];
  hasIntl =
    Intl.DateTimeFormat.supportedLocalesOf(locales).length === 2 &&
    Intl.NumberFormat.supportedLocalesOf(locales).length === 2 &&
    Intl.PluralRules.supportedLocalesOf(locales).length === 2;
} catch (_) {
  hasIntl = false;
}

for (const [name, MF2] of Object.entries(
  process.env.CI ? { src: MF2src, dist: MF2dist, min: MF2min } : { src: MF2src },
)) {
  describe.skipIf(!hasIntl)(`MF2 ${name}`, () => {
    describe('basic parse', () => {
      let mf2;

      beforeEach(() => {
        mf2 = new MF2();
      });

      it('should parse', () => {
        const str = `
        .input {$numPhotos :integer}
        .match $numPhotos
        0 {{You have no photos.}}
        1 {{You have one photo.}}
        * {{You have {$numPhotos} photos.}}`;

        expect(mf2.parse(str, { numPhotos: 1000 }, 'en', 'ns', 'key')).toEqual(
          'You have 1,000 photos.',
        );
      });

      it('should parse (ar-EG)', () => {
        const str = `
        .input {$numVar :number}
        .match $numVar
        zero {{Got {$numVar} zero}}
        one {{Got {$numVar} one}}
        two {{Got {$numVar} two}}
        few {{Got {$numVar} few}}
        many {{Got {$numVar} many}}
        * {{Got {$numVar} other}}`;

        expect(mf2.parse(str, { numVar: 1000 }, 'ar-EG', 'ns', 'key')).toEqual(
          'Got \u2067١٬٠٠٠\u2069 other',
        );
        expect(mf2.parse(str, { numVar: 2 }, 'ar-EG', 'ns', 'key')).toEqual(
          'Got \u2067٢\u2069 two',
        );
        expect(mf2.parse(str, { numVar: 1 }, 'ar-EG', 'ns', 'key')).toEqual(
          'Got \u2067١\u2069 one',
        );
      });

      it('should ignore <0></0> placeholder tags', () => {
        const str = 'This has a <0>placeholder</0> tag in it, and an { $argument }';

        expect(mf2.parse(str, { argument: 'argument' }, 'en', 'ns', 'key')).toBe(
          'This has a <0>placeholder</0> tag in it, and an \u2068argument\u2069',
        );
      });
    });

    describe('with formatter', () => {
      let mf2;

      beforeEach(() => {
        mf2 = new MF2();
      });

      it('should parse with custom format', () => {
        const str1 =
          'number formatting 3 digits {$value :number minimumFractionDigits=3 maximumFractionDigits=3}.';
        const str2 =
          'number formatting 1 digit {$value :number minimumFractionDigits=1 maximumFractionDigits=1}.';

        expect(mf2.parse(str1, { value: 0.333333 }, 'en', 'ns', 'key1')).toEqual(
          'number formatting 3 digits 0.333.',
        );
        expect(mf2.parse(str1, { value: 0.444444 }, 'en', 'ns', 'key1')).toEqual(
          'number formatting 3 digits 0.444.',
        );

        expect(mf2.parse(str2, { value: 0.333333 }, 'en', 'ns', 'key2')).toEqual(
          'number formatting 1 digit 0.3.',
        );
        expect(mf2.parse(str2, { value: 0.444444 }, 'en', 'ns', 'key2')).toEqual(
          'number formatting 1 digit 0.4.',
        );
      });
    });

    describe('with i18next', () => {
      beforeEach(() => {
        i18next.use(MF2).init({
          lng: 'en',
          resources: {
            en: {
              translation: {
                key: `
                .input {$numPhotos :integer}
                .match $numPhotos
                0 {{You have no photos.}}
                1 {{You have one photo.}}
                * {{You have {$numPhotos} photos.}}`,
                bad_key_missing: 'missing {$variable} should not fail the world.',
                bad_key_unescape:
                  'this {- unescapedVariable} is valid for i18next, but not valid for ICU format parser.',
              },
            },
          },
        });
      });

      it('should parse', () => {
        expect(i18next.t('key', { numPhotos: 1000 })).toEqual('You have 1,000 photos.');
        expect(i18next.t('key', { numPhotos: 2000 })).toEqual('You have 2,000 photos.');
      });

      it('should return fallback value for incompatible key values', () => {
        expect(i18next.t('bad_key_missing')).toEqual(
          'missing \u2068{$variable}\u2069 should not fail the world.',
        );
        expect(i18next.t('bad_key_unescape', { unescapedVariable: '<img />' })).toEqual(
          'this {- unescapedVariable} is valid for i18next, but not valid for ICU format parser.',
        );
      });

      it('should clear the cache on bound events', () => {
        i18next.use(MF2).init({
          lng: 'en',
          resources: {},
          i18nFormat: {
            memoize: true,
            bindI18n: 'languageChanged',
            bindI18nStore: 'added',
          },
        });

        const spy = vi.spyOn(i18next.services.i18nFormat, 'clearCache');

        expect(spy).not.toHaveBeenCalled();
        i18next.changeLanguage('ar');
        expect(spy).toHaveBeenCalledTimes(1);
        i18next.addResourceBundle('en', 'translation', { key: 'value' });
        expect(spy).toHaveBeenCalledTimes(2);
      });

      it('should transform the language code', () => {
        i18next.use(MF2).init({
          lng: 'invalid-icu-language',
          resources: { 'invalid-icu-language': { translation: { key: 'Hello {$who}' } } },
          i18nFormat: { parseLngForMF2: (_lng) => 'en-US' },
        });
        expect(i18next.t('key', { who: 'world' })).toEqual('Hello \u2068world\u2069');
      });
    });

    describe('with missing keys', () => {
      it('should call the error handler', () => {
        const parseErrorHandler = vi.fn();
        const mf2 = new MF2({ parseErrorHandler });
        mf2.parse('hello how are you {$name}', {}, 'en', 'ns', 'key1');
        expect(parseErrorHandler).toHaveBeenCalled();
      });
    });

    describe('without missing keys', () => {
      it('should not call the error handler', () => {
        const parseErrorHandler = vi.fn();
        const mf2 = new MF2({ parseErrorHandler });
        mf2.parse('hello how are you {$name}', { name: 'Joseph' }, 'en', 'ns', 'key1');
        expect(parseErrorHandler).toHaveBeenCalledTimes(0);
      });
    });

    describe('documentation examples', () => {
      it('README.md complete sample without mf2DraftFunctions', () => {
        i18next.use(MF2).init({
          lng: 'en',
          resources: { en: { translation: { key: 'Today is {$today :date style=medium}.' } } },
        });
        expect(i18next.t('key', { today: new Date('2022-02-02') })).toEqual(
          'Today is \u2068{$today}\u2069.',
        );
      });

      it('README.md complete sample', () => {
        i18next.use(MF2).init({
          lng: 'en',
          resources: { en: { translation: { key: 'Today is {$today :date style=medium}.' } } },
          i18nFormat: { mf2DraftFunctions: true },
        });
        expect(i18next.t('key', { today: new Date('2022-02-02') })).toEqual(
          'Today is Feb 2, 2022.',
        );
      });
    });
  });
}
