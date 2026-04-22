/* eslint-disable @typescript-eslint/indent */
import { TTheme, type TNavigationItem } from '@blocklet/meta/lib/types';
import { blockletEnv } from '@blocklet/env';

import { BlockletService } from './service/blocklet';
import Notification from './service/notification';
import { WalletAuthenticator } from './wallet-authenticator';
import { WalletHandlers } from './wallet-handler';
import { BlockletAuthenticator } from './connect/authenticator';
import { createConnectHandlers } from './connect/handler';
import { Database } from './database/index';
import middlewares from './middlewares/index';
import { getWallet } from './wallet';
import Component from './component/index';
import Security from './security/index';
import config, { TComponent } from './config';

/** @deprecated Use BlockletService instead */
export { BlockletService as AuthService };
/** @deprecated Use BlockletService instead */
export { BlockletService as Auth };
export { BlockletService };
export { Notification as NotificationService };
export { Notification };
export { WalletHandlers };
export { WalletAuthenticator };
export { BlockletAuthenticator };
export { createConnectHandlers };
export { Database };
export { getWallet };
export { blockletEnv as env };
export { middlewares };
export { Component as component };
export { Component };
export { Security };
export { config };
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
  oauth: Record<
    string,
    {
      enabled: boolean;
      [x: string]: any;
    }
  >;
};

export interface WindowBlocklet {
  [x: string]: any;

  serverDid: string;
  serverVersion: string;

  did: string;
  appId: string;
  appIds: string[];
  appPid: string;
  appPk: string;
  appName: string;
  appDescription: string;
  appLogo: string;
  appLogoRect: string;
  appUrl: string;
  webWalletUrl: string;
  isComponent: boolean;
  prefix: string;
  groupPrefix: string;
  pageGroup: string;
  version: string;
  mode: string;
  status: string;
  tenantMode: 'single' | 'multiple';
  theme: TTheme;
  navigation: TNavigationItem[];
  preferences: Record<string, any>;
  languages: { code: string; name: string }[];
  passportColor: string;
  componentId: string;
  componentMountPoints: TComponent[];
  alsoKnownAs: string[];
  trustedFactories: string[];
  // componentId, updatedAt, settings
  updatedAt: number;
  // FIXME: To be completed later
  // optionalComponents?: TOptionalComponentState[];
  settings: BlockletSettings;
}

declare global {
  interface Window {
    blocklet: WindowBlocklet;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare namespace NodeJS {
  export interface ProcessEnv {
    BLOCKLET_MODE: 'production' | 'development';
    BLOCKLET_APP_SK?: string;
    BLOCKLET_APP_PK: string;
    BLOCKLET_APP_PK_ETH: string;
    BLOCKLET_APP_ID: string;
    BLOCKLET_APP_IDS: string;
    BLOCKLET_APP_PSK?: string;
    BLOCKLET_APP_PPK: string;
    BLOCKLET_APP_PPK_ETH: string;
    BLOCKLET_APP_PID: string;
    BLOCKLET_APP_URL: string;
    BLOCKLET_APP_NAME: string;
    BLOCKLET_APP_DESCRIPTION: string;
    BLOCKLET_APP_DIR: string;
    BLOCKLET_APP_LOGO: string;
    BLOCKLET_APP_SPACES_URL: string;
    BLOCKLET_APP_SPACE_ENDPOINT: string;
    BLOCKLET_APP_BACKUP_ENDPOINT: string;
    BLOCKLET_APP_TENANT_MODE: 'single' | 'multiple';
    BLOCKLET_WALLET_TYPE: string; // deprecated
    BLOCKLET_DATA_DIR: string;
    BLOCKLET_LOG_DIR: string;
    BLOCKLET_CACHE_DIR: string;
    BLOCKLET_SHARE_DIR: string;
    BLOCKLET_APP_SHARE_DIR: string;
    USING_DOCKER: string;
  }
}

export * from './component';
