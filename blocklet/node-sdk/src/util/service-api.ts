/**
 * HTTP client for making requests from the SDK to blocklet-service
 * Automatically injects signed headers; signature verification is handled by blocklet-service
 */

import Axios from 'axios';
import { blockletEnv } from '@blocklet/env';
import { joinURL } from 'ufo';

import { SERVICE_PREFIX } from './constants';
import { getSignData } from './verify-sign';
import { getServerHost } from './parse-docker-endpoint';

const { serverVersion } = blockletEnv;

const axios = Axios.create({
  // Internal machine-local calls must not use a proxy
  proxy: false,
  baseURL: `http://${getServerHost()}:${process.env.ABT_NODE_SERVICE_PORT}${SERVICE_PREFIX}`,
  // Internal calls do not need a long timeout
  timeout: 6 * 1000,
  headers: {
    'User-Agent': `BlockletSDK/${serverVersion}`,
    'x-blocklet-server-version': serverVersion,
    // NOTICE: These two headers must be injected for blocklet-service to identify the current blocklet environment
    'x-blocklet-did': process.env.BLOCKLET_DID,
    'x-blocklet-component-id': process.env.BLOCKLET_REAL_DID,
  },
});

axios.interceptors.request.use(async (config) => {
  const { sig, exp, iat, version } = await getSignData(
    {
      data: config.data,
      method: config.method,
      params: config.params,
      url: joinURL(SERVICE_PREFIX, config.url),
    },
    {
      // Compatible with previous version where APP_ASK does not exist
      appSk: process.env.BLOCKLET_APP_ASK || process.env.BLOCKLET_APP_SK,
    }
  );
  // Signed with the current blocklet's appSk; named x-blocklet-sig for unified use
  config.headers['x-blocklet-sig'] = sig;
  config.headers['x-blocklet-sig-iat'] = iat;
  config.headers['x-blocklet-sig-exp'] = exp;
  config.headers['x-blocklet-sig-version'] = version;
  return config;
});

export default axios;
