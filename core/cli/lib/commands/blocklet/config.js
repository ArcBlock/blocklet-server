const chalk = require('chalk');
const $get = require('lodash/get');
const { fromSecretKey } = require('@ocap/wallet');
const { isValid } = require('@arcblock/did');

const Config = require('../../util/blocklet/config');
const { print, printSuccess, printError } = require('../../util');

const getConfig = (profile) => {
  return new Config({ configFile: process.env.ABT_NODE_CONFIG_FILE, section: profile === 'default' ? '' : profile });
};

const getProfile = (command) => $get(command, 'parent._optionValues.profile') || $get(command, '_optionValues.profile');

const whiteList = ['store', 'accessToken', 'registry', 'developerDid', 'name', 'email'];

function validate(key, value) {
  const validatorMap = {
    store: (v) => {
      // Validate that the value is a valid URL using http or https, e.g. https://store.blocklet.dev/
      if (/^((https?):\/\/)[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/.test(v)) {
        return true;
      }
      print('Invalid store url:', v);
      return false;
    },
    // TODO: remove this in the future
    registry(...args) {
      return validatorMap.store(...args);
    },
    accessToken: (v) => {
      try {
        fromSecretKey(v);
      } catch {
        print('Invalid access token:', v);
        return false;
      }
      return true;
    },
    developerDid: (v) => {
      try {
        return isValid(v);
      } catch {
        return false;
      }
    },
  };
  const fn = validatorMap[key] || (() => true);
  return fn(value);
}

function set(key, value, options, command) {
  if (whiteList.includes(key)) {
    if (validate(key, value)) {
      getConfig(getProfile(command)).set(key, value);
      printSuccess(`Config ${key} successfully`);
      process.exit(0);
    } else {
      printError(`Unexpected config value ${value} for ${key}`);
      process.exit(1);
    }
  } else {
    printError(`Support config keys are: ${whiteList.join(', ')}`);
    process.exit(1);
  }
}

function get(key, options, command) {
  print(Config.stringify(getConfig(getProfile(command)).get(key)));
  process.exit(0);
}

function list(options, command) {
  const profile = getProfile(command);
  const config = getConfig(profile).get();
  if (config) {
    print(Config.stringify(config));
  } else {
    print(`No config found for profile ${chalk.cyan(profile)}`);
  }
  process.exit(0);
}

function unset(key, options, command) {
  getConfig(getProfile(command)).unset(key);
  print(`Delete config ${key} successfully`);
  process.exit(0);
}

module.exports = {
  set,
  get,
  list,
  del: unset,
  delete: unset,

  run: (command, options) => {
    const [key, value] = options.args;

    if (typeof key === 'undefined') {
      list(key, command);
    } else if (typeof value !== 'undefined') {
      set(key, value, command);
    } else {
      get(key, command);
    }
  },
};
