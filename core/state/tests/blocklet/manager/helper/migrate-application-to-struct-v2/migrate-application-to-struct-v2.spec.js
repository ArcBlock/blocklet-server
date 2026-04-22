/* eslint-disable no-await-in-loop */

const { test, expect, beforeEach, beforeAll, mock } = require('bun:test');
const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const http = require('http');
const detectPort = require('detect-port');
const { fromRandom } = require('@ocap/wallet');
const { types } = require('@ocap/mcrypto');
const { BlockletStatus, BlockletGroup } = require('@blocklet/constant');
const {
  migrateApplicationToStructV2,
} = require('../../../../../lib/blocklet/manager/helper/migrate-application-to-struct-v2');
const { getDataDirs } = require('../../../../../lib/util');

const createAppWallet = () => fromRandom({ role: types.RoleType.ROLE_APPLICATION });

const appWallet = createAppWallet();
const appPermanentWallet = createAppWallet();
const serverDir = path.join(os.tmpdir(), 'test-server-migrate-application-to-struct-v2');
const dataDirs = getDataDirs(serverDir);

let states = {};
let manager = {};
let blocklet = {};

const initializeServer = async () => {
  await fs.remove(serverDir);
  await fs.ensureDir(serverDir);
  await fs.ensureDir(path.join(dataDirs.blocklets));
  await fs.ensureDir(path.join(dataDirs.data));
  await fs.ensureDir(path.join(dataDirs.data, 'default-app-name'));
};

const initializeState = () => {
  states = {
    blockletExtras: {
      findOne: mock().mockResolvedValue({ id: 'id:extras', tag: 'backup extras' }),
      encryptSecurityData: mock(),
      update: mock(),
      insert: mock(),
      remove: mock(),
    },
    site: {
      findOneByBlocklet: mock().mockResolvedValue({
        rules: [],
        domainAliases: [],
      }),
      findOne: mock().mockResolvedValue({ id: 'id:site', tag: 'backup site' }),
      update: mock(),
      insert: mock(),
      remove: mock(),
    },
    blocklet: {
      findOne: mock().mockResolvedValue({ id: 'id:blocklet', tag: 'backup blocklet' }),
      addBlocklet: mock().mockImplementation(() => {
        blocklet.structVersion = '2';
      }),
      updateStructV1Did: mock(),
      insert: mock(),
      remove: mock(),
    },
  };
};

const initializeManager = () => {
  manager = {
    installDir: dataDirs.blocklets,
    dataDirs,
    getBlocklet: () => blocklet,
    teamManager: {
      deleteTeam: mock(),
    },
    config: mock(),
    _updateBlockletEnvironment: mock(),
    emit: mock(),
  };
};

const initializeBlocklet = (params) => {
  blocklet = {
    appPid: appPermanentWallet.address,
    meta: {
      did: 'default-app-did',
      name: 'default-app-name',
      bundleDid: 'default-app-did',
      bundleName: 'default-app-name',
    },
    status: BlockletStatus.stopped,
    env: {
      dataDir: path.join(dataDirs.data, 'default-app-name'),
    },
    environmentObj: {
      BLOCKLET_APP_SK: appPermanentWallet.secretKey,
    },
    ...params,
  };
};

const getComponentProps = (did, name, bundleDid, bundleName, componentName) => {
  return {
    meta: {
      did,
      name,
      bundleDid: bundleDid || did,
      bundleName: bundleName || name,
      title: bundleName,
    },
    env: {
      dataDir: path.join(dataDirs.data, componentName || name),
    },
  };
};

let chainServerEndpoint;
beforeAll(async () => {
  const port = await detectPort();
  http
    .createServer((req, res) => {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.write('{}');
      res.end();
    })
    .listen(port);
  chainServerEndpoint = `http://127.0.0.1:${port}`;
});

beforeEach(async () => {
  await initializeServer();
  initializeState();
  initializeManager();
  initializeBlocklet();
});

