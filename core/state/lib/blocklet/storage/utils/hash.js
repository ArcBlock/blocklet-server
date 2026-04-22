const { existsSync, move, createReadStream, remove } = require('fs-extra');
const hasha = require('hasha');
const logger = require('@abtnode/logger')('@abtnode/core:storage.utils.hash');

/**
 *
 *
 * @param {NodeJS.ReadableStream} stream1
 * @param {NodeJS.ReadableStream} stream2
 * @return {Promise<boolean>}
 */
async function compareHash(stream1, stream2) {
  const hash1 = await hasha.fromStream(stream1, {
    algorithm: 'md5',
  });
  const hash2 = await hasha.fromStream(stream2, {
    algorithm: 'md5',
  });

  return hash1 === hash2;
}

/**
 *
 * @description 比对新文件和旧文件的hash，旧文件不存在或者hash不同时，使用新文件替换，hash相同，删除新文件
 * @param {string} target
 * @param {string} source
 * @returns {Promise<boolean>}
 */
async function compareAndMove(source, target) {
  if (!existsSync(source)) {
    logger.warn(`Source(${source}) not found`);
    return;
  }

  if (!existsSync(target)) {
    await move(source, target, { overwrite: true });
    return;
  }

  const isSame = await compareHash(createReadStream(source), createReadStream(target));
  if (isSame) {
    await remove(source);
    return;
  }

  await move(source, target, { overwrite: true });
}

module.exports = {
  compareHash,
  compareAndMove,
};
