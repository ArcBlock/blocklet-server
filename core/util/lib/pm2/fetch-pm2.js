const RpcClient = require('@arcblock/event-hub/lib/rpc').default;
const pm2 = require('./async-pm2');
const md5 = require('../md5');

let rpcClient = null;

async function fetchPm2(pm2Config, ABT_NODE_SK, { timeoutMs = 120000 } = {}) {
  if (!rpcClient) {
    rpcClient = new RpcClient(Number(process.env.ABT_NODE_EVENT_PORT) || 40407, '127.0.0.1');
  }

  if (['development', 'test'].includes(process.env.NODE_ENV)) {
    await pm2.startAsync(pm2Config);
    return 'ok';
  }

  const pwd = md5(`${ABT_NODE_SK}-fetch-pm2`);
  const data = await rpcClient.rpc(
    'pm2/start',
    { pm2Config, pwd },
    { timeoutMs, errorPrefix: 'blocklet start failed' }
  );
  return data;
}

module.exports = fetchPm2;
