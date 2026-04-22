const { it, expect, describe } = require('bun:test');
const { concatPath, trimEndSlash, toSlotDomain, matchRule, findCertificate } = require('../lib/util');

describe('Util.concatPath', () => {
  it('should return suffix if prefix = / and suffix is truthy', () => {
    expect(concatPath('/', 'test')).toEqual('~* .*test$');
  });

  it('should return prefix if prefix = / and suffix is falsy', () => {
    expect(concatPath('/', '')).toEqual('/');
  });

  it('should return prefix with regex if prefix != / and suffix is falsy', () => {
    expect(concatPath('/test', '')).toEqual('/test');
  });

  it('should return prefix and suffix with regex if prefix != / and suffix is truthy', () => {
    expect(concatPath('/test', 'sf')).toEqual('~* ^/test.*sf$');
  });

  it('should return suffix when root and suffix is truthy', () => {
    expect(concatPath('/', '/test', true)).toEqual('~* ^/test$');
  });
});

describe('Util.trimEndSlash', () => {
  it('boundary test', () => {
    expect(trimEndSlash()).toEqual(undefined);
    expect(trimEndSlash(null)).toEqual(null);
    expect(trimEndSlash('')).toEqual('');
    expect(trimEndSlash('/')).toEqual('/');
  });

  it('trim end slash', () => {
    expect(trimEndSlash('/test')).toEqual('/test');
    expect(trimEndSlash('/test/')).toEqual('/test');
  });
});

describe('Util.toSlotDomain', () => {
  it('boundary test', () => {
    expect(toSlotDomain('')).toEqual('');
    expect(toSlotDomain('www.arcblock.io')).toEqual('www.arcblock.io');
  });

  it('to slot domain', () => {
    expect(toSlotDomain('blocklet-launcher-fjg-192-168-123-1.ip.abtnet.io')).toEqual(
      'blocklet-launcher-fjg-888-888-888-888.ip.abtnet.io'
    );
    expect(toSlotDomain('blocklet-launcher-fj3-192-168-123-1.ip.abtnet.io')).toEqual(
      'blocklet-launcher-fj3-888-888-888-888.ip.abtnet.io'
    );
    expect(toSlotDomain('blocklet-launcher-fj3-192-168-123-1.did.abtnet.io')).toEqual(
      'blocklet-launcher-fj3-192-168-123-1.did.abtnet.io'
    );
    expect(toSlotDomain('blocklet-launcher-fj3-256-168-123-1.did.abtnet.io')).toEqual(
      'blocklet-launcher-fj3-256-168-123-1.did.abtnet.io'
    );
  });
});

const rules = [
  {
    type: 'daemon',
    prefix: '/.blocklet/proxy',
    groupPrefix: '/',
    suffix: '',
    port: 8089,
    did: 'z8iZhW61syFGfgMGDm7ttbDATUf4zbNrzxfJG',
    target: '/.blocklet/proxy',
    services: [],
    id: '2fc7f3b8639039cf52781ce5b2a1cdcfd79dedb0',
  },
  {
    type: 'general_proxy',
    prefix: '/.well-known',
    groupPrefix: '/',
    suffix: '',
    port: 8088,
    target: '/',
    services: [],
    id: '4d0b9cca8777f2db39679b47abeee36cb8ca3308',
  },
  {
    ruleId: '4a1b9930-fc3f-4a3f-8f1d-adc7886229ff',
    type: 'blocklet',
    prefix: '/',
    groupPrefix: '/',
    suffix: '',
    port: 8094,
    did: 'z8iZhW61syFGfgMGDm7ttbDATUf4zbNrzxfJG',
    target: '/',
    services: [],
    id: '619fe9b32b33c6aff657bfae37ed70840d5223c1',
  },
  {
    type: 'daemon',
    prefix: '/',
    groupPrefix: '/',
    suffix: '/__(meta|blocklet)__.js',
    port: 8089,
    did: 'z8iZhW61syFGfgMGDm7ttbDATUf4zbNrzxfJG',
    target: '/',
    services: [],
    id: 'baebec8b2555633a0d2fe19212fb5044f1a7383a',
  },
  {
    type: 'daemon',
    prefix: '/',
    groupPrefix: '/',
    suffix: '/__cache__.js',
    port: 8089,
    did: 'z8iZhW61syFGfgMGDm7ttbDATUf4zbNrzxfJG',
    target: '/',
    services: [],
    id: 'baebec8b2555633a0d2fe19212fb5044f1a7383b',
  },
];

