module.exports = async ({ states, printInfo }) => {
  printInfo('Try to rename Blocklet Registry to Blocklet Store in db...');

  const info = await states.node.read();
  (info.blockletRegistryList || []).forEach((item) => {
    if (!item) {
      return;
    }
    item.name = (item.name || '').replace('Registry', 'Store');
    item.description = (item.description || '').replace('registry', 'store');
    item.url = (item.url || '').replace('registry.arcblock.io', 'store.blocklet.dev');
  });

  await states.node.updateNodeInfo(info);
};
