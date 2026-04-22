// Setup blocklet environments
import os from 'os';
import fs from 'fs';
import path from 'path';
import { parse as getBlockletMeta } from '@blocklet/meta/lib/parse';
import { types } from '@ocap/mcrypto';
import { fromRandom } from '@ocap/wallet';
import { fromAppDid } from '@arcblock/did-ext';

export default function testSetup() {
  try {
    const dir = process.cwd();
    const wallet = fromRandom({ role: types.RoleType.ROLE_APPLICATION });
    const meta = getBlockletMeta(dir, { ensureComponentStore: false });
    const tmpDir = path.join(os.tmpdir(), meta.did);

    if (fs.existsSync(tmpDir) === false) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    process.env.ABT_NODE_DID = wallet.address;
    process.env.ABT_NODE_PK = wallet.publicKey;
    process.env.ABT_NODE_PORT = '8089';
    process.env.ABT_NODE_SERVICE_PORT = '40406';

    process.env.BLOCKLET_MODE = 'test';
    process.env.BLOCKLET_DID = meta.did;
    process.env.BLOCKLET_COMPONENT_DID = meta.did;
    process.env.BLOCKLET_DATA_DIR = path.join(tmpDir, wallet.address);
    process.env.BLOCKLET_LOG_DIR = path.join(tmpDir, wallet.address);
    // process.env.BLOCKLET_APP_SK = wallet.secretKey;
    // process.env.BLOCKLET_APP_PSK = wallet.secretKey;
    process.env.BLOCKLET_APP_PK = wallet.publicKey;
    process.env.BLOCKLET_APP_PPK = wallet.publicKey;
    process.env.BLOCKLET_APP_ID = wallet.address;
    process.env.BLOCKLET_APP_PID = wallet.address;
    process.env.BLOCKLET_APP_IDS = wallet.address;
    process.env.BLOCKLET_APP_NAME = meta.title;
    process.env.BLOCKLET_APP_DESCRIPTION = meta.description;
    process.env.BLOCKLET_APP_EK = fromAppDid(meta.did, process.env.ABT_NODE_PK, undefined, 1).secretKey;
    process.env.BLOCKLET_APP_ASK = fromAppDid(meta.did, process.env.ABT_NODE_PK, undefined, 2).secretKey;
    process.env.BLOCKLET_APP_URL = 'http://192.168.0.10:3030';
    process.env.BLOCKLET_MOUNT_POINTS = JSON.stringify([
      {
        title: meta.title,
        did: meta.did,
        name: meta.name,
        version: meta.version,
        mountPoint: '/',
        status: 6,
        port: 8181,
        resources: [],
      },
    ]);
  } catch (err) {
    console.error('Failed to setup blocklet environment for test', err);
  }
}
