const path = require('path');
const fs = require('fs-extra');
const { Throttle } = require('stream-throttle');
const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const { BLOCKLET_BUNDLE_FOLDER } = require('@blocklet/constant');

const defaultLogger = require('@abtnode/logger')('@abtnode/core:resolve-download');

const { getBlockletMeta } = require('../../util');

const { ensureBlockletExpanded, expandTarball, getBundleDir } = require('../../util/blocklet');

const asyncFs = fs.promises;

const removeLock = new DBCache(() => ({
  prefix: 'resolve-download-lock',
  ttl: 1000 * 60 * 5,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

/**
 * decompress file, format dir and move to installDir
 * @param {string} src file
 * @param {{
 *   removeTarFile: boolean;
 *   logger;
 *   nodeInfo: { enableDocker: boolean };
 * }} option
 */
const resolveDownload = async (
  tarFile,
  distDir,
  { removeTarFile = true, logger = defaultLogger, onProgress, dist } = {}
) => {
  const downloadDir = path.join(path.dirname(tarFile), path.basename(tarFile, path.extname(tarFile)));
  const tmp = `${downloadDir}-tmp`;
  try {
    if (typeof onProgress === 'function') {
      onProgress({ name: 'blocklet.tar.gz' });
    }
    await expandTarball({ source: tarFile, dest: tmp, strip: 0 });
  } catch (error) {
    logger.error('expand blocklet tar file error', { error });
    throw error;
  } finally {
    if (removeTarFile) {
      fs.removeSync(tarFile);
    }
  }
  let installDir;
  let meta;
  try {
    // resolve dir
    let dir = tmp;
    const files = await asyncFs.readdir(dir);
    if (files.includes('package')) {
      dir = path.join(tmp, 'package');
    } else if (files.length === 1) {
      const d = path.join(dir, files[0]);
      if ((await asyncFs.stat(d)).isDirectory()) {
        dir = d;
      }
    }

    if (fs.existsSync(path.join(dir, BLOCKLET_BUNDLE_FOLDER))) {
      dir = path.join(dir, BLOCKLET_BUNDLE_FOLDER);
    }

    logger.info('Move expandDir to downloadDir', { expandDir: dir, downloadDir });
    await fs.move(dir, downloadDir, { overwrite: true });
    fs.removeSync(tmp);

    meta = getBlockletMeta(downloadDir);
    if (dist?.integrity) {
      meta.dist = dist;
    }
    const { name, version } = meta;

    if (typeof onProgress === 'function') {
      onProgress({ name: 'blocklet.zip' });
    }
    installDir = getBundleDir(distDir, meta);
    await removeLock.acquire(installDir);

    await ensureBlockletExpanded(meta, downloadDir);

    if (fs.existsSync(installDir)) {
      await fs.remove(installDir);
      logger.info('cleanup blocklet upgrade dir', { name, version, installDir });
    }

    // 确保父目录存在，但不创建目标目录本身
    await fs.ensureDir(path.dirname(installDir));
    logger.info('Move downloadDir to installDir with full', { downloadDir, installDir, dist: meta.dist });
    await fs.move(downloadDir, installDir, { overwrite: true, recursive: true });
  } catch (error) {
    await fs.remove(downloadDir);
    await fs.remove(tmp);
    throw error;
  } finally {
    if (installDir) {
      await removeLock.releaseLock(installDir);
    }
  }

  return { meta, installDir };
};

const resolveDiffDownload = async (
  tarFile,
  distDir,
  { meta: oldMeta, deleteSet, cwd = '/', logger = defaultLogger, dist } = {}
) => {
  // eslint-disable-next-line no-param-reassign
  tarFile = path.join(cwd, tarFile);
  // eslint-disable-next-line no-param-reassign
  distDir = path.join(cwd, distDir);

  logger.info('Resolve diff download', { tarFile, cwd });
  const downloadDir = path.join(path.dirname(tarFile), path.basename(tarFile, path.extname(tarFile)));
  let diffDir = `${downloadDir}-diff`;
  const baseDiffDir = diffDir;
  try {
    await expandTarball({ source: tarFile, dest: diffDir, strip: 0 });
    fs.removeSync(tarFile);
  } catch (error) {
    fs.removeSync(tarFile);
    logger.error('expand blocklet tar file error', { error });
    throw error;
  }
  if (
    !fs.existsSync(path.join(diffDir, 'blocklet.yml')) &&
    fs.existsSync(path.join(diffDir, 'package', 'blocklet.yml'))
  ) {
    diffDir = path.join(diffDir, 'package');
  }
  logger.info('Copy installDir to downloadDir', { installDir: distDir, downloadDir });
  await fs.copy(getBundleDir(distDir, oldMeta), downloadDir);
  let installDir;
  try {
    // delete
    logger.info('Delete files from downloadDir', { fileNum: deleteSet.length });
    // eslint-disable-next-line no-restricted-syntax
    for (const file of deleteSet) {
      /* eslint-disable no-await-in-loop */
      await fs.remove(path.join(downloadDir, file));
    }
    // walk & cover
    logger.info('Move files from diffDir to downloadDir', { diffDir, downloadDir });
    const walkDiff = async (dir) => {
      const files = await asyncFs.readdir(dir);
      // eslint-disable-next-line no-restricted-syntax
      for (const file of files) {
        const p = path.join(dir, file);
        const stat = await asyncFs.stat(p);
        if (stat.isDirectory()) {
          await walkDiff(p);
        } else if (stat.isFile()) {
          await fs.move(p, path.join(downloadDir, path.relative(diffDir, p)), { overwrite: true });
        }
      }
    };
    await walkDiff(diffDir);
    await fs.remove(baseDiffDir);
    const meta = getBlockletMeta(downloadDir);
    if (dist?.integrity) {
      meta.dist = dist;
    }

    installDir = getBundleDir(distDir, meta);
    await removeLock.acquire(installDir);
    await ensureBlockletExpanded(meta, downloadDir);
    // move to installDir
    logger.info('Move downloadDir to installDir with diff', { downloadDir, installDir });
    await fs.move(downloadDir, installDir, { overwrite: true, recursive: true });

    return { meta, installDir };
  } catch (error) {
    if (installDir) {
      await removeLock.releaseLock(installDir);
    }
    await fs.remove(downloadDir);
    await fs.remove(diffDir);
    throw error;
  }
};

/**
 * const { filename, mimetype, encoding, createReadStream } = await uploader;
 */
const downloadFromUpload = async (uploader, { downloadDir, logger = defaultLogger } = {}) => {
  const cwd = downloadDir;
  const { filename, createReadStream } = await uploader;
  const tarFile = path.join(cwd, `${path.basename(filename, path.extname(filename))}.tgz`);
  await fs.ensureDir(cwd);
  await new Promise((resolve, reject) => {
    const readStream = createReadStream();
    const writeStream = fs.createWriteStream(tarFile);
    readStream
      .pipe(new Throttle({ rate: 1024 * 1024 * 20 })) // 20MB
      .pipe(writeStream);
    readStream.on('error', (error) => {
      logger.error('File upload read stream failed', { error });
      writeStream.destroy(new Error(`File upload read stream failed, ${error.message}`));
    });
    writeStream.on('error', (error) => {
      logger.error('File upload write stream failed', { error });
      fs.removeSync(tarFile);
      reject(error);
    });
    writeStream.on('finish', resolve);
  });

  return { tarFile };
};

module.exports = {
  resolveDownload,
  resolveDiffDownload,
  downloadFromUpload,
};
