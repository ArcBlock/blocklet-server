import React from 'react';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { joinURL } from 'ufo';
import toast from '@arcblock/ux/lib/Toast';
import { func } from 'prop-types';
import { DIDSpaceConnect } from '@blocklet/did-space-react';
import { formatError } from '@blocklet/error';

import useBlockletInfoForConnectDIDSpaces from '../../../hooks/use-blocklet-info-for-connect-did-spaces';
import { getPathPrefix, getWebWalletUrl } from '../../../util';
import { useBlockletContext } from '../../../contexts/blocklet';
import { useNodeContext } from '../../../contexts/node';
import { axios } from '../../../util/api';

/**
 * @typedef {import('../../../contexts/config-space').SpaceGateway} SpaceGateway
 */

/**
 * @param {{
 *  onConnect(spaceGateway: SpaceGateway): void | Promise<void>,
 * }} { onConnect, ...rest }
 * @return {React.Component}
 */
function ConnectTo({ onConnect = () => undefined, ...rest }) {
  const { blocklet } = useBlockletContext();
  const { info } = useNodeContext();
  const { t } = useLocaleContext();
  const blockletInfo = useBlockletInfoForConnectDIDSpaces({ blocklet });
  const webWalletUrl = getWebWalletUrl(info);

  const options = {
    checkFn: axios.create({ baseURL: joinURL(window.location.origin, getPathPrefix()) }).get,
    webWalletUrl,
    extraParams: {
      appPid: blocklet.appPid,
      appDid: blockletInfo.appDid,
      appName: blockletInfo.appName,
      appDescription: blockletInfo.appDescription,
      appUrl: blockletInfo.appUrl,
      referrer: blockletInfo.referrer,
      scopes: blockletInfo.scopes,
      nodeDid: info.did,
    },
  };

  const onSuccess = async ({ spaceGateway }) => {
    try {
      await onConnect(spaceGateway);
      toast.success(t('storage.spaces.connectedWithName', { name: spaceGateway.name }));
    } catch (error) {
      console.error(error);
      toast.error(formatError(error));
    }
  };

  return <DIDSpaceConnect {...rest} options={options} onSuccess={onSuccess} />;
}

ConnectTo.propTypes = {
  onConnect: func,
};

export default ConnectTo;
