const { test, expect } = require('bun:test');
const { totp, sha256 } = require('../../src/signer');

test('signer sha256', () => {
  const sk = 'secret';

  [totp, sha256].forEach((signer) => {
    const token = signer.sign(sk, 100);
    if (signer === totp) {
      expect(token).toMatch(/^[0-9]{6}$/);
    } else {
      expect(token).not.toMatch(/^[0-9]{6}$/);
    }
    expect(signer.verify(sk, token, 99)).toBeTruthy();
    expect(signer.verify(sk, token, 100)).toBeTruthy();
    expect(signer.verify(sk, token, 101)).toBeTruthy();
    expect(signer.sign(Buffer.from(sk), 100)).toBe(token);

    const token2 = signer.sign(sk);
    expect(signer.verify(sk, token2)).toBeTruthy();
  });
});
