const { mock, describe, test, expect, afterEach, beforeAll, afterAll, spyOn } = require('bun:test');

mock.module('@abtnode/certificate-manager/sdk/manager', () => {
  class Manager {
    add = mock();

    upsertByDomain = mock();

    issue = mock();

    onCertIssued = mock();

    onCertError = mock();

    on = mock();
  }
  Manager.add = mock();
  Manager.upsertByDomain = mock();
  Manager.issue = mock();
  Manager.prototype.on = mock();
  Manager.prototype.onCertIssued = mock();
  Manager.prototype.onCertError = mock();
  return {
    __esModule: true,
    default: Manager,
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const fs = require('fs');
const os = require('os');
const path = require('path');
const uuid = require('uuid');

const Cert = require('../lib/cert');

describe('cert', () => {
  const tempDir = path.join(os.homedir(), 'abtnode-test-cert');

  const initManager = (
    states,
    teamManager = {
      createNotification: mock(),
    }
  ) => {
    return new Cert({ maintainerEmail: 'test@arcblock.io', dataDir: tempDir, states, teamManager });
  };

  beforeAll(() => {
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('update', () => {
    let certManager;

    beforeAll(() => {
      certManager = initManager();
    });

    test('should throw error if params.certificate or params.privateKey is empty', () => {
      expect(certManager.add({})).rejects.toThrow(/certificate and privateKey are required/i);
      expect(certManager.add({ certificate: 'public key' })).rejects.toThrow(
        /certificate and privateKey are required/i
      );
      expect(certManager.add({ privateKey: 'public key' })).rejects.toThrow(/certificate and privateKey are required/i);
    });

    test('should return entity after added', async () => {
      const mockResult = { name: 'test.arcblock.io', certificate: 'public key', privateKey: 'private key' };
      certManager.manager.add = mock().mockResolvedValueOnce(mockResult);

      const result = await certManager.add(mockResult);
      expect(certManager.manager.add.mock.calls.length).toEqual(1);
      expect(result).toEqual(mockResult);
    });

    test('should emit cert.added event after added', (callback) => {
      const mockResult = { name: 'test.arcblock.io', certificate: 'public key', privateKey: 'private key' };
      certManager.manager.add = mock().mockResolvedValueOnce(mockResult);
      certManager.on('cert.added', (data) => {
        try {
          expect(certManager.manager.add.mock.calls.length).toEqual(1);
          expect(data).toEqual(mockResult);
          callback(null);
        } catch (error) {
          callback(error);
        }
      });

      certManager.add(mockResult);
    });
  });

  describe('upsertByDomain', () => {
    let certManager;

    beforeAll(() => {
      certManager = initManager();
    });

    test('should return updated entity after updated', async () => {
      const mockResult = { name: 'test.arcblock.io' };
      certManager.manager.upsertByDomain = mock().mockResolvedValueOnce(mockResult);

      const result = await certManager.upsertByDomain(mockResult);
      expect(certManager.manager.upsertByDomain.mock.calls.length).toEqual(1);
      expect(result).toEqual(mockResult);
    });

    test('should emit cert.updated event after updated', (callback) => {
      const mockResult = { name: 'test.arcblock.io' };
      certManager.manager.upsertByDomain = mock().mockResolvedValueOnce(mockResult);
      certManager.on('cert.updated', (data) => {
        try {
          expect(certManager.manager.upsertByDomain.mock.calls.length).toEqual(1);
          expect(data).toEqual(mockResult);
          callback(null);
        } catch (error) {
          callback(error);
        }
      });

      certManager.upsertByDomain(mockResult);
    });
  });

  describe('issue', () => {
    let certManager;

    beforeAll(() => {
      certManager = initManager({
        notification: {
          create: mock(),
        },
        site: { findOne: mock().mockResolvedValue({ domainAliases: [] }), update: mock().mockResolvedValue() },
      });
    });

    afterEach(() => {
      certManager.states.site.findOne.mockClear();
      certManager.states.site.update.mockClear();
      certManager.blockletDomains = [];
    });

    test('should event work as expected', async () => {
      const mockIssue = spyOn(certManager.manager, 'issue').mockResolvedValue({});
      const mockEmit = spyOn(certManager, 'emit');

      await certManager.issue({ domain: 'a.com', did: 'a', siteId: 'a' });
      expect(mockIssue).toHaveBeenCalledWith(
        { domain: 'a.com', siteId: 'a', inBlockletSetup: false },
        expect.anything()
      );
      expect(certManager.blockletDomains.length).toBe(1);
      expect(certManager.blockletDomains[0]).toEqual({ domain: 'a.com', did: 'a' });

      certManager.onCertIssued({ domain: 'a.com' });
      expect(mockEmit).toHaveBeenCalledWith('blocklet.certIssued', { domain: 'a.com', meta: { did: 'a' } });

      certManager.onCertIssued({ domain: 'a.com' });
      expect(mockEmit).toHaveBeenCalledWith('blocklet.certIssued', { domain: 'a.com', meta: { did: 'a' } });

      certManager.onCertError({ domain: 'a.com' });
      expect(mockEmit).toHaveBeenCalledWith('blocklet.certError', { domain: 'a.com', meta: { did: 'a' } });

      certManager.onCertIssued({ domain: 'other.com' });
      expect(mockEmit).toHaveBeenCalledWith('cert.issued', { domain: 'other.com' });

      certManager.onCertError({ domain: 'other.com' });
      expect(mockEmit).toHaveBeenCalledWith('cert.error', { domain: 'other.com' });

      mockIssue.mockRestore();
      mockEmit.mockRestore();
    });

    test('should bind 100 domains to blocklet at most', async () => {
      // 目前的实现是在内存中最对保留 100 个

      const mockIssue = spyOn(certManager.manager, 'issue').mockResolvedValue({});

      for (let i = 0; i < 200; i++) {
        const random = uuid.v4();
        const domain = random;
        const did = random;
        // eslint-disable-next-line no-await-in-loop
        await certManager.issue({ domain, did, siteId: domain, inBlockletSetup: true });
        expect(mockIssue).toHaveBeenCalledWith({ domain, siteId: domain, inBlockletSetup: true }, expect.anything());
        expect(certManager.blockletDomains.length).toBe(Math.min(101, i + 1));
      }
    });

    test('should update certificateId if siteId is not empty', async () => {
      const domain = 'test-arcblock.domain';
      const siteId = 'test-site-id';
      const cert = { id: 'test-cert-id' };
      const mockIssue = spyOn(certManager.manager, 'issue').mockResolvedValue(cert);
      const mockFindOne = spyOn(certManager.states.site, 'findOne').mockResolvedValue({
        domainAliases: [
          {
            value: domain,
          },
        ],
      });

      await certManager.issue({ domain, did: 'test-did', siteId });

      expect(mockFindOne).toHaveBeenCalled();
      expect(mockIssue).toHaveBeenCalled();
      expect(certManager.states.site.update).toHaveBeenCalledWith(
        { id: siteId },
        {
          $set: {
            domainAliases: [
              {
                certificateId: cert.id,
                value: domain,
              },
            ],
          },
        }
      );
    });

    test('should not update certificateId if siteId is empty', async () => {
      await certManager.issue({ domain: 'a.com', did: 'a' });
      expect(certManager.states.site.findOne).not.toHaveBeenCalled();
      expect(certManager.states.site.update).not.toHaveBeenCalled();
    });
  });

  describe('notification', () => {
    let certManager;

    beforeAll(() => {
      certManager = initManager({
        notification: {
          create: mock(),
        },
        teamManager: {
          createNotification: mock(),
        },
      });
    });

    afterEach(() => {
      certManager.teamManager.createNotification.mockClear();
    });

    test('cert issued', () => {
      expect(certManager.teamManager.createNotification).not.toHaveBeenCalled();
      certManager.onCertIssued({ domain: 'a.com' });
      expect(certManager.teamManager.createNotification).toHaveBeenCalled();
    });

    test('cert error', () => {
      expect(certManager.teamManager.createNotification).not.toHaveBeenCalled();
      certManager.onCertError({ domain: 'a.com' });
      expect(certManager.teamManager.createNotification).toHaveBeenCalled();
    });

    test('cert about expire', () => {
      expect(certManager.teamManager.createNotification).not.toHaveBeenCalled();
      certManager.onCertAboutToExpire({ domain: 'a.com' });
      expect(certManager.teamManager.createNotification).toHaveBeenCalled();
    });

    test('cert expire', () => {
      expect(certManager.teamManager.createNotification).not.toHaveBeenCalled();
      certManager.onCertExpired({ domain: 'a.com' });
      expect(certManager.teamManager.createNotification).toHaveBeenCalled();
    });
  });
});
