const fs = require('fs');
const { CancelToken } = require('axios');
const merge = require('lodash/merge');
const throttle = require('lodash/throttle');
const streamToPromise = require('stream-to-promise');

const { version } = require('../package.json');
const tryWithTimeout = require('./try-with-timeout');
const axios = require('./axios');
const sleep = require('./sleep');

const CANCEL = '__cancel__';

/**
 *
 *
 * @param {Stream} stream
 * @returns {Promise<string>}
 */
async function getErrorMessageFromStream(stream) {
  const str = await streamToString(stream);

  try {
    const json = JSON.parse(str);
    return json.error;
  } catch (error) {
    return str;
  }
}

/**
 *
 *
 * @param {*} stream
 * @return {Promise<string>}
 */
async function streamToString(stream) {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf-8');
}

/**
 *
 *
 * @param {*} url
 * @param {*} dest directory
 * @param {{
 *  timeout?: number; // unit: ms
 *  checkCanceled?: () => Promise<boolean>;
 *  onProgress?: any
 *  minProgressInterval?: number
 * }} [{ timeout = 600 * 1000, checkCanceled, data }={}]
 * @param {{}} context
 * @return {*}
 */
const downloadFile = async (
  url,
  dest,
  {
    timeout = 600 * 1000,
    minProgressInterval = 400,
    // eslint-disable-next-line no-promise-executor-return
    checkCanceled = () => new Promise((resolve) => resolve(false)),
    onProgress,
    delayTime = 0,
  } = {},
  context = {}
) => {
  const CONNECTION_TIMEOUT = 20 * 1000;
  const source = CancelToken.source();
  let isCancelled = false;

  try {
    return await tryWithTimeout(async () => {
      const timer = setTimeout(() => {
        source.cancel(`Connection timeout: ${Math.ceil(CONNECTION_TIMEOUT / 1000)}s`);
      }, CONNECTION_TIMEOUT);

      let fileStream;
      const cancelDownload = () => {
        isCancelled = true;
        clearTimeout(timer);
        source.cancel('Manual cancel');
        if (fileStream) {
          fileStream.destroy(new Error('Manual cancel'));
          fileStream = null;
        }
      };

      await sleep(delayTime);
      if (await checkCanceled()) {
        if (fs.existsSync(dest)) {
          fs.truncateSync(dest, 0);
          fs.rmSync(dest, { force: true });
        }
        return CANCEL;
      }
      const response = await axios({
        url,
        headers: merge(context?.headers || {}, {
          'User-Agent': `ABTNode/${version}`,
        }),
        method: 'GET',
        responseType: 'stream',
        cancelToken: source.token,
        timeout,
      });

      let t = Date.now();

      if (typeof onProgress === 'function') {
        const throttled = throttle(onProgress, minProgressInterval, { leading: false, trailing: true });
        const total = (response.headers || {})['content-length'] || 0;
        let current = 0;
        response.data.on('data', (chunk) => {
          current += chunk.length;
          // check every 2 seconds whether cancellation has been flagged in db-cache; if so, cancel the download
          if (Date.now() - t > 2000) {
            t = Date.now();
            checkCanceled().then((cancelled) => {
              if (cancelled) {
                cancelDownload();
              }
            });
          }
          try {
            throttled({ total, current });
          } catch {
            // do nothing
          }
        });
      }

      clearTimeout(timer);
      fileStream = response.data.pipe(fs.createWriteStream(dest));
      await streamToPromise(fileStream);

      if (await checkCanceled()) {
        if (fs.existsSync(dest)) {
          fs.truncateSync(dest, 0);
          fs.rmSync(dest, { force: true });
        }
        return CANCEL;
      }

      if (response.data.complete === false) {
        throw new Error('download incomplete');
      }

      if (isCancelled) {
        return CANCEL;
      }

      return dest;
    }, timeout);
  } catch (err) {
    if (fs.existsSync(dest)) {
      fs.truncateSync(dest, 0);
      fs.rmSync(dest, { force: true });
    }

    if (err.message === 'Manual cancel') {
      if (await checkCanceled()) {
        return CANCEL;
      }
      throw new Error('Manual stop abnormal');
    }

    source.cancel();

    if (err?.response?.data) {
      throw new Error(await getErrorMessageFromStream(err.response.data));
    }

    throw err;
  }
};

downloadFile.CancelCtrl = class {
  constructor() {
    this.isCancelled = false;
  }

  cancel() {
    throw new Error('This method should be rewrite inside downloadFile');
  }
};

downloadFile.CANCEL = CANCEL;

module.exports = downloadFile;
