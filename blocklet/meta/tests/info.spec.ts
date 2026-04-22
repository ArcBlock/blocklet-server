// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from 'bun:test';
import { getBlockletInfo } from '../src/index';
import { BLOCKLET_CONFIGURABLE_KEY } from '../src/constants';

const nodeSk = '0x5473889cfcc25682745b7165f724e0c74a110a66ac4b74b646db88b1b351e05979bf6695b10e95a9ae2b1dd636ec6fd015b8764f78826b5c9d8d97027543b95d'; // prettier-ignore

const appSk = '0x852bd56edf65cb07a55e3b5c5582173ca3522acdf14333b1880c2175c24943f61dff49f5a063d67553e506bae8a53b7364d5ba3b8bb6be54fe7776aca390e433'; // prettier-ignore
const appPsk = '0x6aa4a5f5db0fb428650902984d046e4aa4a536cec2aa8364f8cd336025485cb5c523c9568008e4fb80f0c5b25ffb2bcf1823f4e7caab662e6ab7491fc290d795'; // prettier-ignore
const appSkEth = '0x852bd56edf65cb07a55e3b5c5582173ca3522acdf14333b1880c2175c24943f6'; // prettier-ignore

const blockletDid = 'z8iZqeUACK955YaBWqEd8aKg3tTki1GpvE2Wu';

const appDid = 'zNKhnwKBjycrCWZEyRWyqFgkidhzQyWYSFnF';

const didEth = '0x36284c0cEf403Ea5Ad4C6D2a41b0D36383ed15Fc';

const appDidFromDidAndSk = 'zNKfvuK5AcJKFegEajEcRDcyxsf4xZizv5gp';

const appEthDidFromDidAndSk = '0x428eEB8FE65EEB72AC6F733e50d14A22404F2C6c';

