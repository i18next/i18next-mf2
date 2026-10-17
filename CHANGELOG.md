### 2.0.0

- security: guard the memoize cache-key walker against prototype pollution, same fix as i18next-icu 2.4.4. The cache key is `${lng}.${ns}.${key}` and only `key` is dot-escaped, so with the default `memoize: true` a namespace named `__proto__`, `constructor` or `prototype` wrote the formatter onto `Object.prototype`. Unsafe segments are now refused and the cache write is dropped.
- update to messageformat `^4.1.0` (stable Unicode MessageFormat 2, LDML 48.2) instead of the pinned prerelease `4.0.0-10`. This is why this is a major version:
  - `:math` was renamed `:offset` and is now a default function
  - custom `mf2Functions` written against the prerelease: `source` is gone from `MessageValue` and `MessageFunctionContext`, `MessageSelectionError` was replaced by `MessageFunctionError`
  - `:currency` and `:percent` are now default functions, so they no longer need `mf2DraftFunctions`; draft functions are `:date`, `:datetime`, `:time` and `:unit`
  - messageformat needs Node.js 20.19, 22.12 or 24 and newer
- fix: the documented `parseLngForMf2` option is now used (the code only read `parseLngForMF2`, which still works)
- fix: `i18next.MessageFormat` now points to messageformat's `MessageFormat` class (it was set to `Intl.MessageFormat`, which does not exist)
- new `bidiIsolation` option (`'default'` | `'none'`) to turn off the U+2068/U+2069 isolation marks around placeholders
- README: removed the failing `messageformat@next` install step (the dependency is installed automatically), fixed the UMD global name (`window.i18nextMF2`) and the download link, updated the draft functions list, added a TypeScript section (`parseInterpolation: false`)
- package.json: add a `types` field

### 1.0.0

- update for MF2 stable release

### 0.1.1

- initial version
