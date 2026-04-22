/* eslint-disable no-console */
const { setupGracefulShutdown } = require('@abtnode/util/lib/pm2/setup-graceful-shutdown');
const server = require('@arcblock/event-hub/lib/server-abtnode.js').default;
const pm2 = require('@abtnode/util/lib/pm2/async-pm2');
const md5 = require('@abtnode/util/lib/md5');

setupGracefulShutdown(server);

const pm2Pwd = md5(`${process.env.ABT_NODE_SK}-fetch-pm2`);

server.register(
  'pm2/start',
  async (payload) => {
    const { pm2Config, pwd } = payload || {};
    if (!pwd || pwd !== pm2Pwd) {
      return { ok: false, error: 'unauthorized start the blocklet' };
    }
    await pm2.startAsync({
      ...pm2Config,
      instance_var: 'BLOCKLET_INSTANCE_ID',
    });
    return { ok: true, data: 'ok' };
  },
  { authRequired: false }
);

module.exports = server;
