const { test, expect, describe } = require('bun:test');
const { getChainHost } = require('../../../../../lib/blocklet/manager/helper/migrate-application-to-struct-v2');

describe('getChainHost', () => {
  const hostname1 = 'https://chain1';
  const hostname2 = 'https://chain2';
  test('should work as expected', () => {
    expect(getChainHost()).toBe('none');
    expect(getChainHost({})).toBe('none');
    expect(getChainHost({ configObj: {} })).toBe('none');
    expect(getChainHost({ configObj: { CHAIN_HOST: '' } })).toBe('none');
    expect(getChainHost({ configObj: { CHAIN_HOST: 'none' } })).toBe('none');
    expect(getChainHost({ configObj: { CHAIN_HOST: hostname1 } })).toBe(hostname1);

    expect(getChainHost({ configObj: { CHAIN_HOST: 'none' }, children: [{ configObj: { CHAIN_HOST: 'none' } }] })).toBe(
      'none'
    );
    expect(
      getChainHost({ configObj: { CHAIN_HOST: 'none' }, children: [{ configObj: { CHAIN_HOST: hostname1 } }] })
    ).toBe(hostname1);

    expect(
      getChainHost({ configObj: { CHAIN_HOST: hostname2 }, children: [{ configObj: { CHAIN_HOST: hostname1 } }] })
    ).toBe(hostname2);

    expect(
      getChainHost({
        configObj: { CHAIN_HOST: 'none' },
        children: [{ configObj: { CHAIN_HOST: hostname2 } }, { configObj: { CHAIN_HOST: hostname1 } }],
      })
    ).toBe(hostname2);

    expect(
      getChainHost({
        configObj: { CHAIN_HOST: 'none' },
        children: [{ children: [{ configObj: { CHAIN_HOST: hostname2 } }] }, { configObj: { CHAIN_HOST: hostname1 } }],
      })
    ).toBe(hostname2);
  });
});
