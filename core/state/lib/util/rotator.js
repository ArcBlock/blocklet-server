/**
 * Base on: https://github.com/keymetrics/pm2-logrotate
 */
const fs = require('fs-extra');
const path = require('path');
const dayjs = require('@abtnode/util/lib/dayjs');
const zlib = require('zlib');
const log = require('@abtnode/logger');

const buildLogger =
  (func) =>
  (...args) => {
    if (typeof args[0] === 'string') {
      func(`pm2.log.rotate.${args[0]}`, ...args.slice(1));
      return;
    }

    func('pm2.log.rotate', ...args);
  };

// eslint-disable-next-line no-console
const logInfo = buildLogger(console.info);
const logError = buildLogger(console.error);

module.exports = class LogRotate {
  constructor({ compress, dateFormat, tz, retain } = {}) {
    this.compress = compress;
    this.dateFormat = dateFormat;
    this.tz = tz;
    this.retain = retain;
    this.compressedFileFormat = '.gz';
  }

  getLimitSize(maxSize) {
    if (!maxSize) {
      return 1024 * 1024 * 10; // 10M
    }

    if (typeof maxSize === 'number') {
      return maxSize;
    }

    if (typeof maxSize !== 'string') {
      throw new Error('maxSize must be a string or number');
    }

    // eslint-disable-next-line no-param-reassign
    maxSize = maxSize.trim();

    const unit = maxSize[maxSize.length - 1].toUpperCase();
    if (unit === 'G') {
      return parseInt(maxSize, 10) * 1024 * 1024 * 1024;
    }

    if (unit === 'M') {
      return parseInt(maxSize, 10) * 1024 * 1024;
    }

    if (unit === 'K') {
      return parseInt(maxSize, 10) * 1024;
    }

    return parseInt(maxSize, 10);
  }

  /**
   * Apply the rotation process of the log file.
   *
   * @param {string} file
   */
  proceed(file, callback = () => {}) {
    // set default final time
    let finalTime = dayjs().subtract(1, 'day').format(this.dateFormat);
    // check for a timezone
    if (this.tz) {
      try {
        finalTime = dayjs().tz(this.tz).subtract(1, 'day').format(this.dateFormat);
      } catch (err) {
        // use default
      }
    }

    const filename = path.basename(file, path.extname(file));
    const dirname = path.dirname(file);
    const extName = this.compress ? `.log${this.compressedFileFormat}` : '.log';

    let finalName = `${path.join(dirname, filename)}-${finalTime}${extName}`;

    // 这种情况是为了兼容，之间的日志文件名中的日志大了一天，所以升级时旧数据可能存在重复
    if (fs.existsSync(finalName)) {
      finalName = `${path.join(dirname, filename)}-${finalTime}.1${extName}`;
    }

    // if compression is enabled, add gz extention and create a gzip instance
    let GZIP;
    if (this.compress) {
      GZIP = zlib.createGzip({
        level: zlib.constants.Z_BEST_COMPRESSION,
        memLevel: zlib.constants.Z_BEST_COMPRESSION,
      });
    }

    // create our read/write streams
    const readStream = fs.createReadStream(file);
    const writeStream = fs.createWriteStream(finalName, { flags: 'w+' });

    // pipe all stream
    if (this.compress) {
      readStream.pipe(GZIP).pipe(writeStream);
    } else {
      readStream.pipe(writeStream);
    }

    const onError = (err) => {
      if (GZIP) {
        GZIP.close();
      }
      readStream?.close();
      writeStream?.close();

      logError(err);
      callback(err);
    };

    // listen for error
    readStream.on('error', onError);
    writeStream.on('error', onError);
    if (this.compression) {
      GZIP.on('error', onError);
    }

    // when the read is done, empty the file and check for retain option
    writeStream.on('finish', () => {
      if (GZIP) {
        GZIP.close();
      }
      readStream?.close();
      writeStream?.close();

      fs.truncateSync(file);
      logInfo('rotated file:', finalName);

      callback(null, finalName);
    });
  }

  proceedSync(file) {
    return new Promise((resolve, reject) => {
      this.proceed(file, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    });
  }

  /**
   * Apply the rotation process if the `file` size exceeds the `SIZE_LIMIT`.
   *
   * @param {string} file
   */
  async proceedFile(file) {
    if (!fs.existsSync(file)) {
      return;
    }

    if (fs.statSync(file).size > 0) {
      await this.proceedSync(file);
    }

    log.deleteOldLogfiles(file, this.retain);
  }

  /**
   * Apply the rotation process of all log files of `app` where the file size exceeds the`SIZE_LIMIT`.
   *
   * @param {Object} app
   */
  async proceedPm2App(app) {
    // Check all log path
    // Note: If same file is defined for multiple purposes, it will be processed once only.
    if (app.pm2_env.pm_out_log_path) {
      await this.proceedFile(app.pm2_env.pm_out_log_path);
    }

    if (app.pm2_env.pm_err_log_path && app.pm2_env.pm_err_log_path !== app.pm2_env.pm_out_log_path) {
      await this.proceedFile(app.pm2_env.pm_err_log_path);
    }

    if (
      app.pm2_env.pm_log_path &&
      app.pm2_env.pm_log_path !== app.pm2_env.pm_out_log_path &&
      app.pm2_env.pm_log_path !== app.pm2_env.pm_err_log_path
    ) {
      await this.proceedFile(app.pm2_env.pm_log_path);
    }
  }
};
