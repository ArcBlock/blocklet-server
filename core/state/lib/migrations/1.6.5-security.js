/* eslint-disable no-await-in-loop */
const fs = require('fs');
const path = require('path');
const uniq = require('lodash/uniq');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const security = require('@abtnode/util/lib/security');
const { forEachBlocklet } = require('@blocklet/meta/lib/util');

module.exports = async ({ states, dataDir }) => {
  if (process.env.CI || process.env.NODE_ENV === 'test') {
    return;
  }

  const file = path.join(dataDir, '.sock');
  if (fs.existsSync(file) === false) {
    return;
  }

  try {
    const extras = await states.blockletExtras.find();
    const blocklets = await states.blocklet.find();
    for (const blocklet of blocklets) {
      forEachBlocklet(
        blocklet,
        (b) => {
          let configKeys;
          const extra = extras.find((x) => x.did === blocklet.meta.did);
          const rootKeys = (extra.configs || []).map((x) => x.key);
          if (b.meta.did === blocklet.meta.did) {
            configKeys = rootKeys;
          } else {
            const childExtra = (extra.children || []).find((x) => x.did === b.meta.did);
            const childKeys = childExtra ? childExtra.configs.map((x) => x.key) : [];
            configKeys = uniq([...rootKeys, ...childKeys]);
          }

          b.environments = cloneDeep(b.environments || [])
            .filter((x) => configKeys.includes(x.key) === false)
            .map((c) => {
              if (c.key === 'BLOCKLET_APP_SK') {
                c.value = security.encrypt(c.value, b.meta.did, fs.readFileSync(file));
              }

              return c;
            });
        },
        { sync: true }
      );

      await states.blocklet.updateById(blocklet._id, {
        $set: { environments: blocklet.environments, children: blocklet.children, migratedFrom: '1.6.5' },
      });
    }

    states.blocklet.compactDatafile();
  } catch (err) {
    console.error(err);
    throw err;
  }
};
