const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const { BLOCKLET_STORE_URL } = require('@abtnode/constant');
const debug = require('debug')(require('../../../package.json').name);
const { upload } = require('@blocklet/store');
const { joinURL } = require('ufo');
const { printInfo, printSuccess, printError } = require('../../util');
const { logTar, getContents } = require('../../util/blocklet/tar');
const Config = require('../../util/blocklet/config');
const { wrapSpinner } = require('../../ui');

exports.run = async (originalMetaFile, { accessToken, profile }) => {
  const config = new Config({
    configFile: process.env.ABT_NODE_CONFIG_FILE,
    section: profile === 'default' ? '' : profile,
  });
  const developerDoc = 'https://developer.blocklet.io/docs';
  const storeUrl = config.get('store') || config.get('registry') || (profile === 'default' ? BLOCKLET_STORE_URL : '');
  if (!storeUrl) {
    printError('Can not find the store url to upload the blocklet!');
    printInfo(`You can fix with: ${chalk.cyan('blocklet config set store [storeUrl]')}`);
    printInfo(`To learn more: ${chalk.cyan(developerDoc)}`);
  }

  printInfo(`Upload using profile ${chalk.cyan(profile)} to store ${chalk.cyan(storeUrl)}`);

  let metaFile = originalMetaFile;
  if (!metaFile) {
    metaFile = path.join(process.cwd(), '.blocklet', 'release', 'blocklet.json');
  }

  if (!fs.existsSync(metaFile)) {
    printError(`Invalid meta file: '${metaFile}'`);
    process.exit(1);
  }

  let realAccessToken = accessToken;
  if (!realAccessToken) {
    realAccessToken = config.get('accessToken');
    debug('read access token from config');
    if (!realAccessToken) {
      // TODO: Add logic to automatically obtain accessToken when it is missing
      printError('accessToken is required to upload a blocklet');
      process.exit(1);
    }
  }

  try {
    const response = await upload({
      metaFile,
      source: 'CLI',
      accessToken: realAccessToken,
      storeUrl,
      config,
      printInfo,
      printSuccess,
      printTar: async (meta, filePath) => {
        const pkgContents = await getContents(meta, filePath);
        logTar(pkgContents);
      },
      wrapSpinner,
      debug,
    });
    if (response.status === 'published') {
      printSuccess(
        `Blocklet ${chalk.cyan(response.name)} ${chalk.cyan(
          response.version
        )} auto published successfully: ${chalk.cyan(joinURL(storeUrl, '/blocklets', response.did))} !`
      );
    } else {
      printSuccess(
        `Blocklet ${chalk.cyan(response.name)} ${chalk.cyan(response.version)} successfully uploaded to ${chalk.cyan(
          storeUrl
        )}!`
      );
      printInfo(
        `${chalk.cyan('Tips:')}  You need to publish the blocklet at ${chalk.cyan(
          joinURL(storeUrl, '/developer/blocklets')
        )} to make it public accessible`
      );
    }
  } catch (err) {
    if (/\[NO-ACCESS\]/.test(err?.message || '')) {
      printInfo(
        `Blocklet store accessToken is used to authorize developers when uploading blocklets, you can generate your own accessToken from ${chalk.cyan(
          storeUrl
        )}`
      );
      printInfo('Please use the following two methods to specify');
      printInfo(`Option 1: Set a access token locally: ${chalk.cyan('blocklet config set accessToken [accessToken]')}`);
      printInfo(
        `Option 2: By specifying the --access-token parameter: ${chalk.cyan(
          'blocklet upload --access-token <access token>'
        )}`
      );
    }
    printError(err.message);
    printInfo(`To learn more: ${chalk.cyan(developerDoc)}`);

    process.exit(1);
  }

  process.exit(0);
};