describe('Util.matchRule', () => {
  it('should match to blocklet as expected', () => {
    expect(matchRule(rules, '/').id).toEqual('619fe9b32b33c6aff657bfae37ed70840d5223c1');
    expect(matchRule(rules, '/?nocache').id).toEqual('619fe9b32b33c6aff657bfae37ed70840d5223c1');
    expect(matchRule(rules, '/api/admin/sku').id).toEqual('619fe9b32b33c6aff657bfae37ed70840d5223c1');
    expect(matchRule(rules, '/api/admin/sku?nocache').id).toEqual('619fe9b32b33c6aff657bfae37ed70840d5223c1');
  });

  it('should match to meta.js as expected', () => {
    expect(matchRule(rules, '/__blocklet__.js').id).toEqual('baebec8b2555633a0d2fe19212fb5044f1a7383a');
    expect(matchRule(rules, '/__blocklet__.js?locale=en').id).toEqual('baebec8b2555633a0d2fe19212fb5044f1a7383a');
    expect(matchRule(rules, '/api/__blocklet__.js').id).toEqual('baebec8b2555633a0d2fe19212fb5044f1a7383a');
    expect(matchRule(rules, '/api/__blocklet__.js?locale=en').id).toEqual('baebec8b2555633a0d2fe19212fb5044f1a7383a');
    expect(matchRule(rules, '/__meta__.js').id).toEqual('baebec8b2555633a0d2fe19212fb5044f1a7383a');
    expect(matchRule(rules, '/__meta__.js?locale=en').id).toEqual('baebec8b2555633a0d2fe19212fb5044f1a7383a');
    expect(matchRule(rules, '/api/__meta__.js').id).toEqual('baebec8b2555633a0d2fe19212fb5044f1a7383a');
    expect(matchRule(rules, '/api/__meta__.js?locale=en').id).toEqual('baebec8b2555633a0d2fe19212fb5044f1a7383a');
    expect(matchRule(rules, '/__cache__.js').id).toEqual('baebec8b2555633a0d2fe19212fb5044f1a7383b');
    expect(matchRule(rules, '/__cache__.js?a=b#abc').id).toEqual('baebec8b2555633a0d2fe19212fb5044f1a7383b');
    expect(matchRule(rules, '/api/__cache__.js?c=d#ccc').id).toEqual('baebec8b2555633a0d2fe19212fb5044f1a7383b');
  });

  it('should match to proxy as expected', () => {
    expect(matchRule(rules, '/.blocklet/proxy/logo.png').id).toEqual('2fc7f3b8639039cf52781ce5b2a1cdcfd79dedb0');
    expect(matchRule(rules, '/.blocklet/proxy/style.css').id).toEqual('2fc7f3b8639039cf52781ce5b2a1cdcfd79dedb0');
  });

  it('should match to wellknown as expected', () => {
    expect(matchRule(rules, '/.well-known/ping').id).toEqual('4d0b9cca8777f2db39679b47abeee36cb8ca3308');
  });
});

