/* eslint-disable max-len */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable import/prefer-default-export */
import {
  BLOCKLET_STORE_API_PREFIX,
  DEFAULT_DID_DOMAIN,
  DEFAULT_IP_DOMAIN_SUFFIX,
  DEFAULT_SLP_DOMAIN,
  DOMAIN_FOR_DEFAULT_SITE,
  DOMAIN_FOR_INTERNAL_SITE,
  DOMAIN_FOR_IP_SITE,
  DOMAIN_FOR_IP_SITE_REGEXP,
  IP,
  ROLES,
  SLOT_FOR_IP_DNS_SITE,
  WEB_WALLET_URL,
  WELLKNOWN_PATH_PREFIX,
  WELLKNOWN_PING_PREFIX,
  WELLKNOWN_SERVICE_PATH_PREFIX,
} from '@abtnode/constant';

import { filesize as _filesize } from 'filesize';
import humanizeUrl from 'humanize-url';
import isUrl from 'is-url';
import get from 'lodash/get';
import trimEnd from 'lodash/trimEnd';
import qs from 'querystring';
import { joinURL, withHttps, withQuery } from 'ufo';

import axios from '@abtnode/util/lib/axios';
import dayjs from '@abtnode/util/lib/dayjs';
import tryWithTimeout from '@abtnode/util/lib/try-with-timeout';
import normalizePathPrefix from '@abtnode/util/lib/normalize-path-prefix';
import { evaluateURLs, isCustomDomain, isSlackWebhookUrl } from '@abtnode/util/lib/url-evaluation';
import checkAccessible from '@abtnode/util/lib/url-evaluation/check-accessible-browser';
import { BLOCKLET_MODES } from '@blocklet/constant';
import { formatError } from '@blocklet/error';
import { urlPathFriendly } from '@blocklet/meta/lib/url-path-friendly';
import { isBlockletRunning } from '@blocklet/meta/lib/util';

const STORE_LOGO_FILTER = 'imageFilter=convert&f=png&h=80';

export { formatError, isSlackWebhookUrl };

export function filesize(size, options = {}) {
  return _filesize(size, { base: 2, round: 2, ...options });
}

export function sleep(t) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, t));
}

export const validateDomain = (domain, locale = 'en') => {
  if (!domain) {
    return {
      en: 'Site domain cannot be empty',
      zh: '站点域名不能为空',
    }[locale];
  }

  if (domain.endsWith(DEFAULT_IP_DOMAIN_SUFFIX)) {
    return {
      en: `Site domain cannot include ${DEFAULT_IP_DOMAIN_SUFFIX}`,
      zh: `站点域名不能包含 ${DEFAULT_IP_DOMAIN_SUFFIX}`,
    }[locale];
  }

  return null;
};

/**
 * get access url
 * auto fix http/https, port, query
 * docker friendly
 */
export function getAccessUrl(hostname, path = '', params = undefined) {
  if (!hostname) {
    return '';
  }

  try {
    let port = '';
    const browserPort = Number(window.location.port);
    if (process.env.NODE_ENV !== 'development' && browserPort && ![80, 443].includes(browserPort)) {
      port = `:${browserPort}`;
    }

    const urlObj = new URL(`${window.location.protocol}//${hostname}${port}`);
    urlObj.pathname = path;
    const url = urlObj.href.replace(/\/$/, '');

    if (!params || !Object.keys(params)) {
      return url;
    }

    const searchParams = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      searchParams.append(key, params[key]);
    });
    return `${url}${urlObj.pathname === '/' ? '/' : ''}?${searchParams.toString()}`;
  } catch (err) {
    console.error(err);
    return '';
  }
}

export function getBlockletUrl({ blocklet, domain: inputDomain, mountPoint: inputMountPoint, params } = {}) {
  const { site } = blocklet;
  if (!site) {
    return null;
  }

  const domain = inputDomain || (site.domainAliases || [])[0];
  if (!domain) {
    return null;
  }

  let mountPoint = inputMountPoint;
  if (!mountPoint) {
    const rule = site.rules.filter((x) => !x.from.pathPrefix.startsWith(WELLKNOWN_PATH_PREFIX))[0];
    mountPoint = rule ? rule.from.pathPrefix : '/';
  }

  return getAccessUrl(domain.value, mountPoint, params);
}

