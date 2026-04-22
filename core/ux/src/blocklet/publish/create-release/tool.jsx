import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

const getSourceUrls = (params, blocklet, projectId) => {
  const uploadLogoPrefix = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/project/${blocklet.meta.did}/${projectId}/logo/upload`;
  const uploadScreenshotPrefix = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/project/${blocklet.meta.did}/${projectId}/screenshot/upload`;
  const logoUrl = params?.blockletLogo
    ? `${uploadLogoPrefix}/${params.blockletLogo}`
    : `${WELLKNOWN_SERVICE_PATH_PREFIX}/static/images/logo.png`;
  const screenshotUrls = (params?.blockletScreenshots || [])
    .filter(Boolean)
    .map((x) => `${uploadScreenshotPrefix}/${x}`);

  return {
    logoUrl,
    screenshotUrls,
    uploadLogoPrefix,
    uploadScreenshotPrefix,
  };
};

export default getSourceUrls;
