import { DID_SPACES } from '@blocklet/constant';
import { getAppDescription, getAppName } from '@blocklet/meta/lib/util';
import isEmpty from 'lodash/isEmpty';

/**
 *
 *
 * @param {import('@blocklet/server-js').BlockletState} blocklet
 * @return {{
 *  appDid: string,
 *  appName: string,
 *  appDescription: string,
 *  appUrl: string,
 *  scopes: string,
 *  referrer: string,
 *  isReady: string,
 * }}
 */
function useBlockletInfoForConnectDIDSpaces({ blocklet }) {
  if (isEmpty(blocklet)) {
    return {};
  }

  const { appDid } = blocklet;
  const appName = getAppName(blocklet);
  const appDescription = getAppDescription(blocklet);

  const appUrls = blocklet?.site?.domainAliases
    ?.sort((a, b) => {
      if (a.accessibility.accessible && b.accessibility.accessible) {
        return +a.isProtected - +b.isProtected;
      }
      return +b.accessibility.accessible - +a.accessibility.accessible;
    })
    ?.map((domainAlias) => {
      const protocol = domainAlias?.domainStatus?.isHttps ? 'https://' : 'http://';
      const value = domainAlias?.value;

      return `${protocol}${value}`;
    })
    .filter(Boolean);
  const appUrl = appUrls?.[0];

  const scopes = DID_SPACES.AUTHORIZE.DEFAULT_SCOPE;
  const referrer = window.location.href;

  // 授权的时候提供 appUrl, 因为 appUrl 可能很久都拿不到值，所以加一个 isReady 来表示就绪状态
  return { appDid, appName, appDescription, appUrl, scopes, referrer, isReady: Boolean(appUrl) };
}

export default useBlockletInfoForConnectDIDSpaces;
