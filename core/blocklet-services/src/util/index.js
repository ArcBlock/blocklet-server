import { LAUNCH_SESSION_STATUS, SERVERLESS_BLOCKLET_DATA_RETENTION_DAYS, SESSION_CACHE_TTL } from '@abtnode/constant';
import dayjs from '@abtnode/util/lib/dayjs';
import { formatToDatetime } from '@abtnode/ux/lib/util';
import { formatCacheTtl } from '@arcblock/did-connect-react/lib/utils';
import { getCookieOptions } from '@arcblock/ux/lib/Util';
import { BLOCKLET_CONTROLLER_STATUS } from '@blocklet/constant';
import Cookie from 'js-cookie';
import isUrl from 'is-url';
import { getBlockletSDK } from '../libs/blocklet-sdk';

export const getSessionToken = () => {
  return Cookie.get('login_token');
};

const setSessionToken = (sessionToken) => {
  let path = '/';
  if (window.env) {
    path = window.env.groupPathPrefix || window.env.pathPrefix || '/';
  }

  const params = new URLSearchParams(window.location.search);
  const embed = params.get('embed') || window.sessionStorage?.getItem('embed');

  Cookie.set(
    'login_token',
    sessionToken,
    getCookieOptions({
      expireInDays: formatCacheTtl(window.blocklet?.settings.cacheTtl, SESSION_CACHE_TTL / 86400), // 1h
      path,
      returnDomain: false,
      // Use None for embed mode because we have CSP.frame-ancestors protection
      sameSite: embed === '1' ? 'None' : 'Lax',
    })
  );
};

const setRefreshToken = (token) => {
  localStorage.setItem('refresh_token', token);
};

/**
 *
 *
 * @param {string} csrfToken
 */
const setCsrfToken = (csrfToken) => {
  Cookie.set(
    'x-csrf-token',
    csrfToken,
    getCookieOptions({
      expireInDays: formatCacheTtl(window.blocklet?.settings.cacheTtl, SESSION_CACHE_TTL / 86400), // 1h
      sameSite: 'strict',
      secure: true,
    })
  );
};

const hasRequiredEnvironments = (meta) => (meta.environments || []).some((x) => x.required);
const hasRequiredSteps = (meta) => {
  return !!meta.requirements?.fuels?.length || hasRequiredEnvironments(meta);
};

export { getWebWalletUrl } from '@arcblock/did-connect-react/lib/utils';
export { hasRequiredEnvironments, hasRequiredSteps, setRefreshToken, setSessionToken, setCsrfToken };

/**
 * 检查当前 url searchParams 的 serverUrl 查询参数, 如果存在则保存到 localStorage, 方便在 setup 流程结束后返回到 server
 */
export const saveServerUrl = () => {
  // 当从server3000切换到abt节点，会导致相同应用访问旧的节点地址，所以要实时修正节点
  const { searchParams } = new URL(window.location.href);
  const serverUrl = searchParams.get('serverUrl');
  if (serverUrl) {
    localStorage.setItem('blocklet-server-url', serverUrl);
  }
};

export const PREFIX = window.env?.groupPathPrefix || '/';

export const getFromQuery = (key) => new URL(window.location.href).searchParams.get(key) || '';

export const isSuspended = (blocklet) => blocklet?.controller?.status?.value === BLOCKLET_CONTROLLER_STATUS.suspended;

export const isCanceled = (launcherSession) =>
  !!launcherSession?.subscription?.canceled_at && launcherSession?.subscription?.status === 'canceled';

export const isPastDue = (launcherSession) =>
  !launcherSession?.subscription?.canceled_at &&
  !!launcherSession?.subscription?.cancel_at &&
  !!launcherSession?.subscription?.pastDue?.status;

export const isWillBeSuspendedSoon = (launcherSession) =>
  ['active', 'trailing'].includes(launcherSession?.subscription?.status) &&
  launcherSession?.subscription?.cancel_at &&
  launcherSession?.subscription?.cancel_at > Date.now() / 1000;

export const isSuspendedByExpired = (blocklet, launcherSession) =>
  isSuspended(blocklet) &&
  launcherSession?.status >= LAUNCH_SESSION_STATUS.overdue &&
  launcherSession.status <= LAUNCH_SESSION_STATUS.canceled;

export const isSuspendedByTerminated = (blocklet, launcherSession) =>
  isSuspended(blocklet) && launcherSession?.status === LAUNCH_SESSION_STATUS.terminated;

export const calculateRetentionDate = (terminatedAt, locale) => {
  const r = dayjs(terminatedAt).add(SERVERLESS_BLOCKLET_DATA_RETENTION_DAYS, 'days');
  return formatToDatetime(r, locale);
};

// 解析 redirect url
export function parseRedirectUrl(url) {
  const urlInstance = isUrl(url) ? new URL(url) : new URL(url, window.location.origin);

  // 将 redirect 参数作为整体处理，比如
  // https//domain.abtnet.io/some/path?redirect=/a?local=en&embed=1
  // >>
  // https//domain.abtnet.io/some/path?redirect=%2Fa%3Flocal%3Den%26embed%3D1
  if (isUrl(url)) {
    const redirectParam = urlInstance.searchParams.get('redirect');
    if (redirectParam) {
      const params = Array.from(urlInstance.searchParams.entries())
        .filter(([key]) => key !== 'redirect')
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

      urlInstance.search = '';
      urlInstance.searchParams.set(
        'redirect',
        params ? `${redirectParam}${redirectParam.includes('?') ? '&' : '?'}${params}` : redirectParam
      );
    }
  }

  return urlInstance;
}

export const sdkClient = getBlockletSDK();
