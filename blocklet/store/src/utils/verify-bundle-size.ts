import axios from '@abtnode/util/lib/axios';
import xbytes from 'xbytes';
import fs from 'fs';
import path from 'path';

export const verifyBundleSize = async ({
  storeUrl,
  tarballFilePath,
}: {
  storeUrl: string;
  tarballFilePath: string;
}) => {
  const { data: storeJson } = await axios({
    url: `${storeUrl}/api/store.json`,
  }).catch(() => {
    return {};
  });

  if (xbytes.isBytes(storeJson?.maxBundleSize) && fs.existsSync(tarballFilePath)) {
    const { size: tarballFileBytes } = fs.statSync(tarballFilePath);
    const maxBundleBytes = xbytes.parseSize(storeJson.maxBundleSize);
    if (tarballFileBytes > maxBundleBytes) {
      throw new Error(
        `The release file ${path.basename(tarballFilePath)} size cannot exceed ${storeJson.maxBundleSize}`,
      );
    }
  }
};
