/* eslint-disable @typescript-eslint/return-await */
import { WELLKNOWN_SERVICE_PATH_PREFIX, SESSION_TOKEN_STORAGE_KEY } from '@abtnode/constant';
import { joinURL } from 'ufo';
import Cookies from 'js-cookie';
import isUrl from 'is-url';

import { version } from '../../../../package.json';
import { getBearerToken, getVisitorId, sleep, verifyResponse } from '../../utils';
import { RequestParams, TokenResult } from '../../../types';
import { getCSRFToken } from '../../csrf';
import { ComponentService } from '../../../services';

export function createFetch(globalOptions: RequestInit = {}, requestParams?: RequestParams) {
  return async (input: string | Request | URL, options?: RequestInit) => {
    const startAt = Date.now();
    const headers: HeadersInit = {
      ...globalOptions?.headers,
      ...options?.headers,
      'x-csrf-token': getCSRFToken(),
      'x-blocklet-js-sdk-version': version,
    };
    // FIXME: How to replicate axios interceptor behavior so visitorId injection happens per-request
    const visitorId = getVisitorId();
    if (![undefined, null].includes(visitorId)) {
      headers['x-blocklet-visitor-id'] = visitorId;
    }

    const request = fetch(input, {
      ...globalOptions,
      ...options,
      headers,
    });
    try {
      return request;
      // eslint-disable-next-line no-useless-catch
    } catch (error) {
      throw error;
    } finally {
      const endAt = Date.now();
      if (requestParams?.lazy) {
        const lazyTime = requestParams?.lazyTime ?? 300;
        const timeDiff = endAt - startAt;
        if (timeDiff < lazyTime) await sleep(lazyTime - timeDiff);
      }
    }
  };
}

async function renewRefreshToken(refreshToken: string) {
  if (!refreshToken) {
    throw new Error('Refresh token not found');
  }
  const refreshApi = createFetch();
  const res = await refreshApi(joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/api/did/refreshSession'), {
    method: 'POST',
    headers: {
      authorization: getBearerToken(refreshToken),
    },
  });
  const data = await res.json();
  return data;
}

export function createRequest(
  {
    baseURL,
    getSessionToken,
    setSessionToken,
    removeSessionToken,
    getRefreshToken,
    setRefreshToken,
    removeRefreshToken,
    onRefreshTokenError,
    onRefreshTokenSuccess,
  }: {
    baseURL?: string;
    getSessionToken: (config?: any) => string;
    setSessionToken: (value: string) => void;
    removeSessionToken: () => void;
    getRefreshToken: () => string;
    setRefreshToken: (value: string) => void;
    removeRefreshToken: () => void;
    onRefreshTokenError: (error: any) => void;
    onRefreshTokenSuccess: (result: TokenResult) => void;
  },
  requestOptions?: RequestInit & { secure?: boolean },
  requestParams?: RequestParams
) {
  let refreshingTokenRequest: Promise<TokenResult> = null;
  const service = createFetch(requestOptions, requestParams);
  // FIXME: blocklet instance should be passed in from outside
  const componentService = new ComponentService();

  return async (input: string | Request | URL, options?: RequestInit & { secure?: boolean }) => {
    let authorization;

    let finalUrl = input;
    if (typeof input === 'string') {
      if (!isUrl(input)) {
        if (baseURL) {
          finalUrl = joinURL(baseURL, input);
        } else {
          const componentDid = requestParams?.componentDid ?? window.blocklet?.componentId?.split('/').pop();
          const mountPoint: string = componentService.getComponentMountPoint(componentDid);

          finalUrl = joinURL(mountPoint, input);
        }
      }
    }

    if (!Cookies.get(SESSION_TOKEN_STORAGE_KEY)) {
      const token = getSessionToken(requestOptions);
      if (token) {
        authorization = getBearerToken(token);
      }
    }
    if (refreshingTokenRequest) {
      await refreshingTokenRequest;
    }
    const res = await service(finalUrl, {
      ...options,
      headers: {
        ...options?.headers,
        authorization,
      },
    });
    if (!res.ok && res.status === 401) {
      refreshingTokenRequest = renewRefreshToken(getRefreshToken());
      try {
        const tokenData = await refreshingTokenRequest;
        setSessionToken(tokenData.nextToken);
        setRefreshToken(tokenData.nextRefreshToken);
        if (typeof onRefreshTokenSuccess === 'function') {
          onRefreshTokenSuccess(tokenData);
        }
        return service(finalUrl, {
          ...options,
          headers: {
            ...options?.headers,
            authorization,
          },
        });
      } catch (error) {
        removeSessionToken();
        removeRefreshToken();
        if (typeof onRefreshTokenError === 'function') {
          onRefreshTokenError(error);
        }
        // NOTICE: If an error occurs while refreshing the token, return the original request result
        return res;
      } finally {
        refreshingTokenRequest = null;
      }
    }

    // FIXME: How to inject verification logic during retry?
    if (res.ok && options?.secure) {
      await verifyResponse(
        { status: res.status, data: await res.json() },
        () => {
          removeSessionToken();
          removeRefreshToken();
        },
        requestParams?.verifyFn
      );
    }

    return res;
  };
}
