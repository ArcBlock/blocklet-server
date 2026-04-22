import { joinURL } from 'ufo';

import { BLOCKLET_CONFIGURABLE_KEY } from '@blocklet/constant';
import { useNodeContext } from '../contexts/node';
import { isInstalling, getLogoHash } from '../util';

const getSearch = (blocklet, customLogo) => {
  let search = '?v=';
  if (customLogo) {
    search += getLogoHash(customLogo);
  } else {
    search += `${blocklet?.meta?.version}${isInstalling(blocklet?.status) ? '~' : ''}`;
  }
  return search;
};

export default function useAppLogo({ blocklet }) {
  const { inService } = useNodeContext();

  const customLogo = (blocklet?.environments || []).find(
    (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_SQUARE
  )?.value;
  const customLogoDark = (blocklet?.environments || []).find(
    (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_SQUARE_DARK
  )?.value;
  const customRectLogo = (blocklet?.environments || []).find(
    (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_RECT
  )?.value;
  const customRectLogoDark = (blocklet?.environments || []).find(
    (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_RECT_DARK
  )?.value;
  const customFavicon = (blocklet?.environments || []).find(
    (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_FAVICON
  )?.value;
  const customSplashPortrait = (blocklet?.environments || []).find(
    (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPLASH_PORTRAIT
  )?.value;
  const customSplashLandscape = (blocklet?.environments || []).find(
    (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPLASH_LANDSCAPE
  )?.value;
  const customOgImage = (blocklet?.environments || []).find(
    (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_OG_IMAGE
  )?.value;

  const prefix = window.env?.apiPrefix || '/';

  const logoUrl = `${joinURL(prefix, `/blocklet/logo/${inService ? '' : blocklet.meta.did}`)}${getSearch(
    blocklet,
    customLogo
  )}`;
  const logoDarkUrl = `${joinURL(prefix, `/blocklet/logo-dark/${inService ? '' : blocklet.meta.did}`)}${getSearch(
    blocklet,
    customLogoDark
  )}`;
  const rectLogoUrl = `${joinURL(prefix, `/blocklet/logo-rect/${inService ? '' : blocklet.meta.did}`)}${getSearch(
    blocklet,
    customRectLogo ?? customLogo
  )}`;
  const rectLogoDarkUrl = `${joinURL(prefix, `/blocklet/logo-rect-dark/${inService ? '' : blocklet.meta.did}`)}${getSearch(
    blocklet,
    customRectLogoDark ?? customLogoDark
  )}`;
  const faviconUrl = `${joinURL(prefix, `/blocklet/logo-favicon/${inService ? '' : blocklet.meta.did}`)}${getSearch(
    blocklet,
    customFavicon ?? customLogo
  )}`;
  const splashPortraitUrl = `${joinURL(prefix, `/blocklet/splash/portrait/${inService ? '' : blocklet.meta.did}`)}${getSearch(
    blocklet,
    customSplashPortrait
  )}`;
  const splashLandscapeUrl = `${joinURL(prefix, `/blocklet/splash/landscape/${inService ? '' : blocklet.meta.did}`)}${getSearch(
    blocklet,
    customSplashLandscape
  )}`;
  const ogImageUrl = `${joinURL(prefix, `/blocklet/og-image/${inService ? '' : blocklet.meta.did}`)}${getSearch(
    blocklet,
    customOgImage
  )}`;

  return {
    logoUrl,
    logoDarkUrl,
    rectLogoUrl,
    rectLogoDarkUrl,
    faviconUrl,
    splashPortraitUrl,
    splashLandscapeUrl,
    ogImageUrl,
  };
}
