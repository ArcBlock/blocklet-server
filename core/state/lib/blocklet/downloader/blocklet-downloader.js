const { EventEmitter } = require('events');
const fs = require('fs-extra');
const path = require('path');
const get = require('lodash/get');
const pick = require('lodash/pick');
const { toBase58 } = require('@ocap/util');
const pAll = require('p-all');

const defaultLogger = require('@abtnode/logger')('@abtnode/core:blocklet-downloader');

const { forEachComponentV2Sync, getComponentBundleId } = require('@blocklet/meta/lib/util');

const { BlockletSource, BLOCKLET_META_FILE, BLOCKLET_META_FILE_ALT, BLOCKLET_MODES } = require('@blocklet/constant');

const { getBundleDir } = require('../../util/blocklet');
const BundleDownloader = require('./bundle-downloader');
const { CACHE_KEY } = require('./constants');

const isSourceAccessible = (blocklet) =>
  ![BlockletSource.upload, BlockletSource.local, BlockletSource.custom].includes(blocklet.source);

const isMetaFileExist = (dir) => {
  const blockletMetaFile = path.join(dir, BLOCKLET_META_FILE);
  const blockletMetaFileAlt = path.join(dir, BLOCKLET_META_FILE_ALT);

  return fs.existsSync(blockletMetaFile) || fs.existsSync(blockletMetaFileAlt);
};

/**
 * @param {blocklet} component
 * @param {{
 *   cachedBundles: Array<{bundleId, integrity}>;
 * }}
 * @returns {boolean}
 */
const needDownload = (
  component,
  { installDir, logger = defaultLogger, cachedBundles = [], skipCheckIntegrity } = {}
) => {
  if (component.mode === BLOCKLET_MODES.DEVELOPMENT) {
    return false;
  }

  if (component.source === BlockletSource.local) {
    return false;
  }

  const bundleId = getComponentBundleId(component);
  const bundleDir = getBundleDir(installDir, component.meta);

  // check bundle exist

  if (!isMetaFileExist(bundleDir)) {
    return true;
  }

  if (!isSourceAccessible(component)) {
    return false;
  }

  if (skipCheckIntegrity) {
    return false;
  }

  // check integrity

  const cachedBundle = cachedBundles.find((x) => x.bundleId === bundleId);

  // FIXME: 不是新安装的组件不应该 check, 不应该 block 安装成功 https://github.com/blocklet/launcher/actions/runs/4184577090/jobs/7250416272
  if (!cachedBundle) {
    return true;
  }

  const integrity = get(component, 'meta.dist.integrity');
  if (toBase58(integrity) === cachedBundle.integrity) {
    return false;
  }

  logger.error(`find duplicate bundle with different integrity when downloading ${component.meta.title}`, {
    bundleId,
  });
  return true;
};

class BlockletDownloader extends EventEmitter {
  /**
   * @param {{
   *   installDir: string,
   *   downloadDir: string,
   *   cache: {
   *     set: (key: string, value: any) => Promise
   *     get: (key: string) => Promise<any>
   *   },
   *   getNodeInfo: () => Promise<{ enableDocker: boolean }>
   * }}
   */
  constructor({ installDir, downloadDir, cache, logger = defaultLogger, getNodeInfo }) {
    super();

    this.installDir = installDir;
    this.cache = cache;
    this.logger = logger;

    this.bundleDownloader = new BundleDownloader({
      installDir,
      downloadDir,
      cache,
      getNodeInfo,
    });
  }

