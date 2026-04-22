import React, { useContext } from 'react'; // eslint-disable-line
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { useLocation } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import BaseLayout from '@arcblock/ux/lib/Layout/dashboard';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { ErrorFallback } from '@arcblock/ux/lib/ErrorBoundary';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import DashboardIcon from '@mui/icons-material/ConstructionOutlined';
import PreferencesIcon from '@mui/icons-material/TuneOutlined';
import BrandingIcon from '@mui/icons-material/PaletteOutlined';
import LocalizationIcon from '@mui/icons-material/TranslateOutlined';

// eslint-disable-next-line import/no-unresolved
import Logo from '../../assets/studio.svg?react';

export default function StudioLayout({ children, title = 'Studio', ...rest }) {
  const { t } = useLocaleContext();
  const location = useLocation();

  const links = [
    {
      url: `${WELLKNOWN_SERVICE_PATH_PREFIX}/studio/home`,
      name: 'home',
      title: t('studio.home'),
      icon: <DashboardIcon />,
    },
    {
      url: `${WELLKNOWN_SERVICE_PATH_PREFIX}/studio/preferences`,
      name: 'preferences',
      title: t('studio.preferences'),
      icon: <PreferencesIcon />,
    },
    {
      url: `${WELLKNOWN_SERVICE_PATH_PREFIX}/studio/branding`,
      name: 'branding',
      title: t('studio.branding'),
      icon: <BrandingIcon />,
    },
    {
      url: `${WELLKNOWN_SERVICE_PATH_PREFIX}/studio/localization`,
      name: 'localization',
      title: t('studio.localization'),
      icon: <LocalizationIcon />,
    },
  ];

  return (
    <StyledLayout
      links={links}
      headerProps={{
        logo: <Logo width="118" height="48" />,
      }}
      title={title}
      legacy={false}
      fullWidth
      {...rest}>
      <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[location.pathname]}>
        {children}
      </ErrorBoundary>
    </StyledLayout>
  );
}

StudioLayout.propTypes = {
  children: PropTypes.any.isRequired,
  title: PropTypes.string,
};

const StyledLayout = styled(BaseLayout)`
  .header-brand-wrapper .header-logo {
    height: 48px !important;
    width: 134px !important;
  }
`;
