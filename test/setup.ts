import { afterEach } from 'vitest'

// Dexie needs a real IndexedDB; jsdom does not ship one.
import 'fake-indexeddb/auto'

// jss caches `CSS.escape` as a bare reference (`const nativeEscape = CSS.escape`).
// jsdom implements it as a namespace method that throws when its `this` is lost,
// so hand jss a pre-bound copy.
if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
  const bound = CSS.escape.bind(CSS)
  Object.defineProperty(CSS, 'escape', {
    value: bound,
    writable: true,
    configurable: true,
  })
}

// jss writes real <style> tags into document.head. Reset between tests so
// leftover sheets cannot leak across suites.
afterEach(() => {
  document.head.querySelectorAll('style[data-jss]').forEach((el) => el.remove())
  document.body.innerHTML = ''
})
