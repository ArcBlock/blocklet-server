import PropTypes from 'prop-types';
import { Icon } from '@iconify/react';
import { Box, Typography } from '@mui/material';
import LinkRoundedIcon from '@iconify-icons/material-symbols/link-rounded';
import Button from '@arcblock/ux/lib/Button';
import Avatar from '@arcblock/ux/lib/Avatar';
import { useCreation, useMemoizedFn, useReactive } from 'ahooks';
import { useConfirm } from '@arcblock/ux/lib/Dialog';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import InfoOutlineRoundedIcon from '@iconify-icons/material-symbols/info-outline-rounded';
import ProviderIcon from '@arcblock/ux/lib/DIDConnect/provider-icon';
import { SessionContext } from '@arcblock/did-connect-react/lib/Session';
import { use } from 'react';
import pick from 'lodash/pick';
import { getFederatedEnabled, getMaster } from '@arcblock/ux/lib/Util/federated';
import { LOGIN_PROVIDER, LOGIN_PROVIDER_NAME } from '@arcblock/ux/lib/Util/constant';
import { useStateContext } from '@arcblock/did-connect-react/lib/Connect/contexts/state';
import { useBrowser } from '@arcblock/react-hooks';
import Tooltip from '@abtnode/ux/lib/tooltip';

