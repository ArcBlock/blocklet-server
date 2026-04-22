const archiver = require('archiver');
const { ensureDirSync, existsSync, removeSync, createWriteStream } = require('fs-extra');
const { dirname } = require('path');
const StreamZip = require('node-stream-zip');

/**
 *
 *
 * @param {string} source ~/abc/ usually a directory
 * @param {string} target abc.zip name of the zip archive
 * @return {*}
 */
function dirToZip(source, target) {
  return new Promise((resolve, reject) => {
    ensureDirSync(dirname(target));

    if (existsSync(target)) {
      removeSync(target);
    }

    const output = createWriteStream(target);
    const archive = archiver('zip', { level: 9 });
    archive.on('error', (err) => reject(err));
    output.on('close', () => resolve());

    archive.directory(source, false);

    archive.pipe(output);
    archive.finalize();
  });
}

async function zipToDir(source, target) {
  // eslint-disable-next-line new-cap
  const zip = new StreamZip.async({ file: source });
  await zip.extract(null, target);
  await zip.close();
}

module.exports = {
  dirToZip,
  zipToDir,
};
