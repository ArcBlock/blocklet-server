import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Tabs from '@arcblock/ux/lib/Tabs';
import Toast from '@arcblock/ux/lib/Toast';
import { Box, FormControlLabel, Paper, Switch, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useCreation, useMemoizedFn } from 'ahooks';
import { useContext, useMemo, useState } from 'react';
import { useNodeContext } from '../../contexts/node';
import { useBlockletContext } from '../../contexts/blocklet';
import NotificationEmail from './email';
import NotificationPushKit from './push-kit';

const tabs = [
  {
    label: (
      <Box
        sx={{
          textAlign: 'center',
          width: '100%',
        }}>
        Email
      </Box>
    ),
    value: 'email',
  },
  {
    label: (
      <Box
        sx={{
          textAlign: 'center',
          width: '100%',
        }}>
        Push Kit
      </Box>
    ),
    value: 'pushKit',
  },
  {
    label: (
      <Box
        sx={{
          textAlign: 'center',
          width: '100%',
        }}>
        Wallet
      </Box>
    ),
    value: 'wallet',
  },
  {
    label: (
      <Box
        sx={{
          textAlign: 'center',
          width: '100%',
        }}>
        Webhooks
      </Box>
    ),
    value: 'webhooks',
  },
];

const validTabs = tabs.map((t) => t.value);

function BlockletNotification() {
  const { t } = useContext(LocaleContext);
  const { api } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const [params, setParams] = useSearchParams();

  const did = blocklet?.meta?.did;
  const [toastAlert, setToastAlert] = useState(Boolean(blocklet?.settings?.notification?.toastAlert));
  const [toastAlertLoading, setToastAlertLoading] = useState(false);

  const handleToastAlertChange = useMemoizedFn(async (event) => {
    const { checked } = event.target;
    try {
      setToastAlertLoading(true);
      await api.configNotification({
        input: {
          did,
          notification: JSON.stringify({ toastAlert: checked }),
        },
      });
      setToastAlert(checked);
      Toast.success(t('common.saveSuccess'));
    } catch (err) {
      Toast.error(err.message || t('common.saveFailed'));
    } finally {
      setToastAlertLoading(false);
    }
  });

  const typeParam = params.get('type');

  const currentTab = validTabs.includes(typeParam) ? typeParam : tabs[0].value;

  const contents = useCreation(
    () => ({
      email: <NotificationEmail />,
      pushKit: <NotificationPushKit />,
      wallet: <Typography variant="body1">{t('notification.wallet.description')}</Typography>,
      webhooks: <Typography variant="body1">{t('notification.webhooks.description')}</Typography>,
    }),
    [t]
  );

  const onTablChange = useMemoizedFn((tab) => {
    params.set('type', tab);
    setParams(params, { replace: true });
  });

  const tabBodyStyle = useMemo(() => {
    return {
      padding: '10px 0',
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <FormControlLabel
          control={<Switch checked={toastAlert} onChange={handleToastAlertChange} disabled={toastAlertLoading} />}
          label={
            <Box>
              <Typography variant="body1" fontWeight={500}>
                {t('notification.toastAlert.label')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('notification.toastAlert.description')}
              </Typography>
            </Box>
          }
          sx={{ alignItems: 'flex-start', m: 0 }}
        />
      </Paper>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Tabs variant="card" tabs={tabs} current={currentTab} onChange={onTablChange} />
        <Box style={tabBodyStyle}>{contents[currentTab]}</Box>
      </Paper>
    </Box>
  );
}

export default BlockletNotification;
