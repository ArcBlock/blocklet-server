/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */

module.exports = async ({ states, printInfo }) => {
  printInfo('Try to update blocklet to 1.6.17...');
  const blockletState = states.blocklet;

  const blocklets = await blockletState.getBlocklets();
  for (const blocklet of blocklets) {
    if (!blocklet) {
      continue;
    }

    if (!blocklet.children || !blocklet.children.length) {
      continue;
    }

    const meta = blocklet.meta || {};
    const { did } = meta;
    if (!did) {
      continue;
    }

    const children = (blocklet.children || []).map((child) => {
      if (child.mountPoint) {
        return child;
      }

      const config = (meta.children || []).find((x) => x.name === child.meta.name);

      if (
        config &&
        config.mountPoints &&
        config.mountPoints[0] &&
        config.mountPoints[0].root &&
        config.mountPoints[0].root.prefix
      ) {
        child.mountPoint = config.mountPoints[0].root.prefix;
      }
      printInfo(`Set mountPoint: ${child.mountPoint} to child ${child.meta.name} in ${blocklet.meta.name}`);

      return child;
    });

    await blockletState.update(blocklet._id, { $set: { children } });
  }
};
