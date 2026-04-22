import axios from 'axios';
import { joinURL } from 'ufo';

import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { PREFIX } from '../util';

const api = axios.create();

api.interceptors.request.use(
  (config) => {
    config.baseURL = joinURL(PREFIX, WELLKNOWN_SERVICE_PATH_PREFIX, '/api');
    config.timeout = 200000;

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (typeof error.response?.data?.text === 'string') {
      error.message = error.response.data.text;
    } else if (typeof error.response?.data?.text === 'function') {
      error.message = await error.response.data.text();
    }

    throw error;
  }
);

export default api;
