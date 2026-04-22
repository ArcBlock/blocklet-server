const fastFolderSize = require('fast-folder-size');
const { promisify } = require('util');
const getSize = require('get-folder-size');

const fastFolderSizeAsync = promisify(fastFolderSize);

const getOnWindows = (dir) => {
  return new Promise((resolve, reject) => {
    getSize(dir, (err, size) => {
      if (err) {
        return reject(err);
      }

      return resolve(size);
    });
  });
};

module.exports = process.platform === 'win32' ? getOnWindows : fastFolderSizeAsync;