function ThirdPartyItem({ item }) {
  const browser = useBrowser();
  const { blocklet: targetBlocklet } = useStateContext();
  const { confirmApi, confirmHolder } = useConfirm();
  const currentState = useReactive({
    loading: false,
  });
  const { t } = useLocaleContext();
  const { session } = use(SessionContext);
  const { bindOAuth, unbindOAuth, setBaseUrl, baseUrl: oauthBaseUrl } = session.useOAuth();
  const { disconnectPasskey, setTargetAppPid } = session.usePasskey();

  const title = useCreation(() => {
    return LOGIN_PROVIDER_NAME[item?.provider] || 'unknown';
  }, [item?.provider]);

  const getItemTooltip = useMemoizedFn((data) => {
    if (!data?._bind) {
      return '';
    }
    if (data.provider === LOGIN_PROVIDER.WALLET && data.did) {
      return t('userCenter.thirdPartyLogin.walletAccountCantRemove');
    }
    if (data.provider === LOGIN_PROVIDER.PASSKEY && browser.arcSphere) {
      return t('userCenter.thirdPartyLogin.dontSupportRemoveinArcSphere');
    }
    if (data._mainProvider && browser.arcSphere) {
      return t('userCenter.thirdPartyLogin.mainProviderCantRemove');
    }
    return '';
  }, []);

  const toggleBind = useMemoizedFn(async () => {
    if (item?.provider === LOGIN_PROVIDER.PASSKEY) {
      await new Promise((resolve, reject) => {
        confirmApi.open({
          title: t('userCenter.thirdPartyLogin.disconnectPasskey', { name: title }),
          content: t('userCenter.thirdPartyLogin.disconnectPasskeyDescription', { name: title }),
          confirmButtonText: t('common.confirm'),
          confirmButtonProps: {
            color: 'error',
          },
          cancelButtonText: t('common.cancel'),
          onConfirm(close) {
            disconnectPasskey({ session, connectedAccount: item }).then(resolve).catch(reject);
            close();
          },
          onCancel: resolve,
        });
      });
      return;
    }

    try {
      currentState.loading = true;
      await new Promise((resolve, reject) => {
        if (item?._bind) {
          confirmApi.open({
            title: t('userCenter.thirdPartyLogin.confirmUnbind', { name: title }),
            content: t('userCenter.thirdPartyLogin.confirmUnbindDescription', { name: title }),
            confirmButtonText: t('common.confirm'),
            confirmButtonProps: {
              color: 'error',
            },
            cancelButtonText: t('common.cancel'),
            onConfirm(close) {
              unbindOAuth({
                session,
                connectedAccount: {
                  ...pick(item, ['did', 'pk']),
                  showProvider: item.provider,
                  provider: item._rawProvider,
                },
              })
                .then(resolve)
                .catch(reject);
              close();
            },
            onCancel: resolve,
          });
        } else if (item.provider === LOGIN_PROVIDER.WALLET) {
          confirmApi.open({
            title: t('userCenter.thirdPartyLogin.confirmBindWallet', { name: title }),
            content: t('userCenter.thirdPartyLogin.confirmBindWalletDescription', { name: title }),
            confirmButtonText: t('common.confirm'),
            confirmButtonProps: {
              color: 'primary',
            },
            cancelButtonText: t('common.cancel'),
            onConfirm: (close) => {
              session.bindWallet({
                onSuccess: resolve,
                onCancel: reject,
              });
              close();
            },
            onCancel: resolve,
          });
        } else {
          const backupBaseUrl = oauthBaseUrl;
          const blocklet = window?.blocklet;
          let baseUrl = '/';
          const federatedEnabled = getFederatedEnabled(blocklet);
          const master = getMaster(blocklet);
          if (federatedEnabled && master?.appPid && session?.user?.sourceAppPid) {
            baseUrl = master.appUrl;
          }
          setBaseUrl(baseUrl);
          setTargetAppPid(targetBlocklet?.appPid);
          bindOAuth({
            session,
            oauthItem: {
              ...item,
              provider: item._rawProvider,
            },
          })
            .then(resolve)
            .catch(reject)
            .finally(() => {
              setBaseUrl(backupBaseUrl);
              setTargetAppPid();
            });
        }
      });
    } catch (err) {
      console.error(`Failed to ${item?._bind ? 'unbind' : 'bind'} oauth account`, err);
    } finally {
      currentState.loading = false;
    }
  });

  const getItemText = useMemoizedFn((data) => {
    if (data.provider === LOGIN_PROVIDER.WALLET && data.did) {
      return t('userCenter.thirdPartyLogin.walletAccount');
    }
    if (data._mainProvider) {
      return t('userCenter.thirdPartyLogin.mainAccount');
    }
    return data?._bind ? t('userCenter.thirdPartyLogin.disconnect') : t('userCenter.thirdPartyLogin.connect');
  }, []);

  const getItemDisabled = useMemoizedFn(
    (data) => {
      if (data.provider === LOGIN_PROVIDER.WALLET && data.did) {
        return true;
      }
      if (data.provider === LOGIN_PROVIDER.PASSKEY) {
        if (browser.arcSphere || browser.wallet) {
          return true;
        }
      }
      return !!item._mainProvider;
    },
    [browser.arcSphere]
  );

  return (
    <>
      <Box
        sx={{
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'grey.50',
          display: 'flex',
          alignItems: 'center',
          py: 1,
          px: 1.5,
          gap: 0.75,
          fontSize: '14px',
          lineHeight: 1,
          overflow: 'hidden',
        }}>
        <ProviderIcon
          provider={item?.provider}
          sx={{
            width: '1em',
            height: '1em',
            flexShrink: 0,
            fontSize: 16,
          }}
        />
        <Box
          sx={{
            flex: 1,
            display: {
              xs: item.userInfo?.email || item.did ? 'none' : 'block',
              sm: 'block',
            },
          }}>
          {title}
        </Box>
        {item.userInfo?.email || item.did ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              overflow: 'hidden',
            }}>
            <Box
              sx={{
                flex: 1,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                lineHeight: 'normal',
              }}>
              {item.userInfo?.email || item.did}
            </Box>
            {item.userInfo?.name ? (
              <Tooltip
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar size={36} variant="circle" shape="circle" src={item.userInfo?.picture} did={item.did} />
                    <Box>
                      <Typography
                        sx={{
                          whiteSpace: 'normal',
                          wordBreak: 'break-all',
                          fontSize: '0.9rem',
                        }}>
                        {item.userInfo?.name}
                      </Typography>
                      <Typography
                        sx={{
                          whiteSpace: 'normal',
                          wordBreak: 'break-all',
                          fontSize: '0.9rem',
                        }}>
                        {item.userInfo?.email}
                      </Typography>
                    </Box>
                  </Box>
                }>
                <Box
                  component={Icon}
                  icon={InfoOutlineRoundedIcon}
                  sx={{
                    color: 'text.secondary',
                    fontSize: 16,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
              </Tooltip>
            ) : null}
          </Box>
        ) : null}
      </Box>
      <Tooltip title={getItemTooltip(item)} placement="auto">
        {/* HACK: 结合下面的 button disable 使用，必须增加这一层 */}
        <Box>
          <Button
            variant="outlined"
            size="small"
            sx={(theme) => {
              const textRed = theme.palette.error.main;
              const textPrimary = theme.palette.primary.main;

              return {
                color: item?._bind ? textRed : textPrimary,
                borderColor: item?._bind ? textRed : textPrimary,
                backgroundColor: 'background.default',
                '&:hover': {
                  borderColor: item?._bind ? textRed : textPrimary,
                  backgroundColor: 'action.hover',
                },
                py: 0.5,
                borderRadius: 1,
                fontWeight: 500,
                whiteSpace: 'nowrap',
              };
            }}
            fullWidth
            startIcon={currentState.loading ? null : <Icon icon={LinkRoundedIcon} />}
            onClick={toggleBind}
            disabled={getItemDisabled(item)}
            loading={currentState.loading}>
            {getItemText(item)}
          </Button>
        </Box>
      </Tooltip>
      {confirmHolder}
    </>
  );
}

ThirdPartyItem.propTypes = {
  item: PropTypes.shape({
    provider: PropTypes.string,
    did: PropTypes.string,
    pk: PropTypes.string,
    userInfo: PropTypes.object,
    id: PropTypes.string,
    _bind: PropTypes.bool,
    _rawProvider: PropTypes.string,
    _mainProvider: PropTypes.bool,
  }).isRequired,
};

export default ThirdPartyItem;
