/* eslint-disable prettier/prettier */
/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/indent */
import pickBy from 'lodash/pickBy';
import Client from '@blocklet/server-js';
import { SERVER_ROLES } from '@abtnode/constant';
import { toBuffer } from '@ocap/util';
import { LOGIN_PROVIDER } from '@blocklet/constant';
import { findComponentByIdV2 } from '@blocklet/meta/lib/util';
import { verifyVault } from '@blocklet/meta/lib/security';
import { formatError } from '@blocklet/error';
import axios, { AxiosHeaders } from 'axios';

import { checkBlockletEnvironment } from '../util/check-blocklet-env';
import { version } from '../version';
import { getWallet } from '../wallet';
import serviceApi from '../util/service-api';
import { getServerHost } from '../util/parse-docker-endpoint';
import { fixAvatar } from '../util/user';

type PartialDeep<T> = {
  [K in keyof T]?: T[K] extends object ? PartialDeep<T[K]> : T[K];
};

type OmitTeamDid<T> = PartialDeep<Omit<T, 'teamDid'>>;
type OmitDid<T> = PartialDeep<Omit<T, 'did'>>;

type RequestHeaders = {
  headers: {
    cookie: string;
  };
};

const VERSION = version; // version of notification sdk

const isNotNullOrUndefined = (x: any) => ![null, undefined].includes(x);

const fixUserAvatar = (user?: { avatar: string }) => {
  if (user?.avatar) {
    user.avatar = fixAvatar(user.avatar);
  }

  return user;
};

class BlockletClient extends Client {
  constructor(httpEndpoint?: string) {
    checkBlockletEnvironment();
    super(
      httpEndpoint || `http://${getServerHost()}:${process.env.ABT_NODE_PORT}/api/gql`.trim(),
      `BlockletSDK/${VERSION}`
    );

    const wallet = getWallet.getAccessWallet();

    this.setAuthAccessKey({
      accessKeyId: wallet.address,
      accessKeySecret: toBuffer(wallet.secretKey) as any,
      type: 'sha256',
    });
  }

  async _getAuthHeaders() {
    const headers = await super._getAuthHeaders();
    // Use BLOCKLET_APP_PID to match the DID used for deriving BLOCKLET_APP_ASK
    // BLOCKLET_APP_ASK is derived from root.appPid, so we must use BLOCKLET_APP_PID here
    headers['x-access-blocklet'] = process.env.BLOCKLET_APP_PID;
    headers['x-component-did'] = process.env.BLOCKLET_COMPONENT_DID;
    return headers;
  }
}

// Methods that require cookie-based authentication
const AUTH_REQUIRED_METHODS = Object.freeze(['getUserFollowers', 'getUserFollowing', 'getUserFollowStats']);

