/* eslint-disable no-nested-ternary */
import { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Skeleton, Box, Typography, Tooltip, keyframes } from '@mui/material';
import { useCreation } from 'ahooks';
import { Icon } from '@iconify/react';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
// eslint-disable-next-line import/no-unresolved
import { formatNumber } from '@blocklet/aigne-hub/utils/util';
import CachedIcon from '@mui/icons-material/Cached';

import { withQuery } from 'ufo';
import { CardWrapper, ButtonWrapper } from './basic';

export default function CreditCard({
  loading = false,
  credit = null,
  connecting = false,
  onRefresh = () => {},
  refreshing = false,
}) {
  const { t } = useContext(LocaleContext);

  // 定义旋转动画
  const spin = keyframes`
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  `;

  const isSelfHost = useMemo(() => {
    return !credit?.enableCredit;
  }, [credit]);

  const isDeficit = useMemo(() => {
    return Number(credit?.creditBalance?.balance) <= 0 && Number(credit?.creditBalance?.pendingCredit) > 0;
  }, [credit]);

  const { creditBalance, profileLink = '', paymentLink = '', creditPrefix = '' } = credit || {};

  const creditValue = useCreation(() => {
    const formattedBalance = formatNumber(creditBalance?.balance ?? 0);
    const displayValue = creditPrefix ? `${creditPrefix} ${formattedBalance}` : formattedBalance;
    return isDeficit ? `- ${displayValue}` : displayValue;
  }, [isDeficit, creditPrefix, creditBalance?.balance]);

  if (!credit && !loading) {
    return null;
  }

  return (
    <CardWrapper>
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 2,
            height: '100%',
          }}>
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Skeleton variant="rounded" sx={{ width: '80%', height: 20 }} />
            <Skeleton variant="rounded" sx={{ width: '50%', height: 20 }} />
          </Box>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            <Skeleton variant="rounded" sx={{ width: '100%', height: 20 }} />
            <Skeleton variant="rounded" sx={{ width: '100%', height: 20 }} />
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            height: '100%',
            width: '100%',
          }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="body1">AIGNE Hub Credits</Typography>
            <Typography variant="h2" sx={{ color: !isSelfHost && isDeficit ? 'error.main' : 'text.primary' }}>
              {isSelfHost ? t('setting.aigne.infinite') : creditValue}
              {!isSelfHost ? (
                <Tooltip title={t('common.refresh')}>
                  <CachedIcon
                    sx={{
                      fontSize: 14,
                      ml: 1,
                      cursor: 'pointer',
                      animation: refreshing ? `${spin} 1s linear infinite` : 'none',
                    }}
                    onClick={onRefresh}
                  />
                </Tooltip>
              ) : null}
            </Typography>
          </Box>
          {isSelfHost ? null : (
            <Box sx={{ width: '100%', display: 'flex', gap: 1 }}>
              <ButtonWrapper
                fullWidth
                variant="outlined"
                disabled={connecting}
                onClick={() => {
                  if (paymentLink) {
                    window.open(paymentLink, '_blank');
                  }
                }}
                startIcon={<Icon style={{ fontSize: 16 }} icon="tabler:credit-card" />}>
                {t('setting.aigne.addCredits')}
              </ButtonWrapper>
              <ButtonWrapper
                fullWidth
                disabled={connecting}
                onClick={() => {
                  if (profileLink) {
                    window.open(withQuery(profileLink, { appDid: window.blocklet.appPid }), '_blank');
                  }
                }}
                variant="outlined"
                startIcon={<Icon style={{ fontSize: 16 }} icon="hugeicons:transaction" />}>
                {t('setting.aigne.transaction')}
              </ButtonWrapper>
            </Box>
          )}
        </Box>
      )}
    </CardWrapper>
  );
}

CreditCard.propTypes = {
  loading: PropTypes.bool,
  credit: PropTypes.object,
  connecting: PropTypes.bool,
  onRefresh: PropTypes.func,
  refreshing: PropTypes.bool,
};
