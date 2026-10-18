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
const MAX_DEPTH = 8;

/**
 * 深拷贝并剥离密钥字段，不修改入参。
 * @param {unknown} value
 * @param {number} [depth]
 * @param {WeakSet<object>} [seen] 处理循环引用
 * @returns {unknown}
 */
const redact = (value, depth = 0, seen = new WeakSet()) => {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (depth >= MAX_DEPTH) {
    return value;
  }
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((x) => redact(x, depth + 1, seen));
  }

  // Buffer / Uint8Array 等二进制对象原样返回，避免被展开成字节数组
  if (Buffer.isBuffer(value) || value instanceof Uint8Array || value instanceof Date) {
    return value;
  }

  const out = {};
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
      out[key] = redact(value[key], depth + 1, seen);
    }
  }
  return out;
};

module.exports = { redact, SECRET_KEYS, PLACEHOLDER, looksLikeSecretName };