export function getBlockletUrls({ blocklet, mountPoint: inputMountPoint, params } = {}) {
  const { site } = blocklet;

  if (!site) {
    return [];
  }

  const domains = site.domainAliases || [];

  if (!domains.length) {
    return [];
  }

  let mountPoint = inputMountPoint;
  if (!mountPoint) {
    const rules = site.rules.filter((x) => !x.from.pathPrefix.startsWith(WELLKNOWN_PATH_PREFIX));
    let rule = rules[0];
    if (rule?.from?.pathPrefix !== '/') {
      const rootRule = rules.find((x) => x.from?.pathPrefix === '/');
      if (rootRule) {
        rule = rootRule;
      }
    }

    mountPoint = normalizePathPrefix(rule?.from?.pathPrefix || '/');
  }

  return domains.map((domain) => getAccessUrl(domain.value, mountPoint, params));
}

export function getExplorerLink(chainHost, did, type) {
  if (!chainHost) return undefined;
  try {
    const chainUrl = new URL(chainHost);
    switch (type) {
      case 'asset':
        chainUrl.pathname = `/explorer/assets/${did}`;
        break;
      case 'account':
        chainUrl.pathname = `/explorer/accounts/${did}`;
        break;
      case 'tx':
        chainUrl.pathname = `/explorer/txs/${did}`;
        break;
      case 'token':
        chainUrl.pathname = `/explorer/tokens/${did}`;
        break;
      case 'factory':
        chainUrl.pathname = `/explorer/factories/${did}`;
        break;
      case 'bridge':
        chainUrl.pathname = `/explorer/bridges/${did}`;
        break;
      default:
        chainUrl.pathname = '/';
    }

    return chainUrl.href;
  } catch {
    return undefined;
  }
}

export function patchJsxToLocale(rawStr, replaceMap = {}) {
  return rawStr
    .split(/{{|}}/)
    .map((item) => {
      if (replaceMap[item]) {
        if (replaceMap[item] instanceof Function) {
          return replaceMap[item]();
        }
        return replaceMap[item];
      }
      return item;
    })
    .filter(Boolean);
}

export const formatLocale = (locale = 'en') => {
  if (locale === 'tw') {
    return 'zh';
  }

  return locale;
};

export function formatToDate(date, locale = 'en') {
  if (!date) {
    return '-';
  }

  return dayjs(date).locale(formatLocale(locale)).format('ll');
}

export function formatToDatetime(date, locale = 'en') {
  if (!date) {
    return '-';
  }

  return dayjs(date).locale(formatLocale(locale)).format('lll');
}

export function formatTime(date, format = 'lll', locale = 'en') {
  if (!date) {
    return '-';
  }

  return dayjs(date).locale(formatLocale(locale)).format(format);
}

export function formatDateTime(date, locale = 'en') {
  return dayjs(date).locale(formatLocale(locale)).format('YYYY-MM-DD HH:mm');
}

export const formatPrettyMsLocale = (locale) => (locale === 'zh' ? 'zh_CN' : 'en_US');

export const parseQuery = (str) =>
  str
    .replace(/^\?/, '')
    .split('&')
    .map((x) => x.split('='))
    .filter(([key]) => !!key)
    .reduce((memo, x) => {
      const key = x[0];
      const value = decodeURIComponent(x[1]) || true;
      memo[key] = value;
      return memo;
    }, {});

// Append any query string url to api requests
export const appendParams = (url, extraParams = {}) => {
  const [pathname, query = ''] = url.split('?');
  const oldParams = parseQuery(query);

  const params = Object.assign({}, oldParams, extraParams);
  return `${pathname}?${qs.stringify(params)}`;
};

export const isInstalling = (status) => ['waiting', 'downloading', 'installing', 'upgrading'].includes(status);

