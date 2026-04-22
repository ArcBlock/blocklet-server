const crypto = require('crypto');
const { BLOCKLET_AUTOMATIC_ENV_VALUE, BLOCKLET_AUTOMATIC_ENV_VALUE_REGEX } = require('@blocklet/constant');
const { getObjByPath } = require('@abtnode/docker-utils');
const { isValid: isDid } = require('@arcblock/did');
const parseDockerName = require('./parse-docker-name');

function replaceEnvValue(dockerEnv, rootBlocklet, dockerNamePrefix) {
  // 正则匹配形如 zxxxxxxxxxxxx...(30-40位)-(host|port|env.xxx|ports.xxx)，全局匹配
  // const regex = /z[a-zA-Z0-9]{30,40}-(?:host|port|env\.[^.]+|ports\.[^.]+)/g;
  const regex = BLOCKLET_AUTOMATIC_ENV_VALUE_REGEX;
  const envKeys = Object.keys(dockerEnv);

  envKeys.forEach((key) => {
    const originalValue = dockerEnv[key];
    if (typeof originalValue !== 'string') return;

    // 使用 replace 的回调函数对所有匹配项进行处理
    originalValue.replace(regex, (replacementKey) => {
      const [did, ...other] = replacementKey.split('-');
      const rest = other.join('-');

      if (!isDid(did) || !rest) return replacementKey;

      // 根据 did 查找对应的子 blocklet
      const matchingBlocklet = rootBlocklet?.children?.find((blocklet) => blocklet.meta && blocklet.meta.did === did);
      if (!matchingBlocklet) return replacementKey;

      // 构建环境变量映射（configs 内的 key-value 对）
      const envMap = {};
      (matchingBlocklet.configs || []).forEach((config) => {
        envMap[config.key] = config.value || config.default;
      });

      // 计算替换后的值，根据 rest 作为路径取值
      const replacementValue = getObjByPath(
        {
          env: envMap,
          ports: matchingBlocklet.ports,
          host: parseDockerName(`${rootBlocklet.meta.did}-${matchingBlocklet.meta.name}`, dockerNamePrefix),
          port: matchingBlocklet.ports && matchingBlocklet.ports.BLOCKLET_PORT,
        },
        rest
      );

      const out = replacementValue !== undefined ? String(replacementValue) : replacementKey;
      dockerEnv[key] = dockerEnv[key].replace(replacementKey, out);
      return out;
    });
  });

  // 自动生成 env 变量
  envKeys.forEach((key) => {
    if (dockerEnv[key] === BLOCKLET_AUTOMATIC_ENV_VALUE) {
      dockerEnv[key] = crypto
        .createHash('sha256')
        .update(`${rootBlocklet.environmentObj.BLOCKLET_APP_PSK}-${BLOCKLET_AUTOMATIC_ENV_VALUE}`)
        .digest('hex')
        .substring(0, 23);
    }
  });
  return dockerEnv;
}

module.exports = replaceEnvValue;
