/* eslint-disable no-underscore-dangle */
const fs = require('fs-extra');
const ini = require('ini');
const get = require('lodash/get');

class Config {
  constructor({ configFile, section } = {}) {
    if (!configFile) {
      throw new Error('configFile argument is required');
    }

    fs.ensureFileSync(configFile);
    this.configFile = configFile;

    this.config = ini.parse(fs.readFileSync(configFile).toString());
    this.section = section;
  }

  set(key, value) {
    if (this.section) {
      this.config[this.section] = this.config[this.section] === undefined ? {} : this.config[this.section];
      this.config[this.section][key] = value;
    } else {
      this.config[key] = value;
    }

    this._write();
  }

  unset(key) {
    if (this.section) {
      delete this.config[this.section][key];
    } else {
      delete this.config[key];
    }
    this._write();
  }

  get(key, defaultValue) {
    // TODO: Consider whether sensitive fields (e.g. secretKey) should be protected/masked here
    return this._get(key, defaultValue);
  }

  setSection(section) {
    this.section = section;
  }

  _write() {
    fs.writeFileSync(this.configFile, ini.stringify(this.config));
  }

  _get(key, defaultValue) {
    let result = this.config;
    if (this.section) {
      result = result[this.section];
    }

    if (!key) {
      return result;
    }

    return get(result, key, defaultValue);
  }
}

Config.stringify = (value) => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'undefined') {
    return undefined;
  }

  return ini.stringify(value);
};

module.exports = Config;
