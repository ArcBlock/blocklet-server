const { describe, test, mock, expect, beforeEach, afterAll } = require('bun:test');
const express = require('express');
const request = require('supertest');
const bodyParser = require('body-parser');

const testBlocklet = {
  meta: {
    did: 'z1hpgQbjSQrfvypEQdWs24GeBV7QFaoYd45',
    title: 'Test Blocklet',
  },
  environmentObj: {
    BLOCKLET_APP_SK:
      '0x338003c9b11cd9cb49a8c68db3ddeb860b394ab8d926d94cd917c14c1b9a805b6d4cba304e7f957facb2bfa11132a6688c233d75fa710f8bde469be6cbba5a81',
    BLOCKLET_APP_PSK:
      '0xbf859b318716a7c553640b29cb45b3860b3e76a6270472a9986014e87f4fd12de4bd11bb0246057f15ff1c590f83c7f23d19b0ff08bcaaa96430376ea79e124b',
  },
  children: [
    {
      meta: {
        did: 'z2qaL9mF75qcEiGEhcLZZLo5nGj8ECSeYSknZ',
        title: 'Test Component',
      },
    },
  ],
};

const testComponentId = 'z2qaL9mF75qcEiGEhcLZZLo5nGj8ECSeYSknZ';
const testComponentApiKey = 'test-component-api-key';

// Mock modules
mock.module('../../api/middlewares/ensure-blocklet', () => {
  function fn() {
    return (req, res, next) => {
      req.blocklet = testBlocklet;
      next();
    };
  }
  return {
    default: fn,
    __esModule: true,
  };
});

mock.module('@abtnode/util/lib/blocklet', () => {
  const originalModule = request('@abtnode/util/lib/blocklet');
  return {
    __esModule: true,
    ...originalModule,
    getComponentApiKey: () => testComponentApiKey,
  };
});

