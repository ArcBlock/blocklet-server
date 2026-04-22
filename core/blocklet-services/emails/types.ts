import type { TUserSession } from '@abtnode/types';

export type Locale = 'en' | 'zh';
export type ChainId = 'beta' | 'main';

export interface AppInfo {
  title: string;
  description: string;
  url: string;
  logo: string;
  version?: string;
}

export interface PoweredBy {
  name: string;
  url?: string;
}

export interface SignatureConfig {
  companyName: string;
  companyLink: string;
  companyAddress: string;
  supportEmail: string;
}

export type UserSession = Omit<TUserSession, 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
};

export interface EmailTheme {
  palette?: {
    primary?: {
      main?: string;
    };
  };
  typography?: {
    fontFamily?: string;
    h1?: {
      fontFamily?: string;
    };
  };
}
