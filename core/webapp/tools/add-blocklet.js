/**
 * This script is used to add a blocklet to the dev server without declare app did on main chain.
 *
 * Usage:
 * cd core/webapp
 * node tools/add-blocklet.js
 */

/* eslint-disable no-console */
process.env.NODE_ENV = 'development';
process.env.DISABLE_SQLITE_LOG = '1';
require('dotenv-flow').config();

const { types } = require('@ocap/mcrypto');
const { fromRandom } = require('@ocap/wallet');

const { getNode } = require('../dev/util');

const createAppWallet = () => fromRandom({ role: types.RoleType.ROLE_APPLICATION });

// eslint-disable-next-line no-promise-executor-return
const sleep = (ms = 3000) => new Promise(resolve => setTimeout(resolve, ms));

const run = async () => {
  const title = 'my blocklet';
  const description = title;

  const appWallet = createAppWallet();

  try {
    const { node } = await getNode();
    node.onReady(async () => {
      await node.installBlocklet({
        type: 'create',
        context: {},
        title,
        description,
        appSk: appWallet.secretKey,
      });

      console.log('Blocklet Installed. AppDid:', appWallet.address);

      await sleep(3000);

      process.exit(0);
    });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

run();
