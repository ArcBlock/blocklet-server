import { GlobalRegistrator } from '@happy-dom/global-registrator';

const nativeFetch = globalThis.fetch;
const nativeXHR = globalThis.XMLHttpRequest;

GlobalRegistrator.register();

// 恢复 Bun 的 fetch 与 XHR，避免虚假的 CORS 拦截
globalThis.fetch = nativeFetch;
globalThis.XMLHttpRequest = nativeXHR;

// 保留 window 上的 fetch/xhr 一致性：
if (globalThis.window) {
  globalThis.window.fetch = nativeFetch;
  globalThis.window.XMLHttpRequest = nativeXHR;
}

const storageMock = () => {
  let storage = {};
  const out = {
    getItem: (key) => {
      return key in storage ? storage[key] : null;
    },
    // eslint-disable-next-line no-return-assign
    setItem: (key, value) => {
      storage[key] = value || '';
      out.length = Object.keys(storage).length;
    },
    removeItem: (key) => {
      delete storage[key];
      out.length = Object.keys(storage).length;
    },
    key: (index) => {
      return Object.keys(storage)[index];
    },
    // eslint-disable-next-line no-return-assign
    clear: () => {
      storage = {};
      out.length = Object.keys(storage).length;
    },
    length: 0,
  };
  return out;
};

Object.defineProperty(globalThis, 'env', { value: { apiPrefix: '/' } });
Object.defineProperty(globalThis, 'localStorage', { value: storageMock() });
Object.defineProperty(globalThis, 'sessionStorage', { value: storageMock() });
// Object.defineProperty(globalThis, 'MutationObserver', { value: MutationObserver });
Object.defineProperty(globalThis, 'getComputedStyle', {
  value: () => ['-webkit-appearance'],
});
