import { joinURL } from 'ufo';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

import { useNodeContext } from '../contexts/node';
import { formatRegistryLogoPath, APP_PREFIX, isDownloading, isExtracting } from '../util';

export default function useAvatar({ blocklet, ancestors = [] }) {
  const node = useNodeContext();
  const { inService } = node;

  const pending = isDownloading(blocklet?.status) || isExtracting(blocklet?.status);
  const search = `?v=${blocklet?.meta?.version}${pending ? '~' : ''}`;
  let logoUrl = inService
    ? `${joinURL(APP_PREFIX, WELLKNOWN_SERVICE_PATH_PREFIX, '/blocklet/logo-bundle')}${search}`
    : joinURL(node.imgPrefix, 'blocklet.png');

  if (blocklet.source === 'registry' && blocklet.deployedFrom && blocklet.meta.logo) {
    logoUrl = `${joinURL(
      blocklet.deployedFrom,
      formatRegistryLogoPath(blocklet.meta.bundleDid, blocklet.meta.logo)
    )}${search}`;
  } else {
    const prefix = window.env?.apiPrefix || '/';
    const components = ancestors.concat(blocklet);
    const list = inService ? components.slice(1) : components;
    logoUrl = `${joinURL(prefix, `/blocklet/logo-bundle${list.map((x) => `/${x.meta.did}`).join('')}`)}${search}`;
  }

  return {
    logoUrl,
    inService,
  };
}
