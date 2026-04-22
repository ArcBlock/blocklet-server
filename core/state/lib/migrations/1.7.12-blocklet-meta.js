/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */

module.exports = async ({ states, printInfo }) => {
  printInfo('Try to update blocklet server to 1.7.12...');

  const blocklets = await states.blocklet.getBlocklets();

  for (const blocklet of blocklets) {
    let changed = false;

    if (!blocklet.meta.bundleDid) {
      blocklet.meta.bundleDid = blocklet.meta.did;
      blocklet.meta.bundleName = blocklet.meta.name;
      changed = true;
    }

    (blocklet.children || []).forEach((child) => {
      if (!child.meta.bundleDid) {
        child.meta.bundleDid = child.meta.did;
        child.meta.bundleName = child.meta.name;
        changed = true;
      }
    });

    if (changed) {
      await states.blocklet.updateBlocklet(blocklet.meta.did, { meta: blocklet.meta, children: blocklet.children });
      printInfo(`Blocklet meta in blocklet.db updated: ${blocklet.meta.did}`);
    }
  }

  const blockletExtras = await states.blockletExtras.find({});

  for (const extra of blockletExtras) {
    let changed = false;
    const children = await states.blockletExtras.getSettings(extra.did, 'children', []);
    (children || []).forEach((child) => {
      if (!child.meta.bundleDid) {
        child.meta.bundleDid = child.meta.did;
        child.meta.bundleName = child.meta.name;
        changed = true;
      }
    });

    if (changed) {
      await states.blockletExtras.setSettings(extra.did, { children });
      printInfo(`Blocklet dynamic component meta in blocklet_extra.db updated: ${extra.did}`);
    }
  }
};
