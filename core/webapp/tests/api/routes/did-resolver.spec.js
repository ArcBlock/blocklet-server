const { test, expect, describe, mock } = require('bun:test');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const toLower = require('lodash/toLower');
const { fromRandom } = require('@ocap/wallet');
const { toBase58 } = require('@ocap/util');

const { getDidDocumentMiddleware } = require('../../../api/routes/did-resolver');

class MockResponse {
  status(value) {
    this.status = value;
    return this;
  }

  json(data) {
    this.data = data;
    return this;
  }
}

describe('did-resolver', () => {
  const server = fromRandom();
  const blocklet = fromRandom();

  const testServerDid = server.address;
  const testBlockletDid = blocklet.address;
  const info = getBlockletInfo(
    { appDid: testBlockletDid, meta: { did: testBlockletDid }, environments: [] },
    server.secretKey
  );

  test("should return 404 error if the blocklet did can't be found", async () => {
    const mockReq = {
      get() {
        return '';
      },
    };

    const mockRes = new MockResponse();

    const getDidDocument = getDidDocumentMiddleware({ getNodeInfo: mock().mockResolvedValue(null) });

    await getDidDocument(mockReq, mockRes);
    expect(mockRes.status).toEqual(404);
    expect(mockRes.data.message).toEqual(expect.stringMatching(/Service can not be found/i));
  });

  test("should return 404 error if the blocklet did can't be found", async () => {
    const mockReq = {
      get(name) {
        if (toLower(name) === 'x-blocklet-did') {
          return testBlockletDid;
        }

        return '';
      },
    };

    const getNodeInfo = mock().mockResolvedValue({ did: testServerDid, pk: server.publicKey, sk: server.secretKey });
    const getBlocklet = mock().mockResolvedValue(null);

    const mockRes = new MockResponse();

    const getDidDocument = getDidDocumentMiddleware({ getNodeInfo, getBlocklet });

    await getDidDocument(mockReq, mockRes);

    expect(mockRes.status).toEqual(404);
    expect(mockRes.data.message).toEqual(expect.stringMatching(/Service can not be found/i));
    expect(getNodeInfo).toHaveBeenCalled();
    expect(getBlocklet).toHaveBeenCalled();
  });

  test('should return blocklet did document', async () => {
    const mockReq = {
      get(name) {
        if (toLower(name) === 'x-blocklet-did') {
          return testBlockletDid;
        }

        return '';
      },
    };

    const getNodeInfo = mock().mockResolvedValue({ did: testServerDid, pk: server.publicKey, sk: server.secretKey });
    const getBlocklet = mock().mockResolvedValue({
      appDid: testBlockletDid,
      meta: { did: testBlockletDid },
      environments: [],
    });

    const mockRes = new MockResponse();

    const getDidDocument = getDidDocumentMiddleware({ getNodeInfo, getBlocklet });

    await getDidDocument(mockReq, mockRes);

    expect(mockRes.data).toEqual({
      id: `did:abt:${testBlockletDid}`,
      alsoKnownAs: [],
      controller: `did:abt:${testServerDid}`,
      services: [
        {
          id: `did:abt:${testBlockletDid}`,
          path: '/.well-known/service/admin',
          type: 'blocklet',
          metadata: {
            version: '1.0.0',
            running: false,
            name: undefined,
            description: undefined,
          },
        },
      ],
      verificationMethod: [
        {
          controller: `did:abt:${testBlockletDid}`,
          id: `${testBlockletDid}#key-1`,
          publicKeyMultibase: toBase58(info.wallet.publicKey),
          type: 'Ed25519Signature',
        },
      ],
    });
    expect(getNodeInfo).toHaveBeenCalled();
    expect(getBlocklet).toHaveBeenCalled();
  });

  test('should return blocklet did document for migrated', async () => {
    const mockReq = {
      get(name) {
        if (toLower(name) === 'x-blocklet-did') {
          return testBlockletDid;
        }

        return '';
      },
    };

    const getNodeInfo = mock().mockResolvedValue({ did: testServerDid, pk: server.publicKey, sk: server.secretKey });
    const getBlocklet = mock().mockResolvedValue({
      appDid: testBlockletDid,
      appPid: testBlockletDid,
      meta: { did: testBlockletDid },
      environments: [],
      migratedFrom: [{ appDid: 'migrated-from' }],
    });

    const mockRes = new MockResponse();
    const getDidDocument = getDidDocumentMiddleware({ getNodeInfo, getBlocklet });

    await getDidDocument(mockReq, mockRes);

    expect(mockRes.data).toEqual({
      id: `did:abt:${testBlockletDid}`,
      alsoKnownAs: [`did:abt:${testBlockletDid}`, 'did:abt:migrated-from'],
      controller: `did:abt:${testServerDid}`,
      services: [
        {
          id: `did:abt:${testBlockletDid}`,
          path: '/.well-known/service/admin',
          type: 'blocklet',
          metadata: {
            version: '1.0.0',
            running: false,
            description: undefined,
            name: undefined,
          },
        },
      ],
      verificationMethod: [
        {
          controller: `did:abt:${testBlockletDid}`,
          id: `${testBlockletDid}#key-1`,
          publicKeyMultibase: toBase58(info.wallet.publicKey),
          type: 'Ed25519Signature',
        },
      ],
    });
    expect(getNodeInfo).toHaveBeenCalled();
    expect(getBlocklet).toHaveBeenCalled();
  });

  test('should return server did document', async () => {
    const mockReq = {
      get(name) {
        if (toLower(name) === 'x-blocklet-did') {
          return testServerDid;
        }

        return '';
      },
    };

    const appDid = testBlockletDid;
    const getNodeInfo = mock().mockResolvedValue({
      did: testServerDid,
      pk: server.publicKey,
      sk: server.secretKey,
      version: '1.16.18',
      mode: 'production',
      name: 'DevServer',
      description: 'DevServer',
      initialized: true,
    });
    const getBlocklet = mock().mockResolvedValue({ appDid, meta: { did: appDid }, environments: [] });

    const mockRes = new MockResponse();

    const getDidDocument = getDidDocumentMiddleware({ getNodeInfo, getBlocklet });

    await getDidDocument(mockReq, mockRes);

    expect(mockRes.data).toEqual({
      id: `did:abt:${testServerDid}`,
      alsoKnownAs: [],
      controller: `did:abt:${testServerDid}`,
      services: [
        {
          id: `did:abt:${testServerDid}`,
          path: '/.well-known/server/admin',
          type: 'server',
          metadata: {
            initialized: true,
            mode: 'production',
            name: 'DevServer',
            description: 'DevServer',
            version: '1.16.18',
          },
        },
      ],
      verificationMethod: [
        {
          controller: `did:abt:${testServerDid}`,
          id: `${testServerDid}#key-1`,
          publicKeyMultibase: toBase58(server.publicKey),
          type: 'Ed25519Signature',
        },
      ],
    });

    expect(getNodeInfo).toHaveBeenCalled();
    expect(getBlocklet).not.toHaveBeenCalled();
  });
});