describe('getBlockletInfo', () => {
  test('should throw error on invalid state', () => {
    expect(() => getBlockletInfo(undefined)).toThrow(/must be an object/);
    expect(() => getBlockletInfo({} as any)).toThrow(/must be an object/);
    expect(() =>
      getBlockletInfo({
        environments: [{ key: 'test', value: 'test' }],
        meta: { did: 'efg' },
      })
    ).toThrow(/Node secret key must be a string/);
  });

  test('should return as expected: meta.name', () => {
    const result = getBlockletInfo(
      {
        meta: { name: 'name', description: 'description', did: blockletDid },
        environments: [{ key: 'BLOCKLET_APP_SK', value: appSk }],
      },
      nodeSk
    );

    expect(result.name).toEqual('name');
    expect(result.description).toEqual('description');
    expect(result.wallet.address).toEqual(appDid);
    expect(result.permanentWallet.address).toEqual(appDid);
  });

  test('should return as expected: permanentWallet', () => {
    const result = getBlockletInfo(
      {
        meta: { name: 'name', description: 'description', did: blockletDid },
        environments: [
          { key: 'BLOCKLET_APP_SK', value: appSk },
          { key: 'BLOCKLET_APP_PSK', value: appPsk },
        ],
      },
      nodeSk
    );

    expect(result.name).toEqual('name');
    expect(result.description).toEqual('description');
    expect(result.wallet.address).toEqual(appDid);
    expect(result.permanentWallet.address).not.toEqual(appDid);
  });

  test('should return as expected: meta.name from configs', () => {
    const result = getBlockletInfo(
      {
        meta: { name: 'name', description: 'description', did: blockletDid },
        environments: [],
        configs: [{ key: 'BLOCKLET_APP_SK', value: appSk }],
      },
      nodeSk
    );

    expect(result.name).toEqual('name');
    expect(result.description).toEqual('description');
    expect(result.wallet.address).toEqual(appDid);
    expect(result.permanentWallet.address).toEqual(appDid);
  });

  test('should return as expected: meta.title', () => {
    const result = getBlockletInfo(
      {
        meta: { name: 'name', title: 'title', description: 'description', did: blockletDid },
        environments: [{ key: 'BLOCKLET_APP_SK', value: appSk }],
      },
      nodeSk
    );

    expect(result.name).toEqual('title');
    expect(result.description).toEqual('description');
    expect(result.wallet.address).toEqual(appDid);
    expect(result.permanentWallet.address).toEqual(appDid);
  });

  test('should return as expected: env.name', () => {
    const result = getBlockletInfo(
      {
        meta: { name: 'name', title: 'title', description: 'description', did: blockletDid },
        environments: [
          { key: 'BLOCKLET_APP_SK', value: appSk },
          { key: 'BLOCKLET_APP_NAME', value: 'name2' },
        ],
      },
      nodeSk
    );

    expect(result.name).toEqual('name2');
    expect(result.description).toEqual('description');
    expect(result.wallet.address).toEqual(appDid);
    expect(result.permanentWallet.address).toEqual(appDid);
  });

  test('should return as expected: env.desc', () => {
    const result = getBlockletInfo(
      {
        meta: { name: 'name', title: 'title', description: 'description', did: blockletDid },
        environments: [
          { key: 'BLOCKLET_APP_SK', value: appSk },
          { key: 'BLOCKLET_APP_NAME', value: 'name2' },
          { key: 'BLOCKLET_APP_DESCRIPTION', value: 'description2' },
        ],
      },
      nodeSk
    );

    expect(result.name).toEqual('name2');
    expect(result.description).toEqual('description2');
    expect(result.wallet.address).toEqual(appDid);
    expect(result.permanentWallet.address).toEqual(appDid);
  });

  test('should return as expected: env.type', () => {
    const result = getBlockletInfo(
      {
        meta: { name: 'name', title: 'title', description: 'description', did: blockletDid },
        environments: [
          { key: 'BLOCKLET_APP_SK', value: appSkEth },
          { key: 'BLOCKLET_APP_NAME', value: 'name2' },
          { key: 'BLOCKLET_APP_DESCRIPTION', value: 'description2' },
          { key: 'BLOCKLET_APP_CHAIN_TYPE', value: 'ethereum' },
        ],
      },
      nodeSk
    );

    expect(result.name).toEqual('name2');
    expect(result.description).toEqual('description2');
    expect(result.passportColor).toEqual('auto');
    expect(result.wallet.address).toEqual(didEth);
    expect(result.permanentWallet.address).toEqual(didEth);
  });

  test('should return as expected: env.passportColor', () => {
    const result: any = getBlockletInfo(
      {
        meta: { name: 'name', title: 'title', description: 'description', did: blockletDid },
        environments: [
          { key: 'BLOCKLET_APP_SK', value: appSkEth },
          { key: 'BLOCKLET_APP_NAME', value: 'name2' },
          { key: 'BLOCKLET_APP_DESCRIPTION', value: 'description2' },
          { key: 'BLOCKLET_APP_CHAIN_TYPE', value: 'eth' },
          { key: 'BLOCKLET_PASSPORT_COLOR', value: '#ff0000' },
        ],
      },
      nodeSk
    );

    expect(result.name).toEqual('name2');
    expect(result.description).toEqual('description2');
    expect(result.passportColor).toEqual('#ff0000');
    expect(result.wallet.address).toEqual(didEth);
    expect(result.permanentWallet.address).toEqual(didEth);
  });

  test('should return as expected: derived', () => {
    const result = getBlockletInfo(
      {
        meta: {
          name: 'name',
          title: 'title',
          description: 'description',
          did: blockletDid,
        },
        environments: [
          { key: 'BLOCKLET_APP_NAME', value: 'name2' },
          { key: 'BLOCKLET_APP_DESCRIPTION', value: 'description2' },
        ],
      },
      nodeSk
    );

    expect(result.name).toEqual('name2');
    expect(result.description).toEqual('description2');
    expect(result.wallet.address).toEqual(appDidFromDidAndSk);
    expect(result.permanentWallet.address).toEqual(appDidFromDidAndSk);
  });

  test('should return as expected: derived eth type', () => {
    const result = getBlockletInfo(
      {
        meta: {
          name: 'name',
          title: 'title',
          description: 'description',
          did: blockletDid,
        },
        environments: [
          { key: 'BLOCKLET_APP_NAME', value: 'name2' },
          { key: 'BLOCKLET_APP_DESCRIPTION', value: 'description2' },
          { key: 'BLOCKLET_APP_CHAIN_TYPE', value: 'ethereum' },
        ],
      },
      nodeSk
    );

    expect(result.name).toEqual('name2');
    expect(result.description).toEqual('description2');
    expect(result.wallet.address).toEqual(appEthDidFromDidAndSk);
    expect(result.permanentWallet.address).toEqual(appEthDidFromDidAndSk);
  });

  test('should not return wallet id skip returnWallet', () => {
    const result = getBlockletInfo(
      {
        meta: {
          name: 'name',
          title: 'title',
          description: 'description',
          did: blockletDid,
        },
        environments: [],
      },
      nodeSk,
      { returnWallet: false }
    );

    expect(result.name).toEqual('title');
    expect(result.description).toEqual('description');
    expect(result.wallet).toBeFalsy();
    expect(result.permanentWallet).toBeFalsy();
  });

  test('should return appUrl', () => {
    const blocklet: any = {
      meta: {
        did: blockletDid,
      },
      environments: [{ key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_URL, value: 'example.com' }],
    };

    const res1 = getBlockletInfo(blocklet, nodeSk, { returnWallet: true });

    expect(res1.appUrl).toBe('example.com');
    const res2 = getBlockletInfo(blocklet, nodeSk, { returnWallet: false });

    expect(res2.appUrl).toBe('example.com');
  });
});

test('should return version', () => {
  const blocklet: any = {
    meta: {
      did: blockletDid,
      version: '8.8.8',
    },
    environments: [],
  };

  const res1 = getBlockletInfo(blocklet, nodeSk, { returnWallet: true });
  expect(res1.version).toBe('8.8.8');

  const res2 = getBlockletInfo(blocklet, nodeSk, { returnWallet: false });
  expect(res2.version).toBe('8.8.8');
});