describe('Util.findCertificate', () => {
  describe('exact match priority', () => {
    it('should prioritize exact wildcard match over wildcard match for wildcard domain', () => {
      const certs = [
        { domain: 'staging.myvibe.so', sans: [] },
        { domain: '*.staging.myvibe.so', sans: [] },
      ];

      const result = findCertificate(certs, '*.staging.myvibe.so');
      expect(result.domain).toEqual('*.staging.myvibe.so');
    });

    it('should prioritize exact match over wildcard match for non-wildcard domain', () => {
      const certs = [
        { domain: '*.staging.myvibe.so', sans: [] },
        { domain: 'staging.myvibe.so', sans: [] },
      ];

      const result = findCertificate(certs, 'staging.myvibe.so');
      expect(result.domain).toEqual('staging.myvibe.so');
    });

    it('should prioritize exact match over wildcard match regardless of order', () => {
      const certs = [
        { domain: '*.example.com', sans: [] },
        { domain: 'www.example.com', sans: [] },
        { domain: '*.staging.example.com', sans: [] },
      ];

      const result = findCertificate(certs, 'www.example.com');
      expect(result.domain).toEqual('www.example.com');
    });

    it('should prioritize exact match (case-insensitive) over wildcard when wildcard appears first', () => {
      // This is the test case from code review
      // Tests that exact match works case-insensitively in the first pass
      const certs = [
        { domain: '*.example.com', sans: [] },
        { domain: 'Example.COM', sans: [] },
      ];

      const result = findCertificate(certs, 'example.com');
      expect(result.domain).toEqual('Example.COM');
    });
  });

  describe('wildcard matching', () => {
    it('should match subdomain with wildcard certificate', () => {
      const certs = [{ domain: '*.staging.myvibe.so', sans: [] }];

      const result = findCertificate(certs, 'foo.staging.myvibe.so');
      expect(result.domain).toEqual('*.staging.myvibe.so');
    });

    it('should NOT match base domain with wildcard certificate (SSL/TLS standard)', () => {
      const certs = [{ domain: '*.staging.myvibe.so', sans: [] }];

      // Per SSL/TLS standards, *.staging.myvibe.so should match foo.staging.myvibe.so
      // but should NOT match staging.myvibe.so itself
      const result = findCertificate(certs, 'staging.myvibe.so');
      expect(result).toBeUndefined();
    });

    it('should match base domain when exact cert exists alongside wildcard', () => {
      const certs = [
        { domain: '*.staging.myvibe.so', sans: [] },
        { domain: 'staging.myvibe.so', sans: [] },
      ];

      const result = findCertificate(certs, 'staging.myvibe.so');
      expect(result.domain).toEqual('staging.myvibe.so');
    });

    it('should match multiple level subdomain with appropriate wildcard', () => {
      const certs = [
        { domain: '*.example.com', sans: [] },
        { domain: '*.staging.example.com', sans: [] },
      ];

      const result = findCertificate(certs, 'foo.staging.example.com');
      expect(result.domain).toEqual('*.staging.example.com');
    });

    it('should not match if wildcard level does not match', () => {
      const certs = [{ domain: '*.example.com', sans: [] }];

      const result = findCertificate(certs, 'foo.bar.example.com');
      expect(result).toBeUndefined();
    });

    it('should not match base domain even with wildcard in sans', () => {
      const certs = [{ domain: 'other.com', sans: ['*.staging.myvibe.so'] }];

      const result = findCertificate(certs, 'staging.myvibe.so');
      expect(result).toBeUndefined();
    });
  });

  describe('SANs (Subject Alternative Names)', () => {
    it('should match domain in sans with exact match priority', () => {
      const certs = [
        { domain: 'example.com', sans: ['www.example.com', 'api.example.com'] },
        { domain: '*.example.com', sans: [] },
      ];

      const result = findCertificate(certs, 'www.example.com');
      expect(result.domain).toEqual('example.com');
    });

    it('should match wildcard domain in sans', () => {
      const certs = [{ domain: 'example.com', sans: ['*.staging.example.com'] }];

      const result = findCertificate(certs, 'foo.staging.example.com');
      expect(result.domain).toEqual('example.com');
    });

    it('should prioritize exact match in sans over wildcard in domain', () => {
      const certs = [
        { domain: '*.example.com', sans: [] },
        { domain: 'other.com', sans: ['www.example.com'] },
      ];

      const result = findCertificate(certs, 'www.example.com');
      expect(result.domain).toEqual('other.com');
    });
  });

  describe('SANs in meta (database format)', () => {
    it('should match wildcard in meta.sans when domain is non-domain CN (e.g. CloudFlare Origin)', () => {
      const certs = [
        { domain: 'CloudFlare Origin Certificate', meta: { sans: ['*.abtnetwork.io', 'abtnetwork.io'] } }, // prettier-ignore
      ];

      const result = findCertificate(certs, 'main.abtnetwork.io');
      expect(result.domain).toEqual('CloudFlare Origin Certificate');
    });

    it('should match exact domain in meta.sans', () => {
      const certs = [
        { domain: 'primary.com', meta: { sans: ['www.example.com', 'api.example.com'] } }, // prettier-ignore
      ];

      const result = findCertificate(certs, 'www.example.com');
      expect(result.domain).toEqual('primary.com');
    });

    it('should match wildcard in meta.sans when domain is bare domain', () => {
      const certs = [{ domain: 'abtnetwork.io', meta: { sans: ['*.abtnetwork.io', 'abtnetwork.io'] } }];

      const result = findCertificate(certs, 'xeon.abtnetwork.io');
      expect(result.domain).toEqual('abtnetwork.io');
    });

    it('should prefer top-level sans over meta.sans when both exist', () => {
      const certs = [
        { domain: 'other.com', sans: ['specific.example.com'], meta: { sans: ['*.example.com'] } }, // prettier-ignore
      ];

      const result = findCertificate(certs, 'specific.example.com');
      expect(result.domain).toEqual('other.com');
    });
  });

  describe('edge cases', () => {
    it('should return undefined if no certificate matches', () => {
      const certs = [
        { domain: 'example.com', sans: [] },
        { domain: '*.example.com', sans: [] },
      ];

      const result = findCertificate(certs, 'other.com');
      expect(result).toBeUndefined();
    });

    it('should handle empty certificate list', () => {
      const result = findCertificate([], 'example.com');
      expect(result).toBeUndefined();
    });

    it('should handle certificate without sans field', () => {
      const certs = [
        { domain: 'example.com' }, // no sans field
      ];

      const result = findCertificate(certs, 'example.com');
      expect(result.domain).toEqual('example.com');
    });

    it('should handle null sans', () => {
      const certs = [{ domain: 'example.com', sans: null }];

      const result = findCertificate(certs, 'example.com');
      expect(result.domain).toEqual('example.com');
    });
  });

  describe('case sensitivity', () => {
    it('should match domain case-insensitively', () => {
      const certs = [{ domain: 'Example.COM', sans: [] }];

      const result = findCertificate(certs, 'example.com');
      expect(result.domain).toEqual('Example.COM');
    });

    it('should match wildcard domain case-insensitively', () => {
      const certs = [{ domain: '*.Example.COM', sans: [] }];

      const result = findCertificate(certs, 'foo.example.com');
      expect(result.domain).toEqual('*.Example.COM');
    });
  });
});
