/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
if (!process.env.ABT_NODE_UPDATER_PORT) {
  process.env.ABT_NODE_UPDATER_PORT = 40405;
}
if (!process.env.ABT_NODE_EVENT_PORT) {
  process.env.ABT_NODE_EVENT_PORT = 40406;
}

const os = require('os');
const path = require('path');
const express = require('express');
const { fromSecretKey } = require('@ocap/wallet');
const { runSchemaMigrations } = require('@abtnode/core/lib/migrations');
const ABTNode = require('@abtnode/core');
const gql = require('../api/gql');
const genGqlConfig = require('../api/gql/config');

const dataDir = path.join(os.tmpdir(), 'abtnode', Math.random().toString());

const wallet = fromSecretKey(
  '0x541eb9b30734da3cc63317e42903aed61c8c5dfa2ee81d93938bca85df11a689aaf779f14390a13526298ba857c2ee34cb3357a793b17bccaf7a07427d7308fc'
);

runSchemaMigrations({ dataDir, blocklets: [] }).then(() => {
  const node = ABTNode({
    dataDir,
    nodeSk: wallet.secretKey,
    nodePk: wallet.publicKey,
    nodeDid: wallet.address,
    nodeOwner: {
      did: wallet.address,
      pk: wallet.publicKey,
    },
  });

  node.onReady(() => {
    const app = express();
    app.use('/graphql', gql(genGqlConfig(node)));

    app.listen(4000, () => {
      console.log('ABT Node GQL Server at http://localhost:4000/graphql');
    });
  });
});
