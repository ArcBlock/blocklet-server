/**
 * @file Google Cloud Platform(GCP) util
 */
const debug = require('debug')('core:util:gcp');
const { joinURL } = require('ufo');

const axios = require('./axios');

const HOST = 'http://169.254.169.254/computeMetadata/v1';
const DEFAULT_TIMEOUT = 5000;

/**
 * Get meta data from GCP
 * Docs, View project metadata: https://cloud.google.com/compute/docs/metadata/querying-metadata#rest_2
 * Docs, Predefined metadata keys: https://cloud.google.com/compute/docs/metadata/predefined-metadata-keys
 * @param {string} key
 * @param {number} timeout default 5000
 * @returns {string} meta data
 */
const getMeta = async (key, timeout = 5000) => {
  try {
    if (!key) {
      return '';
    }

    const url = joinURL(HOST, key);
    debug('getMeta', { url });
    const result = await axios.get(url, {
      timeout,
      headers: {
        'Metadata-Flavor': 'Google',
      },
    });

    debug('get meta', { key, status: result.status, data: result.data });

    return result.status === 200 ? result.data : '';
  } catch (error) {
    debug('failed to fetch meta', { key, error });

    return '';
  }
};

const isInGCP = async () => {
  const instanceId = await getMeta('instance/id');
  debug('isInGCP:instanceId:', instanceId);
  return !!instanceId;
};

const getInternalIpv4 = async () => {
  const internalIp = await getMeta('instance/network-interfaces/0/ip');
  debug('getLocalIpv4', { internalIp });
  return internalIp;
};

const getExternalIpv4 = async () => {
  const externalIp = await getMeta('instance/network-interfaces/0/access-configs/0/external-ip');
  debug('getPublicIpv4', { externalIp });
  return externalIp;
};

const getInternalIpv6 = async () => {
  // TODO: no IPv6-capable machine is available; this interface has not been tested on a real machine
  const internalIp = await getMeta('instance/network-interfaces/0/ipv6s');

  debug('getLocalIpv6', { internalIp });
  return internalIp;
};

const getExternalIpv6 = async () => {
  // TODO: no IPv6-capable machine is available; this interface has not been tested on a real machine
  const externalIp = await getMeta('instance/network-interfaces/0/access-configs/0/external-ipv6');
  debug('getPublicIpv6', { externalIp });

  return externalIp;
};

module.exports = {
  HOST,
  DEFAULT_TIMEOUT,
  getMeta,
  isInGCP,
  getInternalIpv4,
  getExternalIpv4,
  getInternalIpv6,
  getExternalIpv6,
};
