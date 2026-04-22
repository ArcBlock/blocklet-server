if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'CACHE_UPDATED' && event.data.meta === 'workbox-broadcast-update') {
      const { cacheName } = event.data.payload;
      if (cacheName.includes('documents-swr')) {
        // 如果是 Document 缓存更新，直接刷新页面
        if (navigator.serviceWorker.controller) {
          window.location.reload();
        }
      }
    }
  });
}
