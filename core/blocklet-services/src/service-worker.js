/* eslint-disable no-restricted-globals */
import { skipWaiting, clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { ExpirationPlugin } from 'workbox-expiration';
import { BroadcastUpdatePlugin } from 'workbox-broadcast-update';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { joinURL, withTrailingSlash } from 'ufo';

const { scope } = self.registration;
const scopeUrl = new URL(scope);

// HACK: 无法从 @abtnode/constant 中导入，因为它是 cjs 模块，vite 不支持，sw 需要单独配置 optimizeDeps，暂时不会
const WELLKNOWN_SERVICE_PATH_PREFIX = '/.well-known/service';
const DOCUMENT_CACHE_NAME = `documents-swr-${scope}`;
const META_CACHE_NAME = `meta-swr-${scope}`;
const STATIC_CACHE_NAME = `static-resources-${scope}`;
const OTHERS_CACHE_NAME = `others-${scope}`;

const staticExpirationPlugin = new ExpirationPlugin({
  // maxEntries: 100,
  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天后过期
});

const precacheList = (self.__WB_MANIFEST || []).filter((x) => x.url !== 'index.html');

const appShellPathList = [
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/open-window'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/lost-passport'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/issue-passport'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/login'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/connect'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/oauth/callback/*'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/oauth/authorize'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/exchange-passport'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/invite'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/transfer'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/studio'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/studio/home'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/studio/preferences'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/studio/branding'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/studio/localization'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/kyc/email'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/gen-access-key'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/gen-simple-access-key'),

  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/start'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/setup/*'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/onboard/*'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/wizard/*'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/user/*'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/admin'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/admin/*'),
];

const cacheBlackList = [
  joinURL('/.well-known/analytics/pv/*'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/health'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/health/*'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/admin/websocket'),
  joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/user/websocket'),
];

const shouldNotCache = ({ request, url }) => {
  if (request.method !== 'GET') return true;
  if (url.pathname.includes('/api')) return true;
  if (
    cacheBlackList.some((path) => {
      if (path.endsWith('/*')) {
        const base = path.slice(0, -1);
        return url.pathname.startsWith(base);
      }
      return url.pathname === path;
    })
  ) {
    return true;
  }
  if (precacheList.find((x) => joinURL(scope, 'static', x.url) === url.href)) return true;
  return false;
};

// 1. 预缓存 (Precache): 排除 index.html
// 仅缓存带哈希的静态资源，并启用自动清理 (cleanOutdatedCaches)
// 假设 self.__WB_MANIFEST 已被注入，并且包含静态资源
precacheAndRoute(precacheList);

// 2. Document 资源 (SWR 策略)
// 目标：解决 index.html 动态内容和 SPA 统一缓存键问题
const documentCacheKeyPlugin = {
  cacheKeyWillBeUsed: () => {
    // 将所有导航请求的缓存键统一为根路径，确保只缓存一份 index.html
    // 返回标准的根路径请求作为唯一的缓存键
    return withTrailingSlash(joinURL(scopeUrl.origin, scopeUrl.pathname));
  },
};

const documentHandler = new StaleWhileRevalidate({
  cacheName: DOCUMENT_CACHE_NAME,
  plugins: [
    // 使用自定义插件确保所有 SPA 路由共享同一个 index.html 缓存
    documentCacheKeyPlugin,
    new BroadcastUpdatePlugin(),
  ],
});

registerRoute(
  // 匹配所有导航请求 (用户直接访问 URL)
  ({ request, url }) => {
    if (shouldNotCache({ request, url })) return false;
    // 匹配 url.pathname 属于 appShellPathList 之一
    const isAppShellPath = appShellPathList.some((path) => {
      if (path.endsWith('/*')) {
        const base = path.slice(0, -1);
        return url.pathname.startsWith(base);
      }
      return url.pathname === path;
    });
    // 缓存导航的路由
    if (
      request.mode === 'navigate' &&
      request.destination === 'document' &&
      request.method === 'GET' &&
      isAppShellPath
    ) {
      return true;
    }
    return false;
  },
  documentHandler
);

registerRoute(
  ({ request }) => {
    // 缓存 __meta__.js 和 __blocklet__.js 请求
    if (request.url.includes('__meta__.js') || request.url.includes('__blocklet__.js')) return true;
    // 缓存特定的 API 加快页面展示速度
    if (request.url.includes(joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/api/env'))) return true;
    return false;
  },
  new StaleWhileRevalidate({
    cacheName: META_CACHE_NAME,
    plugins: [
      {
        cacheKeyWillBeUsed: ({ request }) => {
          if (request.url.endsWith('__meta__.js') || request.url.endsWith('__blocklet__.js')) {
            return joinURL(scopeUrl.origin, scopeUrl.pathname, '__blocklet__.js');
          }
          if (request.url.endsWith('__blocklet__.js?type=json')) {
            return joinURL(scopeUrl.origin, scopeUrl.pathname, '__blocklet__.js?type=json');
          }
          return request.url;
        },
      },
    ],
  })
);

// 3. 静态资源 (CacheFirst 策略)
// 目标：优先使用缓存，提供最快速度
registerRoute(
  ({ request, url }) => {
    if (shouldNotCache({ request, url })) return false;
    // 匹配图片、字体、样式和脚本（排除预缓存已包含的）
    if (['image', 'font', 'style', 'script'].includes(request.destination)) return true;
    return false;
  },
  new CacheFirst({
    cacheName: STATIC_CACHE_NAME,
    plugins: [staticExpirationPlugin], // 必须添加清理插件
  })
);

// 4. 其他 GET 网络请求 (NetworkFirst 策略)
// 目标：确保 API 数据或其它请求优先获取最新内容
registerRoute(
  ({ request, url }) => {
    if (url.pathname === joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/api/did/session')) return true;
    if (shouldNotCache({ request, url })) return false;
    if (request.method === 'GET') return true;
    return false;
  },
  new NetworkFirst({
    cacheName: OTHERS_CACHE_NAME,
  })
);

skipWaiting();
clientsClaim();
