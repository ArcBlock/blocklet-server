/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
require('dotenv-flow').config();
const os = require('os');
const path = require('path');

if (!process.env.ABT_NODE_EVENT_PORT) {
  process.env.ABT_NODE_EVENT_PORT = 40407;
}

process.env.PM2_HOME = path.join(os.homedir(), '.arcblock/abtnode-dev');

const { setupGracefulShutdown } = require('@abtnode/util/lib/pm2/setup-graceful-shutdown');
const server = require('@arcblock/event-hub/lib/server-abtnode').default;
const pm2 = require('@abtnode/util/lib/pm2/async-pm2');
const express = require('express');
const md5 = require('@abtnode/util/lib/md5');
const logger = require('@abtnode/logger')('@abtnode/event-hub');

setupGracefulShutdown(server);

const pm2EventHubPort = Number(process.env.ABT_NODE_EVENT_HTTP_PORT || '40411');
const pm2Pwd = md5(`${process.env.ABT_NODE_SK}-fetch-pm2`);
const app = express();
app.use(express.json());

app.post('/pm2/start', async (req, res) => {
  const { pm2Config, pwd } = req.body || {};
  if (!pwd || pwd !== pm2Pwd) {
    res.status(401).send('unauthorized');
    return;
  }
  await pm2.startAsync(pm2Config);
  res.send('ok');
});

app.listen(pm2EventHubPort, () => {
  process.send?.('ready');
  logger.info(`event-hub server started on port ${pm2EventHubPort}`);
});

setupGracefulShutdown(app);

console.log(`Event Hub ready on port ${process.env.ABT_NODE_EVENT_PORT}`);
