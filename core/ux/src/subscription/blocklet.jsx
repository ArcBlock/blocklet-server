import { LAUNCH_SESSION_STATUS } from '@abtnode/constant';
import dayjs from '@abtnode/util/lib/dayjs';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import prettyMs from 'pretty-ms-i18n';
import PropTypes from 'prop-types';
import { useRef } from 'react';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import useSetState from 'react-use/lib/useSetState';

import { useTheme, useMediaQuery, Box, Chip, CircularProgress, Popover } from '@mui/material';
import { useNodeContext } from '../contexts/node';
import { formatPrettyMsLocale, getSubscriptionUrlV2 } from '../util';
import ChipLabel from './chip-label';

const DEFAULT_LAUNCHER_URL = 'https://launcher.arcblock.io/'; // 兼容: 旧版本的 blocklet.controller 没有 launcherUrl 字段

const ALERT_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;

function SubscriptionBlocklet({
  launcherUrl,
  chainHost,
  nftId = '',
  launcherSessionId = '',
  retention = 0,
  sx = {},
  ...rest
}) {
  const { t, locale } = useLocaleContext();
  const node = useNodeContext();
  const [state, setState] = useSetState({
    safeIframeRef: null,
    popoverAnchorEl: null,
  });
  const iframeRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery((x) => x.breakpoints.down('md'));

  const typoKey = isMobile ? 'mobile' : 'desktop';

  const asyncState = useAsyncRetry(async () => {
    const [data, subscriptionURL] = await Promise.all([
      node.api.getLauncherSession({ input: { launcherSessionId, launcherUrl } }),
      getSubscriptionUrlV2({
        launcherUrl: launcherUrl || DEFAULT_LAUNCHER_URL,
        nftDid: nftId,
        launcherSessionId,
        locale,
        theme: theme.palette.mode,
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

  const handlePopoverClick = (event) => {
    setState({ popoverAnchorEl: event.currentTarget });
  };

  const handlePopoverClose = () => {
    setState({ popoverAnchorEl: null });
  };

  const launcherSession = asyncState.value?.launcherSession;
  let status = 'success';

  if (
    [LAUNCH_SESSION_STATUS.overdue, LAUNCH_SESSION_STATUS.canceled, LAUNCH_SESSION_STATUS.terminated].includes(
      asyncState.value?.launcherSession?.status
    )
  ) {
    status = 'error';
  }

  let validity = null;
  if (launcherSession.expirationDate && !launcherSession.subscription) {
    const validityMs = dayjs(launcherSession.expirationDate).diff(dayjs(), 'ms');
    validity = t(`expiration.${typoKey}.tips.${status}`, {
      validity: prettyMs(validityMs, { locale: formatPrettyMsLocale(locale), compact: true, verbose: true }),
    });

    if (validityMs > 0 && validityMs <= ALERT_THRESHOLD_MS) {
      status = 'warning';
    }
  }

  return (
    <>
      <Chip
        label={
          <ChipLabel>{validity || launcherSession?.subscription?.product?.name || t('common.subscription')}</ChipLabel>
        }
        color={status}
        variant={status !== 'success' ? 'contained' : 'outlined'}
        sx={{ cursor: 'pointer', ...sx }}
        {...rest}
        retention={retention}
        onClick={handlePopoverClick}
      />
      <Popover
        id="popover-info"
        open={Boolean(state.popoverAnchorEl)}
        anchorEl={state.popoverAnchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPopover-paper': {
            minHeight: 0,
          },
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}>
        <Box sx={{ width: { xs: '360px', md: '450px' }, display: 'flex', flexDirection: 'column' }}>
          <iframe
            ref={iframeRef}
            title={t('common.subscription')}
            width="100%"
            height="600px"
            style={{
              border: 0,
              maxHeight: '800px',
            }}
            src={asyncState.value?.subscriptionURL}
          />
        </Box>
      </Popover>
    </>
  );
}

SubscriptionBlocklet.propTypes = {
  chainHost: PropTypes.string.isRequired,
  nftId: PropTypes.string,
  launcherSessionId: PropTypes.string,
  sx: PropTypes.object,
  retention: PropTypes.number,
  launcherUrl: PropTypes.string.isRequired,
};

export default SubscriptionBlocklet;