mock.module('@blocklet/meta/lib/util', () => {
  const originalModule = request('@blocklet/meta/lib/util');
  return {
    __esModule: true,
    ...originalModule,
    findComponentByIdV2: (blocklet, componentId) => {
      return blocklet.children.find((c) => c.meta.did === componentId);
    },
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

// Create audit log mock
const mockCreateAuditLog = mock().mockResolvedValue({});

const { init } = require('../../api/routes/sign');

// Setup express server
const server = express();
server.use(bodyParser.json());

// Middleware to simulate localhost and add required request properties
server.use((req, res, next) => {
  // Simulate localhost
  req.ip = '127.0.0.1';
  req.connection = { remoteAddress: '127.0.0.1' };
  req.socket = { remoteAddress: '127.0.0.1' };

  // Add required request properties
  req.getNodeInfo = mock().mockResolvedValue({
    sk: '0x1234567890abcdef',
    did: 'server-did',
  });

  next();
});

// Initialize routes
init(server, { createAuditLog: mockCreateAuditLog }, {});

describe('Sign API Routes', () => {
  beforeEach(() => {
    mock.clearAllMocks();
    mock.restore();
  });

  describe('POST /.well-known/service/api/sign', () => {
    test('should sign payload successfully', async () => {
      const payload = { message: 'test' };

      const res = await request(server)
        .post('/.well-known/service/api/sign')
        .set('x-component-did', testComponentId)
        .send({
          payload,
          apiKey: testComponentApiKey,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('signature');
      expect(res.body).toHaveProperty('publicKey');
      expect(typeof res.body.signature).toBe('string');
      expect(res.body.signature.length).toBeGreaterThan(0);
    });

    test('should sign buffer payload successfully', async () => {
      const payload = {
        __type: 'buffer',
        data: Buffer.from('test message').toString('hex'),
      };

      const res = await request(server)
        .post('/.well-known/service/api/sign')
        .set('x-component-did', testComponentId)
        .send({
          payload,
          apiKey: testComponentApiKey,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('signature');
      expect(res.body).toHaveProperty('publicKey');
    });

    test('should create audit log with componentDid', async () => {
      const payload = { message: 'test' };

      await request(server).post('/.well-known/service/api/sign').set('x-component-did', testComponentId).send({
        payload,
        apiKey: testComponentApiKey,
      });

      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'remoteSign',
          args: expect.objectContaining({
            teamDid: testBlocklet.meta.did,
            componentId: testComponentId,
          }),
          context: expect.objectContaining({
            user: expect.objectContaining({
              did: testBlocklet.meta.did,
              role: 'blocklet',
              componentDid: testComponentId,
            }),
          }),
        })
      );
    });

    test('should return 400 when x-component-did header is missing', async () => {
      const res = await request(server)
        .post('/.well-known/service/api/sign')
        .send({
          payload: { test: 'data' },
          apiKey: testComponentApiKey,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Missing x-component-did header');
    });

    test('should return 401 when apiKey is invalid', async () => {
      const res = await request(server)
        .post('/.well-known/service/api/sign')
        .set('x-component-did', testComponentId)
        .send({
          payload: { test: 'data' },
          apiKey: 'wrong-api-key',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid component API key');
    });
  });

  describe('POST /.well-known/service/api/sign/jwt', () => {
    test('should sign JWT successfully with default options', async () => {
      const payload = { sub: 'test-user', iat: Math.floor(Date.now() / 1000) };

      const res = await request(server)
        .post('/.well-known/service/api/sign/jwt')
        .set('x-component-did', testComponentId)
        .send({
          payload,
          apiKey: testComponentApiKey,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('publicKey');
      expect(typeof res.body.token).toBe('string');
      expect(res.body.token.split('.').length).toBe(3); // JWT has 3 parts
    });

    test('should sign JWT with custom options', async () => {
      const payload = { sub: 'test-user' };
      const options = { doSign: false, version: '1.0.0' };

      const res = await request(server)
        .post('/.well-known/service/api/sign/jwt')
        .set('x-component-did', testComponentId)
        .send({
          payload,
          options,
          apiKey: testComponentApiKey,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    test('should create audit log with componentDid and jwt version', async () => {
      const payload = { sub: 'test' };
      const options = { version: '1.1.0' };

      await request(server).post('/.well-known/service/api/sign/jwt').set('x-component-did', testComponentId).send({
        payload,
        options,
        apiKey: testComponentApiKey,
      });

      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'remoteSignJWT',
          args: expect.objectContaining({
            componentId: testComponentId,
            jwtVersion: '1.1.0',
          }),
          context: expect.objectContaining({
            user: expect.objectContaining({
              componentDid: testComponentId,
            }),
          }),
        })
      );
    });

    test('should handle empty payload', async () => {
      const res = await request(server)
        .post('/.well-known/service/api/sign/jwt')
        .set('x-component-did', testComponentId)
        .send({
          apiKey: testComponentApiKey,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });
  });

  describe('POST /.well-known/service/api/sign/eth', () => {
    test('should successfully sign with ethereum wallet (type is always forced to ethereum)', async () => {
      const data = '0x1234567890abcdef';
      mockCreateAuditLog.mockClear();

      const res = await request(server)
        .post('/.well-known/service/api/sign/eth')
        .set('x-component-did', testComponentId)
        .send({
          data,
          hashBeforeSign: true,
          apiKey: testComponentApiKey,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('signature');
      expect(res.body).toHaveProperty('publicKey');
      expect(res.body.signature).toBeTruthy();
      expect(res.body.publicKey).toBeTruthy();

      // Should create audit log on success
      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'remoteSignETH',
          args: expect.objectContaining({
            componentId: testComponentId,
            hashBeforeSign: true,
            dataContent: data,
          }),
        })
      );
    });
  });

  describe('POST /.well-known/service/api/sign/derive', () => {
    test('should derive wallet successfully', async () => {
      const sub = 'email|test@example.com';

      const res = await request(server)
        .post('/.well-known/service/api/sign/derive')
        .set('x-component-did', testComponentId)
        .send({
          sub,
          apiKey: testComponentApiKey,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('address');
      expect(res.body).toHaveProperty('pk');
      expect(res.body).toHaveProperty('sk');
      expect(res.body).toHaveProperty('type');
      expect(res.body.address).toBeTruthy();
      expect(res.body.pk).toBeTruthy();
      expect(res.body.sk).toBeTruthy();
    });

    test('should derive wallet with type and index', async () => {
      const sub = 'email|test@example.com';
      const type = 'ethereum';
      const index = 1;

      const res = await request(server)
        .post('/.well-known/service/api/sign/derive')
        .set('x-component-did', testComponentId)
        .send({
          sub,
          type,
          index,
          apiKey: testComponentApiKey,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('address');
      expect(res.body).toHaveProperty('pk');
      expect(res.body).toHaveProperty('sk');
      expect(res.body).toHaveProperty('type');
    });

    test('should create audit log with componentDid and derive parameters', async () => {
      const sub = 'email|test@example.com';
      const type = 'ethereum';
      const index = 5;

      await request(server).post('/.well-known/service/api/sign/derive').set('x-component-did', testComponentId).send({
        sub,
        type,
        index,
        apiKey: testComponentApiKey,
      });

      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'remoteDeriveWallet',
          args: expect.objectContaining({
            componentId: testComponentId,
            sub,
            type,
            index,
          }),
          context: expect.objectContaining({
            user: expect.objectContaining({
              componentDid: testComponentId,
            }),
          }),
        })
      );
    });
  });

  describe('Component validation', () => {
    test('should return 404 when component is not found', async () => {
      const res = await request(server)
        .post('/.well-known/service/api/sign')
        .set('x-component-did', 'non-existent-component')
        .send({
          payload: { test: 'data' },
          apiKey: testComponentApiKey,
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Component not found');
    });

    test('should return 400 when apiKey is missing', async () => {
      const res = await request(server)
        .post('/.well-known/service/api/sign')
        .set('x-component-did', testComponentId)
        .send({
          payload: { test: 'data' },
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid component API key');
    });
  });

  describe('Parameter validation', () => {
    test('POST /api/sign - should validate required parameters', async () => {
      // Missing payload
      let res = await request(server)
        .post('/.well-known/service/api/sign')
        .set('x-component-did', testComponentId)
        .send({ apiKey: testComponentApiKey });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('payload');

      // Invalid keyType
      res = await request(server)
        .post('/.well-known/service/api/sign')
        .set('x-component-did', testComponentId)
        .send({ payload: { test: 'data' }, apiKey: testComponentApiKey, options: { keyType: 'invalid' } });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('keyType');
    });

    test('POST /api/sign/jwt - should validate required parameters', async () => {
      // Invalid keyType
      const res = await request(server)
        .post('/.well-known/service/api/sign/jwt')
        .set('x-component-did', testComponentId)
        .send({ payload: { sub: 'test' }, apiKey: testComponentApiKey, options: { keyType: 'invalid' } });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('keyType');
    });

    test('POST /api/sign/eth - should validate required parameters', async () => {
      // Missing data
      let res = await request(server)
        .post('/.well-known/service/api/sign/eth')
        .set('x-component-did', testComponentId)
        .send({ apiKey: testComponentApiKey });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('data');

      // Invalid data type
      res = await request(server)
        .post('/.well-known/service/api/sign/eth')
        .set('x-component-did', testComponentId)
        .send({ data: 12345, apiKey: testComponentApiKey });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('data');
    });

    test('POST /api/sign/derive - should validate required parameters', async () => {
      // Missing sub
      let res = await request(server)
        .post('/.well-known/service/api/sign/derive')
        .set('x-component-did', testComponentId)
        .send({ apiKey: testComponentApiKey });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('sub');

      // Invalid sub type
      res = await request(server)
        .post('/.well-known/service/api/sign/derive')
        .set('x-component-did', testComponentId)
        .send({ sub: 12345, apiKey: testComponentApiKey });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('sub');

      // Invalid index type
      res = await request(server)
        .post('/.well-known/service/api/sign/derive')
        .set('x-component-did', testComponentId)
        .send({ sub: 'email|test@example.com', index: 'invalid', apiKey: testComponentApiKey });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('index');
    });
  });

  describe('KeyType support (sk vs psk)', () => {
    test('should verify signatures are different between sk and psk', async () => {
      const payload = { message: 'same message' };

      // Sign with sk (default)
      const resSk = await request(server)
        .post('/.well-known/service/api/sign')
        .set('x-component-did', testComponentId)
        .send({
          payload,
          apiKey: testComponentApiKey,
        });

      // Sign with psk
      const resPsk = await request(server)
        .post('/.well-known/service/api/sign')
        .set('x-component-did', testComponentId)
        .send({
          payload,
          options: { keyType: 'psk' },
          apiKey: testComponentApiKey,
        });

      expect(resSk.status).toBe(200);
      expect(resPsk.status).toBe(200);

      // Same payload signed with different keys should produce different signatures
      expect(resSk.body.signature).not.toBe(resPsk.body.signature);
      // And different public keys
      expect(resSk.body.publicKey).not.toBe(resPsk.body.publicKey);
    });

    test('should support additional sign parameters (encoding, hashBeforeSign)', async () => {
      const payload = { message: 'test with options' };

      const res = await request(server)
        .post('/.well-known/service/api/sign')
        .set('x-component-did', testComponentId)
        .send({
          payload,
          options: {
            keyType: 'sk',
            encoding: 'hex',
            hashBeforeSign: false,
          },
          apiKey: testComponentApiKey,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('signature');
      expect(res.body).toHaveProperty('publicKey');
    });

    test('should sign JWT with psk when keyType is specified', async () => {
      const payload = { sub: 'test-user' };

      const res = await request(server)
        .post('/.well-known/service/api/sign/jwt')
        .set('x-component-did', testComponentId)
        .send({
          payload,
          options: { keyType: 'psk' },
          apiKey: testComponentApiKey,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('publicKey');
    });

    test('should derive wallet with psk when keyType is specified', async () => {
      const sub = 'email|permanent@example.com';

      const res = await request(server)
        .post('/.well-known/service/api/sign/derive')
        .set('x-component-did', testComponentId)
        .send({
          sub,
          options: { keyType: 'psk' },
          apiKey: testComponentApiKey,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('address');
      expect(res.body).toHaveProperty('pk');
      expect(res.body).toHaveProperty('sk');
    });
  });
});
