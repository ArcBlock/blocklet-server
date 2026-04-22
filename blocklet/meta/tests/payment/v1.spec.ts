import { fromTokenToUnit } from '@ocap/util';
import { describe, test, expect } from 'bun:test';
import { getBlockletPurchaseTemplate } from '../../src/nft-templates';
import { createNftFactoryItx } from '../../src/payment/index';
import { createShareContract } from '../../src/payment/v1';

describe('createShareContract', () => {
  const shares = [
    { name: 'developer', address: 'dev', value: 0.7 },
    { name: 'registry', address: 'reg', value: 0.3 },
  ];

  test('should throw error for invalid payment config: minus value', () => {
    const config = { tokens: [{ address: 'token1', value: '-100' }], shares };

    expect(() => createShareContract(config)).toThrow(/token price must be/);
  });
  test('should throw error for invalid payment config: share', () => {
    const config = { shares: [{ name: 'arcblock', address: 'token1', value: 1.2 }] };

    expect(() => createShareContract(config)).toThrow(/share sum should not be greater than 1/);
  });
  test('should create contract for valid config', () => {
    const result = createShareContract({ tokens: [{ address: 'token1', value: '100' }], shares });

    expect(result).toEqual("transferToken('token1','dev','70');\ntransferToken('token1','reg','30')"); // prettier-ignore
  });
  test('should create contract for valid config: compound', () => {
    const result = createShareContract({ tokens: [{ address: 'token1', value: '100' }], shares });

    expect(result).toEqual("transferToken('token1','dev','70');\ntransferToken('token1','reg','30')"); // prettier-ignore
  });
  test('should create contract for valid config: token with decimals', () => {
    const result = createShareContract({
      tokens: [{ address: 'token1', value: fromTokenToUnit(10.2345).toString() }],
      shares,
    });
    expect(result).toEqual(`transferToken('token1','dev','${fromTokenToUnit(7.16415)}');\ntransferToken('token1','reg','${fromTokenToUnit(3.07035)}')`); // prettier-ignore
  });
});
describe('createNftFactoryItx', () => {
  test('should throw if invalid config given: invalid token did', () => {
    expect(
      () =>
        createNftFactoryItx({
          // @ts-ignore
          meta: { did: 'z8iZwkthMgmMHWgbhZuVDZgRPAa9KtidoHTNL', name: 'demo' },
          tokens: [{ address: 'z35n3kwEXMakjzfa', value: '100' }],
          shares: [
            { address: 'zNKn4x3CaedWFpydP37J8znVxqNgdMVPaPqv', value: 0.7 },
            { address: 'z1dpKhABuYG83FAFySLD1ewe9nF74xSGaGV', value: 0.3 },
          ],
          serviceUrl: 'http://registry.arcblock.io',
          issuers: ['z1dpKhABuYG83FAFySLD1ewe9nF74xSGaGV'],
        })
      // eslint-disable-next-line function-paren-newline
    ).toThrow(/to be valid did/i);
  });
  test('should create valid factory itx as expected', () => {
    const serviceUrl = 'http://registry.arcblock.io';

    const itx = createNftFactoryItx({
      // @ts-ignore
      meta: { did: 'z8iZwkthMgmMHWgbhZuVDZgRPAa9KtidoHTNL', name: 'demo' },
      tokens: [{ address: 'z35n3kwEXMakjzfaf24DLd67dTJRByTf8y1FN', value: '100' }],
      shares: [
        { address: 'zNKn4x3CaedWFpydP37J8znVxqNgdMVPaPqv', value: 0.7 },
        { address: 'z1dpKhABuYG83FAFySLD1ewe9nF74xSGaGV', value: 0.3 },
      ],
      serviceUrl,
      issuers: ['z1dpKhABuYG83FAFySLD1ewe9nF74xSGaGV'],
    });

    expect(itx).toEqual({
      name: 'demo',
      description: 'Purchase NFT factory for blocklet demo',
      settlement: 'instant',
      limit: 0,
      trustedIssuers: ['z1dpKhABuYG83FAFySLD1ewe9nF74xSGaGV'],
      input: {
        tokens: [{ address: 'z35n3kwEXMakjzfaf24DLd67dTJRByTf8y1FN', value: '100' }],
        assets: [],
        variables: [],
      },
      output: {
        issuer: '{{ctx.issuer.id}}',
        parent: '{{ctx.factory}}',
        moniker: 'BlockletPurchaseNFT',
        readonly: true,
        transferrable: false,
        data: getBlockletPurchaseTemplate(serviceUrl),
      },
      data: {
        type: 'json',
        value: {
          did: 'z8iZwkthMgmMHWgbhZuVDZgRPAa9KtidoHTNL',
          url: 'http://registry.arcblock.io/blocklet/z8iZwkthMgmMHWgbhZuVDZgRPAa9KtidoHTNL',
          name: 'demo',
        },
      },
      hooks: [
        {
          name: 'mint',
          type: 'contract',
          hook: "transferToken('z35n3kwEXMakjzfaf24DLd67dTJRByTf8y1FN','zNKn4x3CaedWFpydP37J8znVxqNgdMVPaPqv','70');\ntransferToken('z35n3kwEXMakjzfaf24DLd67dTJRByTf8y1FN','z1dpKhABuYG83FAFySLD1ewe9nF74xSGaGV','30')",
        },
      ],
      // @ts-ignore
      address: 'z3CtEqLZ3WjoW4RRYWDhMoFdUY2sZxt6YYswC',
    });
  });
});