// core/state/lib/api/team.js L42
// All configurable service methods are registered here; add new ones in this list
// core/gql/lib/config.js L25
class BlockletService {
  constructor(httpEndpoint?: string) {
    const client = new BlockletClient(httpEndpoint);

    const apiList = [
      // session
      'login',
      'switchProfile',
      'refreshSession',

      // user
      'getUsers',
      'getUsersCount',
      'getUsersCountPerRole',
      'getUser',
      'getOwner',
      // user session
      'getUserSessions',
      'getUserSessionsCount',
      // 'removeUser',
      'updateUserApproval',
      'updateUserTags',
      'updateUserExtra',

      'getUserFollowers',
      'getUserFollowing',
      'getUserFollowStats',
      'checkFollowing',
      'followUser',
      'unfollowUser',

      'getUserInvites',

      // updateUserInfo
      'updateUserAddress',
      'updateUserInfo',

      // tagging
      'getTags',
      'createTag',
      'updateTag',
      'deleteTag',

      // invitation
      // 'getInvitations',
      // 'createMemberInvitation',
      // 'deleteInvitation',

      // rbac
      'getRoles',
      'getRole',
      'createRole',
      'updateRole',
      'deleteRole',
      'grantPermissionForRole',
      'revokePermissionFromRole',
      'updatePermissionsForRole',
      'hasPermission',

      // user passport
      'issuePassportToUser',
      'revokeUserPassport',
      'enableUserPassport',
      'removeUserPassport',
      // 'getPassportIssuances',
      // 'createPassportIssuance',
      // 'deletePassportIssuance',

      // permission
      'getPermissions',
      'createPermission',
      'updatePermission',
      'deletePermission',
      'getPermissionsByRole',

      // disabled in current
      // 'configTrustedPassports',
      // 'configTrustedFactories',

      // blocklet
      'getBlocklet',
      'getComponent',
      'getTrustedDomains',
      'updatePreferences',
      'clearCache',
      'getVault',

      // access key
      'createAccessKey',
      'verifyAccessKey',
      'getAccessKeys',
      'getAccessKey',

      // org
      'getOrg',
      'getOrgs',
      'createOrg',
      'getOrgResource',
      'addOrgResource',
      'migrateOrgResource',

      // config
      'configBlocklet',
      'configNavigations',

      // routing
      'addRoutingRule',
      'updateRoutingRule',
      'deleteRoutingRule',

      // domain and certificate
      'addDomainAlias',
      'deleteDomainAlias',
      'findCertificateByDomain',
    ];
    const teamDid = process.env.BLOCKLET_APP_PID;
    const componentDid = process.env.BLOCKLET_COMPONENT_DID;

    const apiFallback =
      (fn: Function) =>
      (params = {}, ...args: any[]) =>
        fn({ input: { ...params, teamDid }, ...args });
    // const apiConvertDid = (fn: Function) => (did: string) => fn({ input: { user: { did }, teamDid } });
    const apiFnMap = {
      getUser:
        (fn: Function) =>
        async (
          did: string,
          options: {
            name?: string;
            enableConnectedAccount?: boolean;
            includeTags?: boolean;
          } = {}
        ) => {
          const res: Client.ResponseUser = await fn({ input: { user: { did }, options, teamDid } });
          fixUserAvatar(res.user);
          return res;
        },

      getUsers: (fn: (arg0: { input: any }) => any) => async (args: any) => {
        const res: Client.ResponseUsers = await fn({ input: { teamDid, ...args } });
        (res.users || []).forEach(fixUserAvatar);
        return res;
      },

      // removeUser: apiConvertDid,
      updateUserApproval: (fn: Function) => (did: string, approved: boolean) =>
        fn({ input: { user: { did, approved }, teamDid } }),
      switchProfile: (fn: Function) => (did: string, profile: { avatar?: string; email: string; fullName?: string }) =>
        fn({ input: { teamDid, userDid: did, profile } }),
      getPermissionsByRole: (fn: Function) => (name: string) => fn({ input: { role: { name }, teamDid } }),
      createRole:
        (fn: Function) =>
        ({ name, title, description, extra }: any) =>
          fn({ input: { ...pickBy({ name, title, description, extra }, isNotNullOrUndefined), teamDid } }),
      updateRole:
        (fn: Function) =>
        (name: string, { title, description, extra }: any) =>
          fn({ input: { role: pickBy({ name, title, description, extra }, isNotNullOrUndefined), teamDid } }),
      getRole: (fn: Function) => (name: string) => fn({ input: { role: { name }, teamDid } }),
      deleteRole: (fn: Function) => (name: string) => fn({ input: { name, teamDid } }),
      grantPermissionForRole: (fn: Function) => (roleName: string, permissionName: string) =>
        fn({ input: { teamDid, roleName, grantName: permissionName } }),
      revokePermissionFromRole: (fn: Function) => (roleName: string, permissionName: string) =>
        fn({ input: { teamDid, roleName, grantName: permissionName } }),
      updatePermissionsForRole: (fn: Function) => (roleName: string, permissionNames: string[]) =>
        fn({ input: { teamDid, roleName, grantNames: permissionNames } }),
      createPermission:
        (fn: Function) =>
        ({ name, description }: any) =>
          fn({ input: { ...pickBy({ name, description }, isNotNullOrUndefined), teamDid } }),
      updatePermission:
        (fn: Function) =>
        (name: string, { description }: any) =>
          fn({ input: { permission: pickBy({ name, description }, isNotNullOrUndefined), teamDid } }),
      deletePermission: (fn: Function) => (name: string) => fn({ input: { name, teamDid } }),
      hasPermission: (fn: Function) => (role: string, permission: string) =>
        fn({ input: { teamDid, role, permission } }),
      getBlocklet:
        (fn: Function) =>
        (attachRuntimeInfo: boolean = false, useCache: boolean = true) =>
          fn({ input: { did: teamDid, attachRuntimeInfo, useCache } }),

      createAccessKey: (fn: Function) => (params: OmitTeamDid<Client.RequestCreateAccessKeyInput>) =>
        fn({
          input: {
            authType: 'simple',
            createdVia: 'sdk',
            passport: SERVER_ROLES.GUEST,
            ...params,
            componentDid,
            teamDid,
          },
        }),
      verifyAccessKey: (fn: Function) => (params: OmitTeamDid<Client.RequestVerifyAccessKeyInput>) =>
        fn({ input: { ...params, teamDid } }),
      getAccessKeys: (fn: Function) => (params: OmitTeamDid<Client.RequestAccessKeysInput>) =>
        fn({ input: { ...params, teamDid, componentDid } }),
      getAccessKey: (fn: Function) => (params: OmitTeamDid<Client.RequestAccessKeyInput>) =>
        fn({ input: { ...params, teamDid } }),

      configBlocklet: (fn: Function) => (params: OmitDid<Client.RequestConfigBlockletInput>) =>
        fn({ input: { ...params, did: [teamDid] } }),
      configNavigations: (fn: Function) => (params: OmitDid<Client.RequestConfigNavigationsInput>) =>
        fn({ input: { ...params, did: teamDid } }),

      addRoutingRule: (fn: Function) => (params: OmitTeamDid<Client.RequestAddRoutingRuleInput>) =>
        fn({ input: { ...params, teamDid } }),
      updateRoutingRule: (fn: Function) => (params: OmitTeamDid<Client.RequestUpdateRoutingRuleInput>) =>
        fn({ input: { ...params, teamDid } }),
      deleteRoutingRule: (fn: Function) => (params: OmitTeamDid<Client.RequestDeleteRoutingRuleInput>) =>
        fn({ input: { ...params, teamDid } }),

      // domain and certificate
      addDomainAlias: (fn: Function) => (params: OmitTeamDid<Client.RequestAddDomainAliasInput>) =>
        fn({ input: { ...params, teamDid } }),
      deleteDomainAlias: (fn: Function) => (params: OmitTeamDid<Client.RequestDeleteDomainAliasInput>) =>
        fn({ input: { ...params, teamDid } }),
      findCertificateByDomain: (fn: Function) => (params: OmitTeamDid<Client.RequestFindCertificateByDomainInput>) =>
        fn({ input: { ...params, teamDid } }),
    };

    const apiAliases: Record<string, string> = {};

    apiList.forEach((api) => {
      // Use aliased method name if exists, otherwise use api name directly
      const clientMethodName = apiAliases[api] || api;
      const fn = client[clientMethodName];
      this[api] = apiFnMap[api] ? apiFnMap[api](fn) : apiFallback(fn);
    });

    this.login = async (data, options) => {
      try {
        const { data: resData } = await serviceApi.post('/api/user/login', data, {
          headers: options?.headers,
        });
        if (resData?.user) {
          fixUserAvatar(resData.user);
        }
        return resData;
      } catch (err: any) {
        console.error(err.response ? err.response.data : err);
        throw new Error(formatError(err));
      }
    };

    this.refreshSession = async (data) => {
      try {
        const headers = {
          Authorization: `Bearer ${data.refreshToken}`,
        };
        if (data.visitorId) {
          headers['x-blocklet-visitor-id'] = data.visitorId;
        }
        const { data: resData } = await serviceApi.post('/api/did/refreshSession', {}, { headers });
        if (resData?.user) {
          fixUserAvatar(resData.user);
        }
        return {
          user: resData.user,
          token: resData.nextToken,
          refreshToken: resData?.nextRefreshToken,
          provider: resData?.provider || LOGIN_PROVIDER.WALLET,
        };
      } catch (err: any) {
        console.error(err.response ? err.response.data : err);
        throw new Error(formatError(err));
      }
    };

    this.getTrustedDomains = async () => {
      try {
        const { data } = await serviceApi.get('/api/federated/getTrustedDomains');
        return data;
      } catch (err: any) {
        console.error(err.response ? err.response.data : err);
        throw new Error(formatError(err));
      }
    };

    this.updatePreferences = async (preferences: any) => {
      try {
        const headers = await client._getAuthHeaders();
        const id = `${process.env.BLOCKLET_APP_PID}/${process.env.BLOCKLET_COMPONENT_DID}`;
        const { data } = await axios.post(
          `http://${getServerHost()}:${process.env.ABT_NODE_PORT}/api/preferences?id=${encodeURIComponent(id)}`,
          preferences,
          {
            headers,
          }
        );
        return data;
      } catch (err: any) {
        console.error(err.response ? err.response.data : err);
        throw new Error(formatError(err));
      }
    };

    this.getComponent = async (did: string) => {
      const { blocklet } = await this.getBlocklet();
      return findComponentByIdV2(blocklet, did);
    };

    this.getVault = async () => {
      const wallet = getWallet.getPermanentWallet();
      const { blocklet } = await this.getBlocklet();
      return verifyVault(blocklet.vaults, wallet.address);
    };

    this.updateUserInfo = async (userInfo: ABTNodeClient.UserInfoInput, options: RequestHeaders) => {
      const fn = client.updateUserInfo;
      if (!options?.headers?.cookie) {
        throw new Error('Missing required authentication cookie in request headers');
      }

      if (!userInfo?.did) {
        throw new Error('Missing required user DID in address update args');
      }
      try {
        // @ts-ignore
        const res = await fn({ input: { user: userInfo, teamDid } }, options);
        return res;
      } catch (err: any) {
        throw new Error(formatError(err));
      }
    };

    this.updateUserAddress = async (args: ABTNodeClient.RequestUpdateUserAddressInput, options: RequestHeaders) => {
      const fn = client.updateUserInfo;
      if (!options?.headers?.cookie) {
        throw new Error('Missing required authentication cookie in request headers');
      }
      if (!args?.did) {
        throw new Error('Missing required user DID in address update args');
      }

      try {
        // @ts-ignore
        const res = await fn({ input: { user: { ...args }, teamDid } }, options);
        return res;
      } catch (err: any) {
        throw new Error(formatError(err));
      }
    };

    const callClientMethod = async <T>(
      methodName: keyof typeof client,
      args: any,
      options?: RequestHeaders
    ): Promise<T> => {
      try {
        // Check if this method requires authentication
        if (AUTH_REQUIRED_METHODS.includes(methodName as string)) {
          if (!options?.headers?.cookie) {
            throw new Error('Missing required authentication cookie in request headers');
          }
        }

        const clientMethod = client[methodName] as Function;
        const res = await clientMethod({ input: { teamDid, ...args } }, options);
        return res;
      } catch (err: any) {
        throw new Error(formatError(err)); // Error messages from this client require formatting
      }
    };

    this.getUserFollowers = (args: OmitTeamDid<Client.RequestUserRelationQueryInput>, options: RequestHeaders) =>
      callClientMethod('getUserFollowers', args, options);

    this.getUserFollowing = (args: OmitTeamDid<Client.RequestUserRelationQueryInput>, options: RequestHeaders) =>
      callClientMethod('getUserFollowing', args, options);

    this.getUserFollowStats = (args: OmitTeamDid<Client.RequestUserRelationCountInput>, options: RequestHeaders) =>
      callClientMethod('getUserFollowStats', args, options);

    this.getUserInvites = (args: OmitTeamDid<Client.RequestUserRelationQueryInput>, options: RequestHeaders) =>
      callClientMethod('getUserInvites', args, options);

    this.checkFollowing = (args: OmitTeamDid<Client.RequestCheckFollowingInput>) =>
      callClientMethod('checkFollowing', args);

    this.followUser = (args: OmitTeamDid<Client.RequestFollowUserActionInput>) => callClientMethod('followUser', args);

    this.unfollowUser = (args: OmitTeamDid<Client.RequestFollowUserActionInput>) =>
      callClientMethod('unfollowUser', args);

    // eslint-disable-next-line no-constructor-return
    return new Proxy(this, {
      get(target, propKey) {
        if (!apiList.includes(propKey as string)) {
          return undefined;
        }
        return target[propKey];
      },
    });
  }
}

