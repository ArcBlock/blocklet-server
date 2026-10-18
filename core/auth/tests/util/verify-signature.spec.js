const { test, expect, describe } = require('bun:test');
const { toBase58 } = require('@ocap/util');
const { fromRandom } = require('@ocap/wallet');

const verifySignature = require('../../lib/util/verify-signature');

const createClaim = async (wallet, message) => {
  const origin = toBase58(message);
  const sig = await wallet.sign(origin);
  return { origin, sig };
};

describe('verifySignature', () => {
  test('should pass for a valid signature', async () => {
    const wallet = fromRandom();
    const claim = await createClaim(wallet, 'hello');
    await expect(verifySignature(claim, wallet.address, wallet.publicKey)).resolves.toBeUndefined();
  });

  test('should reject an invalid signature', async () => {
    const wallet = fromRandom();
    const claim = { origin: toBase58('hello'), sig: `0x${'11'.repeat(64)}` };
    await expect(verifySignature(claim, wallet.address, wallet.publicKey)).rejects.toThrow(
      'Failed to verify signature'
    );
  });

  test('should reject a signature of other message', async () => {
    const wallet = fromRandom();
    const claim = await createClaim(wallet, 'hello');
    claim.origin = toBase58('world');
    await expect(verifySignature(claim, wallet.address, wallet.publicKey)).rejects.toThrow(
      'Failed to verify signature'
    );
  });

  test('should reject a public key that does not belong to the did', async () => {
    const owner = fromRandom();
    const attacker = fromRandom();
    const claim = await createClaim(attacker, 'hello');
    await expect(verifySignature(claim, owner.address, attacker.publicKey)).rejects.toThrow(
      'Signer public key does not match the expected DID'
    );
  });

  test('should reject empty claim', async () => {
    const wallet = fromRandom();
    await expect(verifySignature(null, wallet.address, wallet.publicKey)).rejects.toThrow(
      'Signature should not be empty'
    );
    await expect(verifySignature({ origin: 'x' }, wallet.address, wallet.publicKey)).rejects.toThrow(
      'Signature should not be empty'
    );
  });
});
