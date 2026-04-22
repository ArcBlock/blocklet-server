import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Grid, Typography } from '@mui/material';
import { useMemoizedFn, useMount } from 'ahooks';
import { Link } from 'react-router-dom';

import useConnect from '@arcblock/did-connect-react/lib/Connect/use-connect';
import LandingPage from '@arcblock/did-connect-react/lib/Connect/landing-page';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import usePassportId from '@abtnode/ux/lib/hooks/use-passport-id';
import { joinURL, withQuery } from 'ufo';
import { didConnectColors } from '@arcblock/ux/lib/Colors';

import { NodeContext } from '../../contexts/node';
import { SessionContext } from '../../contexts/session';
import { getWebWalletUrl, setRefreshToken, setSessionToken } from '../../libs/util';

export default function NodeLogin({ loadingEle = '' }) {
  const { node } = useContext(NodeContext);
  const { api, session } = useContext(SessionContext);
  const { t, locale } = useContext(LocaleContext);
  const { getPassportId } = usePassportId();

  const { connectApi, connectHolder } = useConnect();

  const onLogin = (result, decrypt) => {
    setSessionToken(decrypt(result.sessionToken));
    setRefreshToken(decrypt(result.refreshToken));
    session.refresh();
  };

  const trustedFactories = node.info?.trustedFactories || [];
  const isFromLauncher = !!node.info?.launcher || false;
  const extraParams = { passportId: getPassportId() };

  const webWalletUrl = getWebWalletUrl(node.info);

  const extraContent =
    trustedFactories.length > 0 || isFromLauncher ? (
      <Grid
        container
        spacing={1}
        sx={{
          justifyContent: 'center',
        }}>
        <Grid
          className="extra-item"
          size={{
            md: 12,
          }}>
          <Box>
            {t('exchangePassport.tooltip1')}
            <Box
              component={Link}
              key="exchange-passport"
              reloadDocument
              to={withQuery(joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/exchange-passport'))}
              sx={{
                color: didConnectColors.primary.light,
                '&:hover': {
                  textDecoration: 'underline dashed',
                },
              }}>
              {t('exchangePassport.tooltip2')}
            </Box>

            <Box component="ul" sx={{ pl: 1.5, my: 1, listStyle: 'disc' }}>
              {trustedFactories.map(item => (
                <Box component="li" key={item.factoryAddress} sx={{ listStyle: 'disc' }}>
                  {item.factoryAddress}
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>
        {!isFromLauncher && (
          <Grid
            className="extra-item"
            size={{
              md: 12,
            }}>
            {t('acceptServer.tooltip')}{' '}
            <Box
              component={Link}
              reloadDocument
              to="/accept-server"
              sx={{
                color: didConnectColors.primary.light,
                '&:hover': {
                  textDecoration: 'underline dashed',
                },
              }}>
              {t('acceptServer.title')}
            </Box>
          </Grid>
        )}
      </Grid>
    ) : null;

  const handleLogin = useMemoizedFn(() => {
    connectApi.open({
      popup: true,
      action: 'login',
      className: 'connect',
      passkeyBehavior: 'only-existing',
      loadingEle,
      checkFn: api.get,
      checkTimeout: 10 * 60 * 1000,
      webWalletUrl,
      onSuccess: onLogin,
      locale,
      messages: {
        title: t('login.connect.title'),
        scan: t('login.connect.scan'),
        confirm: t('login.connect.confirm'),
        success: t('login.connect.success'),
      },
      extraParams,
      extraContent,
    });
  });

  useMount(() => {
    handleLogin();
  });

  return (
    <>
      {connectHolder}
      <LandingPage
        did={window.env?.appPid}
        termsOfUse={
          <Typography variant="caption">
            {t('login.agreeTermsOfUse')}{' '}
            <Link href="https://www.arcblock.io/termsofuse" target="_blank" underline="hover">
              {t('login.termsOfUse')}
            </Link>
          </Typography>
        }
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={handleLogin}>
              {t('login.login')}
            </Button>
          </Box>
        }
      />
    </>
  );
}
NodeLogin.propTypes = {
  loadingEle: PropTypes.any,
};
