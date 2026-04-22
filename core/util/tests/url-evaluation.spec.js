const { describe, expect, test } = require('bun:test');
const { evaluateURL, evaluateURLs } = require('../lib/url-evaluation');

describe('url-evaluation', () => {
  test('evaluation results should be correct', async () => {
    const tests = [
      [
        'https://znkzrwayamzggebvynu4ajsh2821e9qv5j8u.slp.abtnet.io', // slp domain
        { score: 1022, accessible: true },
      ],
      [
        'https://06f58bae-znkzrwayamzggebvynu4ajsh2821e9qv5j8u.did.abtnet.io', // did domain
        { score: 1021, accessible: true },
      ],
      [
        'https://ocap-playground-rdm-18-180-145-193.ip.abtnet.io', // ip echo
        { score: 1020, accessible: true },
      ],
      [
        'https://playground.staging.arcblock.io', // custom domain (multiple levels)
        { score: 30996, accessible: true },
      ],
      [
        'https://custom-domain.com/', // https & custom domain (root domain)
        { score: 30998, accessible: true },
      ],
      [
        'http://custom-domain.com/', // http & custom domain (root domain)
        { score: 29998, accessible: true },
      ],
      [
        'http://1.2.3.4/', // IP address
        { score: 1, accessible: true },
      ],
      [
        'http://1.2.3.4:8080/', // IP address & port
        { score: 0, accessible: true },
      ],
      [
        'https://invalid-url.com/', // custom domain & inaccessible (but still higher priority than ip echo or DID domain)
        { score: 10998, accessible: false },
      ],
    ];

    // 'https://invalid-url.com/' is inaccessible; other test URLs are accessible
    const mockCheckAccessible = (url) => {
      return url !== 'https://invalid-url.com/';
    };

    // check evaluation scores for various URL types
    await Promise.all(
      tests.map(async (subTest) => {
        const result = await evaluateURL(subTest[0], { checkAccessible: mockCheckAccessible });
        expect(result.score).toBe(subTest[1].score);
        expect(result.accessible).toBe(subTest[1].accessible);
      })
    );

    // check priority sorting of evaluation results for a set of URLs
    const results = await evaluateURLs(
      tests.map((subTest) => subTest[0]),
      { checkAccessible: mockCheckAccessible }
    );
    expect(results.map((result) => result.url)).toEqual(
      tests.sort((a, b) => b[1].score - a[1].score).map((subTest) => subTest[0])
    );
  });
});
