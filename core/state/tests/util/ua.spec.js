const { test, expect, describe } = require('bun:test');
const { parse } = require('../../lib/util/ua');

describe('ua', () => {
  test('should parse android wallet ua as expected', () => {
    const result = parse('okhttp/3.12.2 ArcWallet/2.7.17 (Linux; U; Android 25; LGE Build/Nexus5)');
    expect(result.browser).toBeTruthy();
    expect(result.browser.name).toBeTruthy();
    expect(result.browser.name).toEqual('DID Wallet ANDROID');
    expect(result.browser.version).toEqual('2.7.17');
  });

  test('should parse ios wallet ua as expected', () => {
    const result = parse('ArcWallet/2.7.2 iPhone12,3 iOS/13.0 CFNetwork/1098.7 Darwin/19.0.0');
    expect(result.browser).toBeTruthy();
    expect(result.browser.name).toBeTruthy();
    expect(result.browser.name).toEqual('DID Wallet IOS');
    expect(result.browser.version).toEqual('2.7.2');
  });

  test('should parse web wallet ua as expected', () => {
    const result = parse('ArcWallet/0.5.0');
    expect(result.browser).toBeTruthy();
    expect(result.browser.name).toBeTruthy();
    expect(result.browser.name).toEqual('DID Wallet WEB');
    expect(result.browser.version).toEqual('0.5.0');
  });

  test('should parse cli ua as expected', () => {
    const result = parse('cli');
    expect(result.browser).toBeTruthy();
    expect(result.browser.name).toBeTruthy();
    expect(result.browser.name).toEqual('CLI');
  });

  test('should parse browser ua as expected', () => {
    const result = parse(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
    );
    expect(result.browser).toBeTruthy();
    expect(result.os).toBeTruthy();
    expect(result.device).toBeTruthy();
  });
});
