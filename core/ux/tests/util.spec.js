import { describe, expect, test, spyOn } from 'bun:test';
import axios from '@abtnode/util/lib/axios';

import {
  getAccessUrl,
  deepDecodeURIComponent,
  formatLocale,
  isCertificateMatch,
  extractStatusUrlFromNextWorkflow,
  isNewStoreUrl,
  sortDomains,
  getBlockletUrls,
  getSubscriptionURL,
} from '../src/util';
import { parseDomainFromURL } from '../src/blocklet/router/util';

describe('util-spec.js', () => {
  describe('getAccessUrl', () => {
    test('should work as expected', () => {
      const windowSpy = spyOn(window, 'window', 'get');
      windowSpy.mockImplementation(() => ({ location: { port: 80, protocol: 'http:' } }));

      expect(getAccessUrl('a.com')).toEqual('http://a.com');
      expect(getAccessUrl('a.com', '', { a: 'b' })).toEqual('http://a.com/?a=b');
      expect(getAccessUrl('a.com', '/b')).toEqual('http://a.com/b');
      expect(getAccessUrl('a.com', '/', { a: 'b' })).toEqual('http://a.com/?a=b');
      expect(getAccessUrl('blocklet.ip.abtnet.io')).toEqual('http://blocklet.ip.abtnet.io');

      windowSpy.mockImplementation(() => ({ location: { port: 8080, protocol: 'http:' } }));
      expect(getAccessUrl('blocklet.ip.abtnet.io')).toEqual('http://blocklet.ip.abtnet.io:8080');
      windowSpy.mockImplementation(() => ({ location: { port: 443, protocol: 'https:' } }));
      expect(getAccessUrl('blocklet.ip.abtnet.io')).toEqual('https://blocklet.ip.abtnet.io');
      windowSpy.mockImplementation(() => ({ location: { port: 8443, protocol: 'https:' } }));
      expect(getAccessUrl('blocklet.ip.abtnet.io')).toEqual('https://blocklet.ip.abtnet.io:8443');

      windowSpy.mockImplementation(() => ({ location: { port: 8080, protocol: 'http:' } }));
      expect(getAccessUrl('blocklet.did.abtnet.io')).toEqual('http://blocklet.did.abtnet.io:8080');
      windowSpy.mockImplementation(() => ({ location: { port: 443, protocol: 'https:' } }));
      expect(getAccessUrl('blocklet.did.abtnet.io')).toEqual('https://blocklet.did.abtnet.io');
      expect(getAccessUrl('blocklet.slp.abtnet.io')).toEqual('https://blocklet.slp.abtnet.io');
      windowSpy.mockImplementation(() => ({ location: { port: 8443, protocol: 'https:' } }));
      expect(getAccessUrl('blocklet.did.abtnet.io')).toEqual('https://blocklet.did.abtnet.io:8443');

      // support server in Docker or server in non-standard port
      windowSpy.mockImplementation(() => ({ location: { port: 8080, protocol: 'http:' } }));
      expect(getAccessUrl('a.com')).toEqual('http://a.com:8080');
      windowSpy.mockImplementation(() => ({ location: { port: 80, protocol: 'http:' } }));
      expect(getAccessUrl('a.com')).toEqual('http://a.com');
      windowSpy.mockImplementation(() => ({ location: { port: 443, protocol: 'http:' } }));
      expect(getAccessUrl('a.com')).toEqual('http://a.com');
      windowSpy.mockRestore();
    });
  });

  describe('formatLocale', () => {
    test('should work as expected', () => {
      expect(formatLocale('zh')).toEqual('zh');
    });
  });

  describe('isCertificateMatch', () => {
    test('should work as expected', () => {
      const tests = [
        {
          blockletUrls: [
            'https://ocap-playground-rdm-18-180-145-193.ip.abtnet.io/?__bv__=0.24.16',
            'http://playground.staging.arcblock.io/?__bv__=0.24.16',
          ],
          matchedSites: [{ domain: 'playground.staging.arcblock.io' }],
          expected: true,
        },
        {
          blockletUrls: [
            'https://ocap-playground-rdm-18-180-145-193.ip.abtnet.io/?__bv__=0.24.16',
            'http://playground.staging.arcblock.io/?__bv__=0.24.16',
          ],
          matchedSites: [{ domain: 'launcher.staging.arcblock.io' }],
          expected: false,
        },
        {
          blockletUrls: [
            'https://ocap-playground-rdm-18-180-145-193.ip.abtnet.io/?__bv__=0.24.16',
            'http://playground.staging.arcblock.io/?__bv__=0.24.16',
          ],
          matchedSites: [{ domain: 'launcher.staging.arcblock.io' }, { domain: 'playground.staging.arcblock.io' }],
          expected: true,
        },
        {
          blockletUrls: ['http://unmatched-host.com'],
          matchedSites: [{ domain: 'playground.staging.arcblock.io' }],
          expected: false,
        },
        {
          blockletUrls: ['invalid-url'],
          matchedSites: [{ domain: 'playground.staging.arcblock.io' }],
          expected: false,
        },
      ];

      // use "tests.forEach()" will fail: "buffer.reduce is not a function"
      expect(isCertificateMatch(tests[0].blockletUrls, tests[0].matchedSites)).toEqual(tests[0].expected);
      expect(isCertificateMatch(tests[1].blockletUrls, tests[1].matchedSites)).toEqual(tests[1].expected);
      expect(isCertificateMatch(tests[2].blockletUrls, tests[2].matchedSites)).toEqual(tests[2].expected);
      expect(isCertificateMatch(tests[3].blockletUrls, tests[3].matchedSites)).toEqual(tests[3].expected);
    });
  });

  describe('deepDecodeURIComponent', () => {
    test('should work', () => {
      expect(
        deepDecodeURIComponent(
          'https://abtwallet.io/i/?action=requestAuth&url=http%253A%252F%252F192.168.0.101%253A3030%252Fapi%252Fdid%252Flaunch-paid-blocklet-by-vc%252Fauth%253F_t_%253Dafc5ed45'
        )
      ).toEqual(
        'https://abtwallet.io/i/?action=requestAuth&url=http://192.168.0.101:3030/api/did/launch-paid-blocklet-by-vc/auth?_t_=afc5ed45'
      );
    });
  });

  describe('extractStatusUrlFromNextWorkflow', () => {
    test('should work', () => {
      expect(
        extractStatusUrlFromNextWorkflow(
          'https://abtwallet.io/i/?action=requestAuth&url=http%253A%252F%252F192.168.0.101%253A3030%252Fapi%252Fdid%252Flaunch-paid-blocklet-by-vc%252Fauth%253F_t_%253Dafc5ed45'
        )
      ).toEqual({
        statusUrl: 'http://192.168.0.101:3030/api/did/launch-paid-blocklet-by-vc/status?_t_=afc5ed45',
        token: 'afc5ed45',
      });
    });
  });

  describe('isNewStoreUrl', () => {
    test('should work', () => {
      const storeList = [
        {
          cdnUrl: null,
          description: 'ArcBlock official blocklet registry',
          id: null,
          logoUrl: '/logo.png',
          maintainer: 'arcblock',
          name: 'Official Store',
          protected: true,
          selected: false,
          url: 'https://store.blocklet.dev',
        },
        {
          cdnUrl: null,
          description: 'ArcBlock dev registry that contains demo and example blocklets',
          id: null,
          logoUrl: '/logo.png',
          maintainer: 'arcblock',
          name: 'Dev Store',
          protected: false,
          selected: false,
          url: 'https://dev.store.blocklet.dev',
        },
      ];

      const urlTypeNotMatchResult = {
        isNew: false,
        decoded: '',
      };

      expect(isNewStoreUrl(null, storeList)).toEqual(urlTypeNotMatchResult);

      expect(
        isNewStoreUrl(
          {
            url: 'a',
          },
          storeList
        )
      ).toEqual(urlTypeNotMatchResult);

      expect(isNewStoreUrl('https://dev.store.blocklet.dev', storeList)).toEqual({
        isNew: false,
        decoded: 'https://dev.store.blocklet.dev',
      });

      expect(isNewStoreUrl('https://test.store.blocklet.dev/', storeList)).toEqual({
        isNew: true,
        decoded: 'https://test.store.blocklet.dev',
      });
    });
  });

  describe('sortDomains', () => {
    test('should return empty array is domains is falsy', () => {
      expect(sortDomains()).toEqual([]);
      expect(sortDomains(null)).toEqual([]);
      expect(sortDomains([])).toEqual([]);
    });

    test('custom domains should at the top of the list', () => {
      expect(
        sortDomains([
          { value: 'xxx.did.abtnet.io' },
          { value: 'yyy.slp.abtnet.io' },
          { value: '10-0-0-1.ip.abtnet.io' },
          { value: 'arcblock.io' },
          { value: 'blog.arcblock.io' },
        ])
      ).toEqual([
        { value: 'arcblock.io' },
        { value: 'blog.arcblock.io' },
        { value: 'xxx.did.abtnet.io' },
        { value: 'yyy.slp.abtnet.io' },
        { value: '10-0-0-1.ip.abtnet.io' },
      ]);
    });
  });

  describe('getBlockletUrls', () => {
    test('should work', () => {
      expect(
        getBlockletUrls({
          blocklet: {
            site: {
              domainAliases: [{ value: 'test.com' }],
              rules: [],
            },
          },
        })
      ).toEqual([`${window.location.protocol}//test.com`]);

      expect(
        getBlockletUrls({
          blocklet: {
            site: {
              domainAliases: [{ value: 'test.com' }],
              rules: [{ from: { pathPrefix: '/api' } }],
            },
          },
        })
      ).toEqual([`${window.location.protocol}//test.com/api`]);

      expect(
        getBlockletUrls({
          blocklet: {
            site: {
              domainAliases: [{ value: 'test.com' }],
              rules: [{ from: { pathPrefix: '/api' } }, { from: { pathPrefix: '/' } }],
            },
          },
        })
      ).toEqual([`${window.location.protocol}//test.com`]);
    });
  });
  describe('getSubscriptionURL', () => {
    const launcherUrl = 'https://launcher.arcblock.io/app';
    const nftId = 'test-nft-id';

    test('should return empty string if launcherUrl is falsy', async () => {
      expect(await getSubscriptionURL({ launcherUrl: '' })).toEqual('');
      expect(await getSubscriptionURL({ launcherUrl: null })).toEqual('');
    });

    test('should return /{launcher}/instances if launcherUrl is valid and get __blocklet__.js failed', async () => {
      const mockGet = spyOn(axios, 'get').mockRejectedValueOnce(new Error('mock test'));

      const url = await getSubscriptionURL({ launcherUrl, nftId });

      expect(url.startsWith(`${launcherUrl}/instances/${nftId}/subscription`)).toBe(true);

      expect(mockGet).toHaveBeenCalled();

      mockGet.mockRestore();
    });

    test('should return correct url if launcherUrl is valid and get __blocklet__.js success', async () => {
      const mockMeta = {
        componentMountPoints: [
          {
            title: 'Server Launcher',
            name: '@blocklet/server-launcher',
            did: 'z8iZkFBbrVQxZHvcWWB3Sa2TrfGmSeFz9MSU7',
            status: 'running',
            mountPoint: '/app',
            components: [],
          },
          {
            title: 'DID Pay',
            name: '@did-pay/blocklet',
            did: 'z8iZy4P83i6AgnNdNUexsh2kBcsDHoqcwPavn',
            status: 'running',
            mountPoint: '/app/pay',
            components: [],
          },
        ],
      };

      const mockGet = spyOn(axios, 'get').mockResolvedValueOnce({ data: mockMeta });

      const url = await getSubscriptionURL({ launcherUrl, nftId });

      expect(url.startsWith(`${new URL(launcherUrl).origin}/app/pay/nfts/${nftId}/subscription`)).toBe(true);

      expect(mockGet).toHaveBeenCalled();

      mockGet.mockRestore();
    });
  });

  describe('parseDomainFromURL', () => {
    test('should return parsed domain if it is a http url', () => {
      expect(parseDomainFromURL('http://test.com')).toEqual('test.com');
      expect(parseDomainFromURL('https://test.com')).toEqual('test.com');
      expect(parseDomainFromURL('https://test.com:8082')).toEqual('test.com');
    });

    test('should return original domain if it is not a string or empty', () => {
      expect(parseDomainFromURL(null)).toEqual(null);
      expect(parseDomainFromURL(undefined)).toEqual(undefined);
      expect(parseDomainFromURL('')).toEqual('');
      expect(parseDomainFromURL({})).toEqual({});
    });
  });
});
