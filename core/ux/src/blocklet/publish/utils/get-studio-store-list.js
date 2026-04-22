import isNull from 'lodash/isNull';

const getStudioStoreList = ({ fromBlocklet, nodeInfo, blocklet, userDid }) => {
  const teamDid = fromBlocklet ? blocklet?.meta?.did : nodeInfo?.did;
  let storeList = fromBlocklet ? blocklet?.settings?.storeList || [] : nodeInfo?.blockletRegistryList || [];
  if (!Array.isArray(storeList)) {
    storeList = [];
  }
  storeList = storeList.filter((x) => x.protected || isNull(x.scope) || x.scope === 'studio' || x.scope === userDid);

  return { teamDid, storeList };
};

export default getStudioStoreList;
