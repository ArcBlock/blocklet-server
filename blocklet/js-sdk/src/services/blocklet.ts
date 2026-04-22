import { withQuery, joinURL } from 'ufo';
import QuickLRU from 'quick-lru';
import { Blocklet } from '../types';

let blockletCache: QuickLRU<string, Blocklet> | undefined;

function getBlockletCache(): QuickLRU<string, Blocklet> {
  if (!blockletCache) {
    blockletCache = new QuickLRU<string, Blocklet>({ maxSize: 30, maxAge: 60 * 1000 });
  }
  return blockletCache;
}

export class BlockletService {
  getBlocklet(): Blocklet;
  async getBlocklet(baseUrl?: string, force?: boolean): Promise<Blocklet>;

  getBlocklet(baseUrl?: string, force: boolean = false): Blocklet | Promise<Blocklet> {
    if (!baseUrl) {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('Cannot get blocklet in server side without baseUrl');
      }

      return window.blocklet;
    }
    const cache = getBlockletCache();
    if (!force && cache.has(baseUrl)) {
      return cache.get(baseUrl);
    }

    const url = withQuery(joinURL(baseUrl, '__blocklet__.js'), {
      type: 'json',
      t: Date.now(),
    });
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      const res = await fetch(url);
      const data: Blocklet = await res.json();
      cache.set(baseUrl, data);
      resolve(data);
    });
  }

  loadBlocklet() {
    return new Promise<void>((resolve, reject) => {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        reject();
        return;
      }

      const blockletScript = document.createElement('script');
      let basename = '/';
      if (window.blocklet && window.blocklet.prefix) {
        basename = window.blocklet.prefix;
      }
      blockletScript.src = withQuery(joinURL(basename, '__blocklet__.js'), {
        t: Date.now(),
      });
      blockletScript.onload = () => {
        resolve();
      };
      blockletScript.onerror = () => {
        reject();
      };
      document.head.append(blockletScript);
    });
  }

  getPrefix(blocklet?: Blocklet) {
    if (blocklet) {
      return blocklet?.prefix || '/';
    }

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return null;
    }

    return window.blocklet?.prefix || '/';
  }
}
