import { joinURL } from 'ufo';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import createPassportSvgOrig from '@abtnode/auth/lib/util/create-passport-svg';
import stringWidth from 'string-width';

export * from '@abtnode/ux/lib/util';

export function getSessionToken() {
  return window.localStorage.getItem('__sst');
}

export function setSessionToken(token) {
  return window.localStorage.setItem('__sst', token);
}

export function getRefreshToken() {
  return window.localStorage.getItem('__srt');
}

export function setRefreshToken(token) {
  return window.localStorage.setItem('__srt', token);
}

export function createPassportSvg(props, info) {
  return createPassportSvgOrig({
    ...props,
    issuerAvatarUrl: joinURL(
      window.location.origin,
      process.env.NODE_ENV === 'development' ? '' : info.routing.adminPath,
      '/images/node.png'
    ),
  });
}

export const createAppPassportSvg = (props, appUrl) =>
  createPassportSvgOrig({
    ...props,
    issuerAvatarUrl: joinURL(appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, '/blocklet/logo'),
  });

/**
 * @description
 * @export
 * @param {string} str
 * @param {number} maxLength
 * @return {string}
 */
export function truncateString(str, maxLength) {
  if (!str || !maxLength) {
    return str;
  }

  let width = 0;
  let truncated = '';

  for (let i = 0; i < str.length; i++) {
    const charWidth = stringWidth(str.charAt(i));
    if (width + charWidth > maxLength) {
      break;
    }
    truncated += str.charAt(i);
    width += charWidth;
  }

  if (truncated === str) {
    return truncated;
  }

  return `${truncated}...`;
}

export function getCommonHtmlTitle(title = '', groupTitle = '', nodeInfo = {}) {
  const htmlTitle = [title, groupTitle].filter(Boolean).join(' - ');
  const infoName = nodeInfo.name || '';
  if (infoName) {
    return htmlTitle ? `${htmlTitle} | ${infoName}` : infoName;
  }
  return htmlTitle;
}
