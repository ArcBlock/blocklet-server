/* eslint-disable react/jsx-one-expression-per-line, no-undef */
import { useState, useContext } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Box, Typography } from '@mui/material';
import Center from '@arcblock/ux/lib/Center';
import Button from '@arcblock/ux/lib/Button';
import DidConnect from '@arcblock/did-connect-react/lib/Connect';
import Fullpage from '@arcblock/did-connect-react/lib/Connect/fullpage';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

import wrapLocale from './wrap-locale';
import usePassportId from './hooks/use-passport-id';

// eslint-disable-next-line react/prop-types
function IssuePassport({ SessionContext, webWalletUrl }) {
  const { api, session } = useContext(SessionContext);
  const { t, locale } = useContext(LocaleContext);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { setPassportId } = usePassportId();

  const onReceivePassport = (result) => {
    if (result?.passportId) {
      setPassportId(result.passportId);
    }

    setSuccess(true);
  };

  const extraParams = {};
  const { searchParams } = new URL(window.location.href);
  const id = searchParams.get('id');
  if (id) {
    extraParams.id = id;
  }

  const onUsePassport = () => {
    try {
      session.logout();
    } catch (err) {
      // Do nothing
    }

    if ((window.env?.apiPrefix || '').startsWith(WELLKNOWN_SERVICE_PATH_PREFIX)) {
      navigate(`${WELLKNOWN_SERVICE_PATH_PREFIX}/login`, { replace: true });

      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <Div>
      {success ? (
        <div className="login">
          <div className="connect">
            <Box
              sx={{
                textAlign: 'center',
              }}>
              <Box
                sx={{
                  mb: 3,
                  color: 'success.main',
                }}>
                <CheckCircleIcon style={{ fontSize: 60 }} />
              </Box>
              <Typography component="p" variant="body1" className="subheader">
                {t('issuePassport.dialog.success')}
              </Typography>
              <Box
                sx={{
                  mt: 3,
                }}>
                <Button variant="contained" color="primary" onClick={onUsePassport}>
                  {t('issuePassport.dialog.loginWithPassport')}
                </Button>
              </Box>
            </Box>
          </div>
        </div>
      ) : (
        <Fullpage did={window?.blocklet?.appPid || window?.env?.appPid}>
          <Box
            sx={{
              maxWidth: '100%',
              height: '100%',
            }}>
            <DidConnect
              popup
              open
              className="connect"
              action="issue-passport"
              forceConnected={false}
              autoConnect={false}
              checkFn={api.get}
              checkTimeout={10 * 60 * 1000}
              webWalletUrl={webWalletUrl}
              onSuccess={onReceivePassport}
              locale={locale}
              messages={{
                title: t('issuePassport.title'),
                scan: t('issuePassport.description', { name: window.env.appName }),
                confirm: t('issuePassport.dialog.confirm'),
                success: t('issuePassport.dialog.success'),
              }}
              extraParams={extraParams}
              hideCloseButton
            />
          </Box>
        </Fullpage>
      )}
    </Div>
  );
}

const Div = styled(Center)`
  .header {
    text-align: center;
    margin-bottom: 8px;
  }

  .subheader {
    text-align: center;
    margin-bottom: 24px;
  }

  .login {
    padding: 24px;
    height: auto;
    min-height: 480px;
    display: flex;
    flex-direction: column;
  }

  .connect {
    background: #fafafa;
  }
`;

export default wrapLocale(IssuePassport);
