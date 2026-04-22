import PropTypes from 'prop-types';
import { Global, css } from '@emotion/react';
import { Box, useTheme } from '@mui/material';
import Cookie from 'js-cookie';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { ConfigProvider } from '@arcblock/ux/lib/Config';
import { ToastProvider } from '@arcblock/ux/lib/Toast';

import { translations } from '../locales';
import { SessionProvider } from '../contexts/session';

// eslint-disable-next-line react/prop-types
export default function Root({ children }) {
  return (
    <ConfigProvider translations={translations} injectFirst>
      <ToastProvider maxSnack={3}>
        <RootInside>{children}</RootInside>
      </ToastProvider>
    </ConfigProvider>
  );
}

const url = new URL(window.location.href);
const mode = url.searchParams.get('mode') || '';
const isEmbedDialog = url.pathname.includes('embed') && mode === 'dialog';
const isEmbedSection = url.pathname.includes('embed') && mode !== 'dialog';

function RootInside({ children = null }) {
  const { locale } = useLocaleContext();
  const theme = useTheme();

  const isStart = url.searchParams.get('__start__') === '1';
  const visitorId = url.searchParams.get('visitorId');
  const setupToken = url.searchParams.get('setupToken');

  const globalStyles = css`
    ${isEmbedDialog ? 'body { background-color: transparent }' : ''}
    ${isEmbedSection ? '.MuiModal-backdrop { background-color: transparent !important }' : ''}
    a {
      color: ${theme?.palette?.success.main};
      text-decoration: none;
    }

    a:hover {
      text-decoration: none;
    }

    .MuiButton-outlinedPrimary {
      fill: ${theme?.palette?.primary?.main};
    }

    .form-item {
      margin-top: 24px;
    }
  `;

  // 如果携带有 __start__ 参数，需要将 visitorId 和 setupToken 添加到 cookie 中
  if (isStart && visitorId) {
    Cookie.set('vid', visitorId, { expires: 365, secure: true, sameSite: 'Lax' });
  }
  if (isStart && setupToken) {
    Cookie.set('login_token', setupToken, { expires: 1, secure: true, sameSite: 'Lax' });
  }

  return (
    <SessionProvider
      serviceHost={window.env && window.env.apiPrefix ? window.env.apiPrefix : ''}
      autoLogin={false}
      locale={locale}>
      <Global styles={globalStyles} />
      <Box className="wrapper">{children}</Box>
    </SessionProvider>
  );
}

RootInside.propTypes = {
  children: PropTypes.any,
};