export const isDownloading = (status) => ['waiting', 'downloading'].includes(status);
export const isExtracting = (status) => ['extracting'].includes(status);

export const isRunning = (status) => status === 'running';

export const checkInputByType = (type, value) => {
  const typesMap = {
    url: isUrl,
    slack: (v) => isUrl(v) && isSlackWebhookUrl(v),
  };

  if (!type) {
    return true;
  }

  if (typesMap[type]) {
    return typesMap[type](value);
  }

  return false;
};

export const formatUrl = (url) => humanizeUrl(url.split('?').shift());

export const shouldCheckDomainStatus = (domain) =>
  domain && // eslint-disable-line
  ![DOMAIN_FOR_IP_SITE, DOMAIN_FOR_IP_SITE_REGEXP, DOMAIN_FOR_DEFAULT_SITE, DOMAIN_FOR_INTERNAL_SITE].includes(domain);

export const checkIsWildcardDomain = (url) => {
  try {
    if (!url) {
      return false;
    }

    const tempUrl = url.startsWith('http') ? url : `http://${url}`;
    const urlObj = new window.URL(tempUrl);
    return decodeURIComponent(urlObj.host)
      .split('.')
      .some((x) => x === '*');
  } catch (error) {
    console.error(url, error);
    return false;
  }
};

export const stringSortHandlerAsc = (strA = '', strB = '') => {
  if (strA > strB) {
    return 1;
  }

  if (strB > strA) {
    return -1;
  }

  return 0;
};

export const getInviteLink = ({ inviteId, endpoint }) => {
  if (!endpoint) {
    return '';
  }

  const u = new URL(endpoint);
  u.pathname = joinURL(u.pathname, WELLKNOWN_SERVICE_PATH_PREFIX, 'invite');
  u.searchParams.set('inviteId', inviteId);
  return u.href;
};

export const getTransferAppLink = ({ transferId, endpoint }) => {
  if (!endpoint) {
    return '';
  }

  const u = new URL(endpoint);
  u.pathname = joinURL(u.pathname, WELLKNOWN_SERVICE_PATH_PREFIX, 'transfer');
  u.searchParams.set('transferId', transferId);
  return u.href;
};

export const getIssuePassportLink = ({ id, endpoint }) => {
  if (!endpoint) {
    return '';
  }

  const u = new URL(endpoint);
  u.pathname = joinURL(u.pathname, WELLKNOWN_SERVICE_PATH_PREFIX, 'issue-passport');
  u.searchParams.set('id', id);
  return u.href;
};

export const formatRegistryLogoPath = (did, asset, version = '') => {
  if (asset.startsWith('/assets')) {
    return asset;
  }

  return version
    ? `/assets/${did}/${asset}?v=${version}&${STORE_LOGO_FILTER}`
    : `/assets/${did}/${asset}?${STORE_LOGO_FILTER}`;
};

export function getWebWalletUrl(info) {
  try {
    const url = window.localStorage.getItem('wallet_url');
    if (url) {
      return url;
    }
  } catch (err) {
    // Do nothing
  }

  return info && info.webWalletUrl ? info.webWalletUrl : WEB_WALLET_URL;
}

export function isValidClusterSize(data) {
  const { value, cpuCores } = data;
  if (!value) {
    return '';
  }

  const v = Number(value);
  if (Number.isNaN(v)) {
    return 'Cluster size should be a number';
  }
  if (!Number.isInteger(v)) {
    return 'Cluster size should be integer';
  }
  if (v <= 0 || v > cpuCores) {
    return `Cluster size should between 1 to ${cpuCores}`;
  }

  return '';
}

export function isProtectedRole(role) {
  return Object.values(ROLES).includes(role);
}

export function formatFactoryPrice(blocklet) {
  if (!blocklet?.payment) {
    return [];
  }

  const list = (blocklet.payment?.price || []).map((item) => ({ name: item.symbol, value: item.value }));
  return list;
}

