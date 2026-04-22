/* eslint-disable consistent-return */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

function getFilename(req, file, cb) {
  crypto.randomBytes(16, (err, raw) => {
    cb(err, err ? undefined : raw.toString('hex'));
  });
}

function getDestination(req, file, cb) {
  cb(null, os.tmpdir());
}

function DiskStorage(opts) {
  this.getFilename = opts.filename || getFilename;
  this.getDestination = opts.destination || getDestination;
}

// A better version from https://github.com/expressjs/multer/blob/master/storage/disk.js
// Because it stores the file with the content hash
DiskStorage.prototype._handleFile = function _handleFile(req, file, cb) {
  const that = this;
  const hash = crypto.createHash('md5');

  that.getDestination(req, file, (err, destination) => {
    if (err) return cb(err);

    that.getFilename(req, file, (e, filename) => {
      if (e) return cb(e);

      let finalPath = path.join(destination, filename);
      const outStream = fs.createWriteStream(finalPath);

      file.stream.pipe(outStream);
      file.stream.on('data', x => hash.update(x));

      outStream.on('error', cb);
      outStream.on('finish', () => {
        const md5 = hash.digest('hex').toLowerCase();
        const finalName = md5 + path.extname(file.originalname);
        const oldPath = finalPath;
        finalPath = path.join(destination, finalName);

        fs.rename(oldPath, finalPath, () => {
          cb(null, {
            destination,
            filename: finalName,
            path: finalPath,
            size: outStream.bytesWritten,
          });
        });
      });
    });
  });
};

DiskStorage.prototype._removeFile = function _removeFile(req, file, cb) {
  const filePath = file.path;
  delete file.destination;
  delete file.filename;
  delete file.path;

  fs.unlink(filePath, cb);
};

module.exports = DiskStorage;