test('should single component app work', async () => {
  const blockletDid = 'b-did';
  const blockletName = 'b-name';

  initializeBlocklet(getComponentProps(blockletDid, blockletName));
  const dataDir = path.join(dataDirs.data, blockletName);
  fs.ensureDirSync(dataDir);
  fs.ensureFileSync(path.join(dataDir, 'logo.svg'));
  fs.ensureFileSync(path.join(dataDir, 'rbac.db'));
  fs.ensureFileSync(path.join(dataDir, 'user.db'));
  fs.ensureFileSync(path.join(dataDir, 'session.db'));
  fs.ensureDirSync(path.join(dataDir, '.assets'));
  fs.ensureDirSync(path.join(dataDir, '__uploads'));
  fs.ensureDirSync(path.join(dataDir, 'not-system-data'));
  fs.ensureDirSync(path.join(dataDir, 'blocklet-data'));

  states.blockletExtras.findOne.mockResolvedValueOnce({
    meta: {},
    settings: {},
  });

  const newDataDir = path.join(dataDirs.data, appPermanentWallet.address);

  expect(fs.existsSync(path.join(newDataDir))).toBeFalsy();

  await migrateApplicationToStructV2({ did: blocklet.meta.did, appSk: appWallet.secretKey, manager, states });

  expect(fs.existsSync(newDataDir)).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'logo.svg'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'rbac.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'user.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'session.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, '.assets'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, '__uploads'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'not-system-data'))).toBeFalsy();
  expect(fs.existsSync(path.join(newDataDir, 'blocklet-data'))).toBeFalsy();

  expect(fs.existsSync(path.join(newDataDir, blockletName))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, blockletName, 'not-system-data'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, blockletName, 'blocklet-data'))).toBeTruthy();

  expect(manager.config).toHaveBeenLastCalledWith({
    did: appPermanentWallet.address,
    skipHook: true,
    skipDidDocument: true,
    configs: [
      {
        key: 'BLOCKLET_APP_SK',
        value: appWallet.secretKey,
        secure: true,
      },
    ],
  });
});

test('should prevent parallel migration', async () => {
  const blockletDid = 'b-did';
  const blockletName = 'b-name';

  initializeBlocklet(getComponentProps(blockletDid, blockletName));
  const dataDir = path.join(dataDirs.data, blockletName);
  fs.ensureDirSync(dataDir);
  fs.ensureFileSync(path.join(dataDir, 'logo.svg'));
  fs.ensureFileSync(path.join(dataDir, 'rbac.db'));
  fs.ensureFileSync(path.join(dataDir, 'user.db'));
  fs.ensureFileSync(path.join(dataDir, 'session.db'));
  fs.ensureDirSync(path.join(dataDir, '.assets'));
  fs.ensureDirSync(path.join(dataDir, '__uploads'));
  fs.ensureDirSync(path.join(dataDir, 'not-system-data'));
  fs.ensureDirSync(path.join(dataDir, 'blocklet-data'));

  states.blockletExtras.findOne.mockResolvedValueOnce({
    meta: {},
    settings: {},
  });

  const newDataDir = path.join(dataDirs.data, appPermanentWallet.address);

  expect(fs.existsSync(path.join(newDataDir))).toBeFalsy();

  let done = false;
  let parallelError;
  migrateApplicationToStructV2({ did: blocklet.meta.did, appSk: appWallet.secretKey, manager, states }).then(() => {
    done = true;
  });

  try {
    await migrateApplicationToStructV2({ did: blocklet.meta.did, appSk: appWallet.secretKey, manager, states });
  } catch (err) {
    parallelError = err;
  }

  expect(done).toBeTruthy();
  expect(parallelError.message).toMatch('Blocklet already migrated in a few seconds');

  expect(fs.existsSync(newDataDir)).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'logo.svg'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'rbac.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'user.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'session.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, '.assets'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, '__uploads'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'not-system-data'))).toBeFalsy();
  expect(fs.existsSync(path.join(newDataDir, 'blocklet-data'))).toBeFalsy();

  expect(fs.existsSync(path.join(newDataDir, blockletName))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, blockletName, 'not-system-data'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, blockletName, 'blocklet-data'))).toBeTruthy();

  expect(manager.config).toHaveBeenLastCalledWith({
    did: appPermanentWallet.address,
    skipHook: true,
    skipDidDocument: true,
    configs: [
      {
        key: 'BLOCKLET_APP_SK',
        value: appWallet.secretKey,
        secure: true,
      },
    ],
  });
  expect(manager.config).toHaveBeenCalledTimes(1);
});

// the following tests should not be locked by the lock file

