import axios from 'axios';

import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';

function proxyInterceptor(config) {
  /* istanbul ignore if */
  if (config.socketPath != null) return config;

  const { proxy } = config;

  /* istanbul ignore if */
  if (proxy === false) return config;

  const httpProxyUrl = process.env.HTTP_PROXY || process.env.http_proxy;
  const httpsProxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;

  const proxyOptions = Object.assign(
    { keepAlive: true, keepAliveMsecs: 1000, maxSockets: 256, maxFreeSockets: 256 },
    config.proxyOptions || {}
  );

  if (httpProxyUrl) {
    config.proxy = false;
    config.httpAgent = new HttpProxyAgent({ proxy: httpProxyUrl, ...proxyOptions });
  }
  if (httpsProxyUrl) {
    config.proxy = false;
    config.httpsAgent = new HttpsProxyAgent({ proxy: httpsProxyUrl, ...proxyOptions });
  }

  return config;
}

axios.interceptors.request.use(proxyInterceptor);

export default axios;
