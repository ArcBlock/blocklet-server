import { LRUCache } from 'lru-cache';

function withCache<T>(
  fn: T, // The function to wrap
  { maxSize = 1000, maxAge = 1000 * 120 }: { maxSize?: number; maxAge?: number } = {}
): T {
  if (maxAge === 0) {
    return fn as T;
  }

  const cache = new LRUCache<string, unknown>({ max: maxSize, ttl: maxAge });

  return (async (...args: unknown[]): Promise<unknown> => {
    const key = JSON.stringify({ v: args });

    if (cache.has(key) && key.indexOf('file://') === -1) {
      return cache.get(key);
    }

    try {
      const result = await (fn as unknown as (...args: unknown[]) => Promise<unknown>)(...args);
      cache.set(key, result);
      return result;
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error(`[Cache Wrapper] Error during function execution for key ${key}:`, error);
      }
      throw error;
    }
  }) as T;
}

export default withCache;
