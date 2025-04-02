# Introduction

[![npm version](https://img.shields.io/npm/v/i18next-mf2.svg?style=flat-square)](https://www.npmjs.com/package/i18next-mf2)

This changes i18n format from i18next json to Unicode MessageFormat 2.
See [messageformat.unicode.org](https://messageformat.unicode.org/) for more on the syntax,
and [messageformat.github.io](https://messageformat.github.io/) for its JavaScript implementation.

## Advice

When using this module, only the Unicode MessageFormat 2 syntax is respected,
this means the i18next format interpolation will not work.
So for example instead of `Hi {{name}}!` it is `Hi {$name}!`

# Getting started

Source can be loaded via [npm](https://www.npmjs.com/package/i18next-mf2) or [downloaded](https://github.com/i18next/i18next-mf2/blob/master/i18nextmf2.min.js) from this repo.

```
# npm package
$ npm install i18next-mf2
# peer dependencies
$ npm install --save-exact messageformat@next
```

Wiring up:

```js
import i18next from 'i18next';
import mf2 from 'i18next-mf2';

i18next.use(mf2).init(i18nextOptions);
```

- As with all modules you can either pass the constructor function (class) to the i18next.use or a concrete instance.
- If you don't use a module loader it will be added to `window.i18nextMf2`

## Backend Options

```js
{
  // per default MF2 functions are parsed once and cached for subsequent calls
  memoize: true,

  // memoize if not having a lookup and just using the key fallback as value
  memoizeFallback: false,

  // which events should clear the cache, can be set to false or string of events separated by " "
  bindI18n: '',

  // which events on resourceSource should clear the cache, can be set to false or string of events separated by " "
  bindI18nStore: '',

  // whether to enable MF2 functions that are not yet stable:
  // :date, :datetime, :time, :math, :currency, :unit
  mf2DraftFunctions: false,

  // custom MF2 message functions
  mf2Functions: undefined,

  // Will be run when parser throws an error. Can return any string, which can be used as a fallback, in case of broken translation.
  // If omitted, the default swallows the error and returns the unsubstituted message source string
  parseErrorHandler: (err, key, msgsrc, options) => {},

  // Transform the language code prior to MF2 locale parsing, useful for supporting psuedo-locales like en-ZZ
  // If omitted, the default leaves the language code as is
  parseLngForMf2: (lng) => lng,
}
```

Options can be passed in by setting options.i18nFormat in i18next.init:

```js
import i18next from 'i18next';
import MF2 from 'i18next-mf2';

i18next.use(MF2).init({
  i18nFormat: options,
});
```

### More complete sample

```js
import i18next from 'i18next';
import MF2 from 'i18next-mf2';

i18next.use(MF2).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        key: 'Today is {$today :date style=medium}.',
      },
    },
  },
  i18nFormat: {
    mf2DraftFunctions: true,
  },
});

i18next.t('key', { today: new Date('2022-02-02') }); // -> 'Today is Feb 2, 2022.'
```

## hints

While using `i18next-mf2` none of the i18next specific stuff will be available.
You will have to rely on the functions provided by Unicode MessageFormat.

All extra features build around i18next plurals, interpolation, context do not get applied to Unicode MessageFormat based keys.

---

<h3 align="center">Gold Sponsors</h3>

<p align="center">
  <a href="https://locize.com/" target="_blank">
    <img src="https://raw.githubusercontent.com/i18next/i18next/master/assets/locize_sponsor_240.gif" width="240px">
  </a>
</p>
