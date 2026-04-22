/* eslint-disable no-console */
require('dotenv-flow').config();

require('../../state/lib/processes/updater');

console.log(`RPC Server ready on port ${process.env.ABT_NODE_UPDATER_PORT}`);
