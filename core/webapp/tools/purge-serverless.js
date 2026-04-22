/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
require('dotenv-flow').config();

const Client = require('@blocklet/server-js');
const sleep = require('@abtnode/util/lib/sleep');
const dayjs = require('@abtnode/util/lib/dayjs');
const { joinURL } = require('ufo');

if (!process.env.SERVER_ENDPOINT) {
  throw new Error('SERVER_ENDPOINT is required');
}
if (!process.env.SERVER_ACCESS_KEY_ID) {
  throw new Error('SERVER_ACCESS_KEY_ID is required');
}
if (!process.env.SERVER_ACCESS_KEY_SECRET) {
  throw new Error('SERVER_ACCESS_KEY_SECRET is required');
}

const { SERVER_ENDPOINT, SERVER_ACCESS_KEY_ID, SERVER_ACCESS_KEY_SECRET } = process.env;

const client = new Client(joinURL(SERVER_ENDPOINT, '/api/gql'));
client.setAuthAccessKey({
  accessKeyId: SERVER_ACCESS_KEY_ID,
  accessKeySecret: SERVER_ACCESS_KEY_SECRET,
  type: 'arcblock',
});

const PURGE_BLOCKLETS_THRESHOLD_HOURS = Number(process.env.PURGE_BLOCKLETS_THRESHOLD_HOURS) || 24;

client.getBlocklets({ input: {} }).then(async result => {
  const blocklets = result.blocklets.filter(x => x.controller);
  console.log(`Found ${blocklets.length} blocklets`);

  if (blocklets.length === 0) {
    console.log('No blocklets to purge');
    return;
  }

  console.log(`Purging blocklets installed more than ${PURGE_BLOCKLETS_THRESHOLD_HOURS} hours ago`);

  for (const blocklet of blocklets) {
    if (dayjs(blocklet.installedAt).isAfter(dayjs().subtract(PURGE_BLOCKLETS_THRESHOLD_HOURS, 'hour'))) {
      console.log(
        `Skipping ${blocklet.appPid} because it's installed less than ${PURGE_BLOCKLETS_THRESHOLD_HOURS} hours ago`
      );
      continue; // eslint-disable-line no-continue
    }

    console.log(`Purging ${blocklet.appPid}, installed at ${blocklet.installedAt}`);
    await client.deleteBlocklet({ input: { did: blocklet.appPid, keepData: false } });
    await sleep(5000);
  }
});
