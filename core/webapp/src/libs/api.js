import axios from 'axios';
import { joinURL } from 'ufo';
import { getSessionToken } from './util';

const api = axios.create();

api.interceptors.request.use(
  config => {
    const prefix = (window.env && window.env.apiPrefix) || '/';
    config.baseURL = joinURL(prefix, '/api');
    config.timeout = 20000;

    const token = getSessionToken();
    if (token) {
      config.headers = Object.assign(config.headers || {}, { authorization: `Bearer ${token}` });
    }

    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  res => res,
  async error => {
    if (typeof error.response?.data?.text === 'string') {
      error.message = error.response.data.text;
    } else if (typeof error.response?.data?.text === 'function') {
      error.message = await error.response.data.text();
    }

    throw error;
  }
);

export default api;
