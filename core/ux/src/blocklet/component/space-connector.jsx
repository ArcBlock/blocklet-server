import React, { useContext, useState, useEffect, useImperativeHandle, useMemo } from 'react';
import DidConnect from '@arcblock/did-connect-react/lib/Connect';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { BLOCKLET_CONFIGURABLE_KEY, DID_SPACES } from '@blocklet/constant';
import axios from 'axios';
import PropTypes from 'prop-types';
import { joinURL } from 'ufo';
import isEmpty from 'lodash/isEmpty';
import Typography from '@mui/material/Typography';
import Toast from '@arcblock/ux/lib/Toast';
import { getAppName, getAppDescription } from '@blocklet/meta/lib/util';
import { useBlockletContext } from '../../contexts/blocklet';
import { useNodeContext } from '../../contexts/node';
import SpaceSelector from './space-selector';

/**
 *
 *
 * @param {import('@blocklet/server-js').BlockletState} blocklet
 * @return {*}
 */
function useAppUrl(blocklet) {
  const appUrls = blocklet?.site?.domainAliases
    ?.sort((a, b) => {
      if (a.accessibility.accessible && b.accessibility.accessible) {
        return +a.isProtected - +b.isProtected;
      }
      return +b.accessibility.accessible - +a.accessibility.accessible;
    })
    ?.map((domainAlias) => {
      const protocol = domainAlias?.domainStatus?.isHttps ? 'https://' : 'http://';
      const value = domainAlias?.value;

      return `${protocol}${value}`;
    })
    .filter(Boolean);

  const appUrl = appUrls?.[0];

  // 授权的时候提供 appUrl, 因为 appUrl 可能很久都拿不到值，所以加一个 loading 效果过渡一下
  return { appUrl, isReady: Boolean(appUrl) };
}

export default function SpaceConnector({ ref = null, onConnect = () => {}, ...restProps }) {
  /** @type {{ api: import('@blocklet/server-js').ABTNodeClient, info: import('@blocklet/server-js').NodeState  }} */
  const { api, info } = useNodeContext();
  const nodeDid = info.did;

  const { t, locale } = useContext(LocaleContext);
  /** @type {{ blocklet: import('@blocklet/server-js').BlockletState }} */
  const {
    blocklet,
    actions: { refreshBlocklet },
  } = useBlockletContext();

  const [gatewayUrl, setGatewayUrl] = useState('');

  const spaceProps = useMemo(() => {
    return {
      endpoint:
        blocklet?.environments?.find((e) => e.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPACE_ENDPOINT)?.value ||
        '',
      gatewayUrl:
        blocklet?.environments?.find((e) => e.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPACES_URL)?.value || '',
    };
  }, [blocklet]);

  const appName = getAppName(blocklet);
  const appDescription = getAppDescription(blocklet);
  const { appUrl, isReady } = useAppUrl(blocklet);

  async function saveSpaceConnectorEndpoint(did, storageEndpoint) {
    await api
      .configBlocklet({
        input: {
          did: [did],
          configs: [
            {
              key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPACES_URL,
              value: gatewayUrl,
            },
            {
              key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPACE_ENDPOINT,
              value: storageEndpoint,
            },
          ],
        },
      })
      .then(() => {
        Toast.success(t('storage.spaces.connect.succeeded', locale));
      })
      .catch((error) => {
        console.error(error);
        Toast.error(error.message);
      });
  }

  const [authorizeConnect, setAuthorizeConnect] = useState({
    open: false,
  });

  const onAuthorizeConnectSuccess = async (response, decrypt) => {
    await saveSpaceConnectorEndpoint(blocklet.meta.did, decrypt(response.endpoint));
    setTimeout(() => {
      setAuthorizeConnect((preValue) => ({
        ...preValue,
        open: false,
      }));
      onConnect?.();
      refreshBlocklet();
    }, 3000);
  };

  // eslint-disable-next-line no-shadow
  const handleOnClickAuthorize = (gatewayUrl) => {
    if (isEmpty(gatewayUrl)) {
      Toast.error(t('storage.spaces.addressCannotEmpty', locale));
      return;
    }

    setGatewayUrl(gatewayUrl);

    setAuthorizeConnect((preValue) => ({
      ...preValue,
      action: 'one-click-authorization',
      checkTimeout: 1000 * 300,
      prefix: joinURL(gatewayUrl, 'space/api/did'),
      baseUrl: new URL(gatewayUrl).origin,
      checkFn: axios.create({ baseURL: joinURL(gatewayUrl, 'space') }).get,
      extraParams: {
        appDid: blocklet.appDid,
        appName,
        appDescription,
        scopes: DID_SPACES.AUTHORIZE.DEFAULT_SCOPE,
        appUrl,
        referrer: window.location.href,
        nodeDid,
      },
      onClose: () => {
        // eslint-disable-next-line no-shadow
        setAuthorizeConnect((preValue) => ({
          ...preValue,
          open: false,
        }));
      },
      open: true,
    }));
  };

  useEffect(() => {
    setAuthorizeConnect((preValue) => ({
      ...preValue,
      messages: {
        title: t('storage.spaces.authorize.title', { appName }),
        scan: t('storage.spaces.authorize.scan', { appName }),
        confirm: '',
        success: <Typography gutterBottom>{t('storage.spaces.authorize.success')}</Typography>,
      },
    }));
  }, [appName, locale, t]);

  useImperativeHandle(ref, () => ({
    getEndpoint: () => spaceProps.endpoint,
    getGatewayUrl: () => spaceProps.gatewayUrl,
  }));

  return (
    <>
      {/* 填写 DID Spaces 的实例地址 */}
      <SpaceSelector {...restProps} {...spaceProps} onSelect={handleOnClickAuthorize} loading={!isReady} />

      {/* 获得endpoint */}
      <DidConnect
        forceConnected={false}
        saveConnect={false}
        prefix={authorizeConnect.prefix}
        open={authorizeConnect.open}
        popup
        action={authorizeConnect.action}
        baseUrl={authorizeConnect.baseUrl}
        checkFn={authorizeConnect.checkFn}
        onSuccess={onAuthorizeConnectSuccess}
        onClose={authorizeConnect.onClose}
        checkTimeout={authorizeConnect.checkTimeout}
        extraParams={authorizeConnect.extraParams}
        messages={authorizeConnect.messages}
        locale={locale}
      />
    </>
  );
}

SpaceConnector.propTypes = {
  onConnect: PropTypes.func,
  ref: PropTypes.any,
};
