import axios from 'axios';
import { blockletEnv } from '@blocklet/env';
import qs from 'qs';

import { getSignData } from './verify-sign';

const { serverVersion } = blockletEnv;

const componentApi = axios.create({
  timeout: 60 * 1000,
  headers: {
    'User-Agent': `BlockletSDK/${serverVersion}`,
    'x-blocklet-server-version': serverVersion,
  },
  paramsSerializer: (params) => qs.stringify(params),
});

componentApi.interceptors.request.use(async (config) => {
  const { sig, exp, iat, version } = await getSignData(
    {
      data: config.data,
      method: config.method,
      params: config.params,
      url: config.url,
    },
    {
      // Compatible with previous version where APP_ASK does not exist
      appSk: process.env.BLOCKLET_APP_ASK || process.env.BLOCKLET_APP_SK,
    }
  );

  config.headers['x-component-did'] = process.env.BLOCKLET_COMPONENT_DID;
  config.headers['x-component-sig'] = sig;
  config.headers['x-component-sig-iat'] = iat;
  config.headers['x-component-sig-exp'] = exp;
  config.headers['x-component-sig-version'] = version;

  return config;
});

export default componentApi;
