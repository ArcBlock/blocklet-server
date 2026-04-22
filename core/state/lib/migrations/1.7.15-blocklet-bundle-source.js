/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */

module.exports = async ({ states, printInfo }) => {
  printInfo('Try to update blocklet server to 1.7.15...');

  const blocklets = await states.blocklet.getBlocklets();

  for (const blocklet of blocklets) {
    (blocklet.children || []).forEach((child) => {
      const { sourceUrl } = child;
      delete child.sourceUrl;
      if (sourceUrl && !child.bundleSource) {
        child.bundleSource = {
          url: sourceUrl,
        };
      }
    });

    await states.blocklet.updateBlocklet(blocklet.meta.did, { children: blocklet.children });
    printInfo(`Blocklet children in blocklet.db updated: ${blocklet.meta.did}`);
  }

  const blockletExtras = await states.blockletExtras.find({});

  for (const extra of blockletExtras) {
    const children = await states.blockletExtras.getSettings(extra.did, 'children', []);
    (children || []).forEach((child) => {
      const { sourceUrl } = child;
      delete child.sourceUrl;
      if (sourceUrl && !child.bundleSource) {
        child.bundleSource = {
          url: sourceUrl,
        };
      }
    });

    await states.blockletExtras.setSettings(extra.did, { children });
    printInfo(`Blocklet dynamic component in blocklet_extra.db updated: ${extra.did}`);
  }
};
