const path = require('path');
const { BLOCKLET_SITE_GROUP_SUFFIX, DEFAULT_HTTP_PORT, DEFAULT_HTTPS_PORT } = require('@abtnode/constant');
const axios = require('@abtnode/util/lib/axios');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { stableStringify } = require('@arcblock/vc');
const { toBase58 } = require('@ocap/util');
const { getDidDomainServiceURL } = require('@abtnode/util/lib/did-domain');
const { getProvider } = require('@abtnode/router-provider');
const os = require('os');
const uniq = require('lodash/uniq');
const isUrl = require('is-url');
const isIp = require('is-ip');
const isCidr = require('is-cidr');
const getPort = require('get-port');

const logger = require('@abtnode/logger')('@abtnode/core:router:util');

const { isGatewayCacheEnabled } = require('./index');
const request = require('./request');

const getBlockletDomainGroupName = (did) => `${did}${BLOCKLET_SITE_GROUP_SUFFIX}`;

const getDidFromDomainGroupName = (name) => {
  const did = name.replace(BLOCKLET_SITE_GROUP_SUFFIX, '');
  return did;
};

const getNFTDomainHeaders = async ({ wallet, payload }) => ({
  'x-blocklet-sig': toBase58(await wallet.sign(stableStringify(payload))),
});

const updateNFTDomainRecord = async ({ name, value, blocklet, nodeInfo, bindCap }) => {
  const { wallet } = getBlockletInfo(blocklet, nodeInfo.sk);

  const payload = {
    delegatee: blocklet.appPid,
    domain: name,
    record: {
      name,
      type: 'CNAME',
      value,
    },
  };

  let proof;
  if (bindCap) {
    proof = await wallet.sign(stableStringify(`${bindCap.cap.sessionId}|${bindCap.cap.domain}`));

    payload.bindCap = bindCap;
    payload.proof = proof;
    payload.delegateePk = wallet.publicKey;
  }

  const nftDomainServiceUrl = await getDidDomainServiceURL(nodeInfo.nftDomainUrl);

  try {
    const { data } = await axios({
      method: 'POST',
      url: nftDomainServiceUrl.domain,
      data: payload,
      headers: await getNFTDomainHeaders({ wallet, payload }),
    });

    return data;
  } catch (error) {
    logger.error('updateNFTDomainRecord error', {
      error,
      name,
      value,
      delegatee: blocklet.appPid,
      appPid: blocklet.appPid,
      resp: error.response?.data,
    });
    throw new Error('update nft domain record failed');
  }
};

const revokeAndDeleteNFTDomainRecord = async ({ name, blocklet, nodeInfo }) => {
  const { wallet } = getBlockletInfo(blocklet, nodeInfo.sk);

  const payload = {
    delegatee: blocklet.appPid,
    domain: name,
  };

  const nftDomainServiceUrl = await getDidDomainServiceURL(nodeInfo.nftDomainUrl);

  logger.info('will revoke and delete nft domain record', { name, appPid: blocklet.appPid, payload });

  try {
    const { data } = await axios({
      method: 'DELETE',
      url: nftDomainServiceUrl.domain,
      data: payload,
      headers: await getNFTDomainHeaders({ wallet, payload }),
    });

    return data;
  } catch (error) {
    logger.error('revokeAndDeleteNFTDomainRecord error', {
      error,
      name,
      appPid: blocklet.appPid,
      resp: error.response?.data,
    });
    throw new Error('revoke nft domain record failed');
  }
};

const getGatewayPorts = (info) => {
  return {
    httpPort: info.routing?.httpPort || DEFAULT_HTTP_PORT,
    httpsPort: info.routing?.httpsPort || DEFAULT_HTTPS_PORT,
  };
};

/**
 * Get available gateway ports, if the preferred ports are not available, it will return a random port
 * This is used to avoid port conflict when validating router config
 * Preferred ports are 8080-8085, because these ports are not used by other services
 * @returns {Promise<{httpPort: number, httpsPort: number}>}
 */
const getAvailableGatewayPorts = async () => {
  const preferredPorts = [8080, 8081, 8082, 8083, 8084, 8085];
  const httpPort = await getPort({ port: preferredPorts });
  const httpsPort = await getPort({ port: preferredPorts });

  return {
    httpPort,
    httpsPort,
  };
};

const createProviderInstance = ({ nodeInfo, routerDataDir }) => {
  const providerName = nodeInfo.routing.provider;
  const Provider = getProvider(providerName);
  const { httpPort, httpsPort } = getGatewayPorts(nodeInfo);

  logger.info('create router instance', { providerName, httpPort, httpsPort });

  return new Provider({
    configDir: path.join(routerDataDir, providerName),
    httpPort,
    httpsPort,
    cacheEnabled: isGatewayCacheEnabled(nodeInfo),
  });
};

const expandBlacklist = async (blacklist) => {
  const results = blacklist.filter((x) => !isUrl(x));
  await Promise.allSettled(
    blacklist
      .filter((x) => isUrl(x))
      .map(async (url) => {
        try {
          const res = await request.get(url, { timeout: 2000 });
          if (res.status === 200 && typeof res.data === 'string') {
            const items = res.data
              .split(os.EOL)
              .map((x) => x.trim())
              .filter(Boolean);
            logger.info('expand blacklist', { url, status: res.status, data: items });
            // Ignore URLs from remote blacklist
            results.push(...items.filter((x) => isIp.v4(x) || isIp.v6(x) || isCidr.v4(x) || isCidr.v6(x)));
          }
        } catch (err) {
          logger.error('expand blacklist failed', { url, error: err.message });
        }
      })
  );

  return uniq(results.sort());
};

module.exports = {
  getBlockletDomainGroupName,
  getDidFromDomainGroupName,
  getGatewayPorts,
  getAvailableGatewayPorts,
  updateNFTDomainRecord,
  revokeAndDeleteNFTDomainRecord,
  createProviderInstance,
  expandBlacklist,
};
