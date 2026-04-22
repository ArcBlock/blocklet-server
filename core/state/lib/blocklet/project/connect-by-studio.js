const validUrl = require('valid-url');

const { createConnect } = require('@blocklet/store');
const { getDisplayName } = require('@blocklet/meta/lib/util');

function sanitizeBlockletTitle(blockletTitle) {
  let sanitizedTitle = blockletTitle.replace(/[^a-zA-Z0-9-_]/g, '');
  sanitizedTitle = sanitizedTitle.replace(/^[^a-zA-Z0-9]+/, '');
  if (sanitizedTitle.length > 128) {
    sanitizedTitle = sanitizedTitle.slice(0, 128);
  }
  if (sanitizedTitle.length < 4) {
    sanitizedTitle = sanitizedTitle.padEnd(4, '0');
  }
  return sanitizedTitle;
}

const connectByStudio = ({
  did,
  componentDid,
  blockletTitle,
  type,
  tenantScope,
  storeName,
  storeId,
  storeUrl,
  messageId,
  manager,
  context,
}) => {
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
        connectAction: 'connect-studio',
        enableEncrypt: true,
        closeOnSuccess: true,
        source: `Blocklet Studio (${getDisplayName(blocklet)})`,
        // monikers 必须满足一个规则, 而 blockletTitle 是更宽松的规则
        monikers: sanitizeBlockletTitle(blockletTitle) || 'blocklet',
        openPage: (pageUrl) => {
          resolve(pageUrl);
        },
      });

      if (!fetchData) {
        throw new Error('Failed to connect to store');
      }

      const { secretKey, developerDid, name, email } = fetchData.developer;
      const { address: blockletDid } = fetchData.blocklet;

      const { projectState } = await manager._getProjectState(did);

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
      await projectState.createProject({
        blockletTitle,
        type,
        tenantScope,
        blockletDid,
        componentDid,
        messageId,
        createdBy: context.user.did,
        autoUpload: true,
        possibleSameStore: true,
        connectedStores: [nextStore],
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = connectByStudio;
