const { BLOCKLET_LAUNCHER_URL, BLOCKLET_STORE, BLOCKLET_STORE_DEV, BLOCKLET_TEST_STORE } = require('@abtnode/constant');
const canPackageReadWrite = require('@abtnode/util/lib/can-pkg-rw');

const getDefaultAutoUpgrade = () => {
  try {
    // eslint-disable-next-line no-use-before-define
    return canPackageReadWrite(process.env.ABT_NODE_BINARY_NAME, process.env.ABT_NODE_PACKAGE_NAME);
  } catch (err) {
    return false;
  }
};

const defaultNodeConfigs = {
  autoUpgrade: {
    getDefaultValue: getDefaultAutoUpgrade,
  },
  blockletRegistryList: {
    getDefaultValue: () => [
      {
        ...BLOCKLET_STORE,
        protected: true,
      },
      {
        ...BLOCKLET_STORE_DEV,
        protected: false,
      },
      {
        ...BLOCKLET_TEST_STORE,
        protected: false,
      },
    ],
  },
  registerUrl: { getDefaultValue: () => BLOCKLET_LAUNCHER_URL },
};

const lib = {
  get: async () => {
    const configs = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const key of Object.keys(defaultNodeConfigs)) {
      // eslint-disable-next-line no-await-in-loop
      configs[key] = await defaultNodeConfigs[key].getDefaultValue();
    }

    return configs;
  },
  getDefaultAutoUpgrade,
  defaultNodeConfigs,
};

module.exports = lib;
