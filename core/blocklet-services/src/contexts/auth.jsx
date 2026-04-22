import { createContext, useContext } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Spinner from '@mui/material/CircularProgress';
import Center from '@arcblock/ux/lib/Center';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Result from '@arcblock/ux/lib/Result';
import SessionManager from '@arcblock/did-connect-react/lib/SessionManager';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import { WELLKNOWN_SERVICE_PATH_PREFIX, WELLKNOWN_BLOCKLET_ADMIN_PATH } from '@abtnode/constant';

import { useSessionContext } from './session';

const AuthContext = createContext({});
const { Provider, Consumer } = AuthContext;

function AuthProvider({ children = null, roles = ['owner', 'admin'] }) {
  const { t, locale } = useLocaleContext();
  const { session } = useSessionContext();

  const gotoConnect = () => {
    const redirect = encodeURIComponent(`${window.location.pathname}${window.location.search}`);

    // 非外部域名，是安全的
    // FIXME: history.replace does not work
    window.location.href = `${WELLKNOWN_SERVICE_PATH_PREFIX}/login?redirect=${redirect}`;
  };

  if (session.loading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  if (!session.user && roles[0] !== '*') {
    return gotoConnect();
  }

  if (roles[0] === '*' || roles.includes(session.user.role)) {
    return <Provider value={{}}>{children}</Provider>;
  }

  return (
    <>
      <Header maxWidth="100%">
        <div className="header-logo">
          <a href="/">
            <img src={`${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/logo`} alt="logo" />
          </a>
        </div>
        <SessionManager key="session-manager" session={session} locale={locale} showRole />
      </Header>
      <Box sx={{ height: 'calc(100vh - 64px)' }}>
        <Result
          icon={<CancelRoundedIcon sx={{ color: 'error.main', fontSize: 72 }} />}
          title={t('errorPage.404.title')}
          description={t('errorPage.404.description')}
          extra={
            <div style={{ textAlign: 'center' }}>
              <p
                style={{ marginTop: 0 }}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: t('errorPage.404.backHome', { url: '/' }) }}
              />
              <p
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: t('errorPage.404.goToDashboard', { url: WELLKNOWN_BLOCKLET_ADMIN_PATH }),
                }}
              />
            </div>
          }
          style={{ backgroundColor: 'transparent' }}
        />
      </Box>
    </>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.any,
  roles: PropTypes.array,
};

const Header = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  max-width: 100%;
  border-bottom: 1px solid rgb(238, 238, 238);
  .header-logo {
    img {
      height: 36px;
    }
  }
`;

function useAuthContext() {
  const value = useContext(AuthContext);
  return value;
}

function withAuth(Component) {
  return function WithAuth(...props) {
    return (
      <AuthProvider>
        <Component {...props} />
      </AuthProvider>
    );
  };
}

export { AuthContext, AuthProvider, Consumer as AuthConsumer, useAuthContext, withAuth };
