const { describe, test, expect, beforeAll, afterEach } = require('bun:test');
const { fromRandom } = require('@ocap/wallet');
const { NODE_MODES } = require('@abtnode/constant');

const NodeState = require('../../lib/states/node');
const { setupInMemoryModels } = require('../../tools/fixture');

describe('NodeState', () => {
  let store = null;
  let models = null;

  beforeAll(async () => {
    models = await setupInMemoryModels();
    // store = new NodeState(models.Server, {});
  });

  afterEach(async () => {
    if (store) {
      await store.reset();
    }
  });

  test('should initialize as expected', async () => {
    const node = fromRandom();
    const owner = fromRandom();

    expect(() => new NodeState(models.server, {})).toThrowError();
    expect(() => new NodeState(models.server, { nodeSk: node.secretKey })).toThrowError();
    expect(() => new NodeState(models.server, { nodeSk: node.secretKey, nodePk: node.publicKey })).toThrowError();
    expect(
      () => new NodeState(models.server, { nodeSk: node.secretKey, nodePk: node.publicKey, nodeDid: owner.address })
    ).toThrowError();

    store = new NodeState(models.Server, {
      nodeSk: node.secretKey,
      nodePk: node.publicKey,
      nodeDid: node.address,
      nodeOwner: {
        did: owner.address,
        pk: owner.publicKey,
      },
      mode: 'production',
      routing: {
        https: true,
        provider: 'nginx',
      },
      runtimeConfig: {
        daemonMaxMemoryLimit: 300,
      },
    });

    const state = await store.read();
    expect(state).toBeTruthy();
    expect(state.pk).toEqual(node.publicKey);
    expect(state.did).toEqual(node.address);
    expect(state.members).toEqual(undefined);
    expect(state.nodeOwner).toBeTruthy();
    expect(state.nodeOwner.pk).toEqual(owner.publicKey);
    expect(state.nodeOwner.did).toEqual(owner.address);
    expect(state.routing.provider).toEqual('nginx');
    expect(state.routing.https).toEqual(true);

    expect(state.runtimeConfig.daemonMaxMemoryLimit).toEqual(300);

    expect(state.mode).toEqual('production');
  });

  test('should update node info as expected', async () => {
    const node = fromRandom();
    const owner = fromRandom();

    store = new NodeState(models.Server, {
      nodeSk: node.secretKey,
      nodePk: node.publicKey,
      nodeDid: node.address,
      nodeOwner: {
        did: owner.address,
        pk: owner.publicKey,
      },
      mode: 'production',
      routing: {
        https: true,
        provider: 'nginx',
      },
      runtimeConfig: {
        daemonMaxMemoryLimit: 300,
      },
    });
    const updates = {
      registerUrl: 'http://my-launcher.arcblock.io',
      webWalletUrl: 'http://web-wallet.arcblock.io',
    };

    const state = await store.updateNodeInfo(updates);

    expect(state.registerUrl).toEqual(updates.registerUrl);
    expect(state.webWalletUrl).toEqual(updates.webWalletUrl);
  });

  test('should support basic owner and member methods', async () => {
    const node = fromRandom();
    const owner = fromRandom();

    store = new NodeState(models.Server, {
      nodeSk: node.secretKey,
      nodePk: node.publicKey,
      nodeDid: node.address,
    });

    let state = await store.read();
    expect(state).toBeTruthy();
    expect(state.pk).toEqual(node.publicKey);
    expect(state.did).toEqual(node.address);
    expect(state.nodeOwner).toBeFalsy();
    expect(state.members).toEqual(undefined);

    // Add owner
    state = await store.updateNodeOwner({
      nodeOwner: { did: owner.address, pk: owner.publicKey },
    });
    expect(state.nodeOwner).toBeTruthy();
    expect(state.nodeOwner.pk).toEqual(owner.publicKey);
    expect(state.nodeOwner.did).toEqual(owner.address);
  });

  test('should throw error with invalid node owner', async () => {
    const node = fromRandom();
    const owner = fromRandom();
    store = new NodeState(models.Server, {
      nodeSk: node.secretKey,
      nodePk: node.publicKey,
      nodeDid: node.address,
      nodeOwner: {
        did: owner.address,
        pk: '',
      },
    });

    try {
      await store.read();
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  test('should enter and exit mode as expected', async () => {
    const node = fromRandom();

    store = new NodeState(models.Server, {
      nodeSk: node.secretKey,
      nodePk: node.publicKey,
      nodeDid: node.address,
      mode: NODE_MODES.PRODUCTION,
    });

    let info = await store.read();
    expect(info.mode).toEqual(NODE_MODES.PRODUCTION);

    info = await store.enterMode(NODE_MODES.MAINTENANCE);
    expect(info.mode).toEqual(NODE_MODES.MAINTENANCE);
    expect(info.previousMode).toEqual(NODE_MODES.PRODUCTION);

    try {
      await store.enterMode('xxx');
    } catch (err) {
      expect(err).toBeTruthy();
      expect(err.message).toMatch(/unsupported mode/);
    }

    info = await store.exitMode(NODE_MODES.MAINTENANCE);
    expect(info.mode).toEqual(NODE_MODES.PRODUCTION);
    expect(info.previousMode).toEqual('');

    try {
      await store.exitMode(NODE_MODES.PRODUCTION);
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  describe('setMode', () => {
    beforeAll(() => {
      const node = fromRandom();
      store = new NodeState(models.Server, {
        nodeSk: node.secretKey,
        nodePk: node.publicKey,
        nodeDid: node.address,
        mode: NODE_MODES.PRODUCTION,
      });
    });

    test('should throw error if mode is invalid', async () => {
      await expect(store.setMode('zzz')).rejects.toThrow();
    });

    test('should set mode as expected', async () => {
      const newInfo = await store.setMode(NODE_MODES.DEBUG);
      expect(newInfo.mode).toEqual(NODE_MODES.DEBUG);
    });
  });

  test('updateStatus', async () => {
    const node = fromRandom();

    store = new NodeState(models.Server, {
      nodeSk: node.secretKey,
      nodePk: node.publicKey,
      nodeDid: node.address,
      mode: NODE_MODES.PRODUCTION,
    });

    // running
    const d1 = await store.updateStatus(1);
    expect(d1.status).toBe(1);

    // stopped
    const d2 = await store.updateStatus(2);
    expect(d2.status).toBe(2);

    // start from crash
    const d3 = await store.updateStatus(3);
    expect(d3.status).toBe(3);

    expect(store.updateStatus(4)).rejects.toThrow('invalid');

    const d4 = await store.resetStatus();
    expect(d4.status).toBe(1);
  });

  test('updateGateway', async () => {
    const node = fromRandom();

    const routing = {
      provider: 'nginx',
      adminPath: '/admin/',
      headers: { 'X-Powered-By': '"Blocklet Server/1.16.10"' },
      maxUploadFileSize: 500,
      https: true,
      httpPort: 80,
      httpsPort: 443,
      wildcardCertHost: 'https://releases.arcblock.io/',
      ipWildcardDomain: '*.ip.abtnet.io',
      snapshotHash: 'cbfb1365912775caf93ba316b87bde3c0db29ca2',
      requestLimit: { enabled: false },
      cacheEnabled: true,
    };

    store = new NodeState(models.Server, {
      nodeSk: node.secretKey,
      nodePk: node.publicKey,
      nodeDid: node.address,
      mode: NODE_MODES.PRODUCTION,
      routing,
    });

    const oldInfo = await store.read();

    expect(oldInfo.routing).toEqual(routing);

    const updates = {
      requestLimit: { enabled: true, rate: 99, ipHeader: '' },
      cacheEnabled: true,
    };
    await store.updateGateway(updates);

    const newInfo = await store.read();
    expect(newInfo.routing).toEqual({ ...routing, ...updates });
  });

  test('updateNftHolder', async () => {
    const node = fromRandom();
    const ownerNft = {
      holder: 'test-holder',
      issuer: 'test-issuer',
    };
    store = new NodeState(models.Server, {
      nodeSk: node.secretKey,
      nodePk: node.publicKey,
      nodeDid: node.address,
      mode: NODE_MODES.PRODUCTION,
      ownerNft,
    });

    const oldInfo = await store.read();
    expect(oldInfo.ownerNft).toEqual(ownerNft);

    const newHolder = 'test-new-holder';
    await store.updateNftHolder(newHolder);
    const newInfo = await store.read();

    expect(newInfo.ownerNft).toEqual({ ...ownerNft, holder: newHolder });
  });
});
