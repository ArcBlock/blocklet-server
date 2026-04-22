const { existsSync } = require('fs-extra');
const isUrl = require('is-url');
const { join } = require('path');
const axios = require('./axios');

/**
 *
 *
 * @param {{
 *  customLogoSquareUrl?: string;
 *  appDir: string;
 *  dataDir: string;
 *  logo?: string;
 *  defaultLogoPath?: string;
 * }}{ blocklet }
 * @return {Promise<string | undefined>}
 */
async function getLogoUrl({ customLogoSquareUrl, appDir, dataDir, logo, defaultLogoPath }) {
  if (customLogoSquareUrl) {
    if (isUrl(customLogoSquareUrl)) {
      const res = await axios.get(customLogoSquareUrl, { responseType: 'stream' }).catch(() => {
        return { data: null };
      });
      if (res.data) {
        return customLogoSquareUrl;
      }
    } else {
      const logoInDataDir = dataDir && join(dataDir, customLogoSquareUrl);
      const logoInAppDir = appDir && join(appDir, customLogoSquareUrl);
      if (existsSync(logoInDataDir)) {
        return logoInDataDir;
      }
      if (existsSync(logoInAppDir)) {
        return logoInDataDir;
      }
    }
  }

  if (appDir && logo) {
    const metaLogoPath = join(appDir, logo);
    if (existsSync(metaLogoPath)) {
      return metaLogoPath;
    }
  }

  return defaultLogoPath;
}

module.exports = {
  getLogoUrl,
};
