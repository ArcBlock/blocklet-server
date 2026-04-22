import { describe, test, expect } from 'bun:test';
// 因为 import 过程整个模块就失败了, 为了不影响其他测试, 这里暂时改成在测试中动态 import
// import { generateSites, getBlockletUrl } from '../../contexts/routing';

globalThis.window.location = 'http://localhost';

// eslint-disable-next-line jest/no-disabled-tests
describe('generateSites', () => {
  test('should work as expected', async () => {
    const { generateSites } = await import('../../contexts/routing');
    expect(generateSites({ sites: [] })).toEqual({ siteMap: {}, sites: [] });

    const srcDashboardSite = {
      id: '1',
      domain: '~^\\d+.\\d+.\\d+.\\d+$',
      domainAliases: [],
      isProtected: true,
      rules: [],
    };
    const srcBlockletSite = {
      id: '2',
      domain: 'did1.blocklet-domain-group',
      domainAliases: [[{ value: 'a-1.com' }]],
      isProtected: true,
      rules: [],
    };

    const res = generateSites({
      sites: [srcDashboardSite, srcBlockletSite],
    });

    const resDashboardSite = {
      id: srcDashboardSite.id,
      type: 'domain',
      name: 'Dashboard',
      domainAliases: srcDashboardSite.domainAliases,
      isProtected: srcDashboardSite.isProtected,
      corsAllowedOrigins: [],
      items: [],
    };

    const resBlockletSite = {
      id: srcBlockletSite.id,
      type: 'domain',
      name: srcBlockletSite.domain,
      domainAliases: srcBlockletSite.domainAliases,
      isProtected: srcBlockletSite.isProtected,
      corsAllowedOrigins: [],
      items: [],
    };

    expect(res).toEqual({
      siteMap: {
        [resDashboardSite.name]: { ...resDashboardSite, rules: resDashboardSite.items },
        did1: { ...resBlockletSite, rules: resBlockletSite.items },
      },
      sites: [resDashboardSite, resBlockletSite],
    });
  });

  test('should work as expected', async () => {
    const { generateSites } = await import('../../contexts/routing');

    expect(
      generateSites({
        sites: [],
      })
    ).toEqual({ siteMap: {}, sites: [] });
  });
});

describe('getBlockletUrl', () => {
  test('should work as expected', async () => {
    const { getBlockletUrl } = await import('../../contexts/routing');
    // default domain
    expect(
      getBlockletUrl({
        did: 'abc',
        siteMap: {
          abc: {
            domainAliases: [{ value: 'a.com' }, { value: 'b.com' }],
            rules: [{ name: '/prefix' }],
          },
        },
        params: {
          locale: 'zh',
        },
      })
    ).toBe('http://a.com/prefix?locale=zh');

    // specific domain
    expect(
      getBlockletUrl({
        did: 'abc',
        domain: {
          value: 'a.com',
        },
        siteMap: {
          abc: {
            domainAliases: [],
            rules: [{ name: '/prefix' }],
          },
        },
      })
    ).toBe('http://a.com/prefix');

    // specific mountPoint
    expect(
      getBlockletUrl({
        did: 'abc',
        siteMap: {
          abc: {
            domainAliases: [{ value: 'a.com' }, { value: 'b.com' }],
            rules: [{ name: '/prefix' }],
          },
        },
        mountPoint: '/xyz',
      })
    ).toBe('http://a.com/xyz');
  });
});
