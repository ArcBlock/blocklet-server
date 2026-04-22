const { it, expect, describe, test } = require('bun:test');
const { DOMAIN_FOR_DEFAULT_SITE } = require('@abtnode/constant');
const {
  validateAddSite,
  validateAddDomainAlias,
  validateUpdateSite,
  validateAddRule,
  validateEditRule,
} = require('../../lib/validators/router');

describe('routing-rule', () => {
  describe('addSite', () => {
    it('should allow empty domain', async () => {
      const res = await validateAddSite({ domain: '' });
      expect(res).toEqual({ domain: '' });
    });

    it('should allow default site domain', async () => {
      const res = await validateAddSite({ domain: DOMAIN_FOR_DEFAULT_SITE });
      expect(res).toEqual({ domain: DOMAIN_FOR_DEFAULT_SITE });
    });

    it('should allow non-tld domain', async () => {
      const res = await validateAddSite({ domain: 'localhost' });
      expect(res).toEqual({ domain: 'localhost' });
    });

    it('should allow wildcard domain', async () => {
      const res1 = await validateAddSite({ domain: '*.arcblock.io' });
      const res2 = await validateAddSite({ domain: '*.ac.io' });

      expect(res1).toEqual({ domain: '*.arcblock.io' });
      expect(res2).toEqual({ domain: '*.ac.io' });
    });

    it('should the wildcard domain start with asterisk', async () => {
      let error = null;
      try {
        await validateAddSite({ domain: 'docs.*.arcblock.io' });
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(expect.stringMatching(/Invalid domain/));
    });
  });

  test('validateAddRule: pathPrefix', () => {
    const rule = (pathPrefix) => ({
      id: 'xxx',
      rule: {
        from: { pathPrefix },
        to: { type: 'blocklet', did: 'xxx', port: 123, interfaceName: 'public_url' },
      },
    });

    expect(validateAddRule(rule('/'))).resolves.toEqual(
      expect.objectContaining({ rule: expect.objectContaining({ from: { pathPrefix: '/' } }) })
    );
    expect(validateAddRule(rule('/nostr-verifier/.well-known/nostr.json'))).resolves.toEqual(
      expect.objectContaining({
        rule: expect.objectContaining({ from: { pathPrefix: '/nostr-verifier/.well-known/nostr.json' } }),
      })
    );
    expect(validateAddRule(rule(' /a b c '))).resolves.toEqual(
      expect.objectContaining({
        rule: expect.objectContaining({ from: { pathPrefix: '/a-b-c' } }),
      })
    );
    expect(validateAddRule(rule('/path/自动去掉中文/to'))).resolves.toEqual(
      expect.objectContaining({
        rule: expect.objectContaining({ from: { pathPrefix: '/path/to' } }),
      })
    );
  });

  test('validateEditRule: pathPrefix', () => {
    const rule = (pathPrefix) => ({
      id: 'xxx',
      rule: {
        id: 'xxx',
        from: { pathPrefix },
        to: { type: 'blocklet', did: 'xxx', port: 123, interfaceName: 'public_url' },
      },
    });

    expect(validateEditRule(rule('/'))).resolves.toEqual(
      expect.objectContaining({ rule: expect.objectContaining({ from: { pathPrefix: '/' } }) })
    );
    expect(validateEditRule(rule('/nostr-verifier/.well-known/nostr.json'))).resolves.toEqual(
      expect.objectContaining({
        rule: expect.objectContaining({ from: { pathPrefix: '/nostr-verifier/.well-known/nostr.json' } }),
      })
    );
    expect(validateEditRule(rule(' /a b c '))).resolves.toEqual(
      expect.objectContaining({
        rule: expect.objectContaining({ from: { pathPrefix: '/a-b-c' } }),
      })
    );
    expect(validateEditRule(rule('/path/自动去掉中文/to'))).resolves.toEqual(
      expect.objectContaining({
        rule: expect.objectContaining({ from: { pathPrefix: '/path/to' } }),
      })
    );
  });

  describe('addDomainAlias', () => {
    it('should allow non-tld domain', async () => {
      const res = await validateAddDomainAlias('localhost');
      expect(res).toEqual('localhost');
    });

    it('should allow wildcard domain', async () => {
      const res1 = await validateAddDomainAlias('*.arcblock.io');
      const res2 = await validateAddDomainAlias('*.ac.io');

      expect(res1).toEqual('*.arcblock.io');
      expect(res2).toEqual('*.ac.io');
    });

    it('should not allow empty domain', async () => {
      let error = null;
      try {
        await validateAddDomainAlias('');
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(expect.stringMatching(/Invalid domain name/));
    });

    it('should not allow default site domain', async () => {
      let error = null;
      try {
        await validateAddDomainAlias(DOMAIN_FOR_DEFAULT_SITE);
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(expect.stringMatching(/Invalid domain name/));
    });

    it('should the wildcard domain start with asterisk', async () => {
      let error = null;
      try {
        await validateAddDomainAlias('docs.*.arcblock.io');
      } catch (err) {
        error = err;
      }

      expect(error.message).toEqual(expect.stringMatching(/Invalid domain name/));
    });
  });

  describe('validateUpdateSite', () => {
    it('cors should work as expected', () => {
      expect(
        validateUpdateSite({
          id: 'xxx',
          corsAllowedOrigins: ['www.a.com', 'b.com'],
        })
      ).resolves.toBeTruthy();

      expect(
        validateUpdateSite({
          id: 'xxx',
          corsAllowedOrigins: ['8.8.8.8'],
        })
      ).resolves.toBeTruthy();

      expect(
        validateUpdateSite({
          id: 'xxx',
          corsAllowedOrigins: ['*'],
        })
      ).resolves.toBeTruthy();

      expect(
        validateUpdateSite({
          id: 'xxx',
          corsAllowedOrigins: ['__none__'],
        })
      ).resolves.toBeTruthy();
    });
  });
});
