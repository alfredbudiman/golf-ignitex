// Node 25 ships a built-in `localStorage` global that lacks the standard API
// (no getItem/setItem/clear). That global is non-configurable in the way that
// prevents happy-dom from replacing it via the environment populate step.
// We install a minimal in-memory Storage shim before each test so the state
// module's localStorage interactions behave correctly under vitest.
import { beforeEach } from 'vitest';

function createMemoryStorage() {
  let data = Object.create(null);
  return {
    get length() { return Object.keys(data).length; },
    key(i) {
      const keys = Object.keys(data);
      return i >= 0 && i < keys.length ? keys[i] : null;
    },
    getItem(k) {
      return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null;
    },
    setItem(k, v) { data[String(k)] = String(v); },
    removeItem(k) { delete data[k]; },
    clear() { data = Object.create(null); }
  };
}

function installStorage(name) {
  const storage = createMemoryStorage();
  Object.defineProperty(globalThis, name, {
    value: storage,
    writable: true,
    configurable: true,
    enumerable: true
  });
  if (typeof window !== 'undefined') {
    try {
      Object.defineProperty(window, name, {
        value: storage,
        writable: true,
        configurable: true,
        enumerable: true
      });
    } catch {
      // ignore – best-effort sync with window
    }
  }
}

installStorage('localStorage');
installStorage('sessionStorage');

beforeEach(() => {
  installStorage('localStorage');
  installStorage('sessionStorage');
});