export const getBlockletLogoUrl = ({ did, baseUrl, logoPath, version = '' }) => {
  if (logoPath && logoPath.startsWith('http')) {
    return logoPath;
  }

  if (baseUrl.startsWith('http') && logoPath) {
    return joinURL(baseUrl, formatRegistryLogoPath(did, logoPath, version));
  }

  const prefix = window.env.apiPrefix || '/';
  let apiPrefix = prefix.replace(/^\/+/, '').replace(/\/+$/, '');
  if (apiPrefix) {
    apiPrefix = `/${apiPrefix}`;
  }

  return joinURL(
    apiPrefix,
    version ? `/blocklet/logo/${did}?v=${version}&${STORE_LOGO_FILTER}` : `/blocklet/logo/${did}?${STORE_LOGO_FILTER}`
  );
};

export const getPathPrefix = () => (window.env && window.env.apiPrefix ? window.env.apiPrefix : '/');

export const isUrlAccessible = (url) => checkAccessible(joinURL(new URL(url).origin, WELLKNOWN_PING_PREFIX));

const checkBlockletAccessible = async (url, timeout = 5000) => {
  try {
    const urlObj = new URL(url);
    urlObj.protocol = 'https';
    urlObj.pathname = joinURL('/__blocklet__.js?type=json');

    await axios.get(urlObj.toString(), {
      timeout,
      validateStatus: (status) => {
        return (status >= 200 && status < 400) || status === 503; // 503 是 not running, 可以访问 blocklet service
      },
    });

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const waitingForAccessible = async (urls, timeout = 30 * 1000) => {
  const tasks = await urls.map(async (url) => {
    try {
      await tryWithTimeout(async () => {
        let accessible = false;
        do {
          /* eslint-disable no-await-in-loop */
          accessible = await checkBlockletAccessible(url);
          await sleep(2000);
        } while (!accessible);
      }, timeout);
    } catch (error) {
      console.error(error);
    }
  });

  await Promise.all(tasks);
};

export const getAccessibleUrl = async (urls) => {
  try {
    await waitingForAccessible(urls);

    const res = await evaluateURLs(urls, { checkAccessible: checkBlockletAccessible });
    return res[0].url;
  } catch (error) {
    console.warn('get accessible url failed', error);
    return '';
  }
};

/**
 * 检查证书是否与 blocklet 匹配
 * @param {string[]} blockletUrls - 通过 blocklet#interfaces#url 获取到的一组 url
 * @param {object[]} matchedSites - 通过 certificate#matchedSites 获取到的一组 site
 * @returns {boolean} - 匹配则返回 true
 */
export const isCertificateMatch = (blockletUrls = [], matchedSites = []) => {
  try {
    return matchedSites
      .map((item) => item.domain)
      .some((domain) => {
        return blockletUrls.some((u) => {
          const url = new window.URL(u.startsWith('http') ? u : `http://${u}`);
          return url.hostname === domain;
        });
      });
  } catch (e) {
    console.warn('domain match failed');
    return false;
  }
};

export const getBlockletUrlParams = (blocklet, locale) =>
  isBlockletRunning(blocklet || {}) ? { locale } : { locale, __start__: 1 };

/**
 * 判断是否在safari浏览器中
 * 不传的ua情况下，使用当前页面的ua
 * chrome浏览器的ua也会带有 Safari 字样，所以要排除 Chrome 字符串
 * iPhone 设备下，所有浏览器都是 safari 的 webkit
 * @param {String} ua userAgent 字符串
 * @returns bool
 */
export const isSafari = (ua = window.navigator.userAgent) => {
  return ua.includes('iPhone') || (ua.includes('Safari') && !ua.includes('Chrome'));
};

/**
 *
 * @export
 * @param {string} url
 * @return {string}
 */
export function deepDecodeURIComponent(url) {
  let lastDecodeUrl = decodeURIComponent(url);

  while (lastDecodeUrl !== decodeURIComponent(lastDecodeUrl)) {
    lastDecodeUrl = decodeURIComponent(lastDecodeUrl);
  }

  return lastDecodeUrl;
}

/**
 *
 * @description 已知nextWorkflow的地址,提取它的statusUrl和token
 * @export
 * @param {string} nextWorkflow
 * @returns {{
 *  statusUrl: string;
 *  token: string;
 * }}
 */
export function extractStatusUrlFromNextWorkflow(nextWorkflow) {
  const nextWorkflowURL = new URL(deepDecodeURIComponent(nextWorkflow)).searchParams.get('url');

  return {
    statusUrl: nextWorkflowURL.replace('/auth?', '/status?'),
    token: new URL(nextWorkflowURL).searchParams.get('_t_'),
  };
}

export function getBlockletMetaUrl(storeUrl, did, dist) {
  let origin = storeUrl;
  if (!origin && dist?.tarball) {
    origin = new URL(dist.tarball).origin;
  }
  return joinURL(origin, BLOCKLET_STORE_API_PREFIX, `/blocklets/${did}/blocklet.json`);
}

export async function getAsset(chainHost, address) {
  const result = await axios.post(
    joinURL(chainHost, '/api/gql/'),
    JSON.stringify({
      query: `{
        getAssetState(address: "${address}") {
          state {
            address
            data {
              typeUrl
              value
            }
            issuer
            owner
            parent
          }
        }
      }`,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 60 * 1000,
    }
  );

  const state = get(result.data, 'data.getAssetState.state');
  if (state && state.data.typeUrl === 'json') {
    state.data.value = JSON.parse(state.data.value);
  }

  return state;
}

/**
 * 检查url是否 未添加到 store list 中
 * @param {string} url - 需要检查的url
 * @param {object[]} storeList - 后端的store list, 一般是 node.blockletRegistryList 或 blocklet.settings.storeList
 * @returns {Object.freeze({
 *  isNew: boolean;
 *  decoded: string;
 * })} - 返回判断是否是新的url和解码后的url
 */
export const isNewStoreUrl = (url, storeList) => {
  if (url && typeof url === 'string') {
    let decoded = decodeURIComponent(url?.trim());

    const regex = /^https?:\/\//;

    if (!regex.test(decoded)) {
      decoded = `https://${decoded}`;
    }

    decoded = trimEnd(decoded, '/');

    // validate
    try {
      new URL(decoded); // eslint-disable-line no-new
    } catch {
      throw new Error('Invalid Blocklet Store URL');
    }

    if (storeList?.some((item) => [url, decoded].includes(item.url))) {
      return {
        isNew: false,
        decoded,
      };
    }

    return {
      isNew: true,
      decoded,
    };
  }

  return {
    isNew: false,
    decoded: '',
  };
};

export const isBlockletDev = (blocklet) => blocklet.mode === BLOCKLET_MODES.DEVELOPMENT;

export const APP_PREFIX = window.env?.groupPathPrefix || '/';

export const BlockletAdminRoles = [ROLES.ADMIN, ROLES.OWNER];

export const toSlotDomain = (domain) => {
  if (domain.endsWith(DEFAULT_IP_DOMAIN_SUFFIX)) {
    const subDomain = domain.split('.').shift();
    const matches = subDomain.match(IP);
    if (matches) {
      return domain.replace(matches[0].slice(1), SLOT_FOR_IP_DNS_SITE);
    }
  }

  return domain;
};

export const getStoreList = ({ fromBlocklet, nodeInfo, blocklet }) => {
  const teamDid = fromBlocklet ? blocklet?.meta?.did : nodeInfo?.did;
  const storeList = fromBlocklet ? blocklet?.settings?.storeList || [] : nodeInfo?.blockletRegistryList || [];

  return { teamDid, storeList: storeList.filter((x) => x.protected || !x.scope) };
};

export const isDidDomainOrIpEchoDomain = (domain) => {
  if (!domain) {
    return false;
  }

  return (
    domain.endsWith(DEFAULT_DID_DOMAIN) ||
    domain.endsWith(DEFAULT_IP_DOMAIN_SUFFIX) ||
    domain.endsWith(DEFAULT_SLP_DOMAIN)
  );
};

export const sortDomains = (domains) => {
  return (domains || []).sort((x, y) => {
    if (isDidDomainOrIpEchoDomain(x.value) && isDidDomainOrIpEchoDomain(y.value)) {
      return 0;
    }

    if (isDidDomainOrIpEchoDomain(x.value)) {
      return 1;
    }

    if (isDidDomainOrIpEchoDomain(y.value)) {
      return -1;
    }

    return 1;
  });
};

export const formatMountPoint = (value) => normalizePathPrefix(urlPathFriendly(value));

export const getLauncherBaseURL = async (launcherUrl) => {
  if (!launcherUrl) {
    return '';
  }

  let baseUrl = launcherUrl;

  try {
    const { data: appMeta } = await axios.get(joinURL(launcherUrl, '__blocklet__.js?type=json'), { timeout: 5000 });
    const mountPoint = appMeta.componentMountPoints?.find(
      (item) => item.did === 'z8iZkFBbrVQxZHvcWWB3Sa2TrfGmSeFz9MSU7'
    );

    const launcherUrlObj = new URL(launcherUrl);

    baseUrl = joinURL(launcherUrlObj.origin, mountPoint?.mountPoint);
  } catch (error) {
    console.error(error);
  }

  return baseUrl;
};

export const getSubscriptionURL = async ({ launcherUrl = '', nftId = '', locale = 'en' }) => {
  if (!launcherUrl) {
    return '';
  }

  let baseUrl = joinURL(launcherUrl, '/instances');

  try {
    const { data: appMeta } = await axios.get(joinURL(launcherUrl, '__blocklet__.js?type=json'), { timeout: 5000 });
    const mountPoint = appMeta.componentMountPoints?.find(
      (item) => item.did === 'z8iZy4P83i6AgnNdNUexsh2kBcsDHoqcwPavn'
    );

    const launcherUrlObj = new URL(launcherUrl);

    baseUrl = joinURL(launcherUrlObj.origin, mountPoint?.mountPoint, '/nfts');
  } catch (error) {
    console.error(error);
  }

  return joinURL(
    baseUrl,
    `/${nftId}/subscription?locale=${locale}&return-url=${encodeURIComponent(window.location.href)}`
  );
};

export const getSubscriptionUrlV2 = async ({
  launcherUrl = '',
  launcherSessionId = '',
  nftDid,
  locale = 'en',
  theme = '',
}) => {
  if (!launcherUrl) {
    return '';
  }

  const baseUrl = await getLauncherBaseURL(launcherUrl);

  const themeParam = theme ? `&theme=${theme}` : '';

  return joinURL(
    baseUrl,
    `/embed/subscription?launcherSessionId=${launcherSessionId}&nftDid=${nftDid}&locale=${locale}${themeParam}`
  ); // nftDid 是兼容字段
};

export const getManageSubscriptionURL = async ({ launcherUrl = '', launcherSessionId = '', locale = 'en' }) => {
  if (!launcherUrl) {
    return '';
  }

  const baseUrl = await getLauncherBaseURL(launcherUrl);
  return joinURL(baseUrl, `/embed/manage-subscription?launcherSessionId=${launcherSessionId}&locale=${locale}`);
};

export const getSystemDomains = (domains) => domains.filter((x) => x.isProtected);

export const getLogoHash = (logo) => encodeURIComponent((logo || '').split('/').slice(-1)[0].slice(0, 7));

const hasRequiredEnvironments = (meta) => (meta.environments || []).some((x) => x.required);
export const hasRequiredSteps = (meta) => {
  return !!meta.requirements?.fuels?.length || hasRequiredEnvironments(meta);
};

export const isFromWallet = () => {
  const { searchParams } = new URL(window.location.href);
  // NOTICE: 这个参数由钱包中拼接得来，用于判断是否来源于钱包客户端（可以走不同的处理逻辑）
  return searchParams.get('fromWallet') === '1';
};

/**
 * 将远程 SVG 转换为 PNG 图片
 * @param {string} url - SVG 图片的 URL
 * @param {Object} config - 配置选项
 * @param {number} config.width - 输出 PNG 的宽度，默认为 SVG 原始宽度
 * @param {number} config.height - 输出 PNG 的高度，默认为 SVG 原始高度
 * @param {number} config.quality - 输出质量，1-10，默认为 1（相当于 n 倍分辨率）
 * @returns {Promise<Blob>} 返回 PNG 格式的 Blob 对象
 */
export function fetchSvgAsPng(url, options = {}) {
  // 检查是否为 SVG 图片
  if (!url || !url.toLowerCase().endsWith('.svg')) {
    return null;
  }

  const { width, height, quality = 1 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // 创建高分辨率画布
      const canvas = document.createElement('canvas');

      // 设置画布尺寸
      const canvasWidth = width ? width * quality : img.width * quality;
      const canvasHeight = height ? height * quality : img.height * quality;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const ctx = canvas.getContext('2d');

      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 设置抗锯齿
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 计算要绘制的图像尺寸，保持原始宽高比
      const imgRatio = img.width / img.height;
      let drawWidth = img.width * quality;
      let drawHeight = img.height * quality;

      // scale
      if (width || height) {
        if (width && !height) {
          drawWidth = width * quality;
          drawHeight = drawWidth / imgRatio;
        } else if (!width && height) {
          drawHeight = height * quality;
          drawWidth = drawHeight * imgRatio;
        } else if (width && height) {
          const canvasRatio = canvasWidth / canvasHeight;

          if (imgRatio > canvasRatio) {
            // 图像更宽，以高度为基准
            drawHeight = canvasHeight;
            drawWidth = drawHeight * imgRatio;
          } else {
            // 图像更高，以宽度为基准
            drawWidth = canvasWidth;
            drawHeight = drawWidth / imgRatio;
          }
        }
      }

      // 计算居中位置
      const x = (canvasWidth - drawWidth) / 2;
      const y = (canvasHeight - drawHeight) / 2;

      // 绘制图像，保持宽高比并居中
      ctx.drawImage(img, x, y, drawWidth, drawHeight);

      // 转换为 PNG Blob
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/png',
        1.0 // 最高质量
      );
    };

    img.onerror = (error) => {
      console.error('Error loading SVG image:', error);
      reject(new Error(`Failed to load SVG image: ${url}`));
    };

    img.src = url;
  });
}

