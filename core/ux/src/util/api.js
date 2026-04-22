import axios from 'axios';

axios.defaults.timeout = 10 * 1000; // 超时时间设为10s

const api = axios.create();

export { axios, api };
export default api;
