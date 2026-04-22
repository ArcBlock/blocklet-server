/* eslint-disable no-async-promise-executor */
module.exports = (asyncFn, timeout = 5000) => {
  if (typeof asyncFn !== 'function') {
    throw new Error(`Must provide a valid asyncFn function, type: ${typeof asyncFn}`);
  }

  return new Promise(async (resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeout} ms`));
    }, timeout);

    try {
      const result = await asyncFn();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      clearTimeout(timer);
    }
  });
};