test('should composite application work (static)', async () => {
  const blockletDid = 'b-did';
  const blockletName = 'b-name';

  const blocklet2Did = 'b2-did';
  const blocklet2Name = 'b2-name';
  const component2Did = 'b2-did';
  const component2Name = 'b2-name';

  const blocklet3Did = 'b3-did';
  const blocklet3Name = 'b3-name';
  const component3Did = 'b3-did';
  const component3Name = 'b3-name';

  const dataDir = path.join(dataDirs.data, blockletName);
  const newDataDir = path.join(dataDirs.data, appPermanentWallet.address);

  initializeBlocklet({
    children: [
      {
        ...getComponentProps(
          component2Did,
          component2Name,
          blocklet2Did,
          blocklet2Name,
          `${blockletName}/${component2Name}`
        ),
      },
      {
        ...getComponentProps(
          component3Did,
          component3Name,
          blocklet3Did,
          blocklet3Name,
          `${blockletName}/${component3Name}`
        ),
      },
    ],
    ...getComponentProps(blockletDid, blockletName),
  });

  fs.ensureDirSync(dataDir);
  fs.ensureFileSync(path.join(dataDir, 'rbac.db'));
  fs.ensureFileSync(path.join(dataDir, 'user.db'));
  fs.ensureFileSync(path.join(dataDir, 'session.db'));
  fs.ensureFileSync(path.join(dataDir, 'blocklet-data'));
  fs.ensureFileSync(path.join(dataDir, component2Name, 'component2-data'));
  fs.ensureFileSync(path.join(dataDir, component3Name, 'component3-data'));

  expect(fs.existsSync(path.join(newDataDir))).toBeFalsy();

  await migrateApplicationToStructV2({ did: blocklet.meta.did, appSk: appWallet.secretKey, manager, states });

  expect(fs.existsSync(newDataDir)).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'rbac.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'user.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'session.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, '.assets'))).toBeFalsy();
  expect(fs.existsSync(path.join(newDataDir, '__uploads'))).toBeFalsy();
  expect(fs.existsSync(path.join(newDataDir, 'blocklet-data'))).toBeFalsy();

  expect(fs.existsSync(path.join(newDataDir, blockletName, 'blocklet-data'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, blocklet2Name, 'component2-data'))).toBeTruthy(); // component name should be equal to bundle name
  expect(fs.existsSync(path.join(newDataDir, blocklet3Name, 'component3-data'))).toBeTruthy();
});

test('should composite application work (dynamic)', async () => {
  const blockletDid = 'b-did';
  const blockletName = 'b-name';

  const blocklet2Did = 'b2-did';
  const blocklet2Name = 'b2-name';
  const component2Did = 'b2-did-1';
  const component2Name = 'b2-name-1';

  const blocklet3Did = 'b3-did';
  const blocklet3Name = 'b3-name';
  const component3Did = 'b3-did-1';
  const component3Name = 'b3-name-1';

  const dataDir = path.join(dataDirs.data, blockletName);
  const newDataDir = path.join(dataDirs.data, appPermanentWallet.address);

  initializeBlocklet({
    children: [
      {
        ...getComponentProps(
          component2Did,
          component2Name,
          blocklet2Did,
          blocklet2Name,
          `${blockletName}/${component2Name}`
        ),
      },
      {
        ...getComponentProps(
          component3Did,
          component3Name,
          blocklet3Did,
          blocklet3Name,
          `${blockletName}/${component3Name}`
        ),
      },
    ],
    ...getComponentProps(blockletDid, blockletName),
  });

  fs.ensureDirSync(dataDir);
  fs.ensureFileSync(path.join(dataDir, 'rbac.db'));
  fs.ensureFileSync(path.join(dataDir, 'user.db'));
  fs.ensureFileSync(path.join(dataDir, 'session.db'));
  fs.ensureFileSync(path.join(dataDir, 'blocklet-data'));
  fs.ensureFileSync(path.join(dataDir, component2Name, 'component2-data'));
  fs.ensureFileSync(path.join(dataDir, component3Name, 'component3-data'));

  expect(fs.existsSync(path.join(newDataDir))).toBeFalsy();

  await migrateApplicationToStructV2({ did: blocklet.meta.did, appSk: appWallet.secretKey, manager, states });

  expect(fs.existsSync(newDataDir)).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'rbac.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'user.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'session.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, '.assets'))).toBeFalsy();
  expect(fs.existsSync(path.join(newDataDir, '__uploads'))).toBeFalsy();
  expect(fs.existsSync(path.join(newDataDir, 'blocklet-data'))).toBeFalsy();

  expect(fs.existsSync(path.join(newDataDir, blockletName, 'blocklet-data'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, blocklet2Name, 'component2-data'))).toBeTruthy(); // component name should be equal to bundle name
  expect(fs.existsSync(path.join(newDataDir, blocklet3Name, 'component3-data'))).toBeTruthy();
});

