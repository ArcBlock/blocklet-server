const childProcess = require('child_process');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { fromRandom } = require('@ocap/wallet');
const { types } = require('@ocap/mcrypto');

const { printInfo, print, printWarning, printSuccess } = require('../../util');
const { getConnectUrl, generateDidFromWallet } = require('./init');
const { ABT_NODE_HOME } = require('../../constant');

exports.run = async (name, options = {}) => {
  const { didOnly, random } = options;
  if (didOnly) {
    // Generate random DID locally without invoking DID Wallet
    if (random) {
      const wallet = fromRandom({ role: types.RoleType.ROLE_BLOCKLET });

      // Persist wallet to ABT_NODE_HOME/blocklets/{did}.json
      const blockletWalletsDir = path.join(ABT_NODE_HOME, 'blocklets');
      fs.ensureDirSync(blockletWalletsDir);

      const walletFilePath = path.join(blockletWalletsDir, `${wallet.address}.json`);
      fs.writeFileSync(walletFilePath, JSON.stringify(wallet.toJSON(), null, 2));

      printSuccess(`Created Blocklet DID: ${chalk.cyan(wallet.address)}`);
      printInfo(`Wallet saved to: ${chalk.cyan(walletFilePath)}`);
      process.exit(0);
    }

    // Use DID Wallet to generate DID (existing behavior)
    const connectUrl = await getConnectUrl();
    const didList = await generateDidFromWallet(connectUrl, { verbose: false, monikers: 'blocklet' });
    printSuccess(`Created Blocklet DID: ${chalk.cyan(didList.join(','))}`);
    process.exit(0);
  }

  // eslint-disable-next-line no-param-reassign
  name = name ? name.trim() : '';
  let createCommand;
  // must use latest version, otherwise npx will use cache version
  if (name) {
    createCommand = `npx create-blocklet@latest ${name}`;
  } else {
    createCommand = 'npx create-blocklet@latest';
  }
  if (options.did) {
    createCommand += ` --did=${options.did}`;
  }

  try {
    childProcess.execSync(createCommand, { stdio: 'inherit' });
    process.exit(0);
  } catch (error) {
    console.error(error);

    print('');
    printWarning(`This is a problem related to ${chalk.cyan('npx')}.`);
    print(`  You can directly try to execute ${chalk.cyan(createCommand)} to create blocklet. \n`);

    printInfo(
      `You can also execute ${chalk.cyan('npm install -g create-blocklet')} and execute ${chalk.cyan(
        createCommand.replace('npx ', '').replace('@latest', '')
      )}`
    );

    process.exit(error.status);
  }
};
