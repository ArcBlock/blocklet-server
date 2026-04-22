const isWorkerInstance = () => {
  if (process.env.NODE_APP_INSTANCE === undefined) {
    return false;
  }
  return process.env.NODE_ENV !== 'test' && process.env.NODE_APP_INSTANCE !== '0';
};

module.exports = {
  isWorkerInstance,
};
