import PropTypes from 'prop-types';
import Header from '@blocklet/ui-react/lib/Header';
import Footer from '@blocklet/ui-react/lib/Footer';
import Dashboard from '@blocklet/ui-react/lib/Dashboard';
import LinkBlocker from '@blocklet/ui-react/lib/common/link-blocker';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import styled from '@emotion/styled';
import { BLOCKLET_CONFIGURABLE_KEY } from '@blocklet/constant';
import { LocaleProvider, useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { useBlockletContext } from '../../../contexts/blocklet';
import useBlockletLogo from '../../../hooks/use-blocklet-logo';
import useAppLanguages from '../../../hooks/use-app-languages';
import { translations } from '../../../locales';

function NavigationPreview({ className = '', navigation = [] }) {
  const { blocklet } = useBlockletContext();
  const { locale } = useLocaleContext();
  const { languages } = useAppLanguages();
  const logoUrl = useBlockletLogo({ blocklet, square: true });

  const owner = blocklet?.environments?.find(
    (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_COPYRIGHT_OWNER
  )?.value;
  const year = blocklet?.environments?.find(
    (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_COPYRIGHT_YEAR
  )?.value;
  const copyright =
    owner || year
      ? {
          owner,
          year,
        }
      : undefined;

  const blockletInfo = {
    appId: blocklet.appDid,
    appLogo: logoUrl,
    appName: blocklet.meta.title,
    enableConnect: true,
    enableLocale: false,
    navigation,
    copyright,
  };

  return (
    <LocaleProvider translations={translations} locale={locale} languages={languages}>
      <LinkBlocker>
        <Box className={className}>
          <Header
            meta={blockletInfo}
            showDomainWarningDialog={false}
            sx={{ '.header-container': { maxWidth: 'none' } }}
          />
          <Box>
            <Dashboard
              meta={blockletInfo}
              invalidPathFallback={() => {}}
              headerProps={{
                style: {
                  display: 'none',
                },
              }}
              hideHtmlTitle
              showDomainWarningDialog={false}>
              <Grid container spacing={2}>
                {new Array(6).fill().map((item, index) => {
                  return (
                    // eslint-disable-next-line react/no-array-index-key
                    <Grid key={index} size={4}>
                      <Skeleton animation={false} variant="rectangular" width="100%" height={120} />
                      <Box sx={{ pt: 0.5 }}>
                        <Skeleton animation={false} />
                        <Skeleton width="60%" animation={false} />
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Dashboard>
          </Box>
          <Footer meta={blockletInfo} sx={{ '.MuiContainer-root': { maxWidth: 'none' } }} />
        </Box>
      </LinkBlocker>
    </LocaleProvider>
  );
}

NavigationPreview.propTypes = {
  className: PropTypes.string,
  navigation: PropTypes.array,
};

const StyledNavigationPreview = styled(NavigationPreview)`
  .dashboard {
    height: auto !important;
  }
  .dashboard-content + div {
    display: none;
  }
`;

export default StyledNavigationPreview;
