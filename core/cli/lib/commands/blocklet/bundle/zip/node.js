/* eslint-disable no-use-before-define */
/* eslint-disable func-names */
const { stat } = require('fs');
const { dirname, normalize, sep } = require('path');

const commonPathPrefix = require('common-path-prefix');
const unixify = require('unixify');
const { promisify } = require('util');

const { startZip, addZipFile, endZip } = require('./archive');

const pStat = promisify(stat);

// zip a Node.js function file
const zipNodeJs = async function (srcFiles, destPath) {
  const { archive, output } = startZip(destPath);

  const dirnames = srcFiles.map(dirname);
  const commonPrefix = commonPathPrefix(dirnames);

  const srcFilesInfos = await Promise.all(srcFiles.map(addStat));

  // We ensure this is not async, so that the archive's checksum is
  // deterministic. Otherwise it depends on the order the files were added.
  // eslint-disable-next-line no-shadow
  srcFilesInfos.forEach(({ srcFile, stat }) => {
    zipJsFile({ srcFile, commonPrefix, archive, stat });
  });

  await endZip(archive, output);

  return commonPrefix;
};

const addStat = async function (srcFile) {
  // eslint-disable-next-line no-shadow
  const stat = await pStat(srcFile);
  return { srcFile, stat };
};

// eslint-disable-next-line no-shadow
const zipJsFile = function ({ srcFile, commonPrefix, archive, stat }) {
  const filename = normalizeFilePath(srcFile, commonPrefix);
  addZipFile(archive, srcFile, filename, stat);
};

// `adm-zip` and `require()` expect Unix paths.
// We remove the common path prefix.
// With files on different Windows drives, we remove the drive letter.
const normalizeFilePath = function (path, commonPrefix) {
  const pathA = normalize(path);
  const pathB = pathA.replace(commonPrefix, `${ZIP_ROOT_DIR}${sep}`);
  const pathC = unixify(pathB);
  return pathC;
};

const ZIP_ROOT_DIR = '.';

module.exports = { zipNodeJs, ZIP_ROOT_DIR };
