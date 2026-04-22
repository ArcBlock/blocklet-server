import React from 'react';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { joinURL } from 'ufo';
import toast from '@arcblock/ux/lib/Toast';
import { DIDSpaceConnect } from '@blocklet/did-space-react';

import { useBlockletContext } from '../../../contexts/blocklet';
import { axios } from '../../../util/api';
import { formatError, getPathPrefix, getWebWalletUrl } from '../../../util';
import { useNodeContext } from '../../../contexts/node';
import useBlockletInfoForConnectDIDSpaces from '../../../hooks/use-blocklet-info-for-connect-did-spaces';
import { getSpaceGatewayUrl, isValidSpaceGatewayUrl } from '../../../util/spaces';
import { useBlockletStorageContext } from '../../../contexts/blocklet-storage';

/**
 * @description
 * @param {{}} { ...rest }
 * @return {React.Component}
 */
function ConnectTo({ ...rest }) {
  /** @type {{ blocklet: import('@blocklet/server-js').BlockletState }} */
  const { blocklet } = useBlockletContext();
  const { info } = useNodeContext();
  const { t } = useLocaleContext();
  const blockletInfo = useBlockletInfoForConnectDIDSpaces({ blocklet });
  const webWalletUrl = getWebWalletUrl(info);
  const { spaceGateways, addSpaceGateway } = useBlockletStorageContext();

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

  /**
   * @param {{
   *  endpoint: string,
   *  name: string,
   *  did: string,
   * }} {endpoint, name, did}
   * @returns {Promise<void>}
   */
  const addSpaceGatewayNow = async ({ endpoint, name, did }) => {
    const spaceGatewayUrl = await getSpaceGatewayUrl(endpoint);

    if (!(await isValidSpaceGatewayUrl(spaceGatewayUrl))) {
      toast.error(t('storage.spaces.gateway.add.invalidUrl'));
      return;
    }

    const duplicate = spaceGateways.some((s) => s.endpoint === endpoint);
    if (duplicate) {
      toast.error(t('storage.spaces.gateway.add.duplicate', { name }));
      return;
    }

    const spaceGateway = {
      name,
      did,
      url: spaceGatewayUrl,
      endpoint,
    };

    await addSpaceGateway(spaceGateway, endpoint);
  };

  const onSuccess = async ({ spaceGateway }) => {
    try {
      await addSpaceGatewayNow(spaceGateway);
    } catch (error) {
      console.error(error);
      toast.error(formatError(error));
    }
  };

  return <DIDSpaceConnect {...rest} connectScope="app" options={options} onSuccess={onSuccess} />;
}

export default ConnectTo;
