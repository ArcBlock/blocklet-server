import { useContext } from 'react';

import { DEFAULT_DID_DOMAIN } from '@abtnode/constant';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Components from '@abtnode/ux/lib/blocklet/component';
import { getBlockletUrlParams, getBlockletUrl } from '@abtnode/ux/lib/util';
import { encode as encodeBase32 } from '@abtnode/util/lib/base32';

import { useBlockletContext } from '../../../contexts/blocklet';

export default function BlockletComponent(props) {
  const { locale } = useContext(LocaleContext);

  const { blocklet, recommendedDomain: domain } = useBlockletContext();

  const getComponentUrl = mountPoint =>
    getBlockletUrl({
      blocklet,
      domain: { value: domain || `${encodeBase32(blocklet.appPid)}.${DEFAULT_DID_DOMAIN}` },
      mountPoint,
      params: getBlockletUrlParams(blocklet, locale),
    });

  return <Components blocklet={blocklet} getComponentUrl={getComponentUrl} {...props} />;
}