/**
 * 将 Blob 转换为 File 对象
 * @param {Blob} blob - 需要转换的 Blob 对象
 * @param {string} fileName - 文件名
 * @returns {File} 返回 File 对象
 */
export function blobToFile(blob, fileName) {
  const file = new File([blob], fileName, { type: blob.type });
  return file;
}

export function isDomainAccessible(url) {
  if (!url) {
    return false;
  }

  const targetUrl = withHttps(withQuery(joinURL(url, '/__blocklet__.js'), { type: 'json' }));
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    try {
      const response = await axios.get(targetUrl, {
        timeout: 5000,
      });
      resolve(!!response?.data?.did);
    } catch (error) {
      resolve(false);
    }
  });
}

/**
 * 获取 blocklet 的 accessible url，优先返回自定义域名
 * @param {Object} blocklet - blocklet 对象
 * @returns {string} 返回 accessible url
 */
export async function getBlockletAccessibleUrl(blocklet) {
  if (!blocklet) {
    return '';
  }

  const domains = sortDomains(blocklet.site?.domainAliases);
  const customDomains = domains.filter((domain) => isCustomDomain(domain.value));
  const systemDomains = domains.filter((domain) => !isCustomDomain(domain.value));

  for (const domain of customDomains) {
    const accessible = await isDomainAccessible(domain.value);
    if (accessible) {
      return withHttps(domain.value);
    }
  }

  if (!systemDomains.length) {
    return '';
  }

  return withHttps(systemDomains[0]?.value);
}

/**
 * 通过动态脚本加载 window.env
 */
export const updateWindowEnv = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/.well-known/service/api/env';

    script.onload = () => {
      document.body.removeChild(script);
      resolve();
    };

    script.onerror = () => {
      document.body.removeChild(script);
      reject(new Error('Failed to load script: /.well-known/service/api/env'));
    };

    document.body.appendChild(script);
  });
};
