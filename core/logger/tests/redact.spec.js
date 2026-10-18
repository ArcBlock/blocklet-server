const { test, expect, describe } = require('bun:test');
const { redact, PLACEHOLDER } = require('../lib/redact');

describe('redact', () => {
  test('should pass primitives through', () => {
    expect(redact(null)).toBeNull();
    expect(redact(undefined)).toBeUndefined();
    expect(redact('x')).toBe('x');
    expect(redact(1)).toBe(1);
  });

  // Regression: getApplicationInfo output was logged whole, writing app private keys to disk
  test('should strip wallet secret keys from an appInfo-shaped object', () => {
    const appInfo = {
      name: 'DID Names',
      appUrl: 'https://www.didnames.io',
      secret: 'session-secret',
      wallet: { type: { role: 'ROLE_APPLICATION' }, sk: 'PRIVATE', pk: '0xpub', address: 'zNK1' },
      permanentWallet: { sk: 'PRIVATE2', address: 'zNK2' },
      accessWallet: { secretKey: 'PRIVATE3', address: 'zNK3' },
    };
    const out = redact(appInfo);

    expect(out.name).toBe('DID Names');
    expect(out.appUrl).toBe('https://www.didnames.io');
    expect(out.secret).toBe(PLACEHOLDER);
    expect(out.wallet.sk).toBe(PLACEHOLDER);
    expect(out.wallet.pk).toBe('0xpub');
    expect(out.wallet.address).toBe('zNK1');
    expect(out.permanentWallet.sk).toBe(PLACEHOLDER);
    expect(out.accessWallet.secretKey).toBe(PLACEHOLDER);

    expect(JSON.stringify(out)).not.toContain('PRIVATE');
    expect(JSON.stringify(out)).not.toContain('session-secret');
  });

  test('should not mutate the input', () => {
    const input = { wallet: { sk: 'PRIVATE' } };
    redact(input);
    expect(input.wallet.sk).toBe('PRIVATE');
  });

  test('should handle the metadata array shape winston passes', () => {
    const out = redact([{ blocklet: { wallet: { sk: 'PRIVATE' } } }, 'plain']);
    expect(out[0].blocklet.wallet.sk).toBe(PLACEHOLDER);
    expect(out[1]).toBe('plain');
  });

  test('should cover common secret key aliases case-insensitively', () => {
    const out = redact({
      SK: 'a',
      secretKey: 'b',
      private_key: 'c',
      appSk: 'd',
      appPsk: 'e',
      sessionSecret: 'f',
      accessKeySecret: 'g',
      password: 'h',
      dek: 'i',
    });
    Object.values(out).forEach((v) => expect(v).toBe(PLACEHOLDER));
  });

  test('should keep buffers and dates intact', () => {
    const buf = Buffer.from('ab');
    const date = new Date('2026-10-18T00:00:00Z');
    const out = redact({ buf, date });
    expect(Buffer.isBuffer(out.buf)).toBe(true);
    expect(out.date).toBe(date);
  });

  test('should survive circular references', () => {
    const a = { name: 'a', wallet: { sk: 'PRIVATE' } };
    a.self = a;
    const out = redact(a);
    expect(out.wallet.sk).toBe(PLACEHOLDER);
  });
});
