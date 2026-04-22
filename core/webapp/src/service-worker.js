/* eslint-disable no-console */
/* eslint-disable no-restricted-globals */
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { ExpirationPlugin } from 'workbox-expiration';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

// FIXME: index.html 的 <base> 会莫名被修改, 所以这里先不缓存 index.html
precacheAndRoute((self.__WB_MANIFEST || []).filter(x => x.url !== '/' && !x.url.includes('index.html')));
clientsClaim();

self.addEventListener('activate', () => {
  console.log('Service Worker activated');
});

self.addEventListener('install', event => {
  console.log('Service Worker installed');
  event.waitUntil(self.skipWaiting());
});

const shouldNotCache = request => {
  if (request.method !== 'GET') {
    return true;
  }

  if (request.url.includes('/api')) {
    return true;
  }

  if (request.url.includes('__meta__.js')) {
    return true;
  }

  if (request.url.includes('__blocklet__.js')) {
    return true;
  }

  return false;
};

registerRoute(
  data => {
    const { request } = data;

    if (shouldNotCache(request)) {
      return false;
    }
    return request.url.includes('/static/');
  },
  new CacheFirst({
    cacheName: `static-${self.registration.scope}`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
      }),
    ],
  })
);

registerRoute(
  ({ request, url }) => {
    if (!self.blocklet?.canCache?.({ url })) return false;
    return ['image', 'font', 'style', 'script'].includes(request.destination);
  },
  new CacheFirst({
    cacheName: `static-resources-${self.registration.scope}`,
  })
);

registerRoute(data => {
  const { request } = data;

  if (shouldNotCache(request)) {
    return false;
  }

  return request.url.includes('/images/') || request.url.includes('/icons/');
}, new StaleWhileRevalidate());
