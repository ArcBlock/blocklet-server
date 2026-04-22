import dayjs from '@abtnode/util/lib/dayjs';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Popover from '@mui/material/Popover';
import useMediaQuery from '@mui/material/useMediaQuery';
import prettyMs from 'pretty-ms-i18n';
import PropTypes from 'prop-types';
import { useRef } from 'react';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import useSetState from 'react-use/lib/useSetState';

import { useNodeContext } from '../contexts/node';
import { formatPrettyMsLocale, formatToDate, getSubscriptionUrlV2 } from '../util';
import ChipLabel from './chip-label';

const ALERT_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_LAUNCHER_URL = 'https://launcher.arcblock.io/'; // 兼容: 旧版本的 blocklet.controller 没有 launcherUrl 字段

function SubscriptionServer({
  launcherUrl,
  chainHost,
  nftId = '',
  launcherSessionId = '',
  sx = {},
  retention = 0,
  ...rest
}) {
  const { t, locale } = useLocaleContext();
  const [state, setState] = useSetState({
    safeIframeRef: null,
    popoverAnchorEl: null,
  });
  const iframeRef = useRef(null);
  const isMobile = useMediaQuery((x) => x.breakpoints.down('md'));
  const node = useNodeContext();

  const typoKey = isMobile ? 'mobile' : 'desktop';

  const asyncState = useAsyncRetry(async () => {
    const [data, subscriptionURL] = await Promise.all([
      // 新 Launch 的 Server 会有 launcherSessionId 信息，旧的 Server 只有 nftId
      // 这里做兼容处理，优先使用 launcherSessionId, 如果没有则使用 nftId
      node.api.getLauncherSession({ input: { launcherSessionId: launcherSessionId || nftId, launcherUrl } }),
      getSubscriptionUrlV2({
        launcherUrl: launcherUrl || DEFAULT_LAUNCHER_URL,
        nftDid: nftId,
        launcherSessionId,
        locale,
      }),
    ]);

    if (data?.error) {
      throw new Error(data.error);
    }

    return { launcherSession: data.launcherSession, subscriptionURL };
  }, [locale]);

  if (asyncState.loading) {
    return (
      <Chip
        label={
          <ChipLabel>
            {!isMobile && t('expiration.desktop.loading')}
            <CircularProgress size={16} />
          </ChipLabel>
        }
        variant="success"
        sx={{ cursor: 'pointer', ...sx }}
        {...rest}
        retention={retention}
      />
    );
  }

  if (asyncState.error) {
    console.error(asyncState.error);
    return (
      <Chip
        label={<ChipLabel>{t(`expiration.${typoKey}.loadFailed`)}</ChipLabel>}
        color="error"
        variant="success"
        sx={{ cursor: 'pointer', ...sx }}
        {...rest}
        retention={retention}
        onClick={() => asyncState.retry()}
      />
    );
  }

  const expirationDate = asyncState.value?.launcherSession?.expirationDate;

  const isExpired = dayjs(expirationDate).isBefore(dayjs());

  const validityMs = dayjs(expirationDate).diff(dayjs(), 'ms');
  let status = 'success';

  if (validityMs <= ALERT_THRESHOLD_MS) {
    status = 'warning';
  }

  if (isExpired) {
    status = 'error';
  }

  const handlePopoverClick = (event) => {
    setState({ popoverAnchorEl: event.currentTarget });
  };

  const handlePopoverClose = () => {
    setState({ popoverAnchorEl: null });
  };

  return (
    <>
      {asyncState.value?.launcherSession?.subscription && (
        <Chip
          label={
            <ChipLabel>{t('expiration.desktop.nextInvoice', { date: formatToDate(expirationDate, locale) })}</ChipLabel>
          }
          color="success"
          variant="outlined"
          sx={{ cursor: 'pointer', ...sx }}
          {...rest}
          retention={retention}
          onClick={handlePopoverClick}
        />
      )}
      {!asyncState.value?.launcherSession?.subscription && (
        <Chip
          label={
            <ChipLabel>
              {t(`expiration.${typoKey}.tips.${status}`, {
                validity: prettyMs(validityMs, { locale: formatPrettyMsLocale(locale), compact: true, verbose: true }),
              })}
            </ChipLabel>
          }
          color={status}
          variant={status !== 'success' ? 'contained' : 'outlined'}
          sx={{ cursor: 'pointer', ...sx }}
          {...rest}
          retention={retention}
          onClick={handlePopoverClick}
        />
      )}
      <Popover
        id="popover-info"
        open={Boolean(state.popoverAnchorEl)}
        anchorEl={state.popoverAnchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}>
        <Box sx={{ width: { xs: '360px', md: '450px' } }}>
          <iframe
            ref={iframeRef}
            title={t('common.subscription')}
            width="100%"
            height="600px"
            style={{
              border: 0,
            }}
            src={asyncState.value?.subscriptionURL}
          />
        </Box>
      </Popover>
    </>
  );
}

SubscriptionServer.propTypes = {
  chainHost: PropTypes.string.isRequired,
  nftId: PropTypes.string,
  launcherSessionId: PropTypes.string,
  sx: PropTypes.object,
  retention: PropTypes.number,
  launcherUrl: PropTypes.string.isRequired,
};

export default SubscriptionServer;