test('should composite application work (name format: @xxx/xxx)', async () => {
  const blockletDid = 'b-did';
  const blockletName = '@arcblock/b-name';

  const blocklet2Did = 'b2-did';
  const blocklet2Name = '@arcblock/b2-name';
  const component2Did = 'b2-did-1';
  const component2Name = '@arcblock/b2-name-1';

  const blocklet3Did = 'b3-did';
  const blocklet3Name = 'b3-name';
  const component3Did = 'b3-did-1';
  const component3Name = 'b3-name-1';

  const dataDir = path.join(dataDirs.data, blockletName);
  const newDataDir = path.join(dataDirs.data, appPermanentWallet.address);

  initializeBlocklet({
    children: [
      {
        ...getComponentProps(
          component2Did,
          component2Name,
          blocklet2Did,
          blocklet2Name,
          `${blockletName}/${component2Name}`
        ),
      },
      {
        ...getComponentProps(
          component3Did,
          component3Name,
          blocklet3Did,
          blocklet3Name,
          `${blockletName}/${component3Name}`
        ),
      },
    ],
    ...getComponentProps(blockletDid, blockletName),
  });

  fs.ensureDirSync(dataDir);
  fs.ensureFileSync(path.join(dataDir, 'rbac.db'));
  fs.ensureFileSync(path.join(dataDir, 'user.db'));
  fs.ensureFileSync(path.join(dataDir, 'session.db'));
  fs.ensureFileSync(path.join(dataDir, 'blocklet-data'));
  fs.ensureFileSync(path.join(dataDir, component2Name, 'component2-data'));
  fs.ensureFileSync(path.join(dataDir, component3Name, 'component3-data'));

  expect(fs.existsSync(path.join(newDataDir))).toBeFalsy();

  await migrateApplicationToStructV2({ did: blocklet.meta.did, appSk: appWallet.secretKey, manager, states });

  expect(fs.existsSync(newDataDir)).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'rbac.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'user.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'session.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, '.assets'))).toBeFalsy();
  expect(fs.existsSync(path.join(newDataDir, '__uploads'))).toBeFalsy();
  expect(fs.existsSync(path.join(newDataDir, 'blocklet-data'))).toBeFalsy();

  expect(fs.existsSync(path.join(newDataDir, '@arcblock/b-name', 'blocklet-data'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, '@arcblock/b2-name', 'component2-data'))).toBeTruthy(); // component name should be equal to bundle name
  expect(fs.existsSync(path.join(newDataDir, 'b3-name', 'component3-data'))).toBeTruthy();
});

