import { types } from '@ocap/mcrypto';
import { toHex } from '@ocap/util';
import { fromPublicKey, isValid } from '@arcblock/did';

const toBlockletDid = (name: string | Buffer): string => {
  if (isValid(name as string)) {
    return name as string;
  }

  // @ts-ignore
  const pk = toHex(Buffer.from(typeof name === 'string' ? name.trim() : name));
  return fromPublicKey(pk, { role: types.RoleType.ROLE_ANY });
};

export { toBlockletDid };
