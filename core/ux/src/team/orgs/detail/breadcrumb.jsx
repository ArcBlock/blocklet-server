/* eslint-disable react/require-default-props */

/**
 * 详情页面面包屑
 */

import PropTypes from 'prop-types';
import { Breadcrumbs, Link, Typography, Box, Skeleton } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

export default function Breadcrumb({ org = {}, loading = false }) {
  const { t, locale } = useLocaleContext();
  if (!org.id) {
    return null;
  }
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Skeleton variant="text" width={50} height={24} />
        <Skeleton variant="text" width={20} height={24} />
      </Box>
    );
  }
  return (
    <Breadcrumbs aria-label="breadcrumb">
      <Link underline="hover" color="inherit" href={`${WELLKNOWN_SERVICE_PATH_PREFIX}/user/orgs?locale=${locale}`}>
        {t('common.orgs')}
      </Link>
      <Typography>{org.name}</Typography>
    </Breadcrumbs>
  );
}

Breadcrumb.propTypes = {
  org: PropTypes.object.isRequired,
  loading: PropTypes.bool,
};
