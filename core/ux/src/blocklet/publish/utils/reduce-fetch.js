const cache = {};

const reduceFetch = (fn, params, { key, cacheTime = 1000 * 3 } = {}) => {
  const realKey = key + JSON.stringify({ params });
  const lastFetch = cache[realKey];
  if (lastFetch && lastFetch.timestamp > Date.now() - cacheTime) {
    return lastFetch.promise;
  }
  const promise = fn(...params);
  cache[realKey] = {
    promise,
    timestamp: Date.now(),
  };
  return promise;
};

export default reduceFetch;
