// Keys that must never be traversed when walking a string/array path into an
// object, otherwise a crafted path such as `__proto__.polluted` walks straight
// into Object.prototype. Same guard as i18next-icu 2.4.4.
const UNSAFE_KEYS = ['__proto__', 'constructor', 'prototype'];

function getLastOfPath(object, path, Empty) {
  function cleanKey(key) {
    return key && key.indexOf('###') > -1 ? key.replace(/###/g, '.') : key;
  }

  function canNotTraverseDeeper() {
    return !object || typeof object === 'string';
  }

  const stack = typeof path !== 'string' ? [].concat(path) : path.split('.');
  while (stack.length > 1) {
    if (canNotTraverseDeeper()) return {};

    const key = cleanKey(stack.shift());
    if (UNSAFE_KEYS.indexOf(key) > -1) return {};
    if (!object[key] && Empty) object[key] = new Empty();
    object = object[key];
  }

  if (canNotTraverseDeeper()) return {};
  const k = cleanKey(stack.shift());
  if (UNSAFE_KEYS.indexOf(k) > -1) return {};
  return { obj: object, k };
}

export function setPath(object, path, newValue) {
  const { obj, k } = getLastOfPath(object, path, Object);
  if (obj === undefined) return; // unsafe path, drop silently

  obj[k] = newValue;
}

export function getPath(object, path) {
  const { obj, k } = getLastOfPath(object, path);

  if (!obj) return undefined;
  return obj[k];
}
