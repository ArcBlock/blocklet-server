/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */

const props = {
  description: '',
  validation: '',
  shared: true,
  secure: false,
  required: false,
  custom: false,
};
module.exports = async ({ states, printInfo }) => {
  printInfo('Try to update app chain info...');

  const blockletExtras = await states.blockletExtras.find({});

  for (const extra of blockletExtras || []) {
    const appConfigs = extra.configs || [];

    const hasChainHostInApp = appConfigs.find((x) => x.key === 'BLOCKLET_APP_CHAIN_HOST');
    const hasChainIdInApp = appConfigs.find((x) => x.key === 'BLOCKLET_APP_CHAIN_ID');
    const hasChainTypeInApp = appConfigs.find((x) => x.key === 'BLOCKLET_APP_CHAIN_TYPE');
    let shouldUpdate = false;
    let hasSetChainHost = false;
    let hasSetChainId = false;
    let hasSetChainType = false;

    const components = [];
    for (const child of extra.children || []) {
      components.push(child);
    }
    components.push(extra); // root component

    for (const component of components) {
      for (const config of component.configs || []) {
        const { value } = config;

        if (config.key === 'CHAIN_HOST' && value && !hasChainHostInApp && !hasSetChainHost) {
          appConfigs.push({
            key: 'BLOCKLET_APP_CHAIN_HOST',
            value,
            ...props,
          });
          shouldUpdate = true;
          hasSetChainHost = true;
          printInfo(`Should update blocklet ${extra.did}, CHAIN_HOST: ${value}`);
        }

        if (config.key === 'CHAIN_ID' && value && !hasChainIdInApp && !hasSetChainId) {
          appConfigs.push({
            key: 'BLOCKLET_APP_CHAIN_ID',
            value,
            ...props,
          });
          shouldUpdate = true;
          hasSetChainId = true;
          printInfo(`Should update blocklet ${extra.did}, CHAIN_ID: ${value}`);
        }

        if (config.key === 'CHAIN_TYPE' && value && !hasChainTypeInApp && !hasSetChainType) {
          appConfigs.push({
            key: 'BLOCKLET_APP_CHAIN_TYPE',
            value,
            ...props,
          });
          shouldUpdate = true;
          hasSetChainType = true;
          printInfo(`Should update blocklet ${extra.did}, CHAIN_TYPE: ${value}`);
        }
      }
    }

    if (shouldUpdate) {
      await states.blockletExtras.update({ did: extra.did }, { $set: { configs: appConfigs } });
      printInfo(`Blocklet in blocklet_extra.db updated: ${extra.did}`);
    }
  }
};
