/* eslint-disable import/prefer-default-export */
import { forEachChildSync, getAppName } from '@blocklet/meta/lib/util';

export function getAppNameWithDid(blocklet, did) {
  if (!blocklet) {
    return '';
  }
  if (blocklet.meta.did === did) {
    return getAppName(blocklet, true);
  }

  let appName = '';

  forEachChildSync(blocklet, (child) => {
    if (appName) {
      return;
    }
    if (child?.meta?.did === did) {
      appName = getAppName(child, true);
    }
  });

  return appName;
}

export function getAppRuntimeInfo(blocklet, did) {
  if (!blocklet) {
    return null;
  }
  if (blocklet.meta.did === did) {
    return blocklet.appRuntimeInfo;
  }
  for (const child of blocklet.children) {
    const result = getAppRuntimeInfo(child, did);
    if (result) {
      return result;
    }
  }
  return null;
}
