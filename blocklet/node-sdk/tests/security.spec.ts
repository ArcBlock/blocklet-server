import { fromRandom } from '@ocap/wallet'; // eslint-disable-line import/newline-after-import
import { describe, test, expect, afterAll, beforeAll, mock } from 'bun:test';

const wallet = fromRandom();
// BLOCKLET_APP_SK must be set before module load because getWallet is called at the top level
process.env.BLOCKLET_APP_SK = wallet.secretKey;

import { Security } from '../src'; // eslint-disable-line import/first

const { encrypt, decrypt } = Security;
const did = 'z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB';
const ek =
  '0x7cd4fd4d4e13a25f5e46de30a61a4a70f5315db96ceeab30d0b12d93d380efb5d9d3cf4c287305104b5ec4269dc2cf03bcf7d934353c05ea45970d13d4307827';

beforeAll(() => {
  (globalThis as any).processEnv = { ...process.env };
  process.env = {};
});
afterAll(() => {
  process.env = (globalThis as any).processEnv;
  mock.restore();
});

describe('Security', () => {
  const OLD_ENV = process.env;
  afterAll(() => {
    process.env = OLD_ENV;
    process.env.BLOCKLET_DATA_DIR = 'tmp';
  });

  test('should do nothing if non proper env', () => {
    // nothing
    expect(encrypt('abcd')).toEqual('abcd');
    expect(decrypt('abcd')).toEqual('abcd');
    // no blocklet did
    process.env.BLOCKLET_DID = did;
    expect(encrypt('abcd')).toEqual('abcd');
    expect(decrypt('abcd')).toEqual('abcd');
    // no blocklet ek
    process.env.BLOCKLET_DID = '';
    process.env.BLOCKLET_APP_EK = ek;
    expect(encrypt('abcd')).toEqual('abcd');
    expect(decrypt('abcd')).toEqual('abcd');
  });
  test('should work as expected if proper env', () => {
    process.env.BLOCKLET_DID = did;
    process.env.BLOCKLET_APP_EK = ek;
    const message = 'abcd';
    const encrypted = encrypt(message);
    expect(encrypted).not.toEqual(message);
    const decrypted = decrypt(encrypted);
    expect(decrypted).not.toEqual(encrypted);
    expect(decrypted).toEqual(message);
  });

  test('custom password and sort', () => {
    process.env.BLOCKLET_DID = 'did1';
    process.env.BLOCKLET_APP_EK = 'ek1';
    const message = 'abcd';

    const encrypted = encrypt(message, 'password', 'salt');
    expect(encrypted).not.toEqual(message);
    const decrypted = decrypt(encrypted, 'password', 'salt');
    expect(decrypted).not.toEqual(encrypted);
    expect(decrypted).toEqual(message);
  });
});
