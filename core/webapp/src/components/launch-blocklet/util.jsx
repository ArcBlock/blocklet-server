/* eslint-disable import/prefer-default-export */

import { isSlpDomain } from '@abtnode/util/lib/url-evaluation';
import { getAccessibleUrl, getBlockletUrls } from '@abtnode/ux/lib/util';

export const authorize = ({ user, launchType, nftId }) => {
  if (!user) {
    return false;
  }

  if (launchType === 'serverless') {
    if (!nftId) {
      throw new Error('nftId is required');
    }

    return user?.controller?.nftId === nftId;
  }

  return (user.permissions || []).includes('mutate_blocklets');
};

export const isServerlessBlockletInstalled = runtimeBlockletState =>
  runtimeBlockletState.isGetBlocklet && runtimeBlockletState.runtimeBlocklet?.controller?.consumedAt;

export const getRestoredAccessUrl = async blocklet => {
  const urls = getBlockletUrls({ blocklet });
  let accessUrl = '';

  accessUrl = urls.find(url => {
    try {
      const { hostname } = new URL(url);
      return isSlpDomain(hostname);
    } catch (error) {
      console.error(error);
      return false;
    }
  });

  if (!accessUrl) {
    accessUrl = await getAccessibleUrl(urls);
  }

  return accessUrl;
};
