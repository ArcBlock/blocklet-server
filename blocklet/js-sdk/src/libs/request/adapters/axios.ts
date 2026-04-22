/* eslint-disable @typescript-eslint/return-await */
import axios from 'axios';
import Cookies from 'js-cookie';
import { SESSION_TOKEN_STORAGE_KEY, WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import type { InternalAxiosRequestConfig, AxiosRequestHeaders, AxiosRequestConfig } from 'axios';

import Keyv from 'keyv';
import { KeyvLocalStorage } from 'keyv-browser';
import isNumber from 'lodash/isNumber';
import { version } from '../../../../package.json';
import { getBearerToken, getVisitorId, sleep, verifyResponse } from '../../utils';
import { RequestParams, TokenResult } from '../../../types';
import { getCSRFToken, getCSRFTokenByLoginToken, getLoginToken } from '../../csrf';
import { ComponentService } from '../../../services';

let csrfTokenCache: Keyv | undefined;

function getCsrfTokenCache(): Keyv {
  if (!csrfTokenCache) {
    const cacheTtl = window?.blocklet?.settings?.session?.cacheTtl;
    csrfTokenCache = new Keyv({
      store: new KeyvLocalStorage(),
      ttl: isNumber(cacheTtl) ? cacheTtl * 1000 : 1000 * 60 * 60,
    });
  }
  return csrfTokenCache;
}

type AxiosConfig = InternalAxiosRequestConfig & {
  metaData?: {
    startTime?: number;
    endTime?: number;
  };
};

async function sleepForLoading(config: AxiosConfig, lazyTime: number = 300) {
  config.metaData.endTime = +new Date();
  const { startTime, endTime } = config.metaData;
  const timeDiff = endTime - startTime;
  if (timeDiff < lazyTime) await sleep(lazyTime - timeDiff);
  delete config.metaData;
}

export const createAxios = (options?: AxiosRequestConfig & { secure?: boolean }, requestParams?: RequestParams) => {
  const headers = {
    ...options?.headers,
    'x-blocklet-js-sdk-version': version,
  } as unknown as AxiosRequestHeaders;
  // FIXME: blocklet instance should be passed in from outside
  const componentService = new ComponentService();

  const instance = axios.create({
    ...options,
    headers,
  });

  if (requestParams?.lazy) {
    instance.interceptors.request.use(
      (config: AxiosConfig) => {
        config.metaData = { startTime: +new Date() };
        return config;
      },
      (err) => Promise.reject(err)
    );

    instance.interceptors.response.use(
      async (res) => {
        if (res.config) {
          await sleepForLoading(res.config, requestParams?.lazyTime);
        }
        return res;
      },
      async (err) => {
        if (err.response) {
          await sleepForLoading(err.response.config, requestParams?.lazyTime);
        }
        return Promise.reject(err);
      }
    );
  }

  instance.interceptors.request.use(
    async (config: AxiosConfig) => {
      const componentDid = requestParams?.componentDid ?? window.blocklet?.componentId?.split('/').pop();
      config.baseURL = config.baseURL || componentService.getComponentMountPoint(componentDid);
      config.timeout = config.timeout || 20 * 1000;

      const loginToken = getLoginToken();
      const csrfToken = getCSRFToken();
      if (loginToken && csrfToken) {
        const loginTokenKey = loginToken.slice(-32);
        const cache = getCsrfTokenCache();
        const csrfTokenFromCache = await cache.get(loginTokenKey);
        if (csrfTokenFromCache) {
          config.headers['x-csrf-token'] = csrfTokenFromCache;
        } else {
          const { loginToken: newLoginToken, csrfToken: newCsrfToken } = await getCSRFTokenByLoginToken();
          if (newCsrfToken) {
            await cache.set(newLoginToken.slice(-32), newCsrfToken);
            config.headers['x-csrf-token'] = newCsrfToken;
          } else {
            config.headers['x-csrf-token'] = csrfToken;
          }
        }

        // If the x-csrf-token header doesn't match the cookie value, update the cookie to stay in sync
        if (config.headers['x-csrf-token'] && config.headers['x-csrf-token'] !== getCSRFToken()) {
          Cookies.set('x-csrf-token', config.headers['x-csrf-token'], {
            sameSite: 'strict',
            secure: true,
          });
        }
      }

      // NOTICE: visitorId must be fetched here because it is generated dynamically after login; all subsequent requests must carry the correct visitorId
      const visitorId = getVisitorId();
      if (![undefined, null].includes(visitorId)) {
        config.headers['x-blocklet-visitor-id'] = visitorId;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  return instance;
};

async function renewRefreshToken(refreshToken: string) {
  if (!refreshToken) {
    throw new Error('Refresh token not found');
  }
  const refreshApi = createAxios({
    baseURL: WELLKNOWN_SERVICE_PATH_PREFIX,
    timeout: 10 * 1000,
    secure: true,
    headers: {
      authorization: getBearerToken(refreshToken),
    },
  });
  const { data } = await refreshApi.post('/api/did/refreshSession');
  return data;
}

export function createRequest(
  {
    getSessionToken,
    setSessionToken,
    removeSessionToken,
    getRefreshToken,
    setRefreshToken,
    removeRefreshToken,
    onRefreshTokenError,
    onRefreshTokenSuccess,
  }: {
    getSessionToken: (config?: any) => string;
    setSessionToken: (value: string) => void;
    removeSessionToken: () => void;
    getRefreshToken: () => string;
    setRefreshToken: (value: string) => void;
    removeRefreshToken: () => void;
    onRefreshTokenError: (error: any) => void;
    onRefreshTokenSuccess: (result: TokenResult) => void;
  },
  requestOptions?: AxiosRequestConfig,
  requestParams?: RequestParams
) {
  let refreshingTokenRequest: Promise<TokenResult> = null;
  const service = createAxios(
    {
      timeout: 30 * 1000,
      ...requestOptions,
    },
    requestParams
  );

  service.interceptors.request.use(
    async (config) => {
      if (!Cookies.get(SESSION_TOKEN_STORAGE_KEY)) {
        const token = getSessionToken(config);
        if (token) {
          config.headers.authorization = getBearerToken(token);
        }
      }
      if (refreshingTokenRequest) {
        await refreshingTokenRequest;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  service.interceptors.response.use(
    async (response: any) => {
      if (response.config?.secure) {
        const data = await verifyResponse(
          response,
          () => {
            removeSessionToken();
            removeRefreshToken();
          },
          requestParams?.verifyFn
        );
        return data;
      }
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      if (originalRequest) {
        originalRequest.headers = originalRequest?.headers ? { ...originalRequest.headers } : {};
        if (error?.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            if (!refreshingTokenRequest) {
              refreshingTokenRequest = renewRefreshToken(getRefreshToken());
            }
            const tokenData = await refreshingTokenRequest;
            setSessionToken(tokenData.nextToken);
            setRefreshToken(tokenData.nextRefreshToken);
            if (typeof onRefreshTokenSuccess === 'function') {
              onRefreshTokenSuccess(tokenData);
            }
            return service(originalRequest);
          } catch (refreshTokenError) {
            removeSessionToken();
            removeRefreshToken();
            if (typeof onRefreshTokenError === 'function') {
              onRefreshTokenError(refreshTokenError);
            }
            // NOTICE: If an error occurs while refreshing the token, reject with the original error
            return Promise.reject(error);
          } finally {
            refreshingTokenRequest = null;
          }
        }
      }
      return Promise.reject(error);
    }
  );
  return service;
}