test('should composite application work (nested)', async () => {
  const blockletDid = 'b-did';
  const blockletName = '@arcblock/b-name';

  const blocklet2Did = 'b2-did';
  const blocklet2Name = '@arcblock/b2-name';
  const component2Did = 'b2-did-1';
  const component2Name = '@arcblock/b2-name-1';

  const blocklet3Did = 'b3-did';
  const blocklet3Name = 'b3-name';
  const component3Did = 'b3-did-1';
  const component3Name = 'b3-name-1';

  const dataDir = path.join(dataDirs.data, blockletName);
  const newDataDir = path.join(dataDirs.data, appPermanentWallet.address);

  initializeBlocklet({
    children: [
      {
        children: [
          {
            ...getComponentProps(
              component3Did,
              component3Name,
              blocklet3Did,
              blocklet3Name,
              `${blockletName}/${component2Name}/${component3Name}`
            ),
            configs: [
              {
                key: 'PROP1',
                secure: false,
                value: '', // will inherit from parent
              },
              {
                key: 'PROP2',
                secure: false,
                value: 'child prop 2',
              },
            ],
          },
        ],
        ...getComponentProps(
          component2Did,
          component2Name,
          blocklet2Did,
          blocklet2Name,
          `${blockletName}/${component2Name}`
        ),
        configs: [
          {
            key: 'PROP1',
            secure: false,
            value: 'parent prop 1',
          },
          {
            key: 'PROP2',
            secure: false,
            value: 'parent prop 2',
          },
        ],
      },
    ],
    ...getComponentProps(blockletDid, blockletName),
  });

  fs.ensureDirSync(dataDir);
  fs.ensureFileSync(path.join(dataDir, 'rbac.db'));
  fs.ensureFileSync(path.join(dataDir, 'user.db'));
  fs.ensureFileSync(path.join(dataDir, 'session.db'));
  fs.ensureFileSync(path.join(dataDir, 'blocklet-data'));
  fs.ensureFileSync(path.join(dataDir, component2Name, 'component2-data'));
  fs.ensureFileSync(path.join(dataDir, `${component2Name}/${component3Name}`, 'component3-data'));

  expect(fs.existsSync(path.join(newDataDir))).toBeFalsy();

  await migrateApplicationToStructV2({ did: blocklet.meta.did, appSk: appWallet.secretKey, manager, states });

  expect(states.blockletExtras.update).toHaveBeenLastCalledWith(
    { did: 'b-did' },
    expect.objectContaining({
      configs: [
        {
          key: 'BLOCKLET_APP_SK',
          secure: true,
          shared: false,
          // the value is not encrypted because extras.encryptSecurityData() is mocked
          value: appPermanentWallet.secretKey,
        },
        // PROP1 should in app's config because component2 inherit it from component1 before
        {
          key: 'PROP1',
          secure: false,
          shared: true,
          value: 'parent prop 1',
        },
        // PROP2 should NOT in app's config because component2 does not inherit it from component1 before
      ],
      children: [
        expect.objectContaining({
          configs: [], // root component does not have props
        }),
        expect.objectContaining({
          configs: [
            // component1 have its own props
            {
              key: 'PROP1',
              secure: false,
              value: 'parent prop 1',
            },
            {
              key: 'PROP2',
              secure: false,
              value: 'parent prop 2',
            },
          ],
        }),
        expect.objectContaining({
          configs: [
            // component2 have its own props
            {
              key: 'PROP1',
              secure: false,
              value: '',
            },
            {
              key: 'PROP2',
              secure: false,
              value: 'child prop 2',
            },
          ],
        }),
      ],
    })
  );

  expect(fs.existsSync(newDataDir)).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'rbac.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'user.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'session.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, '.assets'))).toBeFalsy();
  expect(fs.existsSync(path.join(newDataDir, '__uploads'))).toBeFalsy();
  expect(fs.existsSync(path.join(newDataDir, 'blocklet-data'))).toBeFalsy();

  expect(fs.existsSync(path.join(newDataDir, '@arcblock/b-name', 'blocklet-data'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, '@arcblock/b2-name', 'component2-data'))).toBeTruthy(); // component name should be equal to bundle name
  expect(fs.existsSync(path.join(newDataDir, 'b3-name', 'component3-data'))).toBeTruthy();
});

test('should composite application work (gateway)', async () => {
  const containerDid = 'container-did';
  const containerName = 'container-name';

  const blockletDid = 'b-did';
  const blockletName = '@arcblock/b-name';

  const blocklet2Did = 'b2-did';
  const blocklet2Name = '@arcblock/b2-name';
  const component2Did = 'b2-did-1';
  const component2Name = '@arcblock/b2-name-1';

  const blocklet3Did = 'b3-did';
  const blocklet3Name = 'b3-name';
  const component3Did = 'b3-did-1';
  const component3Name = 'b3-name-1';

  const dataDir = path.join(dataDirs.data, containerName);
  const newDataDir = path.join(dataDirs.data, appPermanentWallet.address);

  const props = getComponentProps(containerDid, containerName);
  props.meta.group = BlockletGroup.gateway;

  initializeBlocklet({
    children: [
      {
        ...getComponentProps(blockletDid, blockletName, null, null, `${containerName}/${blockletName}`),
      },
      {
        children: [
          {
            ...getComponentProps(
              component3Did,
              component3Name,
              blocklet3Did,
              blocklet3Name,
              `${containerName}/${component2Name}/${component3Name}`
            ),
          },
        ],
        ...getComponentProps(
          component2Did,
          component2Name,
          blocklet2Did,
          blocklet2Name,
          `${containerName}/${component2Name}`
        ),
      },
    ],
    ...props,
  });

  fs.ensureDirSync(dataDir);
  fs.ensureFileSync(path.join(dataDir, 'rbac.db'));
  fs.ensureFileSync(path.join(dataDir, 'user.db'));
  fs.ensureFileSync(path.join(dataDir, 'session.db'));
  fs.ensureFileSync(path.join(dataDir, blockletName, 'blocklet-data'));
  fs.ensureFileSync(path.join(dataDir, component2Name, 'component2-data'));
  fs.ensureFileSync(path.join(dataDir, `${component2Name}/${component3Name}`, 'component3-data'));

  expect(fs.existsSync(path.join(newDataDir))).toBeFalsy();

  await migrateApplicationToStructV2({ did: blocklet.meta.did, appSk: appWallet.secretKey, manager, states });

  expect(fs.existsSync(newDataDir)).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'rbac.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'user.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'session.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, '.assets'))).toBeFalsy();
  expect(fs.existsSync(path.join(newDataDir, '__uploads'))).toBeFalsy();
  expect(fs.existsSync(path.join(newDataDir, 'blocklet-data'))).toBeFalsy();

  expect(fs.existsSync(path.join(newDataDir, '@arcblock/b-name', 'blocklet-data'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, '@arcblock/b2-name', 'component2-data'))).toBeTruthy(); // component name should be equal to bundle name
  expect(fs.existsSync(path.join(newDataDir, 'b3-name', 'component3-data'))).toBeTruthy();
});

