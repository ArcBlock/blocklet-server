import type { UserInfo } from '@blocklet/server-js';

export interface DidWallet {
  os: 'web' | 'ios' | 'android';
  version: string;
  jwt: string;
}

declare module 'express' {
  export interface Request {
    getBlocklet(): Promise<import('@blocklet/server-js').BlockletState>;

    blocklet?: import('@blocklet/server-js').BlockletState;
    user?: Pick<UserInfo, 'did' | 'fullName'>;
  }
}
