import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Button, Tooltip, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import semver from 'semver';

const isSatisfiedVersion = (serverVersion, requirementVersion) => {
  if (!requirementVersion || !serverVersion) return true;
  const isServerVersionSatisfied = semver.satisfies(semver.coerce(serverVersion), requirementVersion);
  return isServerVersionSatisfied;
};

export default function CheckVersionButton({ children, serverVersion = '', requirementVersion = '', ...props }) {
  const { t } = useLocaleContext();
  const isSatisfied = isSatisfiedVersion(serverVersion, requirementVersion);
  if (isSatisfied) {
    return children;
  }
  return (
    <Tooltip title={t('store.tooltip.upgradeServer', { serverVersion, version: requirementVersion })} arrow>
      <Typography>
        <Button disabled variant="outlined" {...props}>
          {t('common.upgradeServer')}
        </Button>
      </Typography>
    </Tooltip>
  );
}

CheckVersionButton.propTypes = {
  children: PropTypes.node.isRequired,
  serverVersion: PropTypes.string,
  requirementVersion: PropTypes.string,
};
