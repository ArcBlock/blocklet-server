const { describe, test, expect, beforeAll, afterAll, afterEach, spyOn, mock } = require('bun:test');
const dns = require('dns');
const { fromRandom } = require('@ocap/wallet');
const { ROUTING_RULE_TYPES } = require('@abtnode/constant');
const { getBlocklets, setupInstance, tearDownInstance } = require('../../tools/fixture');
const { isMockedDidDomain } = require('../../lib/router/manager');

describe('RouterManager', () => {
  let instance = null;
  let manager = null;
  let blockletState = null;
  let siteState = null;

  const blocklets = getBlocklets();

  beforeAll(async () => {
    instance = await setupInstance('router-manager');
    blockletState = instance.states.blocklet;
    siteState = instance.states.site;
    manager = instance.routerManager;

    await blockletState.addBlocklet({ did: blocklets[0].did, meta: blocklets[0] });
    await blockletState.addBlocklet({ did: blocklets[1].did, meta: blocklets[1] });
  });

  afterAll(async () => {
    await tearDownInstance(instance);
  });

  ['/admin', '/static'].forEach((x) => {
    test(`should addRoutingSite throw error on path prefix: ${x}`, async () => {
      const site = {
        domain: 'abtnode.com',
        rules: [
          {
            from: { pathPrefix: x },
            to: { did: blocklets[0].did, port: 8089, interfaceName: 'publicUrl', type: ROUTING_RULE_TYPES.BLOCKLET },
          },
        ],
      };

      try {
        await manager.addRoutingSite({ site });
      } catch (err) {
        expect(err).toBeTruthy();
        expect(err.message.indexOf("path prefix can't be one of these values") > -1).toBeTruthy(); // eslint-disable-line

        const sites = await siteState.getSites();
        expect(sites.length).toEqual(0);
      }
    });
  });

  test('should addRoutingSite throw error on unsupported blocklet', async () => {
    const site = {
      domain: 'abtnode.com',
      rules: [
        {
          from: { pathPrefix: '/my-awesome-prefix' },
          to: { did: blocklets[0].did, port: 8089, interfaceName: 'publicUrl', type: ROUTING_RULE_TYPES.BLOCKLET },
        },
      ],
    };

    try {
      await manager.addRoutingSite({ site });
    } catch (err) {
      expect(err).toBeTruthy();
      expect(err.message.indexOf('for blocklet that can only mount on') > -1).toBeTruthy();
      const sites = await siteState.getSites();
      expect(sites.length).toEqual(0);
    }
  });

  test('should addRoutingSite not throw error on unsupported blocklet and root path', async () => {
    const site = {
      domain: 'abtnode.com',
      rules: [
        {
          from: { pathPrefix: '/' },
          to: { did: blocklets[0].did, port: 8089, interfaceName: 'publicUrl', type: ROUTING_RULE_TYPES.BLOCKLET },
        },
      ],
    };

    await manager.addRoutingSite({ site });
    const sites = await siteState.getSites();
    expect(sites.length).toEqual(1);
  }, 20_000);

  test('should not allow duplicate sites', async () => {
    const site = {
      domain: 'abtnode.com',
      rules: [
        {
          from: { pathPrefix: '/' },
          to: { did: blocklets[0].did, port: 8089, interfaceName: 'publicUrl', type: ROUTING_RULE_TYPES.BLOCKLET },
        },
      ],
    };

    try {
      await manager.addRoutingSite({ site });
    } catch (err) {
      expect(err).toBeTruthy();
      expect(err.message.indexOf('already exists') > -1).toBeTruthy();
      const sites = await siteState.getSites();
      expect(sites.length).toEqual(1);
    }
  });

  test('should addRoutingSite not throw error on supported blocklet and root path', async () => {
    const site = {
      domain: 'abtnode2.com',
      rules: [
        {
          from: { pathPrefix: '/another-prefix' },
          to: { did: blocklets[1].did, port: 8090, interfaceName: 'publicUrl', type: ROUTING_RULE_TYPES.BLOCKLET },
        },
      ],
    };

    await manager.addRoutingSite({ site });
    const sites = await siteState.getSites();
    expect(sites.length).toEqual(2);
  });

  describe('updateRoutingSite', () => {
    test('should updateRoutingSite', async () => {
      const sites = await siteState.getSites();
      const firstId = sites[0].id;
      const changedSite = await manager.updateRoutingSite({ id: firstId, corsAllowedOrigins: ['*'] });
      expect(changedSite.corsAllowedOrigins).toEqual(['*']);
    });

    test('should convert the domain to lower case', async () => {
      const sites = await siteState.getSites();
      const firstId = sites[0].id;
      const changedSite = await manager.updateRoutingSite({ id: firstId, domain: 'update-tesT.ArcBlock.com' });

      expect(changedSite.domain).toEqual('update-test.arcblock.com');
    });
  });

  describe('addDomainAlias', () => {
    test('should add domain aliases', async () => {
      const sites = await siteState.getSites();
      const firstId = sites[0].id;
      const changedSite = await manager.addDomainAlias({ id: firstId, domainAlias: 'a.com' });
      expect(changedSite.domainAliases).toEqual([{ value: 'a.com', isProtected: false }]);

      await manager.deleteDomainAlias({ id: firstId, domainAlias: 'a.com' });
    });

    test('should convert the domain to lower case', async () => {
      const sites = await siteState.getSites();
      const firstId = sites[0].id;
      const changedSite = await manager.addDomainAlias({ id: firstId, domainAlias: 'arcBlocK.cOM' });
      expect(changedSite.domainAliases).toEqual([{ value: 'arcblock.com', isProtected: false }]);

      await manager.deleteDomainAlias({ id: firstId, domainAlias: 'arcblock.com' });
    });

    test('should throw error on add a did domain while type!=nft-domain', async () => {
      const mockFindOne = spyOn(siteState, 'findOne').mockImplementationOnce(() =>
        Promise.resolve({ id: 'test-site-id' })
      );
      const mockIsDidDomain = spyOn(manager, 'isDidDomain').mockImplementationOnce(() => Promise.resolve(true));

      const domainAlias = 'test-1.arcblock.com';

      try {
        await manager.addDomainAlias({
          id: 'test-site-id',
          domainAlias,
          type: 'input-domain',
        });
      } catch (err) {
        expect(err.message).toBe(`domain ${domainAlias} is a did domain`);
      }

      expect(mockIsDidDomain).toHaveBeenCalledTimes(1);
      expect(mockFindOne).toHaveBeenCalledTimes(1);

      mockIsDidDomain.mockRestore();
      mockFindOne.mockRestore();
    });
  });

  describe('deleteDomainAlias', () => {
    test('should delete domain aliases', async () => {
      const sites = await siteState.getSites();
      const firstId = sites[0].id;

      const changedSite = await manager.addDomainAlias({ id: firstId, domainAlias: 'delete-test.arcblOCK.com' });
      expect(changedSite.domainAliases).toEqual([{ value: 'delete-test.arcblock.com', isProtected: false }]);

      await manager.deleteDomainAlias({ id: firstId, domainAlias: 'delETE-test.arcblOCK.com' });

      const site = await siteState.findOne({ id: firstId });
      expect(site.domainAliases).toEqual([]);
    });
  });

  describe('isDidDomain', () => {
    test('should throw error on empty domain', async () => {
      try {
        await manager.isDidDomain();
      } catch (err) {
        expect(err.message).toBe('domain is required');
      }
      try {
        await manager.isDidDomain({ domain: null });
      } catch (err) {
        expect(err.message).toBe('domain is required');
      }
      try {
        await manager.isDidDomain({ domain: '' });
      } catch (err) {
        expect(err.message).toBe('domain is required');
      }
    });

    test('should return true on ordinary did domain', async () => {
      const wallet = fromRandom();
      const domain = 'test-1.arcblock.io';
      const sig = await wallet.sign('arcblock.io');

      const mockResolveTxt = spyOn(dns.promises, 'resolveTxt').mockImplementationOnce(() =>
        Promise.resolve([[`dv=${sig}.${wallet.publicKey}`]])
      );

      expect(await manager.isDidDomain({ domain })).toEqual(true);
      expect(mockResolveTxt).toHaveBeenCalledTimes(1);
      mockResolveTxt.mockRestore();
    });

    test('should return true on tld did domain', async () => {
      const wallet = fromRandom();
      const domain = 'arcblockio';
      const sig = await wallet.sign('arcblockio');

      const mockResolveTxt = spyOn(dns.promises, 'resolveTxt').mockImplementationOnce(() =>
        Promise.resolve([[`dv=${sig}.${wallet.publicKey}`]])
      );

      expect(await manager.isDidDomain({ domain })).toEqual(true);
      expect(mockResolveTxt).toHaveBeenCalledTimes(1);

      mockResolveTxt.mockRestore();
    });

    test('should return false on non did domain', async () => {
      const domain = 'test-1.arcblock.io';

      const mockResolveTxt = spyOn(dns.promises, 'resolveTxt').mockImplementationOnce(() => Promise.resolve([]));

      expect(await manager.isDidDomain({ domain })).toEqual(false);
      expect(mockResolveTxt).toHaveBeenCalledTimes(1);

      mockResolveTxt.mockRestore();
    });
  });

  describe('isMockedDidDomain', () => {
    // Save original env value
    const originalMockDidNames = process.env.ABT_NODE_MOCK_DID_NAMES;

    afterEach(() => {
      // Restore original env value after each test
      process.env.ABT_NODE_MOCK_DID_NAMES = originalMockDidNames;
    });

    test('should return false when ABT_NODE_MOCK_DID_NAMES is not set', () => {
      process.env.ABT_NODE_MOCK_DID_NAMES = undefined;
      expect(isMockedDidDomain('example.com')).toBe(false);
    });

    test('should return false when domain is empty', () => {
      process.env.ABT_NODE_MOCK_DID_NAMES = 'example.com,*.abtnet.io';
      expect(isMockedDidDomain()).toBe(false);
      expect(isMockedDidDomain('')).toBe(false);
      expect(isMockedDidDomain(null)).toBe(false);
    });

    test('should return true for exact domain match', () => {
      process.env.ABT_NODE_MOCK_DID_NAMES = 'example.com,test.abtnet.io';
      expect(isMockedDidDomain('example.com')).toBe(true);
      expect(isMockedDidDomain('test.abtnet.io')).toBe(true);
      expect(isMockedDidDomain('other.com')).toBe(false);
    });

    test('should handle whitespace in ABT_NODE_MOCK_DID_NAMES', () => {
      process.env.ABT_NODE_MOCK_DID_NAMES = 'example.com, test.abtnet.io , *.did.io';
      expect(isMockedDidDomain('test.abtnet.io')).toBe(true);
    });

    test('should return true for wildcard domain match', () => {
      process.env.ABT_NODE_MOCK_DID_NAMES = '*.abtnet.io,*.did.io';
      expect(isMockedDidDomain('test.abtnet.io')).toBe(true);
      expect(isMockedDidDomain('sub.did.io')).toBe(true);
      expect(isMockedDidDomain('abtnet.io')).toBe(false); // Should not match top-level
      expect(isMockedDidDomain('test.other.io')).toBe(false);
    });

    test('should not match wildcard with just suffix', () => {
      process.env.ABT_NODE_MOCK_DID_NAMES = '*.abtnet.io';
      expect(isMockedDidDomain('abtnet.io')).toBe(false);
    });
  });

  describe('isCertMatchedDomain', () => {
    test('should match exact domain', () => {
      const cert = { domain: 'example.com', meta: { sans: [] } };
      expect(manager.isCertMatchedDomain(cert, 'example.com')).toBe(true);
    });

    test('should not match different domain', () => {
      const cert = { domain: 'example.com', meta: { sans: [] } };
      expect(manager.isCertMatchedDomain(cert, 'other.com')).toBe(false);
    });

    test('should match wildcard domain', () => {
      const cert = { domain: '*.example.com', meta: { sans: [] } };
      expect(manager.isCertMatchedDomain(cert, 'foo.example.com')).toBe(true);
    });

    test('should match base domain with wildcard cert (checkDomainMatch allows this)', () => {
      // Note: base domain exclusion per SSL/TLS standard is only in findCertificate, not here
      const cert = { domain: '*.example.com', meta: { sans: [] } };
      expect(manager.isCertMatchedDomain(cert, 'example.com')).toBe(true);
    });

    test('should match domain in meta.sans', () => {
      const cert = { domain: 'primary.com', meta: { sans: ['www.example.com', 'api.example.com'] } };
      expect(manager.isCertMatchedDomain(cert, 'www.example.com')).toBe(true);
      expect(manager.isCertMatchedDomain(cert, 'api.example.com')).toBe(true);
    });

    test('should match wildcard in meta.sans', () => {
      const cert = { domain: 'primary.com', meta: { sans: ['*.example.com'] } };
      expect(manager.isCertMatchedDomain(cert, 'foo.example.com')).toBe(true);
    });

    test('should match wildcard in meta.sans for CloudFlare Origin Certificate', () => {
      const cert = { domain: 'CloudFlare Origin Certificate', meta: { sans: ['*.abtnetwork.io', 'abtnetwork.io'] } };
      expect(manager.isCertMatchedDomain(cert, 'main.abtnetwork.io')).toBe(true);
      expect(manager.isCertMatchedDomain(cert, 'xeon.abtnetwork.io')).toBe(true);
      expect(manager.isCertMatchedDomain(cert, 'abtnetwork.io')).toBe(true);
    });

    test('should handle cert without meta', () => {
      const cert = { domain: 'example.com' };
      expect(manager.isCertMatchedDomain(cert, 'example.com')).toBe(true);
      expect(manager.isCertMatchedDomain(cert, 'other.com')).toBe(false);
    });

    test('should handle empty domain', () => {
      const cert = { domain: 'example.com', meta: { sans: [] } };
      expect(manager.isCertMatchedDomain(cert, '')).toBe(false);
    });

    test('should prefer top-level sans when both exist', () => {
      const cert = { domain: 'other.com', sans: ['specific.example.com'], meta: { sans: ['*.example.com'] } };
      expect(manager.isCertMatchedDomain(cert, 'specific.example.com')).toBe(true);
    });
  });

  describe('issueCert', () => {
    let certManagerMock;

    beforeAll(() => {
      certManagerMock = {
        issue: mock().mockResolvedValue(true),
        getAllNormal: mock().mockResolvedValue([]),
      };
      manager.certManager = certManagerMock;
    });

    afterEach(() => {
      mock.clearAllMocks();
      certManagerMock.issue.mockClear();
    });

    test('should skip cert issue if DNS not resolved or CNAME not match or cert exists', async () => {
      const site = {
        domainAliases: [{ value: 'custom.com' }],
      };
      spyOn(manager, 'checkDomainDNS').mockResolvedValue({ isDnsResolved: false, isCnameMatch: false });
      spyOn(manager, 'getHttpsCert').mockResolvedValue({ domain: 'custom.com' });

      await manager.issueCert({
        did: 'did:abt:test',
        siteId: 'site-id',
        site,
        domain: 'custom.com',
      });

      expect(certManagerMock.issue).not.toHaveBeenCalled();
    });

    test('should issue cert if DNS resolved and CNAME match and no cert exists', async () => {
      const site = {
        domainAliases: [{ value: 'custom.com' }],
      };
      spyOn(manager, 'checkDomainDNS').mockResolvedValue({ isDnsResolved: true, isCnameMatch: true });
      spyOn(manager, 'getHttpsCert').mockResolvedValue(null);

      await manager.issueCert({
        did: 'did:abt:test',
        siteId: 'site-id',
        site,
        domain: 'custom.com',
      });

      expect(certManagerMock.issue).toHaveBeenCalledWith(
        { domain: 'custom.com', did: 'did:abt:test', siteId: 'site-id', inBlockletSetup: false },
        { delay: 3000 }
      );
    });
  });
});
