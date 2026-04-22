/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

const expandTilde = require('expand-tilde');
const path = require('path');
const kill = require('kill-port');

if (!process.env.ABT_NODE_DATA_DIR) {
  process.env.ABT_NODE_DATA_DIR = path.join(__dirname, '../../../.abtnode');
} else {
  process.env.ABT_NODE_DATA_DIR = expandTilde(process.env.ABT_NODE_DATA_DIR);
}

if (!process.env.ABT_NODE_CACHE_SQLITE_PATH) {
  process.env.ABT_NODE_CACHE_SQLITE_PATH = path.join(process.env.ABT_NODE_DATA_DIR, 'core', 'db-cache.db');
}

// NOTE: this script requires a valid abtnode instance
process.env.ABT_NODE_LOG_DIR = path.join(process.env.ABT_NODE_DATA_DIR, 'logs', '_abtnode'); // enable log

const createServer = require('@abtnode/blocklet-services');

const { getNode } = require('./util');

const port = parseInt(process.env.ABT_NODE_SERVICE_PORT, 10);
const { node } = getNode({ daemon: false, service: true });

node.onReady(async () => {
  // 启动前先清理端口
  try {
    await kill(port, 'tcp');
    console.warn(`⚠️  Killed existing process on port ${port}`);
  } catch (err) {
    // 端口没有被占用，忽略错误
  }

  const server = createServer(node, {});

  server.listen(port, err => {
    if (err) throw err;
    console.log(`> Blocklet Server login service ready on ${port}`);
  });
});
