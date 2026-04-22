import { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { joinURL } from 'ufo';
import memoize from 'lodash/memoize';

import { WELLKNOWN_PING_PREFIX } from '@abtnode/constant';
import { evaluateURLs } from '@abtnode/util/lib/url-evaluation';
import defaultCheckAccessible from '@abtnode/util/lib/url-evaluation/check-accessible-browser';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';

import { getAccessUrl, getBlockletUrlParams, getBlockletUrls } from '../util';

// 如果同一个页面中存在多个部分同时对同一个 url 检测 url 可访问性, 避免造成重复请求
const ping = memoize((url) => {
  const { origin, hostname } = new URL(url);

  if (hostname === window.location.hostname) {
    return true;
  }

  return defaultCheckAccessible(joinURL(origin, WELLKNOWN_PING_PREFIX));
});

// url <-> evaluation cache
const CACHE = {};

export function useUrlEvaluation({
  urls,
  checkAccessible = defaultCheckAccessible,
  disableCache = false,
  timeout = 0,
}) {
  // 基于 CACHE 初始化该 hook 的状态
  // FIXME: 最好解决源头的 material-table 渲染 BlockletInterface 时的 re-mount 问题 (#4897)
  const initialCachedRef = useRef(urls.filter((url) => CACHE[url]).map((url) => CACHE[url]));
  const allCached = initialCachedRef.current.length === urls.length;
  const [urlsState, setUrlsState] = useState(allCached ? initialCachedRef.current : []);
  const [loading, setLoading] = useState(!allCached);
  const recommendedUrlState = useMemo(() => {
    if (!loading && urlsState.length) {
      return urlsState[0];
    }
    return null;
  }, [urlsState, loading]);

  useEffect(() => {
    if (urls?.length > 0 && !allCached) {
      const evaluate = async () => {
        let results;
        setLoading(true);
        if (disableCache) {
          results = await evaluateURLs(urls, { checkAccessible });
          results.forEach((item) => {
            CACHE[item.url] = item;
          });
        } else {
          const misses = await evaluateURLs(
            urls.filter((url) => !CACHE[url]),
            { checkAccessible }
          );
          misses.forEach((item) => {
            CACHE[item.url] = item;
          });
          results = urls.map((url) => CACHE[url]).sort((a, b) => b.score - a.score);
        }
        setUrlsState(results);
        setLoading(false);
      };

      setTimeout(evaluate, timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls, disableCache, allCached]);

  return {
    urlsState,
    loading,
    recommendedUrlState,
    recommendedUrl: recommendedUrlState?.url,
  };
}

/**
 * 主要对 blocklet 访问 urls 进行评估
 * @param {object} blocklet
 */
export function useBlockletUrlEvaluation(blocklet) {
  const { locale } = useContext(LocaleContext);
  const urls = useMemo(() => {
    if (!blocklet) {
      return [];
    }
    // getBlockletUrlParams 的调用是必须的, 会根据 blocklet 状态决定是否添加 "__start__" 参数, 以保证 blocklet 启动按钮可以正确的跳转到启动页面
    return getBlockletUrls({ blocklet, params: getBlockletUrlParams(blocklet, locale) });
  }, [blocklet, locale]);
  const { loading, recommendedUrlState, recommendedUrl } = useUrlEvaluation({ urls, checkAccessible: ping });
  return { urls, loading, recommendedUrlState, recommendedUrl };
}

/**
 * 主要对 blocklet domains 对应的 urls 进行评估, 配合 DomainStatusProvider 使用
 * @param {string[]} domains
 * @param {number} timeout 延迟判断时间, 单位: s
 */
export function useDomainsAccessibility(domains, timeout = 0) {
  // 获取 blocklet domain 对应的访问 url
  const urls = useMemo(() => domains.map((item) => getAccessUrl(item)), [domains]);
  const { urlsState, loading, recommendedUrl } = useUrlEvaluation({ urls, checkAccessible: ping, timeout });
  let result;
  if (loading) {
    // 在 loading 时，使用已有的缓存数据
    const cachedResults = urls.reduce((acc, url) => {
      const domain = new URL(url).hostname;
      if (CACHE[url]) {
        acc[domain] = { ...CACHE[url], domain };
      } else {
        acc[domain] = { loading: true };
      }
      return acc;
    }, {});

    const cachedAccessibleUrl = Object.values(CACHE)
      .filter((item) => urls.includes(item.url))
      .find((item) => item.accessible)?.url;

    result = {
      domainsAccessibility: cachedResults,
      recommendedDomain: cachedAccessibleUrl ? new URL(cachedAccessibleUrl).hostname : null,
    };
  } else {
    const domainsAccessibility = urlsState.reduce((acc, cur) => {
      // 检测对象是 domain, 但检测可访问性用的是 domain 对应的 ping url, 所以需要取 hostname 作为结果
      const domain = new URL(cur.url).hostname;
      acc[domain] = { ...cur, domain };
      return acc;
    }, {});
    // 从排好优先级的 urls 中选择第一个可访问的 url 作为 recommendedDomain (对于自定义域名, 可能存在评分最高但不可访问的情况) (#5195)
    const accessibleUrl = urlsState.find((item) => item.accessible)?.url || recommendedUrl;
    result = {
      domainsAccessibility,
      recommendedDomain: accessibleUrl ? new URL(accessibleUrl).hostname : null,
    };
  }
  return result;
}
