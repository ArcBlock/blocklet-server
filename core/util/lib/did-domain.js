const { joinURL } = require('ufo');

const axios = require('./axios');

const DID_DOMAIN_SERVICE_DID = 'z2qaGosS3rZ7m5ttP3Nd4V4qczR9TryTcRV4p';

const getDidDomainServiceURL = async (url) => {
  if (!url || !url?.trim()) {
    return null;
  }

  const urlObj = new URL(url);
  urlObj.pathname = '__blocklet__.js';
  urlObj.searchParams.set('type', 'json');
  const { data } = await axios.get(urlObj.toString());

  const component = data?.componentMountPoints?.find((x) => x.did === DID_DOMAIN_SERVICE_DID);

  const resultUrlObj = new URL(url);
  resultUrlObj.pathname = component?.mountPoint;

  const baseURL = resultUrlObj.toString();
  const apiURL = joinURL(baseURL, '/api');

  return { base: baseURL, api: apiURL, domain: joinURL(apiURL, '/domains') };
};

module.exports = { DID_DOMAIN_SERVICE_DID, getDidDomainServiceURL };
