const validUrl = require('valid-url');

const { createConnect } = require('@blocklet/store');
const { getDisplayName } = require('@blocklet/meta/lib/util');

const connectToStore = ({ did, projectId, storeName, storeId, storeUrl, manager, context }) => {
  if (!did) {
    throw new Error('Invalid did');
  }
  // 校验是否为合法的url地址（必须是 http 或 https 协议）,例如：https://store.blocklet.dev/
  if (!validUrl.isWebUri(storeUrl)) {
    throw new Error('Invalid store url:', storeUrl);
  }

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const blocklet = await manager.getBlocklet(did);
      const fetchData = await createConnect({
        connectUrl: storeUrl,
        connectAction: 'connect-cli',
        source: `Blocklet Studio (${getDisplayName(blocklet)})`,
        enableEncrypt: true,
        closeOnSuccess: true,
        openPage: (pageUrl) => {
          resolve(pageUrl);
        },
      });

      const { secretKey, developerDid, name, email } = fetchData;

      const { projectState } = await manager._getProjectState(did);
      const project = await projectState.findOne({ id: projectId });

      if (!project.connectedStores) {
        project.connectedStores = [];
      }

      const nextStore = {
        storeId,
        storeName,
        storeUrl,
        accessToken: secretKey,
        developerDid,
        developerName: name,
        developerEmail: email,
        createdBy: context?.user?.did,
      };

      const oldStore = project.connectedStores.find((x) => x.storeId === storeId);
      if (oldStore) {
        Object.assign(oldStore, nextStore);
      } else {
        project.connectedStores.push(nextStore);
      }

      await projectState.updateProject(projectId, project);
    } catch (error) {
      reject(new Error(`Failed to connect to store: ${error.message}`));
    }
  });
};

module.exports = connectToStore;
