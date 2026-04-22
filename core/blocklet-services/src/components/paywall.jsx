import PropTypes from 'prop-types';
import { Box, Button, Typography, Tooltip } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined';
import { joinURL } from 'ufo';

import AppInfo from './app-info';

const getPaymentKitMountPoint = () => {
  const info = window.blocklet?.componentMountPoints?.find((x) => x.did === 'z2qaCNvKMv5GjouKdcDWexv6WqtHbpNPQDnAk');
  return info?.mountPoint;
};

export function Paywall({ children = null, cta = null, ...rest }) {
  return (
    <Box {...rest}>
      {children ? (
        <Box
          sx={{
            maxHeight: '50vh',
            overflow: 'hidden',
            position: 'relative',
            ':after': {
              content: '""',
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '80%',
              background: 'linear-gradient(transparent, #fff 85%)',
            },
          }}>
          {children}
        </Box>
      ) : null}
      {cta ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 4,
            borderRadius: 2,
          }}>
          {cta}
        </Box>
      ) : null}
    </Box>
  );
}

Paywall.propTypes = {
  children: PropTypes.node,
  cta: PropTypes.node,
};

export function PassportPaywall({ passports = [], onConnect = () => {}, redirect, ...rest }) {
  const { t } = useLocaleContext();
  const paymentKitMountPoint = getPaymentKitMountPoint();

  const getPaymentLink = (passport) => {
    const pay = passport?.payable;
    return paymentKitMountPoint && pay
      ? joinURL(paymentKitMountPoint, `/api/redirect/checkout/${pay}?redirect=${redirect}`)
      : null;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        minHeight: '100vh',
        maxWidth: '400px',
        margin: 'auto',
        paddingBottom: {
          sx: 0,
          md: 15,
        },
      }}>
      <AppInfo />
      <Paywall
        {...rest}
        cta={
          <>
            <Typography variant="h4" sx={{ mx: 2, textAlign: 'center', fontWeight: 'bold', color: 'warning.main' }}>
              {t('login.accessLimit.title')}
            </Typography>

            <Typography variant="body1" sx={{ maxWidth: 620, mt: 2, mx: 2, textAlign: 'center', color: 'gray' }}>
              {t('login.accessLimit.description')}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 1,
                mt: 5,
              }}>
              {passports?.map((x) => {
                const paymentLink = getPaymentLink(x);
                if (paymentLink) {
                  return (
                    <Tooltip title={t('login.accessLimit.buyPassport')} key={x.name} arrow placement="top">
                      <Button
                        color="primary"
                        variant="contained"
                        endIcon={<LaunchOutlinedIcon />}
                        href={paymentLink}
                        target="_blank">
                        {x.title || x.name}
                      </Button>
                    </Tooltip>
                  );
                }

                return (
                  <Tooltip title={t('login.connectWithPassport')} key={x.name} arrow placement="top">
                    {/* FIXME: 这里实际应该限制使用指定通行证来连接，而不是直接连接 */}
                    <Button color="inherit" variant="contained" onClick={onConnect}>
                      {x.title || x.name}
                    </Button>
                  </Tooltip>
                );
              })}
            </Box>

            <Typography variant="body1" sx={{ mt: 2, color: 'grey.400' }}>
              <Box component="span" sx={{ display: 'inline-block', mr: 1 }}>
                {t('login.accessLimit.alreadyHavePassport')}
              </Box>
              <Box
                component="span"
                sx={{
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  color: 'primary.main',
                }}
                onClick={onConnect}>
                {t('common.connect')}
              </Box>
            </Typography>
          </>
        }
      />
    </Box>
  );
}

PassportPaywall.propTypes = {
  passports: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      title: PropTypes.string,
      payable: PropTypes.string,
    })
  ),
  onConnect: PropTypes.func,
  onClose: PropTypes.func,
  redirect: PropTypes.string.isRequired,
};
