import type { Axios, AxiosRequestConfig } from 'axios';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

import { AuthService, BlockletService, TokenService, UserSessionService, FederatedService } from './services';
import { createAxiosRequest, createFetchRequest } from './libs/request';
import type { RequestParams, VerifyFn } from './types';

export type * from './services';
export type { VerifyFn } from './types';

export * from './libs/csrf';

export interface BlockletSDKOptions {
  verifyFn?: VerifyFn;
}

export class BlockletSDK {
  public api: Axios;

  public user: AuthService;

  public userSession: UserSessionService;

  public token: TokenService;

  public blocklet: BlockletService;

  public federated: FederatedService;

  constructor(options?: BlockletSDKOptions) {
    const tokenService = new TokenService();
    const internalApi = createAxiosRequest(
      {
        getSessionToken: tokenService.getSessionToken,
        setSessionToken: tokenService.setSessionToken,
        removeSessionToken: tokenService.removeSessionToken,
        getRefreshToken: tokenService.getRefreshToken,
        setRefreshToken: tokenService.setRefreshToken,
        removeRefreshToken: tokenService.removeRefreshToken,
        onRefreshTokenError: () => {
          console.error('Failed to refresh token');
        },
        onRefreshTokenSuccess: () => {},
      },
      {
        baseURL: WELLKNOWN_SERVICE_PATH_PREFIX,
      },
      {
        verifyFn: options?.verifyFn,
      }
    );
    const blocklet = new BlockletService();
    this.user = new AuthService({ api: internalApi, token: tokenService });
    this.federated = new FederatedService({ api: internalApi, blocklet });
    this.userSession = new UserSessionService({ api: internalApi, blocklet });
    this.token = tokenService;
    this.blocklet = blocklet;

    /**
     * @deprecated this is deprecated, please use createAxios replace this
     */
    this.api = internalApi;
  }
}

export function createAxios(config: AxiosRequestConfig = {}, requestParams: RequestParams = {}) {
  const tokenService = new TokenService();

  return createAxiosRequest(
    {
      getSessionToken: tokenService.getSessionToken,
      setSessionToken: tokenService.setSessionToken,
      removeSessionToken: tokenService.removeSessionToken,
      getRefreshToken: tokenService.getRefreshToken,
      setRefreshToken: tokenService.setRefreshToken,
      removeRefreshToken: tokenService.removeRefreshToken,
      onRefreshTokenError: () => {
        console.error('Failed to refresh token');
      },
      onRefreshTokenSuccess: () => {},
    },
    config,
    requestParams
  );
}

export function createFetch(options?: RequestInit, requestParams?: RequestParams) {
  const tokenService = new TokenService();
  return createFetchRequest(
    {
      getSessionToken: tokenService.getSessionToken,
      setSessionToken: tokenService.setSessionToken,
      removeSessionToken: tokenService.removeSessionToken,
      getRefreshToken: tokenService.getRefreshToken,
      setRefreshToken: tokenService.setRefreshToken,
      removeRefreshToken: tokenService.removeRefreshToken,
      onRefreshTokenError: () => {
        console.error('Failed to refresh token');
      },
      onRefreshTokenSuccess: () => {},
    },
    options,
    requestParams
  );
}

// NOTICE: Use a closure to avoid polluting the global scope
export const getBlockletSDK = (() => {
  let instance: BlockletSDK;

  return (options?: BlockletSDKOptions) => {
    if (!instance) {
      instance = new BlockletSDK(options);
    }

    return instance;
  };
})();
