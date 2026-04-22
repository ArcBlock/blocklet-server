import { Link, useLocation } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import { useMemoizedFn, useMount, useReactive } from 'ahooks';
import { Box, Card, CardActions, CardContent, CardHeader, Typography } from '@mui/material';
import Button from '@arcblock/ux/lib/Button';
import Toast from '@arcblock/ux/lib/Toast';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { joinURL } from 'ufo';
import { useSessionContext } from '../contexts/session';

export default function Unsubscribe() {
  const { api } = useSessionContext();
  const location = useLocation();
  const { t } = useLocaleContext();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');
  const pageState = useReactive({
    error: '',
    finished: false,
    loading: false,
  });

  const handleClosePage = useMemoizedFn(() => {
    window.close();
    window.location.replace('/');
  });
  const handleUnsubscribe = useMemoizedFn(async () => {
    try {
      pageState.loading = true;
      const { data } = await api.post('/api/user/notification/unsubscribe', {
        token,
      });
      if (data.success === true) {
        pageState.finished = true;
        Toast.success(t('notification.unsubscribeSucceed'));
      } else {
        pageState.finished = false;
        Toast.error(t('notification.unsubscribeFailed'));
      }
    } catch (err) {
      pageState.finished = false;
      Toast.error(err.message || t('notification.unsubscribeFailed'));
    } finally {
      pageState.loading = false;
    }
  });

  useMount(() => {
    if (!token) {
      pageState.error = t('notification.unsubscribeTokenRequired');
    } else {
      const decoded = jwtDecode(token);
      if (!decoded) {
        pageState.error = t('notification.unsubscribeTokenInvalid');
      } else {
        const { exp } = decoded;
        if (exp * 1000 <= Date.now()) {
          pageState.error = t('notification.unsubscribeTokenExpired');
        }
      }
    }
  });

  const copyright = window?.blocklet?.copyright;

  const copyrightOwner = copyright?.owner || window?.blocklet?.appName;
  const copyrightYear = copyright?.year || new Date().getFullYear();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}>
      <Box sx={{ width: '450px', maxWidth: '90%' }}>
        <Box sx={{ width: '100%' }}>
          <img
            style={{ height: '40px' }}
            src={joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/blocklet/logo-rect?imageFilter=convert&f=png')}
            alt="blocklet logo"
          />
        </Box>
        <Card variant="outlined" sx={{ my: 1 }}>
          <CardHeader
            title={pageState.finished ? t('notification.unsubscribeSucceed') : t('notification.email.unsubscribe')}
          />
          <CardContent sx={{ minHeight: '10em' }}>
            {pageState.error ? pageState.error : null}
            {!pageState.error && !pageState.finished ? t('notification.email.unsubscribeDescription') : null}
            {!pageState.error && pageState.finished ? (
              <>
                {t('notification.email.subscribeDescription')}{' '}
                <Link to={joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/user/settings')} color="primary">
                  {t('notification.email.subscribe')}
                </Link>
              </>
            ) : null}
          </CardContent>
          <CardActions sx={{ justifyContent: 'end!important' }}>
            <Button
              size="small"
              color={pageState.error ? 'error' : 'primary'}
              variant="outlined"
              onClick={handleClosePage}>
              {t('common.close')}
            </Button>
            {pageState.error || pageState.finished ? null : (
              <Button
                size="small"
                color="primary"
                variant="contained"
                onClick={handleUnsubscribe}
                loading={pageState.loading}>
                {t('notification.unsubscribe')}
              </Button>
            )}
          </CardActions>
        </Card>
        <Typography variant="body2" color="gray">
          Copyright © {copyrightYear} {copyrightOwner}
        </Typography>
      </Box>
    </Box>
  );
}
