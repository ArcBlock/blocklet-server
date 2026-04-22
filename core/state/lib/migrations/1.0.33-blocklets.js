/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
const { BLOCKLET_DEFAULT_PORT_NAME } = require('@blocklet/constant');

module.exports = async ({ states, printInfo }) => {
  printInfo('Try to update node config to 1.0.33...');
  const blockletState = states.blocklet;
  const extrasState = states.blockletExtras;

  const blocklets = await blockletState.getBlocklets();
  for (let i = 0; i < blocklets.length; i++) {
    const { meta, configs } = blocklets[i];
    // Save blocklet config to extras
    await extrasState.setConfigs(meta.did, configs);

    const blocklet = await blockletState.getBlocklet(meta.did);
    printInfo(`Migrate configs for blocklet state: ${meta.did}`);
    if (blocklet) {
      // Remove blocklet configs from blocklet state
      await blockletState.update(blocklet._id, { $unset: { configs: '' } });
      printInfo(`Remove configs from blocklet state: ${meta.did}`);

      // Update blocklet ports
      const { port, ports } = blocklet;
      if (port && !ports) {
        const alreadyAssigned = { [BLOCKLET_DEFAULT_PORT_NAME]: port };
        const newPorts = await blockletState.getBlockletPorts(blocklet.meta.interfaces, alreadyAssigned, true);
        await blockletState.update(blocklet._id, { $set: { ports: newPorts } });
        printInfo(`Update ports for blocklet state: ${meta.did}`);
      }
    }
  }
};
