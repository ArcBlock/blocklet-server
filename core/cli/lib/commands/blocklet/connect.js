/* eslint-disable global-require */
const chalk = require('chalk');
const { createConnect } = require('@blocklet/store');
const { getStoreUrl } = require('@abtnode/core/lib/util/store');
const isUndefined = require('lodash/isUndefined');
const open = require('open');
const validUrl = require('valid-url');
const inquirer = require('inquirer');
const { printError, printInfo, printSuccess, getCLIBinaryName } = require('../../util');
const Config = require('../../util/blocklet/config');
const { wrapSpinner } = require('../../ui');

/**
 *
 * @description Prompt the user to confirm whether to overwrite the existing store URL.
 *              Pressing Enter or 'y' overwrites; any other input cancels.
 * @see https://www.npmjs.com/package/inquirer
 * @see https://github.com/SBoudrias/Inquirer.js/blob/0053e3f5694a4f75c4901512ab87e8906d1d7896/packages/inquirer/examples/pizza.js
 * @default false
 * @return {boolean}
 */
async function confirmOverwriteStoreUrl() {
  const { isRewriteStore } = await inquirer.prompt([
    {
      name: 'isRewriteStore',
      type: 'confirm',
      default: false,
      message: 'The store url has been set, do you need to overwrite it?',
    },
  ]);

  return isRewriteStore;
}

const run = async (store, { profile }) => {
  // Validate that the URL is a valid web URI (must use http or https)
  if (!validUrl.isWebUri(store)) {
    printError('Invalid store url:', store);
    process.exit(1);
  }

  try {
    const storeUrl = await getStoreUrl(store);

    // Load configuration
    const config = new Config({
      configFile: process.env.ABT_NODE_CONFIG_FILE,
      section: profile === 'default' ? '' : profile,
    });

    const oldStoreUrl = config.get('store');
    // If a store URL was already configured, it differs from the new one, and the user declined to overwrite, exit
    if (!isUndefined(oldStoreUrl) && oldStoreUrl !== storeUrl && !(await confirmOverwriteStoreUrl())) {
      process.exit(0);
    }

    const fetchData = await createConnect({
      connectUrl: storeUrl,
      connectAction: 'connect-cli',
      enableEncrypt: true,
      wrapSpinner,
      openPage: open,
      prettyUrl: (url) => chalk.cyan(url),
    });
    const { secretKey, developerDid, name, email } = fetchData;
    config.set('store', storeUrl);
    config.set('accessToken', secretKey);
    config.set('developerDid', developerDid);
    config.set('name', name);
    config.set('email', email);

    printSuccess(`Successfully connected, and now you are ready to upload blocklets to ${storeUrl}`);
    printInfo(
      `${chalk.cyan('Tips:')} Use the following command to view the configuration: ${chalk.cyan(
        `${getCLIBinaryName()} config list ${profile === 'default' ? '' : `--profile ${profile}`}`
      )}`
    );
  } catch (err) {
    console.error(err);
    printInfo(
      `You can use the command ${chalk.cyan(`${getCLIBinaryName()} connect`)} to try to reconnect to the blocklet store`
    );
    process.exit(1);
  }
  process.exit(0);
};

exports.run = run;
