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

Source can be loaded via [npm](https://www.npmjs.com/package/i18next-mf2) or [downloaded](https://unpkg.com/i18next-mf2/i18nextMF2.min.js) from unpkg.

```
$ npm install i18next-mf2
```

The [messageformat](https://www.npmjs.com/package/messageformat) package is installed as a dependency. It needs Node.js 20.19, 22.12 or 24 and newer.

Wiring up:

```js
import i18next from 'i18next';
import mf2 from 'i18next-mf2';

i18next.use(mf2).init(i18nextOptions);
```

- As with all modules you can either pass the constructor function (class) to the i18next.use or a concrete instance.
- If you don't use a module loader it will be added to `window.i18nextMF2`

## Backend Options

```js
{
  // per default MF2 functions are parsed once and cached for subsequent calls
  // (a message changed by addResource, reloadResources or HMR is parsed again)
  memoize: true,

  // memoize if not having a lookup and just using the key fallback as value
  memoizeFallback: false,

  // which events should clear the cache, can be set to false or string of events separated by " "
  bindI18n: '',

  // which events on resourceSource should clear the cache, can be set to false or string of events separated by " "
  bindI18nStore: '',

  // whether to enable MF2 functions that are not yet stable: :date, :datetime, :time, :unit
  // (:number, :integer, :string, :currency, :percent and :offset are always available)
  mf2DraftFunctions: false,

  // custom MF2 message functions
  mf2Functions: undefined,

  // placeholders are wrapped in Unicode isolation marks (U+2068 ... U+2069) when their direction
  // could differ from the message, e.g. strings or right-to-left locales;
  // set to 'none' to turn this off, e.g. for plain-text targets like <title> or test assertions
  bidiIsolation: 'default',

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

react-i18next `<Trans>` placeholders like `<0>text</0>` are plain text in MF2, so they pass through and react-i18next renders them. MF2 markup such as `{#b}text{/b}` is dropped when a message is formatted to a string.

What keeps working and what does not is listed in [Using ICU or MF2](https://www.i18next.com/how-to/using-icu-or-mf2) in the i18next docs.

### debug warnings

With i18next `debug: true`, i18next-mf2 logs a warning through the i18next logger, once per key, when:

- a message can not be parsed or formatted (the default `parseErrorHandler` silently returns the message source), with a hint if it contains i18next interpolation like `{{name}}`
- a message is only a quoted pattern like `{{name}}`, which MF2 renders as the plain text `name`
- `t` is called with `count` and plural suffix keys (`key_one`, `key_other`, `key_ordinal_one`, ...) exist for that key
- `t` is called with `context` and a context key (`key_male`) exists
- a message contains `$t(` nesting
- a key resolves to an object or array (`returnObjects`, `joinArrays`)
- `interpolation.escapeValue` is on, which the plugin does not apply (logged once)

Without `debug` these checks do not run.

### React Native, Hermes and other runtimes without Intl

messageformat uses the runtime's `Intl` APIs: `Intl.Locale` for every message, `Intl.PluralRules` to select plural variants, `Intl.NumberFormat` for `:number`, `:integer`, `:currency` and `:percent`. When one is missing, the default `parseErrorHandler` returns the message source (with `debug: true` the error is logged).

- **Hermes** (the default React Native engine) implements `Intl.NumberFormat` and `Intl.DateTimeFormat` on Android and iOS, but not `Intl.Locale` or `Intl.PluralRules` (see [Hermes Intl APIs](https://github.com/facebook/hermes/blob/main/doc/IntlAPIs.md)), so no message is formatted, not even `Hello {$name}`. Polyfill both in your entry file, before i18next is initialized, with locale data for each language you ship:

  ```js
  import '@formatjs/intl-locale/polyfill.js';
  import '@formatjs/intl-pluralrules/polyfill-force.js';
  import '@formatjs/intl-pluralrules/locale-data/en.js';
  import '@formatjs/intl-pluralrules/locale-data/de.js';
  ```

- **Runtimes without `Intl`** (Hermes on React Native for Windows, older Hermes and JavaScriptCore builds on Android): polyfill, in this order, `@formatjs/intl-getcanonicallocales`, `@formatjs/intl-locale`, `@formatjs/intl-pluralrules`, `@formatjs/intl-numberformat` and, for the draft `:date`/`:time` functions, `@formatjs/intl-datetimeformat`, the last three with locale data for your languages. See [FormatJS runtime requirements](https://formatjs.github.io/docs/guides/runtime-requirements/).

## TypeScript

Since `i18next` v26.5.0, set `parseInterpolation: 'mf2'` in your `CustomTypeOptions` and the options of `t()` (and the `values` of react-i18next's `Trans`) are type-checked against the variables of each message:

```ts
// i18next.d.ts
import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    parseInterpolation: 'mf2';
    defaultNS: 'translation';
    resources: {
      translation: {
        key: '.input {$numPhotos :integer} .match $numPhotos 0 {{You have no photos.}} * {{You have {$numPhotos} photos.}}';
      };
    };
  }
}
```

```ts
t('key', { numPhotos: 3 }); // ok
t('key', { numPhotos: 'three' }); // type error: numPhotos takes a number
t('key'); // type error: 'pass these arguments as t() options': { numPhotos: number }
```

`{$name}` takes a string or number, a variable annotated with `:number`, `:integer`, `:currency`, `:percent` or `:unit` (inline or through `.input` / `.local`) a number, `:datetime`, `:date` and `:time` a `Date`, `:string` a string, and option and markup variables (`minimumFractionDigits=$digits`, `{#link href=$url}`) are required too. `.local` variables are not arguments. `interpolationFormatTypeMap` changes a type by function name, for example a custom `uppercase: string`. The messages need literal types, as the resources file from [i18next-cli](https://github.com/i18next/i18next-cli)'s `types` command has them; with `typeof` a JSON import every message is a `string` and the variables are not checked.

With `i18next` v26.2.0 to v26.4.x, set `parseInterpolation: false` instead. i18next's own extractor looks for `{{variable}}`, and MF2 variants like `* {{You have {$numPhotos} photos.}}` use double braces as pattern delimiters, so it would ask for a variable that does not exist. With `false`, keys are checked but the options are not.

Both settings are type-only; runtime formatting is handled by messageformat and is not affected.

---

<h3 align="center">Gold Sponsors</h3>

<p align="center">
  <a href="https://www.locize.com/?utm_source=i18next_mf2_readme&utm_medium=github&utm_campaign=readme" target="_blank">
    <img src="https://raw.githubusercontent.com/i18next/i18next/master/assets/locize_sponsor_240.gif" width="240px">
  </a>
</p>
