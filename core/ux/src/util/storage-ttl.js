const TTL_PREFIX = 'ttl-';
const debounce = (fn, delay) => {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Set an item in local storage with a time-to-live (TTL).
 * @param {string} key - The key to store the item under.
 * @param {any} items - The items to store.
 * @param {number} ttl - The time-to-live in milliseconds.
 */
export function setStorageWithTTL(key, items, ttl = 0, delay = 0) {
  if (items === null || items === undefined) {
    localStorage.removeItem(TTL_PREFIX + key);
    return;
  }
  const item = {
    value: items,
    expiry: Date.now() + ttl,
  };
  if (delay) {
    debounce(() => localStorage.setItem(TTL_PREFIX + key, JSON.stringify(item)), delay)();
  } else {
    localStorage.setItem(TTL_PREFIX + key, JSON.stringify(item));
  }
}

/**
 * Get an item from local storage with a time-to-live (TTL).
 * @param {string} key - The key to retrieve the item from.
 * @returns {any} The item, or null if the item is expired or does not exist.
 */
export function getStorageWithTTL(key) {
  clearExpiredItems();
  const itemStr = localStorage.getItem(TTL_PREFIX + key);
  if (!itemStr) {
    return null;
  }
  const item = JSON.parse(itemStr);
  if (Date.now() > item.expiry) {
    localStorage.removeItem(TTL_PREFIX + key);
    return null;
  }
  return item.value;
}

/**
 * Remove an item with TTL from local storage.
 * @param {string} key - The key of the item to remove.
 */
export function removeStorageTTL(key) {
  localStorage.removeItem(TTL_PREFIX + key);
}

let lastClearTime = null;

/**
 * Clear all expired items from local storage.
 */
export function clearExpiredItems(force = false) {
  const now = Date.now();
  if (!force && lastClearTime && now - lastClearTime < 60 * 1000 * 5) {
    // Less than 5 minutes has passed since the last clear, so we do nothing
    return;
  }
  lastClearTime = now;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(TTL_PREFIX)) {
      const itemStr = localStorage.getItem(key);
      if (itemStr) {
        let item;
        try {
          item = JSON.parse(itemStr);
        } catch (error) {
          // eslint-disable-next-line no-continue
          continue;
        }
        if (now > item.expiry) {
          localStorage.removeItem(key);
        }
      }
    }
  }
}

clearExpiredItems();
