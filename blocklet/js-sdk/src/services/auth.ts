/* eslint-disable @typescript-eslint/return-await */
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { withQuery } from 'ufo';

import type { Axios } from 'axios';
import { TokenService } from './token';

export type UserPublicInfo = {
  avatar: string;
  did: string;
  name: string;
  fullName: string;
  sourceAppPid: string | null;
};

export type Webhook = {
  type: 'slack' | 'api';
  url: string;
};
export type NotificationConfig = {
  webhooks?: Webhook[];
  notifications?: {
    email?: boolean;
    wallet?: boolean;
    phone?: boolean;
  };
};

export type PrivacyConfig = {
  [key: string]: boolean;
};

export interface SpaceGateway {
  did: string;
  name: string;
  url: string;
  endpoint: string;
}

export enum OrgQueryType {
  OWNED = 'owned',
  JOINED = 'joined',
}

export class AuthService {
  private api: Axios;

  private token: TokenService;

  constructor({ api, token }: { api: Axios; token: TokenService }) {
    this.api = api;
    this.token = token;
  }

  async getUserPublicInfo({ did, name }: { did: string; name?: string }): Promise<UserPublicInfo> {
    const { data } = await this.api.get('/api/user', {
      params: { did, name },
    });
    return data;
  }

  async getUserPrivacyConfig({ did, name }: { did: string; name?: string }): Promise<PrivacyConfig> {
    const { data } = await this.api.get('/api/user/privacy/config', {
      params: { did, name },
    });
    return data;
  }

  async saveUserPrivacyConfig(config: PrivacyConfig): Promise<PrivacyConfig> {
    const { data } = await this.api.post('/api/user/privacy/config', config);
    return data;
  }

  async getUserNotificationConfig(): Promise<NotificationConfig> {
    const { data } = await this.api.get('/api/user/notification/config');
    return data;
  }

  async saveUserNotificationConfig(config: NotificationConfig): Promise<NotificationConfig> {
    const { data } = await this.api.post('/api/user/notification/config', config);
    return data;
  }

  async testNotificationWebhook(webhook: Webhook): Promise<{
    success: boolean;
  }> {
    const { data } = await this.api.put('/api/user/notification/webhook', webhook);
    return data;
  }

  // eslint-disable-next-line require-await
  async getProfileUrl({ did, locale }: { did: string; locale: string }) {
    const url = `${WELLKNOWN_SERVICE_PATH_PREFIX}/user`;
    return withQuery(url, {
      did,
      locale,
    });
  }

  async getProfile() {
    const { data } = await this.api.get('/api/user/profile');
    return data;
  }

  async refreshProfile(): Promise<void> {
    await this.api.put('/api/user/refreshProfile');
  }

  async followUser({ userDid }: { userDid: string }): Promise<void> {
    await this.api.post(`/api/user/follow/${userDid}`);
  }

  async unfollowUser({ userDid }: { userDid: string }): Promise<void> {
    await this.api.delete(`/api/user/follow/${userDid}`);
  }

  async isFollowingUser({ userDid }: { userDid: string }): Promise<boolean> {
    const { data } = await this.api.get(`/api/user/follow/${userDid}`);
    return data.isFollowing;
  }

  async saveProfile({
    locale,
    inviter,
    metadata,
    address,
  }: {
    locale?: string;
    inviter?: string;
    metadata?: any;
    address?: any;
  }) {
    const { data } = await this.api.put('/api/user/profile', { locale, inviter, metadata, address });
    return data;
  }

  async updateDidSpace({ spaceGateway }: { spaceGateway: SpaceGateway }) {
    await this.api.put('/api/user/updateDidSpace', { spaceGateway });
  }

  /**
   * Specify the device ID to log out
   * Specify the session status filter
   * @param {{ visitorId: string, status: string }} { visitorId, status }
   * @return {Promise<void>}
   */
  async logout({
    visitorId,
    status,
    includeFederated,
  }: {
    visitorId?: string;
    status?: string;
    includeFederated?: boolean;
  }): Promise<void> {
    const refreshToken = this.token.getRefreshToken();
    const { data } = await this.api.post('/api/user/logout', {
      visitorId,
      status,
      includeFederated,
      refreshToken,
    });
    return data;
  }

  /**
   * Delete the currently logged-in user
   * @return {Promise<{did: string}>}
   */
  async destroyMyself(): Promise<{ did: string }> {
    const { data } = await this.api.delete('/api/user');
    return data;
  }

  async getOrgs({
    search = '',
    type = '',
    page = 1,
    pageSize = 20,
  }: {
    search?: string;
    page: number;
    pageSize: number;
    type?: OrgQueryType | '';
  }): Promise<any> {
    const { data } = await this.api.get('/api/user/orgs', { params: { search, page, pageSize, type } });
    return data;
  }

  // Fetch org information by orgId
  async getOrg(orgId: string): Promise<any> {
    const { data } = await this.api.get(`/api/user/orgs/${orgId}`);
    return data;
  }

  async createOrg(org: any): Promise<any> {
    const { data } = await this.api.post('/api/user/orgs', { org });
    return data;
  }

  // Fetch role info to determine org membership
  async getRole(name: string): Promise<any> {
    const { data } = await this.api.get('/api/user/role', { params: { name } });
    return data;
  }

  async addResourceToOrg({
    orgId,
    resourceId,
    type,
    metadata,
  }: {
    orgId: string;
    resourceId: string;
    type?: string;
    metadata?: any;
  }): Promise<any> {
    const { data } = await this.api.post(`/api/user/orgs/${orgId}/resources`, { resourceId, type, metadata });
    return data;
  }

  async migrateResourceToOrg({ form, to, resourceId }: { form: string; to: string; resourceId: string }): Promise<any> {
    const { data } = await this.api.put(`/api/user/orgs/${form}/resources`, { to, resourceId });
    return data;
  }
}
