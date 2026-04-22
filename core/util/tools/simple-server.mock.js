const http = require('http');
const express = require('express');
const { setupGracefulShutdown } = require('../lib/pm2/setup-graceful-shutdown');
const { loadReloadEnv } = require('../lib/pm2/pm2-start-or-reload');

loadReloadEnv();

async function createSimpleServerMock({ port = 0, killTimeout = 10000, socketEndTimeout = 3000 } = {}) {
  const app = express();

  app.get('/ping', (_, res) => res.status(200).send(process.env.PING_RES || 'pong'));

  app.get('/slow', async (req, res) => {
    const ms = Number(req.query.ms || 300);
    await new Promise((r) => setTimeout(r, ms));
    res.status(200).send('slow-ok');
  });

  const server = http.createServer(app);

  // simulate startup taking some time
  await new Promise((r) => setTimeout(r, 100));

  await new Promise((resolve) => {
    server.listen(port, () => {
      // paired with wait_ready: true — send the ready signal to PM2
      if (typeof process.send === 'function') {
        process.send('ready');
      }
      resolve();
    });
  });

  setupGracefulShutdown(server, { killTimeout, socketEndTimeout, logger: console });

  return server;
}

const port = Number(process.env.PORT || 0);
const killTimeout = Number(process.env.KILL_TIMEOUT || 10000);
const socketEndTimeout = Number(process.env.SOCKET_END_TIMEOUT || 3000);

createSimpleServerMock({ port, killTimeout, socketEndTimeout });
