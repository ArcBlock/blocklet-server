import type { Axios } from 'axios';
import { joinURL } from 'ufo';
import { WELLKNOWN_SERVICE_PATH_PREFIX, USER_SESSION_STATUS } from '@abtnode/constant';
import { BlockletService } from './blocklet';

export type UserSessionUser = {
  avatar: string;
  did: string;
  email: string;
  fullName: string;
  pk: string;
  remark?: string;
  role: string;
  roleTitle: string;
  sourceAppPid: string | null;
  sourceProvider: 'wallet' | 'auth0' | 'nft';
};

export type UserSession = {
  appName: string;
  appPid: string;
  extra: {
    walletOS: 'android' | 'ios' | 'web';
  };
  id: string;
  lastLoginIp: string;
  passportId: string | null;
  ua: string;
  createdAt?: string;
  updatedAt: string;
  status?: string;
  user?: UserSessionUser;
  userDid: string;
  visitorId: string;
};

export type UserSessionList = {
  list: UserSession[];
  paging: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export type UserSessionQuery = {
  page: number;
  pageSize: number;
  status?: USER_SESSION_STATUS.ONLINE | USER_SESSION_STATUS.EXPIRED | USER_SESSION_STATUS.OFFLINE;
};

export class UserSessionService {
  private api: Axios;

  private blocklet: BlockletService;

  constructor({ api, blocklet }: { api: Axios; blocklet?: BlockletService }) {
    this.api = api;
    this.blocklet = blocklet || new BlockletService();
  }

  getBaseUrl(appUrl?: string): string | undefined {
    return appUrl ? joinURL(appUrl, WELLKNOWN_SERVICE_PATH_PREFIX) : undefined;
  }

  async getUserSessions({ did, appUrl }: { did: string; appUrl?: string }): Promise<UserSession[]> {
    const baseURL = this.getBaseUrl(appUrl);

    const blocklet = await this.blocklet.getBlocklet();
    const { data } = await this.api.get('/api/user-session', {
      baseURL,
      params: {
        userDid: did,
        appPid: blocklet.appPid,
      },
    });
    return data;
  }

  /**
   * Get all login sessions for the current user
   */
  async getMyLoginSessions(
    { appUrl }: { appUrl?: string } = {},
    params: UserSessionQuery = { page: 1, pageSize: 10 }
  ): Promise<UserSessionList> {
    const baseURL = this.getBaseUrl(appUrl);

    const { data } = await this.api.get('/api/user-session/myself', { baseURL, params });
    return data;
  }

  async loginByUserSession({
    id,
    appPid,
    userDid,
    passportId,
    appUrl,
  }: {
    appPid: string;
    userDid: string;
    id: string;
    passportId: string;
    appUrl?: string;
  }): Promise<UserSession[]> {
    const baseURL = this.getBaseUrl(appUrl);
    const { data } = await this.api.post(
      '/api/user-session/login',
      {
        id,
        appPid,
        userDid,
        passportId,
      },
      { baseURL }
    );
    return data;
  }
}
