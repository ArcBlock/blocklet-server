const { describe, expect, test } = require('bun:test');
const stableStringify = require('json-stable-stringify');
const { fromRandom, WalletType } = require('@ocap/wallet');
const { types } = require('@ocap/mcrypto');
const { toBase58 } = require('@ocap/util');

const { sign } = require('../../../lib/util/blocklet/sign');

const type = WalletType({
  pk: types.KeyType.ED25519,
  role: types.RoleType.ROLE_ACCOUNT,
  hash: types.EncodingType.BASE58,
});
const wallet = fromRandom(type);

describe('sign', () => {
  test('should sign successfully', async () => {
    const meta = {
      name: 'test',
      did: 'testdid',
    };

    const signature = await sign(meta, wallet);

    const { sig, ...signatureData } = signature;
    // @ts-ignore
    expect(await wallet.verify(stableStringify({ ...meta, signatures: [signatureData] }), sig)).toBe(true);
  });

  test('should add necessary fields', async () => {
    const meta = {
      name: 'test',
      did: 'testdid',
    };
    const walletJSON = wallet.toJSON();

    const signature = await sign(meta, wallet);

    expect(signature.type).toEqual('ED25519');
    expect(signature.name).toEqual(meta.name);
    expect(signature.signer).toEqual(walletJSON.address);
    expect(signature.pk).toEqual(toBase58(walletJSON.pk));
    expect(typeof signature.created).toEqual('string');
    expect(typeof signature.sig).toEqual('string');
  });
});
