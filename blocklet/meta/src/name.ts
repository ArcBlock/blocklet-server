import { isValid as isDid, toTypeInfo, types } from '@arcblock/did';
import validate from 'validate-npm-package-name';

const MAX_NAME_LENGTH = 32;

/**
 * Check whether a DID is a new-style blocklet DID (must have role ROLE_BLOCKLET)
 * @param did The DID value to validate
 */
export const validateNewDid = (did: string): void => {
  const typeInfo = toTypeInfo(did);
  if (typeInfo.role !== types.RoleType.ROLE_BLOCKLET) {
    throw new Error("Blocklet DID's type must be ROLE_BLOCKLET");
  }
};

export const validateName = (name: string, { checkDid = true } = {}): void => {
  if (isDid(name)) {
    // new did mode
    if (checkDid) {
      validateNewDid(name);
    }
  } else {
    // old did mode
    const { validForNewPackages, errors = [], warnings = [] } = validate(name);

    if (!validForNewPackages) {
      throw new Error(errors[0] || warnings[0]);
    }

    if (name.length > MAX_NAME_LENGTH) {
      throw new Error('Blocklet name is too long');
    }
  }
};

export default {
  validateName,
  validateNewDid,
};
