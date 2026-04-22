/* eslint-disable react/prop-types */
/* eslint-disable object-curly-newline */
import { useMemo } from 'react';
import { ConfigProvider } from '@arcblock/ux/lib/Config';
import { Global, css } from '@emotion/react';
import { useTheme } from '@mui/material';
import { teal } from '@mui/material/colors';

import { ErrorBoundary } from 'react-error-boundary';
import { ToastProvider } from '@arcblock/ux/lib/Toast';
import { baseLanguages } from '@blocklet/constant';
import ErrorFallback from './error-fallback';
import { translations } from '../locales';
import { SessionProvider } from '../contexts/session';
import { NodeProvider } from '../contexts/node';

function GlobalStyles() {
  const theme = useTheme();
  const styles = useMemo(() => {
    return css`
      a {
        color: ${teal.A700};
        text-decoration: none;
      }

      a:hover {
        text-decoration: none;
      }

      .page-breadcrumb {
        margin-bottom: 16px !important;
      }

      .page-header {
        margin-bottom: 32px !important;
      }

      ul,
      li {
        padding: 0;
        margin: 0;
        list-style: none;
      }

      .toolbar > div {
        .header-link {
          flex: 0;

          .header-image {
            margin-left: 14px;
          }
        }

        @media (max-width: ${theme.breakpoints.values.md}px) {
          width: 100%;
          .header-link {
            overflow: hidden;
          }
        }
      }

      .MuiFormControlLabel-label {
        flex: 1;
        display: inline-flex;
        justify-content: space-between;
        align-items: center;
      }

      .form-item {
        margin-top: 20px;

        .form-item-label {
          margin-top: 10px;
        }

        .form-item-value {
          margin-top: 10px;
        }
      }

      .dropzone {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        border-width: 2px;
        border-radius: 2px;
        border-color: #eeeeee;
        border-style: dashed;
        background-color: #fafafa;
        color: #bdbdbd;
        outline: none;
        transition: border 0.24s ease-in-out;
      }

      .dropzone:focus {
        border-color: #2196f3;
      }

      .MuiTableHead-root th {
        white-space: nowrap;
      }
      .MuiDialog-paper.MuiPaper-rounded {
        @media (max-width: ${theme.breakpoints.values.md - 1}px) {
          border-radius: 0;
        }
      }
      .MuiButton-outlinedPrimary {
        fill: ${theme.palette.primary.main};
      }
      .MuiListItemIcon-root {
        svg {
          fill: currentColor;
        }
      }

      ${'' /* fix #4192 */}
      .MuiOutlinedInput-root fieldset legend {
        overflow: hidden;
      }
    `;
  }, [theme]);

  return <Global styles={styles} />;
}

export default function Root({ children }) {
  return (
    <ConfigProvider prefer="system" languages={baseLanguages} translations={translations}>
      <ToastProvider maxSnack={3}>
        <SessionProvider
          serviceHost={window.env && window.env.apiPrefix ? window.env.apiPrefix : ''}
          autoLogin={false}
          extraParams={{
            openMode: 'popup',
          }}>
          <NodeProvider>
            <GlobalStyles />
            <div className="wrapper">
              <ErrorBoundary
                FallbackComponent={ErrorFallback}
                onReset={() => {
                  window.location.reload();
                }}>
                {children}
              </ErrorBoundary>
            </div>
          </NodeProvider>
        </SessionProvider>
      </ToastProvider>
    </ConfigProvider>
  );
}
