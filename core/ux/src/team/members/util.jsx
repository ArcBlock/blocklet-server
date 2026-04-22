import { joinURL } from 'ufo';

import { encode as encodeBase32 } from '@abtnode/util/lib/base32';
import { USER_AVATAR_URL_PREFIX, USER_AVATAR_PATH_PREFIX, DEFAULT_DID_DOMAIN } from '@abtnode/constant';

// eslint-disable-next-line import/prefer-default-export
export function parseAvatar(avatar, teamDid, inService, sourceByServer = false) {
  if (avatar && avatar.startsWith(USER_AVATAR_URL_PREFIX)) {
    const prefix = window.env.apiPrefix || '/';

    if (inService) {
      if (sourceByServer && window.blocklet?.serverDid) {
        const serverEndpoint = `https://${encodeBase32(window.blocklet?.serverDid)}.${DEFAULT_DID_DOMAIN}`;
        return `${joinURL(serverEndpoint, USER_AVATAR_PATH_PREFIX, teamDid, avatar.replace(USER_AVATAR_URL_PREFIX, ''))}?imageFilter=resize&w=64&h=64`;
      }
      return `${joinURL(prefix, USER_AVATAR_PATH_PREFIX, avatar.replace(USER_AVATAR_URL_PREFIX, ''))}?imageFilter=resize&w=64&h=64`;
    }

    return `${joinURL(prefix, USER_AVATAR_PATH_PREFIX, teamDid, avatar.replace(USER_AVATAR_URL_PREFIX, ''))}?imageFilter=resize&w=64&h=64`;
  }

  return avatar;
}

export const isNodeOwner = (nodeInfo, userDid) => nodeInfo.nodeOwner && nodeInfo.nodeOwner.did === userDid;
export const isSelf = (sessionUser, userDid) => sessionUser && sessionUser.did === userDid;