test('should migrateAppOnChain', async () => {
  const blockletDid = 'b-did';
  const blockletName = 'b-name';

  initializeBlocklet({
    configObj: {
      CHAIN_HOST: chainServerEndpoint,
    },
    ...getComponentProps(blockletDid, blockletName),
  });
  const dataDir = path.join(dataDirs.data, blockletName);
  fs.ensureDirSync(dataDir);
  fs.ensureDirSync(path.join(dataDir, blockletName));

  const newDataDir = path.join(dataDirs.data, appPermanentWallet.address);

  expect(fs.existsSync(path.join(newDataDir))).toBeFalsy();

  try {
    await migrateApplicationToStructV2({ did: blocklet.meta.did, appSk: appWallet.secretKey, manager, states });
  } catch (error) {
    // FIXME: how to mock ocap client
  }
});

test('should rollback', async () => {
  const blockletDid = 'b-did';
  const blockletName = 'b-name';

  initializeBlocklet({
    configObj: {
      CHAIN_HOST: chainServerEndpoint,
    },
    ...getComponentProps(blockletDid, blockletName),
  });
  const dataDir = path.join(dataDirs.data, blockletName);
  fs.ensureDirSync(dataDir);
  fs.ensureDirSync(path.join(dataDir, blockletName));

  let errMsg = '';
  states.site.update = () => {
    throw new Error('test throw error on update site');
  };
  try {
    await migrateApplicationToStructV2({ did: blocklet.meta.did, appSk: appWallet.secretKey, manager, states });
  } catch (error) {
    errMsg = error.message;
  }

  expect(errMsg).toBe('test throw error on update site');
  expect(states.site.remove).toHaveBeenLastCalledWith({ id: 'id:site' });
  expect(states.blocklet.remove.mock.calls[0][0]).toEqual({ appPid: appPermanentWallet.address });
  expect(states.blocklet.remove.mock.calls[1][0]).toEqual({ id: 'id:blocklet' });
  expect(states.blocklet.remove.mock.calls[2][0]).toEqual({ 'meta.did': appPermanentWallet.address });
  expect(states.blockletExtras.remove).toHaveBeenLastCalledWith({ id: 'id:extras' });
  expect(states.site.insert).toHaveBeenLastCalledWith({ id: 'id:site', tag: 'backup site' });
  expect(states.blockletExtras.insert).toHaveBeenLastCalledWith({ id: 'id:extras', tag: 'backup extras' });
  expect(states.blocklet.insert).toHaveBeenLastCalledWith({ id: 'id:blocklet', tag: 'backup blocklet' });
});

