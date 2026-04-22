const pickBy = require('lodash/pickBy');

const getSafeEnv = (inputEnv, processEnv = process.env) => {
  const whiteList = ['ABT_NODE', 'ABT_NODE_DID', 'ABT_NODE_PK', 'ABT_NODE_PORT', 'ABT_NODE_SERVICE_PORT'];
  const blackList = { ABT_NODE_SK: '' };
  // 此处需要保留 process.env 中的环境变量，只移除和 ABT_NODE 相关的环境变量（否则丢失了 process.env.SHELL 变量可能会造成无法使用 nodejs 的情况）
  const filterProcessEnv = pickBy(processEnv, (value, key) => !key.startsWith('ABT_NODE') || whiteList.includes(key));
  const mergedEnv = { ...filterProcessEnv, ...inputEnv, ...blackList };
  return mergedEnv;
};

module.exports = getSafeEnv;
