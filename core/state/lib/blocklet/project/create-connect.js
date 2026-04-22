const { joinURL } = require('ufo');
const { withQuery } = require('ufo');
const pWaitFor = require('p-wait-for');
const { encodeEncryptionKey, decrypt } = require('@abtnode/util/lib/security');
const axios = require('@abtnode/util/lib/axios');

const ACCESS_KEY_PREFIX = '/api/access-key/session';

const fetchConfigs = async ({ connectUrl, sessionId, fetchInterval, fetchTimeout }) => {
  const url = withQuery(joinURL(connectUrl, ACCESS_KEY_PREFIX), { sid: sessionId });

  const condition = async () => {
    const { data: session } = await axios({ url });
    return Boolean(session.accessKeyId && session.accessKeySecret);
  };

  await pWaitFor(condition, { interval: fetchInterval, timeout: fetchTimeout });

  const { data: session } = await axios({ url });
  await axios({
    url: withQuery(joinURL(connectUrl, ACCESS_KEY_PREFIX), { sid: sessionId }),
    method: 'DELETE',
  });

  return {
    ...session,
    accessKeyId: session.accessKeyId,
    accessKeySecret: decrypt(session.accessKeySecret, session.accessKeyId, session.challenge),
  };
};

async function createConnect({
  connectUrl,
  openPage,
  fetchInterval = 3 * 1000,
  retry = 1500,
  source = 'Blocklet CLI',
  connectAction = 'connect-cli',
  wrapSpinner = (_, waiting) => Promise.resolve(waiting()),
  closeOnSuccess,
  prettyUrl,
  intervalFetchConfig,
  appUrl,
}) {
  try {
    const { data: session } = await axios(joinURL(connectUrl, ACCESS_KEY_PREFIX), { method: 'POST' });
    const token = session.id;

    const pageUrl = withQuery(joinURL(connectUrl, connectAction), {
      __token__: encodeEncryptionKey(token),
      __url__: encodeEncryptionKey(appUrl),
      source,
      closeOnSuccess,
    });

    // eslint-disable-next-line no-console
    console.info(
      'If browser does not open automatically, please open the following link in your browser: ',
      prettyUrl?.(pageUrl) || pageUrl
    );

    openPage?.(pageUrl);

    return await wrapSpinner(`Waiting for connection: ${connectUrl}`, async () => {
      const fn = intervalFetchConfig ?? fetchConfigs;

      const fetchData = await fn({
        connectUrl,
        sessionId: token,
        fetchTimeout: retry * fetchInterval,
        fetchInterval: retry,
      });

      return fetchData;
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
}

module.exports = {
  createConnect,
  fetchConfigs,
};