test('should encrypt data', async () => {
  const blockletDid = 'b-did';
  const blockletName = 'b-name';

  const blocklet2Did = 'b2-did';
  const blocklet2Name = 'b2-name';
  const component2Did = 'b2-did';
  const component2Name = 'b2-name';

  const blocklet3Did = 'b3-did';
  const blocklet3Name = 'b3-name';
  const component3Did = 'b3-did';
  const component3Name = 'b3-name';

  const dataDir = path.join(dataDirs.data, blockletName);
  const newDataDir = path.join(dataDirs.data, appPermanentWallet.address);

  initializeBlocklet({
    children: [
      {
        ...getComponentProps(
          component2Did,
          component2Name,
          blocklet2Did,
          blocklet2Name,
          `${blockletName}/${component2Name}`
        ),
      },
      {
        ...getComponentProps(
          component3Did,
          component3Name,
          blocklet3Did,
          blocklet3Name,
          `${blockletName}/${component3Name}`
        ),
      },
    ],
    ...getComponentProps(blockletDid, blockletName),
  });

  fs.ensureDirSync(dataDir);
  fs.ensureFileSync(path.join(dataDir, 'rbac.db'));
  fs.ensureFileSync(path.join(dataDir, 'user.db'));
  fs.ensureFileSync(path.join(dataDir, 'session.db'));
  fs.ensureFileSync(path.join(dataDir, 'blocklet-data'));
  fs.ensureFileSync(path.join(dataDir, component2Name, 'component2-data'));
  fs.ensureFileSync(path.join(dataDir, component3Name, 'component3-data'));

  expect(fs.existsSync(path.join(newDataDir))).toBeFalsy();

  await migrateApplicationToStructV2({ did: blocklet.meta.did, appSk: appWallet.secretKey, manager, states });

  expect(states.blockletExtras.encryptSecurityData).toHaveBeenLastCalledWith({
    data: expect.objectContaining({
      id: 'id:extras',
      children: [
        {
          did: 'b-did',
          configs: [],
        },
        {
          did: 'b2-did',
          configs: [],
        },
        {
          did: 'b3-did',
          configs: [],
        },
      ],
      configs: [
        {
          key: 'BLOCKLET_APP_SK',
          secure: true,
          shared: false,
          value: appPermanentWallet.secretKey,
        },
      ],
      did: appPermanentWallet.address,
    }),
  });

  expect(fs.existsSync(newDataDir)).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'rbac.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'user.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, 'session.db'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, '.assets'))).toBeFalsy();
  expect(fs.existsSync(path.join(newDataDir, '__uploads'))).toBeFalsy();
  expect(fs.existsSync(path.join(newDataDir, 'blocklet-data'))).toBeFalsy();

  expect(fs.existsSync(path.join(newDataDir, blockletName, 'blocklet-data'))).toBeTruthy();
  expect(fs.existsSync(path.join(newDataDir, blocklet2Name, 'component2-data'))).toBeTruthy(); // component name should be equal to bundle name
  expect(fs.existsSync(path.join(newDataDir, blocklet3Name, 'component3-data'))).toBeTruthy();
});

test('should set bundleSource:store of root component', async () => {
  // store source
  const blockletDid = 'b-did';
  const blockletName = 'b-name';

  initializeBlocklet({
    source: 0, // registry
    deployedFrom: 'https://store.blocklet.dev',
    ...getComponentProps(blockletDid, blockletName),
  });

  const dataDir = path.join(dataDirs.data, blockletName);
  fs.ensureDirSync(dataDir);

  const newDataDir = path.join(dataDirs.data, appPermanentWallet.address);
  expect(fs.existsSync(path.join(newDataDir))).toBeFalsy();

  await migrateApplicationToStructV2({ did: blocklet.meta.did, appSk: appWallet.secretKey, manager, states });

  expect(states.blocklet.addBlocklet).toHaveBeenLastCalledWith({
    appPid: appPermanentWallet.address,
    children: [
      expect.objectContaining({
        source: 0,
        deployedFrom: 'https://store.blocklet.dev',
        bundleSource: {
          name: 'b-name',
          store: 'https://store.blocklet.dev',
          version: 'latest',
        },
        meta: expect.objectContaining({
          did: 'b-did',
          name: 'b-name',
          bundleDid: 'b-did',
          bundleName: 'b-name',
        }),
        children: [],
      }),
    ],
    meta: expect.objectContaining({
      bundleDid: appPermanentWallet.address,
      bundleName: appPermanentWallet.address,
      name: appPermanentWallet.address,
      did: appPermanentWallet.address,
      version: '1.0.0',
      group: 'gateway',
      environments: [],
    }),
    migratedFrom: [],
    source: 4, // custom
    status: 8, // stopped
  });
});

