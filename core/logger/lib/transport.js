const { transports } = require('winston');
require('@abtnode/winston-daily-rotate-file');

module.exports = class CustomRotateFileTransport extends transports.DailyRotateFile {
  constructor(opts) {
    super(opts);

    if (opts.ignoreLevels) {
      this.ignoreLevels = Array.isArray(opts.ignoreLevels) ? opts.ignoreLevels : [opts.ignoreLevels];
    } else {
      this.ignoreLevels = [];
    }
  }

  log(info, callback) {
    if ((this.ignoreLevels || []).includes(info.level)) {
      callback();
      return;
    }

    super.log(info, callback);
  }
};
