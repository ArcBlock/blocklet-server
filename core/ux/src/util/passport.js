import createPassportSvgOrig from '@abtnode/auth/lib/util/create-passport-svg';
import { joinURL } from 'ufo';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

// eslint-disable-next-line import/prefer-default-export
export const createPassportSvg = (props) => {
  return createPassportSvgOrig({
    ...props,
    issuerAvatarUrl: joinURL(window.location.origin, WELLKNOWN_SERVICE_PATH_PREFIX, '/blocklet/logo'),
  });
};
