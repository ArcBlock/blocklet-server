// eslint-disable-next-line import/no-extraneous-dependencies
import { UserInfo } from '@blocklet/server-js';
import { LOGIN_PROVIDER } from '@blocklet/constant';

export function getPermanentDid(user: UserInfo) {
  return user?.did;
}

export function getConnectedAccounts(user: UserInfo) {
  const connectedAccounts = user?.connectedAccounts || [];
  return connectedAccounts;
}
export function getConnectedDids(user: UserInfo) {
  const connectedAccounts = getConnectedAccounts(user);
  const didList = connectedAccounts.map((item) => item.did);
  return didList;
}

export function getWallet(user: UserInfo) {
  const connectedAccounts = getConnectedAccounts(user);
  const walletAccount = connectedAccounts.find((item) => item.provider === LOGIN_PROVIDER.WALLET);
  return walletAccount;
}

export function getWalletDid(user: UserInfo) {
  const walletAccount = getWallet(user);
  return walletAccount?.did;
}

export function getSourceProvider(user: UserInfo) {
  return user?.sourceProvider || LOGIN_PROVIDER.WALLET;
}

export function getSourceProviders(user: UserInfo) {
  const connectedAccounts = getConnectedAccounts(user);
  return connectedAccounts.map((item) => item.provider);
}