// This mixin is used to provide type hints for dynamically generated methods
interface BlockletService {
  login: (
    params: object,
    options?: { headers: AxiosHeaders }
  ) => Promise<{
    user: Object;
    token: string;
    refreshToken: string;
    visitorId?: string;
  }>;
  refreshSession: (params: { refreshToken: string; visitorId?: string }) => Promise<{
    user: Object;
    token: string;
    refreshToken: string;
    provider: keyof typeof LOGIN_PROVIDER;
  }>;
  getUser(
    did: string,
    options?: {
      name?: string;
      enableConnectedAccount?: boolean;
      includeTags?: boolean;
    }
  ): Promise<Client.ResponseUser>;
  getUsers(args?: OmitTeamDid<Client.RequestUsersInput>): Promise<Client.ResponseUsers>;
  getUsersCount(args?: OmitTeamDid<Client.TeamInput>): Promise<Client.ResponseGetUsersCount>;
  getUsersCountPerRole(args?: OmitTeamDid<Client.TeamInput>): Promise<Client.ResponseGetUsersCountPerRole>;
  getOwner(): Promise<Client.ResponseUser>;
  switchProfile(
    did: string,
    profile: { avatar?: string; email?: string; fullName?: string }
  ): Promise<Client.ResponseUser>;

  updateUserApproval(did: string, approved: boolean): Promise<Client.ResponseUser>;
  updateUserTags(args: OmitTeamDid<Client.RequestUpdateUserTagsInput>): Promise<Client.ResponseUser>;
  updateUserExtra(args: OmitTeamDid<Client.RequestUpdateUserExtraInput>): Promise<Client.ResponseUser>;

