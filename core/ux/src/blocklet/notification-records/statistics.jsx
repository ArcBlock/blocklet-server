import PropTypes from 'prop-types';
import { useCreation } from 'ahooks';
import InfoRow from '@arcblock/ux/lib/InfoRow';
import { alpha, Box, Typography } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Grid from '@mui/material/Grid';
import styled from '@emotion/styled';
import Button from '@arcblock/ux/lib/Button';
import ReplayIcon from '@mui/icons-material/Replay';
import { NOTIFICATION_SEND_CHANNEL } from '@abtnode/constant';
import StatusDot from './status-dot';
import { sendStatusColor, getTitleByChannel } from './utils';

const formatNumber = (num) => {
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num;
};

function getSimpleRows(statistics) {
  const { wallet, push, email, webhook } = statistics;
  return [
    { name: 'Wallet', value: <StatisticsPreview item={wallet} /> },
    { name: 'Push', value: <StatisticsPreview item={push} /> },
    { name: 'Email', value: <StatisticsPreview item={email} /> },
    ...(webhook.total > 0 ? [{ name: 'Webhook', value: <StatisticsPreview item={webhook} isWebhook /> }] : []),
  ];
}

function getDetailRows(statistics, onResend, loading) {
  const { wallet, push, email, webhook } = statistics;
  return [
    {
      name: 'Wallet',
      value: (
        <StatisticsDetail
          loading={loading}
          channel={NOTIFICATION_SEND_CHANNEL.WALLET}
          item={wallet}
          onResend={onResend}
        />
      ),
    },
    {
      name: 'Push',
      value: (
        <StatisticsDetail loading={loading} channel={NOTIFICATION_SEND_CHANNEL.PUSH} item={push} onResend={onResend} />
      ),
    },
    {
      name: 'Email',
      value: (
        <StatisticsDetail
          loading={loading}
          channel={NOTIFICATION_SEND_CHANNEL.EMAIL}
          item={email}
          onResend={onResend}
        />
      ),
    },
    ...(webhook.total > 0
      ? [
          {
            name: 'Webhook',
            value: (
              <StatisticsDetail
                loading={loading}
                channel={NOTIFICATION_SEND_CHANNEL.WEBHOOK}
                item={webhook}
                isWebhook
                onResend={onResend}
              />
            ),
          },
        ]
      : []),
  ];
}

NotificationStatistics.propTypes = {
  statistics: PropTypes.object.isRequired,
  onResend: PropTypes.func,
  mode: PropTypes.oneOf(['simple', 'detail']),
  resending: PropTypes.bool,
};

StatisticsPreview.propTypes = {
  item: PropTypes.object.isRequired,
  isWebhook: PropTypes.bool,
};

/**
 * 统计预览，不展示详细信息
 */
function StatisticsPreview({ item, isWebhook = false }) {
  const { t } = useLocaleContext();
  const successCount = !isWebhook ? item.success : item.success.length;
  const sendTotal = item.total;
  const status = successCount === sendTotal ? 'success' : 'failed';
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 2,
      }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}>
        <StatusDot config={{ status }} enableTooltip={false}>
          {formatNumber(successCount)} / {formatNumber(sendTotal)} {t('notification.sendStatus.success')}
        </StatusDot>
      </Box>
    </Box>
  );
}

StatisticsDetail.propTypes = {
  item: PropTypes.object.isRequired,
  isWebhook: PropTypes.bool,
  channel: PropTypes.string,
  onResend: PropTypes.func,
  loading: PropTypes.bool,
};

/**
 * 统计详情，显示详细信息，并能够重发
 */
function StatisticsDetail({
  channel = NOTIFICATION_SEND_CHANNEL.WALLET,
  item,
  isWebhook = false,
  onResend = () => {},
  loading = false,
}) {
  const { t } = useLocaleContext();

  const { success, failed, pending } = item;
  const title = getTitleByChannel(channel);

  const successCount = isWebhook ? success.length : success;
  const failedCount = isWebhook ? failed.length : failed;
  const pendingCount = isWebhook ? pending.length : pending;

  const handleResend = async (event) => {
    event.stopPropagation();
    const urls = isWebhook ? [...new Set([...success, ...failed].map((x) => x))] : [];
    await onResend([channel], [], true, urls);
  };

  const total = successCount + failedCount;
  const successRatio = total > 0 ? (successCount / total) * 100 : 0;
  const failedRatio = total > 0 ? (failedCount / total) * 100 : 0;

  return (
    <ItemCard successRatio={successRatio} failedRatio={failedRatio}>
      <Typography variant="h6">
        {title} ({item.total})
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        <span style={{ color: sendStatusColor.success, fontWeight: 600, fontSize: 24 }}>
          {formatNumber(successCount)}
        </span>
        <small style={{ paddingLeft: 4 }}>{t('notification.sendStatus.success')}</small>
      </Typography>
      <Box className="unsent-area">
        <Box>
          <StatusDot config={{ status: 'failed' }} enableTooltip={false}>
            {formatNumber(failedCount)} {t('notification.sendStatus.failed')}
          </StatusDot>
          <StatusDot config={{ status: 'pending' }} enableTooltip={false}>
            {formatNumber(pendingCount)} {t('notification.sendStatus.pending')}
          </StatusDot>
        </Box>
        {failedCount > 0 && (
          <Box className="resend-btn">
            <Button
              size="small"
              color="primary"
              loading={loading}
              variant="contained"
              startIcon={<ReplayIcon />}
              sx={{ '.MuiButton-startIcon': { mr: '2px' } }}
              onClick={handleResend}>
              {t('notification.resend')}
            </Button>
          </Box>
        )}
      </Box>
    </ItemCard>
  );
}

export default function NotificationStatistics({
  statistics,
  mode = 'simple',
  onResend = () => {},
  resending = false,
}) {
  const rows = useCreation(() => {
    if (mode === 'simple') {
      return getSimpleRows(statistics);
    }
    return getDetailRows(statistics, onResend, resending);
  }, [statistics, mode]);

  if (mode === 'simple') {
    return (
      <div>
        {rows.map((row) => (
          <InfoRow
            style={{ alignItems: 'flex-start', marginBottom: mode === 'simple' ? 0 : 16 }}
            valueComponent="div"
            nameWidth={100}
            key={row.name}
            name={row.name}>
            {row.value}
          </InfoRow>
        ))}
      </div>
    );
  }

  return (
    <Grid container spacing={2}>
      {rows.map((x) => (
        <Grid
          key={x.name}
          size={{
            md: 4,
            sm: 6,
            xs: 12,
          }}>
          {x.value}
        </Grid>
      ))}
    </Grid>
  );
}

const ItemCard = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px;
  border-radius: 8px;
  background: ${({ successRatio, failedRatio, theme }) => {
    if (successRatio === 0 && failedRatio === 0) {
      return theme.palette.grey[300];
    }
    return `linear-gradient(to right, ${alpha(theme.palette.success.light, 0.4)} ${successRatio}%, ${theme.palette.grey[100]} ${successRatio}%)`;
  }};
  transition: 'background 0.5s ease';
  cursor: pointer;
  .unsent-area {
    width: 100%;
    position: relative;
    .resend-btn {
      position: absolute;
      right: 0;
      bottom: 0;
    }
  }
`;
