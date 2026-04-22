/* eslint-disable import/first */
import { expect, test } from 'bun:test';
import { getAppCapabilities, getWalletType } from '../../src/blocklet/util';

test('getAppCapabilities', () => {
  expect(getAppCapabilities({})).toEqual({ didSpace: null });
  expect(getAppCapabilities({ meta: { capabilities: {} } })).toEqual({ didSpace: null });
  expect(getAppCapabilities({ meta: { capabilities: { didSpace: 'optional' } } })).toEqual({ didSpace: 'optional' });
  expect(getAppCapabilities({ meta: { capabilities: { didSpace: 'required' } } })).toEqual({ didSpace: 'required' });
  expect(getAppCapabilities({ meta: {}, children: [{ meta: { capabilities: { didSpace: 'required' } } }] })).toEqual({
    didSpace: 'required',
  });
  expect(
    getAppCapabilities({
      meta: {},
      children: [{ meta: { capabilities: {} } }, { meta: { capabilities: { didSpace: 'required' } } }],
    })
  ).toEqual({
    didSpace: 'required',
  });
  expect(
    getAppCapabilities({
      meta: {},
      children: [
        { meta: { capabilities: { didSpace: 'optional' } } },
        { meta: { capabilities: { didSpace: 'required' } } },
      ],
    })
  ).toEqual({
    didSpace: 'required',
  });

  expect(
    getAppCapabilities({
      meta: { capabilities: { didSpace: 'required' } },
      children: [{ meta: { capabilities: { didSpace: 'optional' } } }],
    })
  ).toEqual({
    didSpace: 'required',
  });

  expect(
    getAppCapabilities({
      meta: {},
      children: [
        {
          meta: { capabilities: { didSpace: 'optional' } },
          children: [{ meta: { capabilities: { didSpace: 'required' } } }],
        },
      ],
    })
  ).toEqual({
    didSpace: 'required',
  });

  expect(
    getAppCapabilities({
      meta: { capabilities: {} },
      children: [{ meta: { capabilities: {} } }, { meta: { capabilities: {} } }],
    })
  ).toEqual({
    didSpace: null,
  });
});

test('getWalletType', () => {
  // from meta
  expect(getWalletType({})).toBe('arcblock');
  expect(getWalletType({ environments: [] })).toBe('arcblock');
  expect(getWalletType({ environments: [{ name: 'BLOCKLET_APP_CHAIN_TYPE' }] })).toBe('arcblock');
  expect(getWalletType({ environments: [{ name: 'BLOCKLET_APP_CHAIN_TYPE', default: 'ethereum' }] })).toBe('ethereum');
  expect(getWalletType({ environments: [{ name: 'CHAIN_TYPE' }] })).toBe('arcblock');
  expect(getWalletType({ environments: [{ name: 'CHAIN_TYPE', default: 'ethereum' }] })).toBe('ethereum');

  // from state
  expect(getWalletType({}, true)).toBe('arcblock');
  expect(getWalletType({ environments: [] }, true)).toBe('arcblock');
  expect(getWalletType({ environments: [{ key: 'BLOCKLET_APP_CHAIN_TYPE' }] }, true)).toBe('arcblock');
  expect(getWalletType({ environments: [{ key: 'BLOCKLET_APP_CHAIN_TYPE', value: 'ethereum' }] }, true)).toBe(
    'ethereum'
  );
  expect(getWalletType({ environments: [{ key: 'CHAIN_TYPE' }] }, true)).toBe('arcblock');
  expect(getWalletType({ environments: [{ key: 'CHAIN_TYPE', value: 'ethereum' }] }, true)).toBe('ethereum');

  expect(getWalletType({ configs: [] }, true)).toBe('arcblock');
  expect(getWalletType({ configs: [{ key: 'BLOCKLET_APP_CHAIN_TYPE' }] }, true)).toBe('arcblock');
  expect(getWalletType({ configs: [{ key: 'BLOCKLET_APP_CHAIN_TYPE', value: 'ethereum' }] }, true)).toBe('ethereum');
});
