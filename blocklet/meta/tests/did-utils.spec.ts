import { describe, test, expect } from 'bun:test';

import { getConnectedAccounts, getConnectedDids, getPermanentDid, getWallet, getWalletDid } from '../src';

const walletAccount = {
  provider: 'wallet',
  did: 'abcdefg',
  pk: 'abcdefg',
};
const auth0Account = {
  provider: 'auth0',
  id: 'auth0',
  did: 'abcdefghi',
  pk: 'abcdefghi',
};

const userInfoData: any = {
  did: 'abcdefg',
  pk: 'abcdefg',
  sourceProvider: 'wallet',
  connectedAccounts: [walletAccount, auth0Account],
};

const userInfoNoWallet: any = {
  did: 'abcdefg',
  pk: 'abcdefg',
  sourceProvider: 'auth0',
  connectedAccounts: [auth0Account],
};

describe('getConnectedAccounts', () => {
  test('should get right alias account', () => {
    expect(getConnectedAccounts(userInfoData)).toEqual([walletAccount, auth0Account]);
  });
});

describe('getConnectedDids', () => {
  test('should get right alias account did', () => {
    expect(getConnectedDids(userInfoData)).toEqual([walletAccount.did, auth0Account.did]);
  });
});
describe('getPermanentDid', () => {
  test('should get main did', () => {
    expect(getPermanentDid(userInfoData)).toEqual(userInfoData.did);
  });
});

describe('getWallet', () => {
  test('should get wallet account', () => {
    expect(getWallet(userInfoData)).toEqual(walletAccount);
  });

  test('should work with no wallet account data', () => {
    expect(getWallet(userInfoNoWallet)).toEqual(undefined);
  });
});

describe('getWalletDid', () => {
  test('should get wallet account did', () => {
    expect(getWalletDid(userInfoData)).toEqual(walletAccount.did);
  });
  test('should work with no wallet account data', () => {
    expect(getWalletDid(userInfoNoWallet)).toEqual(undefined);
  });
});
