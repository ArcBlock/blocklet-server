import { BLOCKLET_TENANT_MODES } from '@blocklet/constant';

const canDeleteStore = ({ store, userDid }) => {
  const singleTenant = !(window.blocklet?.tenantMode === BLOCKLET_TENANT_MODES.MULTIPLE);
  if (store.protected) {
    return false;
  }
  if (store.scope && store.scope === userDid) {
    return true;
  }
  if (singleTenant) {
    return store.scope === 'studio';
  }
  return false;
};

export default canDeleteStore;
