function promiseOnce(fn) {
  let executed = false;
  let result;

  return async (...args) => {
    if (!executed) {
      executed = true;
      result = await fn(...args);
    }
    return result;
  };
}

module.exports = promiseOnce;
