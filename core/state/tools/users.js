/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable global-require */
const path = require('path');
const { fromRandom } = require('@ocap/wallet');
const { getBlockletModels, setupModels, createSequelize } = require('@abtnode/models');
const { LOGIN_PROVIDER } = require('@blocklet/constant');

const dataDir = '/Users/wangshijun/Develop/abtnode/blocklet/.abtnode/data';
const appDid = 'zNKc87X1CBkRcejUrfEVkLXdWsp2CLzogShj';
const dbFile = path.join(dataDir, appDid, 'blocklet.db');

const States = {
  User: require('../lib/states/user'),
  Passport: require('../lib/states/passport'),
  ConnectedAccount: require('../lib/states/connect-account'),
  Session: require('../lib/states/session'),
};

const sequelize = createSequelize(dbFile, { logging: false });
const models = getBlockletModels();
setupModels(models, sequelize);

const state = new States.User(models.User, {}, models);

(async () => {
  console.time('findOne');
  let result = await state.getUser('z1mJFJBqFGwJZxtDKWDjBjfVEoRkSUjrrbq');
  console.timeEnd('findOne');
  console.log(result);
  console.time('count');
  result = await state.count({ approved: true });
  console.timeEnd('count');
  console.log(result);

  for (let i = 0; i < 400000; i++) {
    const wallet = fromRandom();
    await state.addUser({
      did: wallet.address,
      pk: wallet.publicKey,
      fullName: `user${i}`,
      email: `user${i}@arcblock.io`,
      avatar: 'bn://avatar/b6f04763cf45d6f4acfd499f26e60350.jpg',
      approved: Math.random() > 0.5,
      locale: 'en',
      sourceProvider: LOGIN_PROVIDER.WALLET,
      firstLoginAt: '2023-05-15T04:26:33.314Z',
      lastLoginAt: '2023-05-15T06:28:02.875Z',
      lastLoginIp: '192.168.123.127',
      createdAt: '2023-05-15T04:26:33.316Z',
      updatedAt: '2023-05-15T06:28:02.878Z',
      meta: {},
      passports: [],
      connectedAccounts: [
        {
          provider: LOGIN_PROVIDER.WALLET,
          did: wallet.address,
        },
      ],
    });
    console.log(`inserted user ${wallet.address}`);
  }
})();
