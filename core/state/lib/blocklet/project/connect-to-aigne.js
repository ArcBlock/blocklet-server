const validUrl = require('valid-url');

const { encrypt } = require('@abtnode/util/lib/security');
const { joinURL, withHttps } = require('ufo');
const { WELLKNOWN_SERVICE_PATH_PREFIX, AIGNE_CONFIG_ENCRYPT_SALT } = require('@abtnode/constant');
const { getDisplayName, getAppUrl } = require('@blocklet/meta/lib/util');
const { CustomError } = require('@blocklet/error');
const logger = require('@abtnode/logger')('connect-to-aigne');
const { createConnect, fetchConfigs } = require('./create-connect');

// eslint-disable-next-line require-await
const connectToAigne = async ({ did, baseUrl, provider, model, manager }) => {
  if (!did) {
    throw new CustomError(400, 'Invalid did');
  }

  if (!validUrl.isWebUri(baseUrl)) {
    throw new CustomError(400, 'Invalid endpoint url:', baseUrl);
  }

  // eslint-disable-next-line no-async-promise-executor, consistent-return
  return new Promise(async (resolve, reject) => {
    try {
      const blocklet = await manager.getBlocklet(did);
      const appUrl = getAppUrl(blocklet);

      const fetchData = await createConnect({
        connectUrl: joinURL(new URL(baseUrl).origin, WELLKNOWN_SERVICE_PATH_PREFIX),
        connectAction: 'gen-simple-access-key',
        source: `Connect to AIGNE hub (${getDisplayName(blocklet)})`,
        closeOnSuccess: true,
        openPage: (pageUrl) => resolve(pageUrl),
        intervalFetchConfig: fetchConfigs,
        appUrl: withHttps(appUrl),
      });

      if (!fetchData.accessKeySecret) {
        throw new CustomError(400, 'Failed to generate access key secret');
      }

      const encryptedKey = encrypt(fetchData.accessKeySecret, did || AIGNE_CONFIG_ENCRYPT_SALT, '');

      await manager.updateBlockletSettings({
        did,
        aigne: {
          key: encryptedKey,
          url: baseUrl,
          provider,
          model,
          accessKeyId: '',
          secretAccessKey: '',
        },
      });
    } catch (error) {
      logger.error('connect to aigne error', { error, did, baseUrl });
      reject(error);
    }
  });
};

module.exports = connectToAigne;
