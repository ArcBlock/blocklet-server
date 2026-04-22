import { toBlockletDid } from '@blocklet/meta/lib/did';
import {
  getConnectedAccounts,
  getConnectedDids,
  getPermanentDid,
  getWallet,
  getWalletDid,
} from '@blocklet/meta/lib/did-utils';
import { BlockletService } from './service/blocklet';

async function getUserInfo(
  userDid: string,
  {
    blockletClient = undefined,
    authClient = undefined,
  }: {
    blockletClient?: BlockletService;
    /** @deprecated Use blockletClient instead */
    authClient?: BlockletService;
  } = {}
) {
  const client = blockletClient || authClient || new BlockletService();
  const { user } = await client.getUser(userDid, {
    enableConnectedAccount: true,
  });
  return user;
}

export { getUserInfo, toBlockletDid, getConnectedAccounts, getConnectedDids, getPermanentDid, getWallet, getWalletDid };
