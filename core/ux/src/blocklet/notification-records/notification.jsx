/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { useState, useCallback, memo } from 'react';
import { NOTIFICATION_SEND_CHANNEL } from '@abtnode/constant';
import Dialog from '@arcblock/ux/lib/Dialog';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useReactive, useCreation } from 'ahooks';
import styled from '@emotion/styled';
import colors from '@arcblock/ux/lib/Colors/themes/default';
import InfoRow from '@arcblock/ux/lib/InfoRow';
import Tabs from '@arcblock/ux/lib/Tabs';
import Toast from '@arcblock/ux/lib/Toast';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';

import ShortenLabel from '../component/shorten-label';
import { SendComponentAvatar } from '../../notifications/pages/list';
import NotificationContent from '../../notifications/pages/content';
import { useNotificationRecordsContext } from '../../contexts/notification-records';
import NotificationSeverity from './severity';
import Receivers from './receivers';
import Statistics from './statistics';
import { emailServiceAvailable, pushKitServiceAvailable } from './utils';
import { isIncludeActivity, isUserActor } from '../../notifications/pages/activity/utils';
import ActorAvatar from '../../notifications/pages/avatars/actor';
import Activity from '../../notifications/pages/activity';

Notification.propTypes = {
  notification: PropTypes.object.isRequired,
  onCancel: PropTypes.func,
  blocklet: PropTypes.object.isRequired,
  tab: PropTypes.string,
};

function Notification({ notification, onCancel = () => {}, blocklet, tab = 'info' }) {
  const { t, locale } = useLocaleContext();
  const { getComponent, resendNotification } = useNotificationRecordsContext();
  const [resending, setResending] = useState(false);

  const component = useCreation(() => {
    const target = getComponent(notification.componentDid);
    return target || blocklet;
  }, [blocklet, notification.componentDid]);

  const pageState = useReactive({
    tab: tab || 'info',
  });

  const handleResend = useCallback(
    async (resendChannels, receivers, isResendFailedOnly = true, urls = []) => {
      if (!resendChannels.length || !notification.id) return;
      const rawReceivers =
        receivers.length > 0 ? receivers : notification?.receivers?.map((receiver) => receiver.receiver);
      if (!rawReceivers.length) return;

      let _channels = [...resendChannels];
      // 判断是否开启服务
      if (_channels.includes(NOTIFICATION_SEND_CHANNEL.PUSH) && !pushKitServiceAvailable(blocklet)) {
        Toast.warning(t('notification.sendStatus.reason.unavailable', { channel: 'Push Kit' }));
        _channels = _channels.filter((channel) => channel !== NOTIFICATION_SEND_CHANNEL.PUSH);
      }
      if (_channels.includes(NOTIFICATION_SEND_CHANNEL.EMAIL) && !emailServiceAvailable(blocklet)) {
        Toast.warning(t('notification.sendStatus.reason.unavailable', { channel: 'Email' }));
        _channels = _channels.filter((channel) => channel !== NOTIFICATION_SEND_CHANNEL.EMAIL);
      }

      if (!_channels.length) return;

      try {
        setResending(true);
        await resendNotification({
          notificationId: notification.id,
          receivers: rawReceivers,
          channels: _channels,
          resendFailedOnly: isResendFailedOnly,
          ...(_channels.includes('webhook') && urls.length ? { webhookUrls: urls } : {}),
        });
        Toast.success('Message has been sent!');
      } catch (error) {
        console.error('handleResend error', { error });
        Toast.error(error.response ? error.response.statusText : error.message);
      } finally {
        setResending(false);
      }
    },
    [blocklet, notification.id, notification?.receivers, resendNotification, t]
  );

  const includeActivity = useCreation(() => {
    return isIncludeActivity(notification);
  }, [notification]);

  const isUserInitiatedNotification = useCreation(() => {
    return isUserActor(notification);
  }, [notification]);

  const actor = useCreation(() => {
    if (!includeActivity) return [];
    return notification?.actorInfo;
  }, [notification]);

  const teamDid = useCreation(() => {
    return blocklet?.did || blocklet?.meta?.did || '';
  }, [blocklet]);

  function Info() {
    const rows = [
      {
        name: t('notification.from'),
        value:
          includeActivity && isUserInitiatedNotification ? (
            <ActorAvatar actors={actor} teamDid={teamDid} size={32} showName />
          ) : (
            <SendComponentAvatar size={32} blocklet={component} showName hideDot />
          ),
      },
      {
        name: t('notification.notificationTitle'),
        value: <ShortenLabel maxLength={50}>{notification.title}</ShortenLabel>,
      },
      {
        name: t('notification.body'),
        value: includeActivity ? (
          <Activity notification={notification} blocklet={blocklet} />
        ) : (
          <NotificationContent notification={notification} rows={0} />
        ),
      },
      { name: t('notification.severity'), value: <NotificationSeverity severity={notification.severity} /> },
      {
        name: t('notification.createdAt'),
        value: <RelativeTime value={notification.createdAt} locale={locale} shouldUpdate type="all" />,
      },
    ];

    return rows.map((row) => (
      <InfoRow style={{ alignItems: 'flex-start' }} valueComponent="div" nameWidth={120} key={row.name} name={row.name}>
        {row.value}
      </InfoRow>
    ));
  }

  const tabConfigs = {
    info: {
      label: t('common.basicInfo'),
      value: 'info',
      component: Info,
    },
    receivers: {
      label: t('notification.receiver'),
      value: 'receivers',
    },
    statistics: {
      label: t('notification.statistics'),
      value: 'statistics',
    },
  };
  const tabs = Object.values(tabConfigs).map(({ label, value }) => ({ label, value }));

  const tabConfig = tabConfigs[pageState.tab] || tabConfigs.info;
  const onTabChange = (newTab) => {
    pageState.tab = newTab;
  };

  return (
    <Dialog
      title={t('notification.notificationDetails')}
      fullWidth
      maxWidth="lg"
      onClose={() => {
        pageState.tab = 'info';
        onCancel();
      }}
      open
      actionsPosition="left"
      sx={{
        '.ux-dialog_header': {
          paddingBottom: 0,
        },
        '.MuiDialogContent-root': {
          paddingTop: 0,
        },
      }}>
      <Div>
        <Box
          className="tabs"
          sx={{
            mx: 3,
          }}>
          <Tabs tabs={tabs} current={pageState.tab} onChange={onTabChange} scrollButtons="auto" />
        </Box>
        <div className="body">
          {pageState.tab === 'receivers' && (
            <Receivers notificationId={notification.id} resending={resending} handleResend={handleResend} />
          )}
          {pageState.tab === 'statistics' && (
            <Statistics
              statistics={notification.statistics}
              mode="detail"
              resending={resending}
              onResend={handleResend}
            />
          )}
          {pageState.tab === 'info' && <tabConfig.component />}
        </div>
      </Div>
    </Dialog>
  );
}

export default memo(Notification);

const Div = styled.div`
  & > .notification-row {
    padding: 0;
  }

  .tabs {
    margin: 0;
  }
  .body {
    margin-top: 16px;
  }

  .channel-item {
    display: flex;
    padding: 4px;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
    > p {
      font-size: 15px;
    }
    .resend-btn {
      svg {
        font-size: 16px;
      }
      display: flex;
      align-items: center;
      font-size: 12px;
      cursor: pointer;
      &.disabled {
        cursor: not-allowed;
        color: ${colors.text.disabled};
      }
    }
  }
`;
