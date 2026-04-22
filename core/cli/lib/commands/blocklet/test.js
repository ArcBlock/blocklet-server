require('dotenv-flow').config({ silent: true, node_env: 'test' });

const chalk = require('chalk');
const { fromSecretKey } = require('@ocap/wallet');
const { types } = require('@ocap/mcrypto');
const { replaceSlotToIp } = require('@blocklet/meta/lib/util');
const { BlockletStatus, BlockletEvents } = require('@blocklet/constant');
const getIP = require('@abtnode/util/lib/get-ip');
const sleep = require('@abtnode/util/lib/sleep');

const { print, printError, printInfo, printSuccess, getDevUrl, printWarning } = require('../../util');
const { getNode } = require('../../node');
const { getOption, waitForAnyEvents, checkNodeRunning, getAccessibleUrl } = require('./dev');

const ACTIONS = {
  INIT: 'init',
  START: 'start',
  REMOVE: 'remove',
  RESET: 'reset',
};

const getUtil = ({ node, socket, publishEvent, appName, appSk, ownerSk }) => {
  const app = fromSecretKey(appSk, { role: types.RoleType.ROLE_APPLICATION });

  printInfo(`Test blocklet did: ${chalk.cyan(app.address)}`);

  // init app container
  const initApp = async () => {
    const owner = fromSecretKey(ownerSk, { role: types.RoleType.ROLE_ACCOUNT });
    printInfo(`Test owner did: ${chalk.cyan(owner.address)}`);

    const exist = await node.getBlocklet({ did: app.address, attachConfig: false });
    if (exist) {
      printWarning(`Test blocklet already exist: ${chalk.cyan(app.address)}`);
      return;
    }

    try {
      const blocklet = await node.installBlocklet({
        appSk,
        title: appName,
        description: `Test blocklet ${appName}`,
        skSource: 'blocklet:cli:test:init',
      });
      await publishEvent(BlockletEvents.installed, { blocklet });
      await waitForAnyEvents({ blocklet, socket, events: [BlockletEvents.installed] }); // wait for db updating
      printInfo(`Test blocklet created: ${app.address}`);

      await node.setBlockletInitialized({
        did: app.address,
        owner: { did: owner.address, pk: owner.publicKey },
        purpose: 'e2e',
      });
      await node.loginUser({
        teamDid: app.address,
        force: true,
        user: {
          did: owner.address,
          pk: owner.publicKey,
          role: 'owner',
          fullName: 'TestOwner',
          email: 'blocklet@arcblock.io',
          approved: true,
          remark: 'e2e',
          connectedAccount: {
            provider: 'wallet',
            did: owner.address,
            pk: owner.publicKey,
          },
        },
      });
      await node.issuePassportToUser({ teamDid: app.address, userDid: owner.address, role: 'owner', notify: false });
      await node.issuePassportToUser({ teamDid: app.address, userDid: owner.address, role: 'admin', notify: false });
      await node.issuePassportToUser({ teamDid: app.address, userDid: owner.address, role: 'member', notify: false });
      printInfo(`Test blocklet initialized: ${app.address}`);
    } catch (err) {
      printError(`Test blocklet init failed: ${err.message}`);
      console.error(err);
      // eslint-disable-next-line no-use-before-define
      await removeApp();
      process.exit(1);
    }
  };

  const removeApp = async () => {
    try {
      const deleted = await node.deleteBlocklet({
        did: app.address,
        keepData: false,
        keepLogsDir: false,
        keepConfigs: false,
      });
      await publishEvent(BlockletEvents.removed, { blocklet: deleted, context: { keepRouting: false } });
      print(`Test blocklet was removed: ${app.address}`);
    } catch (err) {
      console.error(err);
    }
    await sleep(200);
  };

  const startApp = async () => {
    try {
      const blocklet = await node.ensureBlockletIntegrity(app.address);

      await node.startBlocklet({
        did: app.address,
        throwOnError: true,
        checkHealthImmediately: true,
        atomic: true,
        componentDids: null,
      });

      blocklet.status = BlockletStatus.running;
      await publishEvent(BlockletEvents.statusChange, blocklet);

      await sleep(1000);
      printSuccess(`Test blocklet successfully started: ${app.address}`);

      // print info
      const info = await node.getNodeInfo();
      const port = Number(info.routing.httpsPort) !== 443 ? `:${info.routing.httpsPort}` : '';
      const url = await getDevUrl({
        getUrl: async () => {
          const ips = await getIP();

          const urls = blocklet.site.domainAliases.map(
            (x) => `https://${replaceSlotToIp(x.value, ips.internal)}${port}`
          );

          return getAccessibleUrl(urls);
        },
      });

      if (url) {
        print('');
        printInfo('You can access with the following URL\n');
        print(`- ${chalk.cyan(url)}`);
      }
    } catch (err) {
      console.error(err);
      printError(err.message);
    }
  };

  const resetApp = async () => {
    try {
      await node.getBlocklet({ did: app.address });
      await node.resetBlocklet({ did: app.address });
      print(`\nTest blocklet has been reset: ${app.address}\n`);
    } catch (err) {
      console.error(err);
      printError(err.message);
    }
  };

  return {
    initApp,
    startApp,
    resetApp,
    removeApp,
  };
};

const run = async (action, { appName, appSk, ownerSk }) => {
  try {
    await checkNodeRunning();

    const { node, publishEvent, getWsClient } = await getNode({ dir: process.cwd() });
    const socket = await getWsClient();
    const util = getUtil({ node, publishEvent, socket, appName, appSk, ownerSk });

    node.onReady(async () => {
      if (action === ACTIONS.INIT) {
        await util.initApp();
        process.exit(0);
      }

      if (action === ACTIONS.REMOVE) {
        await util.removeApp();
        process.exit(0);
      }

      if (action === ACTIONS.START) {
        await util.startApp();
        process.exit(0);
      }

      if (action === ACTIONS.RESET) {
        await util.resetApp();
        process.exit(0);
      }
    });
  } catch (err) {
    printError(err.message);
    process.exit(1);
  }
};

const getOptions = (command) => ({
  appSk: getOption(command, 'appSk'),
  appName: getOption(command, 'appName'),
  ownerSk: getOption(command, 'ownerSk'),
});

module.exports = {
  run: (command) => run(null, getOptions(command)),
  init: (command) => run('init', getOptions(command)),
  start: (command) => run('start', getOptions(command)),
  remove: (command) => run('remove', getOptions(command)),
  reset: (command) => run('reset', getOptions(command)),
};