  getTags(args: OmitTeamDid<Client.RequestTagsInput>): Promise<Client.ResponseTags>;
  createTag(args: OmitTeamDid<Client.RequestTagInput>): Promise<Client.ResponseTag>;
  updateTag(args: OmitTeamDid<Client.RequestTagInput>): Promise<Client.ResponseTag>;
  deleteTag(args: OmitTeamDid<Client.RequestTagInput>): Promise<Client.ResponseTag>;

  issuePassportToUser(args: OmitTeamDid<Client.RequestIssuePassportToUserInput>): Promise<Client.ResponseUser>;
  enableUserPassport(args: OmitTeamDid<Client.RequestRevokeUserPassportInput>): Promise<Client.ResponseUser>;
  revokeUserPassport(args: OmitTeamDid<Client.RequestRevokeUserPassportInput>): Promise<Client.ResponseUser>;
  removeUserPassport(args: OmitTeamDid<Client.RequestRevokeUserPassportInput>): Promise<Client.GeneralResponse>;

  getPermissionsByRole(role: string): Promise<Client.ResponsePermissions>;
  getRoles(): Promise<Client.ResponseRoles>;
  getRole(name: string): Promise<Client.ResponseRole>;
  createRole(args: OmitTeamDid<Client.RequestCreateRoleInput>): Promise<Client.ResponseRole>;
  updateRole(
    name: string,
    updates: Partial<Pick<Client.RequestCreateRoleInput, 'title' | 'description' | 'extra'>>
  ): Promise<Client.ResponseRole>;
  deleteRole(name: string): Promise<Client.GeneralResponse>;

