/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
process.env.NODE_ENV = 'development';

require('dotenv-flow').config();
const path = require('path');
const dayjs = require('@abtnode/util/lib/dayjs');
const getAppWallet = require('@abtnode/util/lib/get-app-wallet');
const random = require('lodash/random');
const { toCamelCase } = require('@abtnode/core/lib/util');

if (!process.env.ABT_NODE_UPDATER_PORT) {
  process.env.ABT_NODE_UPDATER_PORT = 40405;
}
if (!process.env.ABT_NODE_SERVICE_PORT) {
  process.env.ABT_NODE_SERVICE_PORT = 40406;
}

if (!process.env.ABT_NODE_CACHE_SQLITE_PATH) {
  process.env.ABT_NODE_CACHE_SQLITE_PATH = path.join(process.env.ABT_NODE_DATA_DIR, 'core', 'db-cache.db');
}

process.env.ABT_NODE_LOG_DIR = path.join(process.env.ABT_NODE_DATA_DIR, 'logs', '_abtnode'); // enable log
process.env.ABT_NODE_DID = getAppWallet(process.env.ABT_NODE_SK).address;

const { getNode } = require('../dev/util');

const { node } = getNode(true);

node.onReady(async () => {
  const getDoc = () =>
    toCamelCase({
      total_requests: random(100, 10000),
      valid_requests: random(9000, 10000),
      failed_requests: random(0, 10),
      generation_time: random(0, 5),
      unique_visitors: random(5, 1000),
      unique_files: random(1, 10),
      excluded_hits: random(0, 5),
      unique_referrers: random(0, 5),
      unique_not_found: random(0, 10),
      unique_static_files: random(0, 5),
      log_size: random(100000, 1000000),
      bandwidth: random(100000, 1000000),
    });

  const info = await node.getNodeInfo();
  const result = await node.getBlocklets();
  const blocklets = result.blocklets || [];
  for (let i = 1; i <= 30; i++) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    let result = await node.states.trafficInsight.upsert({ did: info.did, date }, { did: info.did, date, ...getDoc() });
    console.log(result);
    for (const blocklet of blocklets) {
      result = await node.states.trafficInsight.upsert(
        { did: blocklet.appPid, date },
        { did: blocklet.appPid, date, ...getDoc() }
      );
      console.log(result);
    }
  }
});
