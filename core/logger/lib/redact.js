/**
 * 日志脱敏。
 *
 * getApplicationInfo / getBlockletInfo 的返回值里带有 wallet、permanentWallet、
 * accessWallet 和 secret，这些对象一旦被整体写进日志，应用私钥就会以明文落盘，
 * 而日志可以被下载（/api/download/log）。因此在日志序列化前统一剥离密钥字段。
 */

// 命中即整体替换为占位符的键名（小写比较）。清单依据代码中实际出现的字段名统计，
// 不含 pk / address / accessKeyPublic 等公开字段。
const SECRET_KEYS = new Set([
  // 钱包与节点私钥
  'sk',
  'secretkey',
  'secret_key',
  'privatekey',
  'private_key',
  'appsk',
  'apppsk',
  'appek',
  'nodesk',
  'serversk',
  'externalsk',
  // 会话与派生密钥
  'secret',
  'sessionsecret',
  'sessionsalt',
  'encryptionkey',
  'dek',
  // 凭证
  'accesskeysecret',
  'clientsecret',
  'client_secret',
  'apikey',
  'api_key',
  'password',
  'passphrase',
  'mnemonic',
  // 令牌
  'sessiontoken',
  'refreshtoken',
  'accesstoken',
  'idtoken',
  'csrftoken',
  'authtoken',
  'auth_token',
  // 请求头
  'authorization',
  'cookie',
  'x-access-signature',
]);

// 配置项常见形态为 { key, value, secure }，密钥值在 value 里，按键名无法命中
const CONFIG_KEY_FIELDS = ['key', 'name'];
const looksLikeSecretName = (name) =>
  typeof name === 'string' &&
  (SECRET_KEYS.has(name.toLowerCase()) ||
    /(^|_)(sk|psk|ek)$|secret|password|passphrase|private_?key|token|api_?key/i.test(name));

const PLACEHOLDER = '[REDACTED]';
const TRUNCATED = '[TRUNCATED]';
const MAX_DEPTH = 8;

/**
 * 深拷贝并剥离密钥字段，不修改入参。
 * 输出中不会出现入参里的任何原始对象（Buffer / Date 除外），否则同一对象被多处引用、
 * 循环引用或嵌套过深时，未脱敏的原对象会被序列化进日志。
 * @param {unknown} value
 * @param {number} [depth]
 * @param {WeakMap<object, unknown>} [memo] 原对象 -> 脱敏副本，处理重复引用与循环引用
 * @returns {unknown}
 */
const redact = (value, depth = 0, memo = new WeakMap()) => {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  // Buffer / Uint8Array 等二进制对象原样返回，避免被展开成字节数组
  if (Buffer.isBuffer(value) || value instanceof Uint8Array || value instanceof Date) {
    return value;
  }
  if (memo.has(value)) {
    return memo.get(value);
  }
  if (depth >= MAX_DEPTH) {
    return TRUNCATED;
  }

  // Sequelize 实例等对象按其 toJSON 结果脱敏，与 safeStringify 的序列化结果保持一致
  if (typeof value.toJSON === 'function') {
    let json;
    try {
      json = value.toJSON();
    } catch {
      return TRUNCATED;
    }
    // toJSON 返回自身时按普通对象处理
    if (json !== value) {
      memo.set(value, TRUNCATED);
      const result = redact(json, depth, memo);
      memo.set(value, result);
      return result;
    }
  }

  if (Array.isArray(value)) {
    const arr = [];
    memo.set(value, arr);
    value.forEach((x) => arr.push(redact(x, depth + 1, memo)));
    return arr;
  }

  const out = {};
  memo.set(value, out);
  const keys = Object.keys(value);

  // { key: 'BLOCKLET_APP_SK', value: '...' } / { key, value, secure: true }
  const nameField = CONFIG_KEY_FIELDS.find((f) => keys.includes(f) && typeof value[f] === 'string');
  const isSecretConfigEntry =
    keys.includes('value') && (value.secure === true || (nameField && looksLikeSecretName(value[nameField])));

  for (const key of keys) {
    if (SECRET_KEYS.has(key.toLowerCase())) {
      out[key] = PLACEHOLDER;
    } else if (key === 'value' && isSecretConfigEntry) {
      out[key] = PLACEHOLDER;
    } else {
      out[key] = redact(value[key], depth + 1, memo);
    }
  }
  return out;
};

module.exports = { redact, SECRET_KEYS, PLACEHOLDER, TRUNCATED, looksLikeSecretName };
