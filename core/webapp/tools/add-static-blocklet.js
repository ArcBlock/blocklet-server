/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
require('dotenv-flow').config();

const { joinURL } = require('ufo');

const Client = require('@blocklet/server-js');
const sleep = require('@abtnode/util/lib/sleep');

if (!process.env.TEST_SERVER_ENDPOINT) {
  throw new Error('TEST_SERVER_ENDPOINT is required');
}
if (!process.env.TEST_SERVER_ACCESS_KEY_ID) {
  throw new Error('TEST_SERVER_ACCESS_KEY_ID is required');
}
if (!process.env.TEST_SERVER_ACCESS_KEY_SECRET) {
  throw new Error('TEST_SERVER_ACCESS_KEY_SECRET is required');
}

const { TEST_SERVER_ENDPOINT, TEST_SERVER_ACCESS_KEY_ID, TEST_SERVER_ACCESS_KEY_SECRET } = process.env;

const client = new Client(joinURL(TEST_SERVER_ENDPOINT, '/api/gql'));
client.setAuthAccessKey({
  accessKeyId: TEST_SERVER_ACCESS_KEY_ID,
  accessKeySecret: TEST_SERVER_ACCESS_KEY_SECRET,
  type: 'arcblock',
});

const blockletDid = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
const blockletUrl = `https://store.blocklet.dev/api/blocklets/${blockletDid}/blocklet.json`;
const startIndex = 2800;
const endIndex = 3000;
const batchSize = Number(process.env.BATCH_SIZE) || 2;

const waitForStatus = async (appDid, status, timeout = 60_000) => {
  const checker = async () => {
    const { blocklet } = await client.getBlocklet({ input: { did: appDid } });
    const component = blocklet.children.find(v => v.meta?.did === blockletDid);
    if (!component) {
      return false;
    }
    // console.log(`Component status: ${component.status}, expected: ${status}`);
    return component.status === status;
  };
  const t = Date.now();
  let isEq = false;
  while (Date.now() - t < timeout && !isEq) {
    isEq = await checker();
    if (isEq) break;
    await sleep(200);
  }
};

const installBlocklet = async index => {
  const timestamp = () => new Date().toISOString();

  console.log(`[${timestamp()}] Installing blocklet ${index}`);
  const startInstall = Date.now();
  const { data } = await client.launchBlockletWithoutWallet({
    input: { blockletMetaUrl: blockletUrl, title: `Static Blocklet ${index + 1}` },
  });
  const launchElapsed = Date.now() - startInstall;
  console.log(`[${timestamp()}] Blocklet ${index} launch initiated in ${launchElapsed}ms, waiting for installation...`);

  const installWaitStart = Date.now();
  await waitForStatus(data.appDid, 'installed');
  const installWaitElapsed = Date.now() - installWaitStart;
  console.log(`[${timestamp()}] Blocklet ${index} installed in ${installWaitElapsed}ms, starting...`);

  const startBlockletStart = Date.now();
  await client.startBlocklet({ input: { did: data.appDid, componentDids: [blockletDid] } });
  const startElapsed = Date.now() - startBlockletStart;
  console.log(`[${timestamp()}] Blocklet ${index} start command issued in ${startElapsed}ms, waiting for running...`);

  const runWaitStart = Date.now();
  await waitForStatus(data.appDid, 'running');
  const runWaitElapsed = Date.now() - runWaitStart;
  console.log(`[${timestamp()}] Blocklet ${index} started and running in ${runWaitElapsed}ms`);

  return { index, appDid: data.appDid };
};

(async () => {
  console.log(`Starting batch installation with batch size: ${batchSize}`);
  const totalCount = endIndex - startIndex;
  const totalBatches = Math.ceil(totalCount / batchSize);

  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
    const batchStart = startIndex + batchNum * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, endIndex);
    const batchIndices = [];
    for (let i = batchStart; i < batchEnd; i++) {
      batchIndices.push(i);
    }

    const timestamp = () => new Date().toISOString();
    console.log(
      `\n[${timestamp()}] === Batch ${batchNum + 1}/${totalBatches}: Installing blocklets ${batchStart} to ${batchEnd - 1} ===`
    );

    const batchStartTime = Date.now();
    const results = await Promise.allSettled(batchIndices.map(index => installBlocklet(index)));
    const batchElapsed = Date.now() - batchStartTime;

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
        console.error(
          `[${timestamp()}] Blocklet ${batchIndices[idx]} failed: ${result.reason?.message || result.reason}`
        );
      }
    });

    console.log(
      `[${timestamp()}] === Batch ${batchNum + 1} completed in ${batchElapsed}ms (${succeeded} succeeded, ${failed} failed) ===\n`
    );
  }

  console.log('All batches completed');
})();
