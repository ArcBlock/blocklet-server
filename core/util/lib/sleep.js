// eslint-disable-next-line no-promise-executor-return
module.exports = (timeout = 0) => new Promise((resolve) => setTimeout(resolve, timeout));
