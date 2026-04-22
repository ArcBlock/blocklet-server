/* eslint-disable import/prefer-default-export */
import { LOGIN_PROVIDER } from '@blocklet/constant';
import type { LiteralUnion } from 'type-fest';

export function getLoginProvider(request) {
  const extraParams = request?.context?.store?.extraParams || request.query || {};
  return extraParams.provider || LOGIN_PROVIDER.WALLET;
}

export function getSourceAppPid(request) {
  const extraParams = request?.context?.store?.extraParams || request.query || {};

  return extraParams?.sourceAppPid || null;
}

export const encodeKycStatus = (emailVerified: boolean, phoneVerified: boolean): number => {
  const emailVerifiedBit: number = emailVerified ? 1 : 0;
  const phoneVerifiedBit: number = phoneVerified ? 1 : 0;
  // eslint-disable-next-line no-bitwise
  return emailVerifiedBit | (phoneVerifiedBit << 1);
};

export const decodeKycStatus = (status: number): { emailVerified: boolean; phoneVerified: boolean } => {
  // eslint-disable-next-line no-bitwise
  const emailVerifiedBit: number = status & 1;
  // eslint-disable-next-line no-bitwise
  const phoneVerifiedBit: number = (status >> 1) & 1;
  return {
    emailVerified: emailVerifiedBit === 1,
    phoneVerified: phoneVerifiedBit === 1,
  };
};

export type KycMethod = LiteralUnion<'email' | 'phone', string>;
export type AuthMethod = LiteralUnion<'loginToken' | 'componentCall' | 'signedToken' | 'accessKey', string>;

export type SessionUser = {
  did: string;
  role: string | undefined;
  provider: string;
  fullName: string;
  walletOS: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  method?: AuthMethod;
  accessKeyId?: string;
  kyc?: number;
  [key: string]: any;
};

export const isLoginToken = (token: string) => {
  return typeof token === 'string' && token.split('.').length === 3;
};

export const isAccessKey = (token: string) => {
  return typeof token === 'string' && token.split('.').length === 1 && token.startsWith('blocklet-');
};
