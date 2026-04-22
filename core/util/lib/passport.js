const uniqBy = require('lodash/uniqBy');
const { ROLES, PASSPORT_STATUS } = require('@abtnode/constant');

const hasActiveOwnerPassport = (user, { blocklet, nodeInfo } = {}) => {
  return (user?.passports || []).some((x) => {
    let result = x.role === ROLES.OWNER && x.status === PASSPORT_STATUS.VALID;
    if (blocklet) {
      result = result && user.did === blocklet?.settings?.owner?.did;
    } else if (nodeInfo) {
      result = result && user.did === nodeInfo?.nodeOwner?.did;
    }
    return result;
  });
};

const getActivePassports = (user, issuerDidList = []) => {
  const isRecoverable = (x) => {
    if (x.status !== PASSPORT_STATUS.VALID) {
      return false;
    }

    if (!issuerDidList.includes(x.issuer.id)) {
      return false;
    }

    return !(x.expirationDate && Date.now() > new Date(x.expirationDate).getTime());
  };

  return uniqBy((user.passports || []).filter((x) => !x.display).filter(isRecoverable), 'name').concat(
    uniqBy((user.passports || []).filter((x) => x.display).filter(isRecoverable), 'display.content')
  );
};

module.exports = {
  hasActiveOwnerPassport,
  getActivePassports,
};
