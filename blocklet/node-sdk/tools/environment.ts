import { fromAppDid } from '@arcblock/did-ext';
import { fromSecretKey } from '@ocap/wallet';
import { toHex } from '@ocap/util';

const clearEnvironment = () => {
  process.env.BLOCKLET_APP_NAME = '';
  process.env.BLOCKLET_APP_DESCRIPTION = '';
  process.env.BLOCKLET_APP_ID = '';
  process.env.BLOCKLET_APP_SK = '';
  process.env.BLOCKLET_APP_PID = '';
  process.env.BLOCKLET_APP_PSK = '';
  process.env.BLOCKLET_APP_PK = '';
  process.env.BLOCKLET_APP_PPK = '';
  process.env.BLOCKLET_APP_PK_ETH = '';
  process.env.BLOCKLET_APP_PPK_ETH = '';
  process.env.BLOCKLET_COMPONENT_DID = '';
  process.env.BLOCKLET_MOUNT_POINTS = '';
  process.env.CHAIN_TYPE = undefined;
  process.env.BLOCKLET_DID = '';
  process.env.ABT_NODE_PORT = '';
  process.env.ABT_NODE_VERSION = '';
  process.env.ABT_NODE_DID = '';
  process.env.ABT_NODE_PK = '';
  process.env.BLOCKLET_START_AT = '';
  process.env.BLOCKLET_APP_ASK = '';
  process.env.BLOCKLET_SESSION_SECRET = '';
};

const appSk =
  '0x8ed6742900c639fb2e55671342f01bb7be83fb62e7c3e109783501d926a293b9c4a3f8cd5303848fc06e7a3ca69a04adbe3881e6f4577b84df8fc4b51b1b2f70';
const newAppSk =
  '0xc3e482f80a1a33e6265945710600f8ec9a441bcc73438508d2833bf97d5c609941dea824ae2ff5f137c7a2a5c7ca1cee42f370b9522c053f379e323f087d5ff8';

const appDid = 'zNKhBhM6QHJ7NSwPMDG1oXUGCZRuDaPzzyWZ';
const appDidNew = 'zNKtvYJqA6cYjeVhRdJaXznJKKt3AbLXkmVU';
const appDidEth = '0x5370756988F74B404dFb539bEd32768115091dd3';

const setEnvironment = (servicePort = '40406', migrated = false) => {
  process.env.BLOCKLET_APP_URL = 'http://127.0.0.1';
  process.env.BLOCKLET_APP_NAME = 'test blocklet name';
  process.env.BLOCKLET_APP_DESCRIPTION = 'test blocklet description';
  process.env.BLOCKLET_APP_ID = appDid;
  process.env.BLOCKLET_APP_SK = appSk;
  process.env.BLOCKLET_DID = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
  process.env.BLOCKLET_COMPONENT_DID = 'did1';
  process.env.CHAIN_TYPE = 'arcblock';
  process.env.ABT_NODE_PORT = 'mock';
  process.env.ABT_NODE_VERSION = '1.16.15';
  process.env.ABT_NODE_DID = 'zNKZRWaYaMZGgeBVyNU4AjSh2821e9qv5j8U';
  process.env.ABT_NODE_PK = '0x6d4cba304e7f957facb2bfa11132a6688c233d75fa710f8bde469be6cbba5a81';
  process.env.BLOCKLET_START_AT = `${Date.now()}`;

  // Set public keys
  const appWallet = fromSecretKey(appSk);
  process.env.BLOCKLET_APP_PK = toHex(appWallet.publicKey);

  const ethWallet = fromSecretKey(appSk.slice(0, 66), 'ethereum');
  process.env.BLOCKLET_APP_PK_ETH = toHex(ethWallet.publicKey);

  if (migrated) {
    process.env.BLOCKLET_APP_PID = appDidNew;
    process.env.BLOCKLET_APP_PSK = newAppSk;

    // Set permanent public keys for migrated blocklets
    const permanentWallet = fromSecretKey(newAppSk);
    process.env.BLOCKLET_APP_PPK = toHex(permanentWallet.publicKey);

    const ethPermanentWallet = fromSecretKey(newAppSk.slice(0, 66), 'ethereum');
    process.env.BLOCKLET_APP_PPK_ETH = toHex(ethPermanentWallet.publicKey);
  } else {
    process.env.BLOCKLET_APP_PID = process.env.BLOCKLET_APP_ID;
    process.env.BLOCKLET_APP_PSK = process.env.BLOCKLET_APP_SK;
    // For non-migrated blocklets, PPK is same as PK
    process.env.BLOCKLET_APP_PPK = process.env.BLOCKLET_APP_PK;
    process.env.BLOCKLET_APP_PPK_ETH = process.env.BLOCKLET_APP_PK_ETH;
  }

  process.env.BLOCKLET_MOUNT_POINTS = '[{"title":"title1","did":"did1","name":"name1","mountPoint":"/abc","port":123}]';

  process.env.ABT_NODE_SERVICE_PORT = servicePort;
  process.env.BLOCKLET_DATA_DIR = 'tmp';

  process.env.BLOCKLET_APP_EK = fromAppDid(process.env.BLOCKLET_DID, process.env.ABT_NODE_PK, undefined, 1).secretKey;
  // For Access Key authentication - use same wallet as BLOCKLET_APP_EK
  process.env.BLOCKLET_APP_ASK = fromAppDid(process.env.BLOCKLET_DID, process.env.ABT_NODE_PK, undefined, 2).secretKey;
  // For login token authentication - mock secret for testing
  process.env.BLOCKLET_SESSION_SECRET = '0x6a1a9d187b9ceeb41a0686b9c70ab9fe4071f6f32765b8f683e8a6512c74e1e0';
};

export { clearEnvironment, setEnvironment, appDid, appDidNew, appDidEth, appSk, newAppSk };
export default { clearEnvironment, setEnvironment, appDid, appDidNew, appDidEth, appSk, newAppSk };
