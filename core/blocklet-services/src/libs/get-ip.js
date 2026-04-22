import api from './api';

let cache = null;

const fetch = async () => {
  try {
    const res = await api.get(`/dns-resolve?hostname=${window.location.hostname}`);
    return res.data.address;
  } catch (error) {
    return null;
  }
};

// eslint-disable-next-line import/prefer-default-export
const getIp = () => {
  if (!cache) {
    cache = fetch();
  }

  return cache;
};

export default getIp;
