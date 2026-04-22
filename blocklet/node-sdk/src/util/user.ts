import { joinURL } from 'ufo';
import { WELLKNOWN_SERVICE_PATH_PREFIX, USER_AVATAR_URL_PREFIX, USER_AVATAR_PATH_PREFIX } from '@abtnode/constant';

export function fixAvatar(avatar: string) {
  if (avatar && avatar.startsWith(USER_AVATAR_URL_PREFIX)) {
    return joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, USER_AVATAR_PATH_PREFIX, avatar.replace(USER_AVATAR_URL_PREFIX, ''));
  }

  return avatar;
}