  /**
   * @param {{}} blocklet
   * @param {{
   *   preDownload: ({ downloadList: Array<meta>, downloadComponentIds: Array<string> }) => any
   *   postDownload: ({ downloadList: Array<meta>, downloadComponentIds: Array<string>, isCancelled: boolean }) => any
   *   onProgress: ({ step?: string, ...extras }) => any
   *   skipCheckIntegrity: boolean
   * }} [options={}]
   * @return {*}
   */
  async download(blocklet, options = {}) {
    const {
      meta: { name, title, did },
    } = blocklet;

    this.logger.info('Download Blocklet', { name, did });

    const { preDownload = () => {}, postDownload = () => {}, skipCheckIntegrity, onProgress = () => {} } = options;

    const { downloadComponentIds, downloadList, skipList } = await this.getDownloadList({
      blocklet,
      skipCheckIntegrity,
    });

    await preDownload({ downloadList, downloadComponentIds });

    try {
      // Fake progress events for cached bundles
      skipList.forEach((meta) => {
        const info = pick(meta, ['title', 'name', 'did', 'version']);
        onProgress({ status: 'downloading', component: info });
        setTimeout(
          () => {
            onProgress({ status: 'completed', component: info });
          },
          process.env.NODE_ENV === 'test' ? 0 : Math.random() * 800
        );
      });

      this.logger.info('Start Download Blocklet', {
        name,
        did,
        bundles: downloadList.map((x) => get(x, 'dist.tarball')),
      });

      await pAll(
        downloadList.map((meta) => {
          return () => {
            const url = meta.dist.tarball;
            return this.bundleDownloader.download(meta, did, url, {
              ...options,
              onProgress: (data) => {
                onProgress({ ...data, component: pick(meta, ['title', 'name', 'did', 'version']) });
              },
            });
          };
        }),
        4
      );

      const isCancelled = await this.bundleDownloader.isCanceled(did);

      await postDownload({ downloadList, downloadComponentIds, isCancelled });

      if (isCancelled) {
        return { isCancelled: true };
      }
    } catch (error) {
      this.logger.error('Download blocklet failed', { did, name, title, error });
      await this.bundleDownloader.cancelDownload(blocklet.meta.did);
      throw error;
    }

    return { isCancelled: false };
  }

  cancelDownload(did) {
    return this.bundleDownloader.cancelDownload(did);
  }

  /**
   * @param {{
   *   blocklet;
   * }}
   * @returns {{
   *   downloadList: Array<import('@blocklet/server-js').BlockletMeta>;
   *   skipList: Array<import('@blocklet/server-js').BlockletMeta>;
   *   downloadComponentIds: Array<string>; // like: "z8ia1i2yq67x39vruqQTbkVcwCnqRGx8zSPsJ/z8iZwubkNdA1BfEUwc5NJpY2Jnfm7yEbyvmKS"
   * }}
   */
  async getDownloadList({ blocklet, skipCheckIntegrity }) {
    const downloadComponentIds = [];
    const scheduled = {};
    const skipped = {};

    const cachedBundles = (await this.cache.get(CACHE_KEY)) || [];

    const handle = (component) => {
      const bundleId = getComponentBundleId(component);

      if (scheduled[bundleId]) {
        this.logger.info(`skip download duplicate bundle ${bundleId}`);
        return;
      }

      const needComponentDownload = needDownload(component, {
        installDir: this.installDir,
        cachedBundles,
        skipCheckIntegrity,
      });
      if (!needComponentDownload) {
        skipped[bundleId] = component.meta;
        this.logger.info(`skip download existed bundle ${bundleId}`, { source: component.source });
        return;
      }

      if (!isSourceAccessible(component)) {
        // should not throw error
        // broken bundle should not block blocklet installing
        // broken bundle should only block blocklet starting
        this.logger.error(`Component bundle is broken and can not be recovered: ${bundleId}`);
        return;
      }

      scheduled[bundleId] = component.meta;
      downloadComponentIds.push(component.meta.did);
    };

    handle(blocklet);
    forEachComponentV2Sync(blocklet, handle);

    const downloadList = Object.values(scheduled);
    const skipList = Object.values(skipped);

    return { downloadList, skipList, downloadComponentIds };
  }
}

module.exports = BlockletDownloader;
