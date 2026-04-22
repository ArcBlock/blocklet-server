const { test, expect, describe, mock, afterAll } = require('bun:test');

const realFs = require('fs-extra');

mock.module('fs-extra', () => {
  return {
    ...realFs,
    readFileSync: mock(() => Buffer.from('mock-sock-key')),
    outputJson: mock(),
  };
});
mock.module('@abtnode/util/lib/security', () => {
  return {
    decrypt: mock((value) => `decrypted-${value}`),
    encrypt: mock((value) => `encrypted-${value}`),
  };
});
mock.module('../../../../lib/states', () => ({
  blockletExtras: {
    findOne: mock(() =>
      Promise.resolve({
        id: 1,
        did: 'test-did',
        configs: [
          { key: 'SOME_KEY', value: 'plain-value', secure: false },
          { key: 'SECRET_KEY', value: 'encrypted-secret', secure: true },
        ],
        children: [],
      })
    ),
  },
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const security = require('@abtnode/util/lib/security');
const { BlockletExtrasExport } = require('../../../../lib/blocklet/storage/export/blocklet-extras-export');

describe('BlockletExtrasExport', () => {
  const did = 'test-did';

  const newExport = () => {
    const instance = new BlockletExtrasExport({ did });
    instance.backupDir = __dirname;
    instance.blocklet = { meta: { did } };
    instance.serverDir = __dirname;
    instance.securityContext = {
      encrypt: mock(() => 'should-not-be-called'),
    };
    return instance;
  };

  describe('#encrypt', () => {
    test('should decrypt secure configs to plaintext without re-encrypting', () => {
      const instance = newExport();
      const configs = [
        { key: 'PLAIN_KEY', value: 'plain-value', secure: false },
        { key: 'SECRET_KEY', value: 'encrypted-value', secure: true },
      ];

      instance.encrypt(configs);

      // Non-secure config should remain unchanged
      expect(configs[0].value).toEqual('plain-value');
      // Secure config should be decrypted (not re-encrypted)
      expect(configs[1].value).toEqual('decrypted-encrypted-value');
      expect(configs[1].secure).toBe(true);
      // securityContext.encrypt should NOT be called
      expect(instance.securityContext.encrypt).not.toHaveBeenCalled();
      // security.decrypt should be called
      expect(security.decrypt).toHaveBeenCalledWith('encrypted-value', did, expect.anything());
    });

    test('should handle empty configs', () => {
      const instance = newExport();
      expect(() => instance.encrypt([])).not.toThrow();
      expect(() => instance.encrypt(null)).not.toThrow();
      expect(() => instance.encrypt(undefined)).not.toThrow();
    });
  });
});
