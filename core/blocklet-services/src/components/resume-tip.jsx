import { formatToDatetime, getManageSubscriptionURL } from '@abtnode/ux/lib/util';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { OverdueInvoicePayment, PaymentProvider } from '@blocklet/payment-react';
import Link from '@mui/material/Link';
import { useSetState } from 'ahooks';
import { Link as InternalLink } from 'react-router-dom';

import { WELLKNOWN_BLOCKLET_ADMIN_PATH } from '@abtnode/constant';
import { Button, Typography, Alert } from '@mui/material';
import { useEffect, useState } from 'react';
import { joinURL } from 'ufo';
import { useBlockletContext } from '../contexts/blocklet';
import { useSessionContext } from '../contexts/session';
import {
  calculateRetentionDate,
  isCanceled,
  isPastDue,
  isSuspendedByExpired,
  isSuspendedByTerminated,
  isWillBeSuspendedSoon,
} from '../util';

export default function ResumeTip() {
  const { t, locale } = useLocaleContext();
  const { blocklet, launcherSession, refreshSubscription } = useBlockletContext();
  const { connectApi, session, api } = useSessionContext();
  const [showPay, setShowPay] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');

  const [state, setState] = useSetState({ subscriptionURL: '#' });

  useEffect(() => {
    if (isSuspendedByExpired(blocklet, launcherSession) || isWillBeSuspendedSoon(launcherSession)) {
      getManageSubscriptionURL({
        launcherSessionId: blocklet?.controller?.launcherSessionId,
        launcherUrl: blocklet?.controller?.launcherUrl,
        locale,
      })
        .then((url) => {
          setState({ subscriptionURL: url });
        })
        .catch((error) => {
          console.error('get subscription url error:', error);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocklet, launcherSession]);

  useEffect(() => {
    if (blocklet.controller?.launcherUrl) {
      const url = joinURL(blocklet.controller.launcherUrl, '__blocklet__.js?type=json');
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          const paymentMount = data.componentMountPoints?.find(
            (item) => item.did === 'z2qaCNvKMv5GjouKdcDWexv6WqtHbpNPQDnAk'
          )?.mountPoint;
          const baseUrl = joinURL(blocklet.controller.launcherUrl, paymentMount);
          setPaymentUrl(baseUrl);
        });
    }
  }, [blocklet.controller?.launcherUrl]);

  if (!blocklet || !launcherSession) {
    return '';
  }

  let action = null;
  let description = '';
  let type = 'error';

  if (isPastDue(launcherSession)) {
    action = isCanceled(launcherSession) ? (
      <Link href={state.subscriptionURL}>{t('blocklet.manageSubscription')}</Link>
    ) : (
      <Button
        variant="text"
        color="error"
        onClick={() => setShowPay(true)}
        sx={{ lineHeight: 'inherit', fontSize: 'inherit' }}>
        {t('blocklet.payNow')}
      </Button>
    );
    description = t('blocklet.suspendedCausedByPastDue', {
      deadline: formatToDatetime(launcherSession?.reservedUntil, locale),
    });
  } else if (isWillBeSuspendedSoon(launcherSession)) {
    action = <Link href={state.subscriptionURL}>{t('blocklet.manageSubscription')}</Link>;
    description = t('blocklet.willBeSuspendedSoon', {
      deadline: formatToDatetime((launcherSession?.subscription?.cancel_at || 0) * 1000, locale),
    });
    type = 'warning';
  } else if (isSuspendedByExpired(blocklet, launcherSession)) {
    action = <Link href={state.subscriptionURL}>{t('blocklet.manageSubscription')}</Link>;
    description = t('blocklet.suspendedCausedByExpired', {
      deadline: formatToDatetime(launcherSession?.reservedUntil, locale),
      canceledAt: formatToDatetime((launcherSession?.subscription?.canceled_at || 0) * 1000, locale),
    });
  } else if (isSuspendedByTerminated(blocklet, launcherSession)) {
    action = (
      <InternalLink to={joinURL(WELLKNOWN_BLOCKLET_ADMIN_PATH, '/did-spaces')}>{t('common.backup')}</InternalLink>
    );
    description = t('blocklet.suspendedCausedByTerminated', {
      canceledAt: formatToDatetime(launcherSession?.terminatedAt, locale),
      deadline: calculateRetentionDate(launcherSession?.terminatedAt, locale),
    });
  }

  if (!description) {
    return null;
  }

  return (
    <>
      <Alert severity={type} sx={{ mb: 1 }}>
        {description}
        <Typography
          sx={{
            display: 'inline-block',
            fontSize: 'inherit',
            lineHeight: 'inherit',
            ml: 1,
            a: {
              textDecoration: 'auto',
            },
            '& .MuiButtonBase-root': { p: 0, minWidth: 'auto' },
          }}>
          {action}
        </Typography>
      </Alert>
      {showPay && paymentUrl && launcherSession && (
        <PaymentProvider
          session={session}
          connect={connectApi}
          baseUrl={paymentUrl}
          authToken={launcherSession.subscription.authToken}>
          <OverdueInvoicePayment
            dialogProps={{ open: showPay, onClose: () => setShowPay(false) }}
            subscriptionId={launcherSession.subscription.id}
            successToast
            onPaid={() => {
              api.post('/blocklet/start?fromSetup=1');
              refreshSubscription();
              setShowPay(false);
            }}
          />
        </PaymentProvider>
      )}
    </>
  );
}
