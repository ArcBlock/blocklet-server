import { fromRandom, fromSecretKey } from '@ocap/wallet';
import { describe, test, expect, afterEach, mock, afterAll, Mock } from 'bun:test';
// @ts-ignore
import { fromAppDid } from '@arcblock/did-ext';
import { types } from '@ocap/mcrypto';
import { setEnvironment, clearEnvironment, appSk, appDid, appDidEth, appDidNew } from '../tools/environment';
import { getAccessWallet, getWallet } from '../src/wallet';
import { remoteSign, remoteSignJWT, remoteSignETH, remoteDeriveWallet } from '../src/service/signature';

mock.module('../src/service/signature', () => ({
  remoteSign: mock(() => true),
  remoteSignJWT: mock(() => true),
  remoteSignETH: mock(() => true),
  remoteDeriveWallet: mock(() => true),
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

describe('getWallet', () => {
  const { getPermanentWallet, getEthereumWallet } = getWallet;
  test('should work as expected from process.env', () => {
    setEnvironment('40405', true);
    expect(getWallet().address).toEqual(appDid);
    expect(getWallet('ethereum').address).toEqual(appDidEth);
    expect(getEthereumWallet().address).toEqual(appDidEth);
    expect(getPermanentWallet().address).toEqual(appDidNew);
    clearEnvironment();
  });

  test('should work with wallet cache', () => {
    let wallet1;
    let wallet2;
    setEnvironment('40405', true);
    wallet1 = getWallet();
    wallet2 = getWallet();
    expect(wallet1).toBe(wallet2);

    wallet1 = getWallet('arcblock', appSk);
    wallet2 = getWallet('arcblock', appSk);
    expect(wallet1).toBe(wallet2);

    wallet1 = getWallet('default', appSk);
    wallet2 = getWallet('default', appSk);
    expect(wallet1).toBe(wallet2);

    wallet1 = getWallet('ethereum', appSk);
    wallet2 = getWallet('ethereum', appSk);
    expect(wallet1).toBe(wallet2);

    clearEnvironment();
  });

  test('should work as expected from args', () => {
    expect(getWallet('arcblock', appSk).address).toEqual(appDid);
    expect(getWallet('default', appSk).address).toEqual(appDid);
    expect(getWallet('ethereum', appSk).address).toEqual(appDidEth);
    expect(getWallet('eth', appSk).address).toEqual(appDidEth);
  });

  test('should generate accessWallet by BLOCKLET_APP_ASK', () => {
    setEnvironment('40405', true);

    const wallet = getAccessWallet();
    const expectedWallet = fromSecretKey(process.env.BLOCKLET_APP_ASK, {
      role: types.RoleType.ROLE_APPLICATION,
      pk: types.KeyType.ED25519,
      hash: types.HashType.SHA3,
    });
    expect(wallet.address).toEqual(expectedWallet.address);
    expect(wallet.publicKey).toEqual(expectedWallet.publicKey);
    expect(wallet.secretKey).toEqual(process.env.BLOCKLET_APP_ASK);

    clearEnvironment();
  });
});

describe('getWallet remote signing', () => {
  const remoteSignMock = remoteSign as Mock<typeof remoteSign>;

  afterEach(() => {
    clearEnvironment();
    remoteSignMock.mockReset();
    delete process.env.BLOCKLET_APP_PK;
    delete process.env.BLOCKLET_COMPONENT_API_KEY;
  });

  test('should sign via blocklet-service when secret key is missing', async () => {
    const testWallet = fromRandom();
    const payload = 'test payload to sign';
    // Create a real signature using the test wallet
    const realSignature = await testWallet.sign(payload);

    setEnvironment('40407', false);
    process.env.BLOCKLET_APP_SK = '';
    process.env.BLOCKLET_APP_PK = testWallet.publicKey;
    process.env.BLOCKLET_DID = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
    process.env.BLOCKLET_REAL_DID = 'did:component:1';
    process.env.BLOCKLET_COMPONENT_API_KEY = 'test-api-key';

    // Mock remote signing to return a valid signature
    remoteSignMock.mockResolvedValue({
      signature: realSignature,
      publicKey: testWallet.publicKey,
    });

    const resultWallet = getWallet();
    const signature = await (resultWallet as any).sign(payload);

    // Verify the signature is the expected one
    expect(signature).toBe(realSignature);
    expect(remoteSignMock).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({
        keyType: 'sk',
      })
    );

    // Verify the signature can be validated
    const isValid = await testWallet.verify(payload, signature);
    expect(isValid).toBe(true);
  });

  test('should throw error when remote context is missing', async () => {
    const wallet = fromRandom();
    setEnvironment('40408', false);
    process.env.BLOCKLET_APP_SK = '';
    process.env.BLOCKLET_APP_PK = wallet.publicKey;
    process.env.BLOCKLET_DID = '';
    process.env.BLOCKLET_REAL_DID = '';
    process.env.BLOCKLET_COMPONENT_API_KEY = 'test-api-key';

    remoteSignMock.mockImplementation(() => {
      throw new Error(
        'Missing blocklet runtime context for remote signing: require BLOCKLET_DID and BLOCKLET_REAL_DID'
      );
    });

    const resultWallet = getWallet();

    await expect((resultWallet as any).sign('payload')).rejects.toThrow('Missing blocklet runtime context');
    expect(remoteSignMock).toHaveBeenCalled();
  });

  test('should throw error when BLOCKLET_APP_PK is missing for remote wallet', () => {
    // Ensure BLOCKLET_APP_PK is not set
    const originalPk = process.env.BLOCKLET_APP_PK;
    delete process.env.BLOCKLET_APP_PK;

    try {
      // Pass empty string as appSk to force remote wallet creation
      // Use a unique type that hasn't been cached by previous tests
      expect(() => getWallet('eth', '')).toThrow('Missing public key for SK wallet: BLOCKLET_APP_PK_ETH');
    } finally {
      // Restore original value
      if (originalPk) {
        process.env.BLOCKLET_APP_PK = originalPk;
      }
    }
  });

  test('should support remote signETH', async () => {
    const remoteSignETHMock = remoteSignETH as Mock<typeof remoteSignETH>;
    const testWallet = fromRandom();
    const data = 'test data for eth signing';
    const testSignature = '0xabcd1234';

    setEnvironment('40409', false);
    process.env.BLOCKLET_APP_SK = '';
    process.env.BLOCKLET_APP_PK = testWallet.publicKey;
    process.env.BLOCKLET_DID = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
    process.env.BLOCKLET_REAL_DID = 'did:component:eth1';
    process.env.BLOCKLET_COMPONENT_API_KEY = 'test-api-key';

    // Mock remote ETH signing to return a valid signature
    remoteSignETHMock.mockResolvedValue({
      signature: testSignature,
      publicKey: testWallet.publicKey,
    });

    const resultWallet = getWallet();
    const signature = await (resultWallet as any).signETH(data);

    // Verify the signature is the expected one
    expect(signature).toBe(testSignature);
    expect(remoteSignETHMock).toHaveBeenCalledWith(
      data,
      expect.objectContaining({
        hashBeforeSign: undefined,
        keyType: 'sk',
        type: 'ethereum',
      })
    );

    remoteSignETHMock.mockReset();
  });

  test('should support remote signETH with hashBeforeSign option', async () => {
    const remoteSignETHMock = remoteSignETH as Mock<typeof remoteSignETH>;
    const testWallet = fromRandom();
    const data = '0x1234567890abcdef';
    const hashBeforeSign = true;
    const testSignature = '0xdef5678';

    setEnvironment('40410eth', false);
    process.env.BLOCKLET_APP_SK = '';
    process.env.BLOCKLET_APP_PK = testWallet.publicKey;
    process.env.BLOCKLET_DID = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
    process.env.BLOCKLET_REAL_DID = 'did:component:eth2';
    process.env.BLOCKLET_COMPONENT_API_KEY = 'test-api-key';

    // Mock remote ETH signing with hashBeforeSign
    remoteSignETHMock.mockResolvedValue({
      signature: testSignature,
      publicKey: testWallet.publicKey,
    });

    const resultWallet = getWallet();
    const signature = await (resultWallet as any).signETH(data, hashBeforeSign);

    // Verify the signature is the expected one
    expect(signature).toBe(testSignature);
    expect(remoteSignETHMock).toHaveBeenCalledWith(
      data,
      expect.objectContaining({
        hashBeforeSign,
        keyType: 'sk',
        type: 'ethereum',
      })
    );

    remoteSignETHMock.mockReset();
  });

  test('should sign Buffer payload via remote signing', async () => {
    const testWallet = fromRandom();
    const bufferPayload = Buffer.from('test buffer data');
    const realSignature = await testWallet.sign(bufferPayload);

    setEnvironment('40410', false);
    process.env.BLOCKLET_APP_SK = '';
    process.env.BLOCKLET_APP_PK = testWallet.publicKey;
    process.env.BLOCKLET_DID = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
    process.env.BLOCKLET_REAL_DID = 'did:component:2';
    process.env.BLOCKLET_COMPONENT_API_KEY = 'test-api-key';

    remoteSignMock.mockResolvedValue({
      signature: realSignature,
      publicKey: testWallet.publicKey,
    });

    const resultWallet = getWallet();
    const signature = await (resultWallet as any).sign(bufferPayload);

    expect(signature).toBe(realSignature);
    expect(remoteSignMock).toHaveBeenCalledWith(
      bufferPayload,
      expect.objectContaining({
        keyType: 'sk',
      })
    );
    const isValid = await testWallet.verify(bufferPayload, signature);
    expect(isValid).toBe(true);
  });

  test('should handle remote signing with object payload', async () => {
    const testWallet = fromRandom();
    const objectPayload = { key: 'value', nested: { data: 123 } };
    const realSignature = await testWallet.sign(JSON.stringify(objectPayload));

    setEnvironment('40411', false);
    process.env.BLOCKLET_APP_SK = '';
    process.env.BLOCKLET_APP_PK = testWallet.publicKey;
    process.env.BLOCKLET_DID = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
    process.env.BLOCKLET_REAL_DID = 'did:component:3';
    process.env.BLOCKLET_COMPONENT_API_KEY = 'test-api-key';

    remoteSignMock.mockResolvedValue({
      signature: realSignature,
      publicKey: testWallet.publicKey,
    });

    const resultWallet = getWallet();
    const signature = await (resultWallet as any).sign(objectPayload);

    expect(signature).toBe(realSignature);
    expect(remoteSignMock).toHaveBeenCalledWith(
      objectPayload,
      expect.objectContaining({
        keyType: 'sk',
      })
    );
  });

  test('should cache remote wallet', () => {
    const testWallet = fromRandom();
    setEnvironment('40412', false);
    process.env.BLOCKLET_APP_SK = '';
    process.env.BLOCKLET_APP_PK = testWallet.publicKey;

    const wallet1 = getWallet();
    const wallet2 = getWallet();

    expect(wallet1).toBe(wallet2);
  });
});

describe('deriveWallet', () => {
  const { deriveWallet } = getWallet;
  const remoteSignMock = remoteSign as Mock<typeof remoteSign>;
  const remoteSignJWTMock = remoteSignJWT as Mock<typeof remoteSignJWT>;
  const remoteDeriveWalletMock = remoteDeriveWallet as Mock<typeof remoteDeriveWallet>;

  afterEach(() => {
    clearEnvironment();
    remoteSignMock.mockReset();
    remoteSignJWTMock.mockReset();
    remoteDeriveWalletMock.mockReset();
    delete process.env.BLOCKLET_APP_PK;
    delete process.env.BLOCKLET_COMPONENT_API_KEY;
  });

  test('should create wallet locally when secret key is available', async () => {
    setEnvironment('40413', true);

    const userSub = 'email|user@example.com';
    const wallet = await deriveWallet(userSub);

    expect(wallet.address).toBeDefined();
    expect(wallet.publicKey).toBeDefined();

    // Verify it matches the local fromAppDid behavior
    const expectedWallet = fromAppDid(userSub, appSk);
    expect(wallet.address).toEqual(expectedWallet.address);
    expect(wallet.publicKey).toEqual(expectedWallet.publicKey);

    // Should not call remote API
    expect(remoteDeriveWalletMock).not.toHaveBeenCalled();
  });

  test('should create wallet locally with different types', async () => {
    setEnvironment('40414', true);

    const userSub = 'email|user@example.com';
    const wallet = await deriveWallet(userSub, 'ethereum');

    expect(wallet.address).toBeDefined();
    expect(wallet.publicKey).toBeDefined();

    // Verify it matches the local fromAppDid behavior
    const expectedWallet = fromAppDid(userSub, appSk, 'ethereum');
    expect(wallet.address).toEqual(expectedWallet.address);
    expect(wallet.publicKey).toEqual(expectedWallet.publicKey);
  });

  test('should create wallet locally with custom index', async () => {
    setEnvironment('40415', true);

    const userSub = 'email|user@example.com';
    const wallet = await deriveWallet(userSub, undefined, 5);

    expect(wallet.address).toBeDefined();
    expect(wallet.publicKey).toBeDefined();

    // Verify it matches the local fromAppDid behavior
    const expectedWallet = fromAppDid(userSub, appSk, undefined, 5);
    expect(wallet.address).toEqual(expectedWallet.address);
  });

  test('should create wallet via remote API when secret key is missing', async () => {
    const testWallet = fromRandom();
    const userSub = 'email|user@example.com';

    setEnvironment('40416', false);
    process.env.BLOCKLET_APP_SK = '';
    process.env.BLOCKLET_APP_PK = testWallet.publicKey;
    process.env.BLOCKLET_DID = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
    process.env.BLOCKLET_REAL_DID = 'did:component:4';
    process.env.BLOCKLET_COMPONENT_API_KEY = 'test-api-key';

    // Mock remote fromAppDid response with full wallet JSON
    remoteDeriveWalletMock.mockResolvedValue(testWallet.toJSON());

    const wallet = await deriveWallet(userSub);

    expect(wallet.address).toEqual(testWallet.address);
    expect(wallet.publicKey).toEqual(testWallet.publicKey);
    expect(wallet.secretKey).toEqual(testWallet.secretKey);
    expect(remoteDeriveWalletMock).toHaveBeenCalledWith(userSub, undefined, undefined, { keyType: 'sk' });
  });

  test('should create wallet via remote API with type and index', async () => {
    const testWallet = fromRandom();
    const userSub = 'oauth|github|123456';

    setEnvironment('40417', false);
    process.env.BLOCKLET_APP_SK = '';
    process.env.BLOCKLET_APP_PK = testWallet.publicKey;
    process.env.BLOCKLET_DID = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
    process.env.BLOCKLET_REAL_DID = 'did:component:5';
    process.env.BLOCKLET_COMPONENT_API_KEY = 'test-api-key';

    remoteDeriveWalletMock.mockResolvedValue(testWallet.toJSON());

    const wallet = await deriveWallet(userSub, 'ethereum', 10);

    expect(wallet.address).toEqual(testWallet.address);
    expect(wallet.secretKey).toEqual(testWallet.secretKey);
    expect(remoteDeriveWalletMock).toHaveBeenCalledWith(userSub, 'ethereum', 10, { keyType: 'sk' });
  });

  test('remote wallet should support sign method', async () => {
    const testWallet = fromRandom();
    const userSub = 'email|user@example.com';
    const payload = 'test payload';

    setEnvironment('40418', false);
    process.env.BLOCKLET_APP_SK = '';
    process.env.BLOCKLET_APP_PK = testWallet.publicKey;
    process.env.BLOCKLET_DID = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
    process.env.BLOCKLET_REAL_DID = 'did:component:6';
    process.env.BLOCKLET_COMPONENT_API_KEY = 'test-api-key';

    remoteDeriveWalletMock.mockResolvedValue(testWallet.toJSON());

    const wallet = await deriveWallet(userSub);
    const result = await wallet.sign(payload);

    expect(result).toBeDefined();
    // Now wallet has secretKey, so it can sign locally without calling remote API
    expect(remoteSignMock).not.toHaveBeenCalled();
  });

  test('remote wallet should support signJWT method', async () => {
    const testWallet = fromRandom();
    const userSub = 'email|user@example.com';
    const payload = { userId: '123', role: 'admin' };

    setEnvironment('40419', false);
    process.env.BLOCKLET_APP_SK = '';
    process.env.BLOCKLET_APP_PK = testWallet.publicKey;
    process.env.BLOCKLET_DID = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
    process.env.BLOCKLET_REAL_DID = 'did:component:7';
    process.env.BLOCKLET_COMPONENT_API_KEY = 'test-api-key';

    remoteDeriveWalletMock.mockResolvedValue(testWallet.toJSON());

    const wallet = await deriveWallet(userSub);
    const token = await wallet.signJWT(payload);

    expect(token).toBeDefined();
    // Now wallet has secretKey, so it can sign JWT locally without calling remote API
    expect(remoteSignJWTMock).not.toHaveBeenCalled();
  });

  test('should throw error when remote API returns invalid data', async () => {
    const userSub = 'email|user@example.com';

    setEnvironment('40420', false);
    process.env.BLOCKLET_APP_SK = '';
    process.env.BLOCKLET_APP_PK = 'test-pk';
    process.env.BLOCKLET_DID = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
    process.env.BLOCKLET_REAL_DID = 'did:component:8';
    process.env.BLOCKLET_COMPONENT_API_KEY = 'test-api-key';

    // Mock invalid response without secretKey
    remoteDeriveWalletMock.mockResolvedValue({
      address: 'z1abc123',
      publicKey: 'test-pk',
      type: {},
    } as any);

    await expect(deriveWallet(userSub)).rejects.toThrow('Invalid response from remote fromAppDid: wallet is invalid');
  });

  test('should throw error when remote API returns no publicKey', async () => {
    const userSub = 'email|user@example.com';

    setEnvironment('40421', false);
    process.env.BLOCKLET_APP_SK = '';
    process.env.BLOCKLET_APP_PK = 'test-pk';
    process.env.BLOCKLET_DID = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
    process.env.BLOCKLET_REAL_DID = 'did:component:9';
    process.env.BLOCKLET_COMPONENT_API_KEY = 'test-api-key';

    // Mock invalid response without publicKey
    remoteDeriveWalletMock.mockResolvedValue({
      address: 'test-address',
      publicKey: '',
      type: {},
    } as any);

    await expect(deriveWallet(userSub)).rejects.toThrow('Invalid response from remote fromAppDid: wallet is invalid');
  });

  test('should create wallet with PSK when keyType is psk', async () => {
    const testWallet = fromRandom();
    const userSub = 'email|user@example.com';

    setEnvironment('40422', false);
    process.env.BLOCKLET_APP_SK = '';
    process.env.BLOCKLET_APP_PSK = appSk; // PSK available
    process.env.BLOCKLET_APP_PK = testWallet.publicKey;
    process.env.BLOCKLET_DID = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
    process.env.BLOCKLET_REAL_DID = 'did:component:10';
    process.env.BLOCKLET_COMPONENT_API_KEY = 'test-api-key';

    // Should derive wallet locally using PSK
    const wallet = await deriveWallet(userSub, undefined, undefined, 'psk');

    expect(wallet.address).toBeDefined();
    expect(wallet.publicKey).toBeDefined();

    // Verify it matches the local fromAppDid behavior with PSK
    const expectedWallet = fromAppDid(userSub, appSk);
    expect(wallet.address).toEqual(expectedWallet.address);
    expect(wallet.publicKey).toEqual(expectedWallet.publicKey);

    // Should not call remote API when PSK is available locally
    expect(remoteDeriveWalletMock).not.toHaveBeenCalled();
  });

  test('should create wallet via remote API with PSK when local PSK is missing', async () => {
    const testWallet = fromRandom();
    const userSub = 'email|permanent@example.com';

    setEnvironment('40423', false);
    process.env.BLOCKLET_APP_SK = '';
    process.env.BLOCKLET_APP_PSK = ''; // No PSK available
    process.env.BLOCKLET_APP_PK = testWallet.publicKey;
    process.env.BLOCKLET_DID = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
    process.env.BLOCKLET_REAL_DID = 'did:component:11';
    process.env.BLOCKLET_COMPONENT_API_KEY = 'test-api-key';

    remoteDeriveWalletMock.mockResolvedValue(testWallet.toJSON());

    const wallet = await deriveWallet(userSub, undefined, undefined, 'psk');

    expect(wallet.address).toEqual(testWallet.address);
    expect(wallet.publicKey).toEqual(testWallet.publicKey);
    expect(remoteDeriveWalletMock).toHaveBeenCalledWith(userSub, undefined, undefined, { keyType: 'psk' });
  });
});
