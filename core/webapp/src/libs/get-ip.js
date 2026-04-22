import axios from 'axios';
import { joinURL } from 'ufo';

let cache = null;

const fetch = async () => {
  const prefix = window.env.apiPrefix || '/';
  const url = joinURL(prefix, '/api/dns-resolve?accessible=1');

  try {
    const res = await axios.get(url);
    return res.data.address;
  } catch (error) {
    return null;
  }
};

const getIp = () => {
  if (!cache) {
    cache = fetch();
  }

  return cache;
};

export default getIp;
