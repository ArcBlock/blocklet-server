import type { TNavigationItem as BlockletNavigation, TTheme as BlockletTheme } from '@blocklet/meta/lib/types';
import type { TComponentInternalInfo } from '@blocklet/meta/lib/blocklet';
import { BlockletStatus } from '@blocklet/meta/lib/constants';

/**
 * Signature verification function type
 * @param data - The data to verify (JSON string)
 * @param signature - The signature value
 * @param appPk - Application public key
 * @param appId - Application DID
 * @returns Verification result; supports both sync and async
 */
export type VerifyFn = (data: string, signature: string, appPk: string, appId: string) => boolean | Promise<boolean>;

export type TokenResult = {
  nextToken: string;
  nextRefreshToken: string;
};

export type RequestParams = {
  lazy?: boolean;
  lazyTime?: number;
  componentDid?: string;
  verifyFn?: VerifyFn;
};

export type BlockletComponent = TComponentInternalInfo & {
  status: keyof typeof BlockletStatus;
};
export type BlockletSettings = {
  session: {
    ttl: number;
    cacheTtl: number;
  };
  federated: {
    master: {
      appId: string;
      appPid: string;
      appName: string;
      appDescription: string;
      appUrl: string;
      appLogo: string;
      version: string;
    };
    config: Record<string, any>;
  };
  oauth: Record<string, { enabled: boolean; [x: string]: any }>;
};
export type Blocklet = {
  [x: string]: any;
  did: string;
  appId: string;
  appPk: string;
  appIds?: string[];
  appPid: string;
  appName: string;
  appDescription: string;
  appLogo: string;
  appLogoRect: string;
  appUrl: string;
  domainAliases?: string[];
  isComponent: boolean;
  prefix: string;
  groupPrefix: string;
  pageGroup: string;
  version: string;
  mode: string;
  tenantMode: 'single' | 'multiple';
  theme: BlockletTheme;
  navigation: BlockletNavigation[];
  preferences: Record<string, any>;
  languages: { code: string; name: string }[];
  passportColor: string;
  componentMountPoints: BlockletComponent[];
  alsoKnownAs: string[];
  trustedFactories: string[];
  status: string;
  serverDid: string;
  serverVersion: string;
  componentId: string;
  webWalletUrl: string;
  updatedAt: number;
  // FIXME: To be completed later
  // optionalComponents?: TOptionalComponentState[];
  settings: BlockletSettings;
};

export type ServerEnv = {
  appId: string;
  appPid: string;
  appName: string;
  appDescription: string;
  apiPrefix: string;
  baseUrl: string;
};
