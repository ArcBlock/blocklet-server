(function injectAnalytics(window) {
  const tracker = {};

  tracker.pageView = function trackPageView(pageName) {
    sendTrackerRequest('pv', pageName);
  };

  tracker.event = function trackEvent(eventName) {
    sendTrackerRequest('evt', eventName);
  };

  function sendTrackerRequest(type, data) {
    if (typeof data !== 'string') {
      return;
    }

    const tmp = document.createElement('script');
    tmp.src = `/.well-known/analytics/${type}/${data.startsWith('/') ? data.slice(1) : data}`;
    tmp.defer = true;
    tmp.async = true;
    tmp.onload = function cleanup() {
      document.head.removeChild(tmp);
    };
    setTimeout(function append() {
      document.head.appendChild(tmp);
    }, 200);
  }

  window.tracker = tracker;
  if (window.blocklet) {
    window.blocklet.tracker = tracker;
  }
})(window);