  grantPermissionForRole(role: string, permission: string): Promise<Client.GeneralResponse>;
  revokePermissionFromRole(role: string, permission: string): Promise<Client.GeneralResponse>;
  updatePermissionsForRole(role: string, permissions: string): Promise<Client.ResponseRole>;

  hasPermission(role: string, permission: string): Promise<Client.BooleanResponse>;
  getPermissions(): Promise<Client.ResponsePermissions>;
  createPermission(args: OmitTeamDid<Client.RequestCreatePermissionInput>): Promise<Client.ResponsePermission>;
  updatePermission(args: OmitTeamDid<Client.PermissionInput>): Promise<Client.ResponsePermission>;
  deletePermission(name: string): Promise<Client.GeneralResponse>;
  getBlocklet(attachRuntimeInfo?: boolean): Promise<Client.ResponseBlocklet>;
  clearCache(args?: OmitTeamDid<Client.RequestClearCacheInput>): Promise<Client.ResponseClearCache>;

  getComponent(did: string): Promise<Client.ComponentState>;
  getTrustedDomains(): Promise<string[]>;
  updatePreferences(preferences: any): Promise<any>;

  getVault(): Promise<string>;

  updateUserAddress(
    args: OmitTeamDid<Client.RequestUpdateUserAddressInput>,
    options: RequestHeaders
  ): Promise<Client.ResponseUser>;
  updateUserInfo(userInfo: ABTNodeClient.UserInfoInput, options: RequestHeaders): Promise<Client.ResponseUser>;

