import { Box, CircularProgress, styled, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import Button from '@arcblock/ux/lib/Button';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import PropTypes from 'prop-types';
import Toast from '@arcblock/ux/lib/Toast';
import { joinURL } from 'ufo';
import { BLOCKLET_CONFIGURABLE_KEY } from '@blocklet/constant';
import DidConnect from '@arcblock/did-connect-react/lib/Connect';
import isEmpty from 'lodash/isEmpty';
import { DIDSpaceStatus } from '@blocklet/did-space-react';
import { axios } from '../../../util/api';
import { useNodeContext } from '../../../contexts/node';
import { useBlockletContext } from '../../../contexts/blocklet';
import useBlockletInfoForConnectDIDSpaces from '../../../hooks/use-blocklet-info-for-connect-did-spaces';
import { getDIDSpaceDidFromEndpoint, hasPermissionByEndpoint } from '../../../util/spaces';
import { useBlockletStorageContext } from '../../../contexts/blocklet-storage';
import MoreAction from './gateway-more-action';

const CustomTooltip = styled(({ className, ...props }) => <Tooltip {...props} classes={{ popper: className }} />)(
  () => ({
    '.MuiTooltip-tooltip': {
      backgroundColor: 'transparent',
      padding: 0,
      margin: 0,
      boxShadow: 'none',
      maxWidth: 'none',
    },
    '.MuiTooltip-arrow': {
      color: 'rgba(230, 235, 245, 1)',
    },
  })
);

/**
 * @typedef {import('./connected').SpaceGateway} SpaceGateway
 * @description
 * @param {{
 *  spaceGateway: SpaceGateway,
 *  selected: boolean,
 *  spaceStatus: import('@blocklet/did-space-react').DIDSpaceStatus,
 *  onConnected: (err: unknown, spaceGateway: SpaceGateway) => Promise<void>,
 *  onDeleted: (err: unknown, spaceGateway: SpaceGateway) => Promise<void>,
 *  onBackedUp: (err: unknown, spaceGateway: SpaceGateway) => Promise<void>,
 * }}
 */
function GatewayAction({
  spaceGateway,
  spaceStatus,
  selected,
  onConnected = () => {},
  onDeleted = () => {},
  onBackedUp = () => {},
}) {
  const { t, locale } = useLocaleContext();
  /** @type {{ blocklet: import('@blocklet/server-js').BlockletState }} */
  const { blocklet } = useBlockletContext();
  const {
    api: nodeApi,
    info: { did: nodeDid },
  } = useNodeContext();
  const { appDid, appName, appDescription, scopes, appUrl, referrer } = useBlockletInfoForConnectDIDSpaces({
    blocklet,
  });
  const { backupProgress, updateSpaceGateway, deleteSpaceGateway, refreshBackupSummary, refreshBackups } =
    useBlockletStorageContext();
  const [backupLoading, setBackupLoading] = useState(false);
  const [authorizeConnect, setAuthorizeConnect] = useState({
    open: false,
    action: 'one-click-authorization',
    checkTimeout: 1000 * 300,
    messages: {
      title: t('storage.spaces.authorize.title', { appName }, locale),
      scan: t('storage.spaces.authorize.scan', { appName }, locale),
      confirm: '',
      success: <Typography gutterBottom>{t('storage.spaces.authorize.success')}</Typography>,
    },
    onClose: () => {
      // eslint-disable-next-line no-shadow
      setAuthorizeConnect((preValue) => ({
        ...preValue,
        open: false,
      }));
    },
  });

  const shouldDisplayReconnectNow = selected && !backupLoading && spaceStatus === DIDSpaceStatus.DISCONNECTED;
  const shouldDisplayBackupButton =
    selected && !backupLoading && !spaceGateway.loading && spaceStatus === DIDSpaceStatus.CONNECTED;
  const shouldDisplayBackupProgress =
    selected && backupLoading && spaceStatus === DIDSpaceStatus.CONNECTED && backupProgress?.progress >= 0;

  /**
   *
   * @param {import('./connected').SpaceGateway} _spaceGateway
   * @param {string} endpoint
   * @return {Promise<void>}
   */
  const onConnect = async () => {
    try {
      const alreadyAuthorize = await hasPermissionByEndpoint(spaceGateway?.endpoint);

      if (alreadyAuthorize) {
        await nodeApi.configBlocklet({
          input: {
            did: [blocklet.meta.did],
            configs: [
              {
                key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_BACKUP_ENDPOINT,
                value: spaceGateway.endpoint,
              },
            ],
          },
        });
        Toast.success(
          t('storage.spaces.connect.switchToSpaceSucceeded', {
            name: spaceGateway.name ? `(${spaceGateway.name})` : '',
          })
        );
        onConnected?.(null, spaceGateway);
        return;
      }
    } catch (error) {
      console.error(error);
      onConnected?.(error, spaceGateway);
      return;
    }

    setAuthorizeConnect((preValue) => ({
      ...preValue,
      open: true,
      prefix: joinURL(spaceGateway.url, 'space/api/did'),
      baseUrl: new URL(spaceGateway.url).origin,
      checkFn: axios.create({ baseURL: joinURL(spaceGateway.url, 'space') }).get,
      extraParams: {
        appDid,
        appName,
        appDescription,
        scopes,
        appUrl,
        referrer,
        nodeDid,

        spaceDid: spaceGateway.did,
      },
    }));
  };

  /**
   * @description
   * @param {Record<string, any>} response
   * @param {Function} decrypt
   */
  const onAuthorizeConnectSuccess = async (response, decrypt) => {
    const endpoint = decrypt(response.endpoint);
    const spaceDid = getDIDSpaceDidFromEndpoint(endpoint);
    const space = response.space ? decrypt(response.space) : {};

    if (spaceGateway.did && spaceDid !== spaceGateway.did) {
      setAuthorizeConnect((preValue) => ({
        ...preValue,
        open: false,
      }));
      const errMsg = t('storage.spaces.gateway.switch.failedForMismatchSpace', { name: space?.name ? space.name : '' });
      Toast.error(errMsg);
      onConnected?.(new Error(errMsg), spaceGateway);
      return;
    }

    const newSpaceGateway = {
      ...spaceGateway,
      name: space.name ?? 'DID Space',
      did: space.did ?? getDIDSpaceDidFromEndpoint(endpoint),
      endpoint,
    };

    await updateSpaceGateway(newSpaceGateway);

    setAuthorizeConnect((preValue) => ({
      ...preValue,
      open: false,
    }));
    onConnected?.(null, newSpaceGateway);
  };

  const onBackupNow = async () => {
    try {
      if (backupLoading) {
        return;
      }
      setBackupLoading(true);

      await nodeApi.backupBlocklet({ input: { appDid: blocklet.appDid, to: 'spaces' } });
    } catch (error) {
      console.error(error);
      Toast.error(error.message);
      onBackedUp?.(error, spaceGateway);
    } finally {
      setBackupLoading(true);
    }
  };

  const onDelete = async () => {
    try {
      await deleteSpaceGateway(spaceGateway);
      Toast.success(
        t('storage.spaces.gateway.delete.succeeded', { name: spaceGateway.name ? `(${spaceGateway.name})` : '' })
      );
      onDeleted?.(null, spaceGateway);
    } catch (error) {
      console.error(error);
      onDeleted?.(error, spaceGateway);
    }
  };

  useEffect(() => {
    if (backupProgress?.completed) {
      // backupProgress 是全局的，只需反馈到当前 endpoint
      if (selected) {
        if (backupProgress?.progress === 100) {
          Toast.success(t('storage.spaces.backupSuccessfully'));
          onBackedUp?.(null, spaceGateway);
        } else if (backupProgress.message) {
          onBackedUp?.(new Error(backupProgress?.message), spaceGateway);
        }
        backupProgress.progress = 0;
        backupProgress.message = '';
      }
      setBackupLoading(false);
      refreshBackupSummary();
      refreshBackups();
    } else if (backupProgress.progress) {
      setBackupLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backupProgress]);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          '.action-btn': { borderRadius: 1, marginLeft: 1 },
        }}>
        {/* 立即备份，实时备份 */}
        {shouldDisplayBackupButton && (
          <Button className="action-btn" variant="outlined" size="small" onClick={onBackupNow}>
            {t('storage.spaces.strategy.backupNow')}
          </Button>
        )}
        {shouldDisplayReconnectNow && (
          <Button className="action-btn" variant="outlined" size="small" onClick={onConnect}>
            {t('storage.spaces.disconnected.reconnectNow')}
          </Button>
        )}
        {shouldDisplayBackupProgress && (
          <CustomTooltip
            title={
              backupProgress?.message && (
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    boxShadow: 2,
                    color: 'black',
                    backgroundColor: 'white',
                  }}>
                  <Typography variant="body2">{backupProgress.message}</Typography>
                </Box>
              )
            }>
            <Button className="action-btn" variant="outlined" size="small" sx={{ minWidth: 70 }}>
              <CircularProgress variant="determinate" value={backupProgress?.progress} size={14} sx={{ mr: 1 }} />
              {backupProgress?.progress}%
            </Button>
          </CustomTooltip>
        )}
        <DidConnect
          key="get-endpoint"
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
      </Box>
      <MoreAction
        sx={{ minWidth: 32, padding: '2px 4px', ml: 1 }}
        spaceGateway={spaceGateway}
        selected={selected}
        onDelete={onDelete}
        onConnect={onConnect}
        enableSwitchToSpace={backupProgress?.completed || isEmpty(backupProgress?.message)}
        backupInProgress={shouldDisplayBackupProgress}
      />
    </>
  );
}

GatewayAction.propTypes = {
  spaceGateway: PropTypes.shape({
    did: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    endpoint: PropTypes.string.isRequired,
    protected: PropTypes.bool,
    loading: PropTypes.bool,
  }).isRequired,
  spaceStatus: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  onConnected: PropTypes.func,
  onDeleted: PropTypes.func,
  onBackedUp: PropTypes.func,
};

export default GatewayAction;
