const Joi = require('joi');
const axios = require('@abtnode/util/lib/axios');
const pick = require('lodash/pick');
const { joinURL } = require('ufo');
const pRetry = require('p-retry');
const { stableStringify } = require('@arcblock/vc');
const { toBase58 } = require('@ocap/util');
const getNodeWallet = require('@abtnode/util/lib/get-app-wallet');
const { formatError } = require('@blocklet/error');

const logger = require('@abtnode/logger')('@abtnode/auth:launcher');

const { version } = require('../package.json');

const LAUNCHER_BLOCKLET_DID = 'z8iZkFBbrVQxZHvcWWB3Sa2TrfGmSeFz9MSU7';

const schema = Joi.object({
  launcherSessionId: Joi.string().required(),
  launcherUrl: Joi.string().uri().required(),
  locale: Joi.string().optional(),
}).unknown(true);

const getLauncherInfo = async (launcherUrl) => {
  const baseURL = new URL(launcherUrl).origin;
  const { data: meta } = await axios.get(joinURL(baseURL, '__blocklet__.js?type=json'));
  const component = meta.componentMountPoints?.find((x) => x.did === LAUNCHER_BLOCKLET_DID);
  return {
    ...pick(meta, ['appName', 'appDescription', 'appId', 'appPk', 'appPid', 'appUrl']),
    mountPoint: component?.mountPoint || '/',
  };
};

const buildLauncherUrl = async (launcherUrl, pathname) => {
  const launcherInfo = await getLauncherInfo(launcherUrl);
  if (!launcherInfo.mountPoint) {
    throw new Error('launcher blocklet mount point not found');
  }

  const url = joinURL(launcherInfo.appUrl, launcherInfo.mountPoint, pathname);

  return url;
};

const buildRequestHeaders = async (serverSk, payload) => {
  const wallet = getNodeWallet(serverSk);
  return {
    'x-server-sig': toBase58(await wallet.sign(stableStringify(payload))),
    'User-Agent': `ABTNode/${version}`,
  };
};

// eslint-disable-next-line require-await
const doRequest = async (serverSk, { launcherUrl, pathname, payload, method = 'post', locale = 'en' }) => {
  if (!serverSk) {
    throw new Error('serverSk is required to request launcher');
  }

  const fn = async () => {
    const url = await buildLauncherUrl(launcherUrl, pathname);

    let params = method === 'get' ? payload : {};
    params = { ...(params || {}), locale };

    logger.info('do launcher request', { url, method, payload });

    const options = {
      method,
      url,
      params,
      headers: await buildRequestHeaders(serverSk, payload),
    };
    if (method === 'post') {
      options.data = payload;
    }

    const { data } = await axios(options);

    return data;
  };

  const delay = 10 * 1000;
  return pRetry(fn, {
    retries: 3,
    minTimeout: delay,
    maxTimeout: delay,
    onFailedAttempt: (error) => {
      logger.error('failed to call launcher', { error, method, launcherUrl, pathname, payload });
      // Exclude retrying for 4XX response codes
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }
    },
  });
};

const getLauncherSession = async (serverSk, params) => {
  const { error } = schema.validate(params);
  if (error) {
    return { error: formatError(error) };
  }

  const { launcherSessionId, launcherUrl, locale } = params;
  try {
    const result = await doRequest(serverSk, {
      launcherUrl: launcherUrl || 'https://launcher.arcblock.io/',
      pathname: `/api/launches/${launcherSessionId}`,
      payload: {},
      method: 'get',
      locale,
    });
    return { error: '', launcherSession: result.launch };
  } catch (err) {
    return { error: formatError(err) };
  }
};

const getLauncherUser = async (serverSk, params) => {
  const { launcherSessionId, launcherUrl } = params;
  const result = await doRequest(serverSk, {
    launcherUrl,
    pathname: `/api/launches/${launcherSessionId}/user`,
    payload: {},
    method: 'get',
  });

  return result.user;
};

const sendEmailWithLauncher = async (serverSk, params, payload) => {
  const { error } = schema.validate(params);
  if (error) {
    return { error: formatError(error) };
  }

  const { launcherSessionId, launcherUrl, locale } = params;
  try {
    const result = await doRequest(serverSk, {
      launcherUrl: launcherUrl || 'https://launcher.arcblock.io/',
      pathname: `/api/launches/${launcherSessionId}/service/email`,
      payload,
      locale,
    });
    return { error: '', result };
  } catch (err) {
    return { error: formatError(err) };
  }
};

module.exports = {
  doRequest,
  getLauncherSession,
  getLauncherUser,
  getLauncherInfo,
  buildLauncherUrl,
  buildRequestHeaders,
  sendEmailWithLauncher,
  LAUNCHER_BLOCKLET_DID,
};