  createAccessKey(params: OmitTeamDid<Client.RequestCreateAccessKeyInput>): Promise<Client.ResponseCreateAccessKey>;
  verifyAccessKey(params: OmitTeamDid<Client.RequestVerifyAccessKeyInput>): Promise<Client.ResponseAccessKey>;
  getAccessKeys(params: OmitTeamDid<Client.RequestAccessKeysInput>): Promise<Client.ResponseAccessKeys>;
  getAccessKey(params: OmitTeamDid<Client.RequestAccessKeyInput>): Promise<Client.ResponseAccessKey>;
  getUserFollowers(
    args: OmitTeamDid<Client.RequestUserRelationQueryInput>,
    options: RequestHeaders
  ): Promise<Client.ResponseUserFollows>;
  getUserFollowing(
    args: OmitTeamDid<Client.RequestUserRelationQueryInput>,
    options: RequestHeaders
  ): Promise<Client.ResponseUserFollows>;
  getUserFollowStats(
    args: OmitTeamDid<Client.RequestUserRelationCountInput>,
    options: RequestHeaders
  ): Promise<Client.ResponseUserRelationCount>;
  checkFollowing(args: OmitTeamDid<Client.RequestCheckFollowingInput>): Promise<Client.ResponseCheckFollowing>;
  followUser(args: OmitTeamDid<Client.RequestFollowUserActionInput>): Promise<Client.GeneralResponse>;
  unfollowUser(args: OmitTeamDid<Client.RequestFollowUserActionInput>): Promise<Client.GeneralResponse>;
  getUserInvites(
    args: OmitTeamDid<Client.RequestUserRelationQueryInput>,
    options: RequestHeaders
  ): Promise<Client.ResponseUsers>;
  getOrg(params: OmitTeamDid<Client.RequestGetOrgInput>): Promise<Client.ResponseGetOrg>;
  getOrgs(params: OmitTeamDid<Client.RequestGetOrgsInput>): Promise<Client.ResponseGetOrgs>;
  createOrg(params: OmitTeamDid<Client.RequestCreateOrgInput>): Promise<Client.ResponseGetOrg>;
  getOrgResource(params: OmitTeamDid<Client.RequestGetOrgResourceInput>): Promise<Client.ResponseGetOrgResource>;
  addOrgResource(params: OmitTeamDid<Client.RequestAddOrgResourceInput>): Promise<Client.ResponseOrgResourceOperation>;
  migrateOrgResource(
    params: OmitTeamDid<Client.RequestMigrateOrgResourceInput>
  ): Promise<Client.ResponseOrgResourceOperation>;

  configBlocklet(params: OmitDid<Client.RequestConfigBlockletInput>): Promise<Client.ResponseBlocklet>;
  configNavigations(params: OmitDid<Client.RequestConfigNavigationsInput>): Promise<Client.ResponseBlocklet>;

  addRoutingRule(params: OmitTeamDid<Client.RequestAddRoutingRuleInput>): Promise<Client.ResponseRoutingSite>;
  updateRoutingRule(params: OmitTeamDid<Client.RequestUpdateRoutingRuleInput>): Promise<Client.ResponseRoutingSite>;
  deleteRoutingRule(params: OmitTeamDid<Client.RequestDeleteRoutingRuleInput>): Promise<Client.ResponseRoutingSite>;

  // Domain and Certificate APIs
  addDomainAlias(params: OmitTeamDid<Client.RequestAddDomainAliasInput>): Promise<Client.ResponseRoutingSite>;
  deleteDomainAlias(params: OmitTeamDid<Client.RequestDeleteDomainAliasInput>): Promise<Client.ResponseRoutingSite>;
  findCertificateByDomain(
    params: OmitTeamDid<Client.RequestFindCertificateByDomainInput>
  ): Promise<Client.ResponseFindCertificateByDomain>;
}

export { BlockletService };
