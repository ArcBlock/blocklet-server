import crypto from 'node:crypto';

if (typeof crypto.hash !== 'function') {
  console.warn('🔧 Node v21 detected — monkey-patching crypto.hash');

  // eslint-disable-next-line func-names
  crypto.hash = function (algorithm, data) {
    return crypto.createHash(algorithm).update(data).digest('hex');
  };
}
