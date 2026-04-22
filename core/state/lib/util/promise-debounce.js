// debounce bing q promise 过程中不会重复执行
function promiseDebounce(fn, delay = 1000) {
  let timeoutId = null;
  let isRunning = false;

  return (...args) => {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        if (isRunning) return;

        isRunning = true;
        try {
          const result = await Promise.resolve(fn(...args));
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          isRunning = false;
        }
      }, delay);
    });
  };
}

module.exports = promiseDebounce;