test('should set bundleSource:url of root component', async () => {
  // store source
  const blockletDid = 'b-did';
  const blockletName = 'b-name';

  initializeBlocklet({
    source: 3, // url
    deployedFrom: 'https://x.y.z',
    ...getComponentProps(blockletDid, blockletName),
  });

  const dataDir = path.join(dataDirs.data, blockletName);
  fs.ensureDirSync(dataDir);

  const newDataDir = path.join(dataDirs.data, appPermanentWallet.address);
  expect(fs.existsSync(path.join(newDataDir))).toBeFalsy();

  await migrateApplicationToStructV2({ did: blocklet.meta.did, appSk: appWallet.secretKey, manager, states });

  expect(states.blocklet.addBlocklet).toHaveBeenLastCalledWith({
    appPid: appPermanentWallet.address,
    children: [
      expect.objectContaining({
        source: 3,
        deployedFrom: 'https://x.y.z',
        bundleSource: {
          url: 'https://x.y.z',
        },
        meta: expect.objectContaining({
          did: 'b-did',
          name: 'b-name',
          bundleDid: 'b-did',
          bundleName: 'b-name',
        }),
        children: [],
      }),
    ],
    meta: expect.objectContaining({
      bundleDid: appPermanentWallet.address,
      bundleName: appPermanentWallet.address,
      name: appPermanentWallet.address,
      did: appPermanentWallet.address,
      version: '1.0.0',
      group: 'gateway',
      environments: [],
    }),
    migratedFrom: [],
    source: 4, // custom
    status: 8, // stopped
  });
});

test('appSk must exist', () => {
  expect(migrateApplicationToStructV2({})).rejects.toThrow('New key pair is required when migrate application');
});

test('blocklet.structVersion must not exist', () => {
  manager.getBlocklet = () => ({
    structVersion: '2',
  });
  expect(migrateApplicationToStructV2({ appSk: appWallet.address, manager })).rejects.toThrow(
    'Blocklet already migrated'
  );
});

test('blocklet state should not in progress or running', async () => {
  for (const status of [
    BlockletStatus.starting,
    BlockletStatus.stopping,
    BlockletStatus.running,
    BlockletStatus.installing,
    BlockletStatus.upgrading,
  ]) {
    blocklet.status = status;
    await expect(migrateApplicationToStructV2({ appSk: appWallet.address, manager })).rejects.toThrow(
      'Please stop blocklet before migration'
    );
  }

  for (const status of [BlockletStatus.stopped, BlockletStatus.error, BlockletStatus.installed]) {
    blocklet.status = status;
    states.blockletExtras.findOne.mockRejectedValueOnce(new Error('test'));
    await expect(migrateApplicationToStructV2({ appSk: appWallet.address, manager, states })).rejects.toThrow(
      'test' // the error is not status error
    );
  }
});

test('should should throw error if find duplicate component', async () => {
  const blockletDid = 'b-did';
  const blockletName = 'b-name';

  const blocklet2Did = 'b2-did';
  const blocklet2Name = 'b2-name';

  const component2Did = 'b2-did-1';
  const component2Name = 'b2-name-1';

  const component3Did = 'b2-did-2';
  const component3Name = 'b2-name-2';

  initializeBlocklet({
    children: [
      {
        ...getComponentProps(
          component2Did,
          component2Name,
          blocklet2Did,
          blocklet2Name,
          `${blockletName}/${component2Name}`
        ),
      },
      {
        ...getComponentProps(
          component3Did,
          component3Name,
          blocklet2Did,
          blocklet2Name,
          `${blockletName}/${component3Name}`
        ),
      },
    ],
    ...getComponentProps(blockletDid, blockletName),
  });

  const dataDir = path.join(dataDirs.data, blockletName);
  fs.ensureDirSync(dataDir);

  await expect(
    migrateApplicationToStructV2({ did: blocklet.meta.did, appSk: appWallet.secretKey, manager, states })
  ).rejects.toThrow('Find duplicate component b2-name');

  initializeBlocklet({
    children: [
      {
        children: [
          {
            ...getComponentProps(
              component3Did,
              component3Name,
              blockletDid,
              blockletName,
              `${blockletName}/${component2Name}/${component3Name}`
            ),
          },
        ],
        ...getComponentProps(
          component2Did,
          component2Name,
          blocklet2Did,
          blocklet2Name,
          `${blockletName}/${component2Name}`
        ),
      },
    ],
    ...getComponentProps(blockletDid, blockletName),
  });

  await expect(
    migrateApplicationToStructV2({ did: blocklet.meta.did, appSk: appWallet.secretKey, manager, states })
  ).rejects.toThrow('Find duplicate component b-name');
});
