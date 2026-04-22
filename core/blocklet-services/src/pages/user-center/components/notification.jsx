import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useCreation, useMemoizedFn, useReactive, useRequest } from 'ahooks';
import { Icon } from '@iconify/react';
import AddRoundedIcon from '@iconify-icons/material-symbols/add-rounded';
import Button from '@arcblock/ux/lib/Button';
import Toast from '@arcblock/ux/lib/Toast';
import { getWalletDid } from '@arcblock/ux/lib/SessionUser/libs/utils';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import DID from '@arcblock/ux/lib/DID';
import SwitchWithLabel from '@abtnode/ux/lib/switch';
import { formatError } from '@blocklet/error';
import ProviderIcon from '@arcblock/ux/lib/DIDConnect/provider-icon';

import WebhookItem from './webhook-item'; // 暂时注释掉，待创建组件后使用
import { sdkClient } from '../../../util';

function NotificationItem({ title = undefined, description = undefined, value, onChange, isMobile, type }) {
  const handleClick = useMemoizedFn((event) => {
    event.stopPropagation();
  });

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        py: 1,
        px: 1.5,
        gap: 0.75,
        borderRadius: 1,
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {type === 'push' ? (
          <Icon icon="tabler:bell" />
        ) : (
          <ProviderIcon
            provider={type}
            sx={{
              width: '1em',
              height: '1em',
              flexShrink: 0,
              fontSize: 16,
            }}
          />
        )}
        <Typography
          component="div"
          onClick={handleClick}
          sx={{
            color: 'text.primary',
            fontSize: 14,
            display: 'flex',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            columnGap: 1,
            flex: 1,
            whiteSpace: isMobile ? 'normal' : 'nowrap',
          }}>
          {title}
          {description}
        </Typography>
      </Box>

      <SwitchWithLabel sx={{ minWidth: 36, flexShrink: 0 }} checked={value} onChange={onChange} />
    </Box>
  );
}

NotificationItem.propTypes = {
  title: PropTypes.string,
  description: PropTypes.node,
  value: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  isMobile: PropTypes.bool.isRequired,
  type: PropTypes.oneOf(['wallet', 'email', 'push']).isRequired,
};

