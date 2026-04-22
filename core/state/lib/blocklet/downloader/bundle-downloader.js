const { EventEmitter } = require('events');
const fs = require('fs-extra');
const { fileURLToPath } = require('url');
const path = require('path');
const pick = require('lodash/pick');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const { toBase58 } = require('@ocap/util');

const defaultLogger = require('@abtnode/logger')('@abtnode/core:bundle-downloader');
const downloadFile = require('@abtnode/util/lib/download-file');

const { getComponentBundleId } = require('@blocklet/meta/lib/util');

const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const { verifyIntegrity } = require('../../util/blocklet');
const { resolveDownload } = require('./resolve-download');
const { CACHE_KEY } = require('./constants');

const lock = new DBCache(() => ({
  prefix: 'bundle-downloader-lock',
  ttl: 1000 * 10,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

class BundleDownloader extends EventEmitter {
  /**
   * @param {{
   *   cache: {
   *     set: (key: string, value: any) => Promise
   *     get: (key: string) => Promise<any>
   *   }
   *   getNodeInfo: () => Promise<{ enableDocker: boolean }>
   * }}
   */
  constructor({ installDir, downloadDir, cache, logger = defaultLogger, getNodeInfo }) {
    super();

    this.installDir = installDir;
    this.downloadDir = downloadDir;
    this.cache = cache;
    this.logger = logger;
    this.getNodeInfo = getNodeInfo;
    /**
     * { [download-did-version]: Lock }
     */
    this.downloadLocks = {};
  }

  /**
   *
   *
   * @param {*} meta
   * @param {*} rootDid
   * @param {*} url
   * @param {{}} [context={ nodeInfo: { enableDocker: boolean } }]
   * @return {*}
   * @memberof BlockletManager
   */
  async download(meta, rootDid, url, context = {}) {
    const { bundleName: name, bundleDid: did, title, version, dist = {} } = meta;
    const { tarball, integrity } = dist;

    const onProgress = context.onProgress || (() => {});
    const nodeInfo = await this.getNodeInfo();

    const lockName = `download-${did}-${version}`;
    await lock.acquire(lockName);
    try {
      this.logger.info('downloaded blocklet for installing', { name, version, tarball, integrity });
      const cwd = path.join(this.downloadDir, 'download', name);
      await fs.ensureDir(cwd);
      this.logger.info('start download blocklet', { name, version, cwd, tarball, integrity });
      onProgress({ status: 'downloading' });
      let tarballPath;
      try {
        tarballPath = await this._downloadTarball({
          name,
          did,
          version,
          cwd,
          tarball,
          integrity,
          verify: true,
          url,
          context,
          onProgress,
          rootDid,
        });
      } catch (error) {
        this.logger.error('download bundle failed', { did, title, version, url, error });
        throw error;
      }
      this.logger.info('downloaded blocklet tar file', { name, version, tarballPath });
      if (await this.isCanceled(rootDid)) {
        return { isCancelled: true };
      }

      // resolve tarball and mv tarball to cache after resolved
      await resolveDownload(tarballPath, this.installDir, {
        removeTarFile: false,
        nodeInfo,
        dist,
        onProgress: ({ name: _name }) => {
          onProgress({ status: 'extracting', name: _name });
        },
      });
      onProgress({ status: 'completed' });
      await this._addCacheTarFile(tarballPath, integrity, getComponentBundleId({ meta }));

      this.logger.info('resolved blocklet tar file to install dir', { name, version });
      return { isCancelled: false };
    } finally {
      await lock.releaseLock(lockName);
    }
  }

  // eslint-disable-next-line no-unused-vars
  cancelDownload = async (rootDid) => {
    await lock.groupSet('download-ctrl', rootDid, 'canceled');
  };

  isCanceled = async (rootDid) => {
    const canceled = await lock.groupGet('download-ctrl', rootDid);
    return canceled === 'canceled';
  };

  /**
   *
   *
   * @param {{
   *   url: string,
   *   cwd: string,
   *   tarball: string,
   *   did: string,
   *   integrity: string,
   *   verify: boolean = true,
   *   rootDid: string,
   *   context: {} = {},
   * }} { url, cwd, tarball, did, integrity, verify = true, rootDid, context = {} }
   * @return {*}
   * @memberof BlockletManager
   */
  async _downloadTarball({
    url,
    cwd,
    tarball,
    did,
    integrity,
    verify = true,
    context = {},
    onProgress = () => {},
    rootDid,
  }) {
    fs.mkdirSync(cwd, { recursive: true });

    const tarballName = url.split('/').slice(-1)[0];

    const tarballPath = path.join(cwd, tarballName);

    const { protocol } = new URL(url);

    const cachedTarFile = await this._getCachedTarFile(integrity);
    if (cachedTarFile) {
      this.logger.info('found cache tarFile', { did, tarballName, integrity });

      await lock.acquire('cache-tar-ball-lock');
      try {
        await fs.move(cachedTarFile, tarballPath, { overwrite: true });
      } catch (error) {
        this.logger.error('move cache tar file failed', { cachedTarFile, tarballPath, error });
        throw error;
      } finally {
        await lock.releaseLock('cache-tar-ball-lock');
      }
    } else if (protocol.startsWith('file')) {
      await fs.copy(decodeURIComponent(fileURLToPath(url)), tarballPath);
    } else {
      const headers = pick(context.headers ? cloneDeep(context.headers) : {}, [
        'x-server-did',
        'x-server-public-key',
        'x-server-signature',
      ]);
      const exist = (context.downloadTokenList || []).find((x) => x.did === did);
      if (exist) {
        headers['x-download-token'] = exist.token;
      }

      await downloadFile(
        url,
        path.join(cwd, tarballName),
        {
          checkCanceled: () => this.isCanceled(rootDid),
          onProgress: ({ total, current }) => {
            onProgress({ status: 'downloading', total, current });
          },
        },
        {
          ...context,
          headers,
        }
      );
    }

    if (verify) {
      try {
        await verifyIntegrity({ file: tarballPath, integrity });
      } catch (error) {
        this.logger.error('verify integrity error', { error, tarball, url });
        throw new Error(`${tarball} integrity check failed.`);
      }
    }

    return tarballPath;
  }

  /**
   * use LRU algorithm
   */
  async _addCacheTarFile(tarballPath, integrity, bundleId) {
    // eslint-disable-next-line no-param-reassign
    integrity = toBase58(integrity);

    // move tarball to cache dir
    const cwd = path.join(this.downloadDir, 'download-cache');
    const cachePath = path.join(cwd, `${integrity}.tar.gz`);
    await fs.ensureDir(cwd);
    await fs.move(tarballPath, cachePath, { overwrite: true });

    const cacheList = (await this.cache.get(CACHE_KEY)) || [];
    const exist = cacheList.find((x) => x.bundleId === bundleId && x.integrity === integrity);

    // update
    if (exist) {
      this.logger.info('update cache tarFile', { base58: integrity });
      exist.accessAt = Date.now();
      await this.cache.set(CACHE_KEY, cacheList);
      return;
    }

    // add
    cacheList.push({ integrity, accessAt: Date.now(), bundleId });
    if (cacheList.length > 50) {
      // find and remove
      let minIndex = 0;
      let min = cacheList[0];
      cacheList.forEach((x, i) => {
        if (x.accessAt < min.accessAt) {
          minIndex = i;
          min = x;
        }
      });

      cacheList.splice(minIndex, 1);

      const removeFile = path.join(cwd, `${min.integrity}.tar.gz`);
      await lock.acquire('cache-tar-ball-lock');
      try {
        await fs.remove(removeFile);
      } catch (error) {
        this.logger.error('remove cache tar file failed', { file: removeFile, error });
      } finally {
        await lock.releaseLock('cache-tar-ball-lock');
      }

      this.logger.info('remove cache tarFile', { base58: min.integrity });
    }
    this.logger.info('add cache tarFile', { base58: integrity });

    // update
    await this.cache.set(CACHE_KEY, cacheList);
  }

  _getCachedTarFile(integrity) {
    // eslint-disable-next-line no-param-reassign
    integrity = toBase58(integrity);

    const cwd = path.join(this.downloadDir, 'download-cache');
    const cachePath = path.join(cwd, `${integrity}.tar.gz`);

    if (fs.existsSync(cachePath)) {
      return cachePath;
    }

    return null;
  }
}

module.exports = BundleDownloader;