function Notification({ user, isMobile }) {
  const { t } = useLocaleContext();
  const currentState = useReactive({
    showAdd: false,
  });

  const notificationConfigState = useRequest(
    async () => {
      const data = await sdkClient.user.getUserNotificationConfig();
      return data;
    },
    {
      refreshDeps: [user],
      loadingDelay: 300,
    }
  );
  const notifications = useCreation(() => {
    return {
      wallet: true,
      email: true,
      phone: false,
      push: true,
      ...(notificationConfigState?.data?.notifications || {}),
    };
  }, [notificationConfigState?.data?.notifications]);

  const webhooks = useCreation(() => {
    return notificationConfigState?.data?.webhooks || [];
  }, [notificationConfigState?.data?.webhooks]);

  const onSaveChanges = useMemoizedFn(async (values) => {
    try {
      await sdkClient.user.saveUserNotificationConfig(values);
      Toast.success(t('userCenter.saveSuccess'));
      notificationConfigState.run();
    } catch (err) {
      Toast.error(formatError(err));
    }
  });

  const handleChangeSwitch = useMemoizedFn(async (channel, value) => {
    await onSaveChanges({
      notifications: {
        [channel]: value,
      },
    });
  });

  // eslint-disable-next-line no-unused-vars
  const handleTestWebhook = async (data) => {
    try {
      await sdkClient.user.testNotificationWebhook(data);
      Toast.success(t('userCenter.webhookTested'));
    } catch (err) {
      Toast.error(formatError(err));
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleDeleteWebhook = useMemoizedFn(async (index) => {
    await onSaveChanges({
      webhooks: webhooks.filter((_, i) => i !== index),
    });
  });

  // eslint-disable-next-line no-unused-vars
  const handleEditWebhook = useMemoizedFn(async (index, webhook) => {
    await onSaveChanges({
      webhooks: webhooks.map((item, i) => (i === index ? webhook : item)),
    });
  });

  // eslint-disable-next-line no-unused-vars
  const handleAddWebhook = useMemoizedFn(async (webhook) => {
    await onSaveChanges({
      webhooks: [...webhooks, webhook],
    });
    currentState.showAdd = false;
  });

  if (notificationConfigState.error) {
    return <Alert severity="error">{notificationConfigState.error.message}</Alert>;
  }

  if (notificationConfigState.loading || !notificationConfigState.data) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100px',
        }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        '.MuiSwitch-track': {
          borderRadius: '100vw',
        },
        '.MuiSwitch-thumb': {
          borderRadius: '100%',
        },
        '.MuiSwitch-root.MuiSwitch-sizeSmall': {
          height: '20px',
          width: '36px',
          '.MuiSwitch-thumb': {
            width: '16px',
            height: '16px',
          },
        },
      }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'start',
          '.MuiFormControlLabel-root': {
            gap: 1,
            m: 0,
            flexDirection: {
              xs: 'row-reverse',
              md: 'row',
            },
            width: {
              xs: '100%',
              md: 'unset',
            },
          },
        }}>
        <NotificationItem
          value={notifications.wallet}
          isMobile={isMobile}
          type="wallet"
          title={t('userCenter.walletNotification')}
          onChange={(checked) => handleChangeSwitch('wallet', checked)}
          description={
            getWalletDid(user) && (
              <DID
                did={getWalletDid(user)}
                showQrcode={false}
                showAvatar={!isMobile}
                copyable
                compact
                responsive
                startChars={isMobile ? 2 : 6}
              />
            )
          }
        />
        <NotificationItem
          value={notifications.email}
          isMobile={isMobile}
          type="email"
          onChange={(checked) => handleChangeSwitch('email', checked)}
          title={t('userCenter.emailNotification')}
          description={
            user?.email && (
              <Typography
                component="span"
                sx={{
                  color: 'text.secondary',
                  fontSize: 13,
                }}>
                {user?.email}
              </Typography>
            )
          }
        />
        <NotificationItem
          isMobile={isMobile}
          value={notifications.push}
          type="push"
          title={t('userCenter.pushNotification')}
          onChange={(checked) => handleChangeSwitch('push', checked)}
        />
      </Box>
      <Stack
        useFlexGap
        direction="column"
        sx={{
          alignItems: 'start',
        }}>
        {webhooks.map((item, index) => (
          <WebhookItem
            enabled={item.enabled}
            // eslint-disable-next-line react/no-array-index-key
            key={`${index}_${item.url}`}
            onTest={handleTestWebhook}
            onDelete={() => handleDeleteWebhook(index)}
            onSave={(...args) => handleEditWebhook(index, ...args)}
            type={item.type}
            url={item.url}
            edit={false}
            webhooks={webhooks}
          />
        ))}
        {currentState.showAdd && (
          <WebhookItem
            key="add"
            onTest={handleTestWebhook}
            onCancel={() => {
              currentState.showAdd = false;
            }}
            onSave={(...args) => handleAddWebhook(...args)}
            edit
            webhooks={webhooks}
          />
        )}

        <Button
          variant="outlined"
          size="small"
          sx={{
            color: 'text.primary',
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'divider',
            },
            py: 0.5,
            borderRadius: 1,
            mt: 1,
            ml: 1.5,
          }}
          startIcon={<Icon icon={AddRoundedIcon} />}
          onClick={() => {
            currentState.showAdd = true;
          }}>
          {t('userCenter.addWebhook')}
        </Button>
      </Stack>
    </Box>
  );
}

Notification.propTypes = {
  user: PropTypes.object.isRequired,
  isMobile: PropTypes.bool.isRequired,
};

export default Notification;
