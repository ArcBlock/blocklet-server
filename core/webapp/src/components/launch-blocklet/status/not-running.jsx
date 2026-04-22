import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useTheme, useMediaQuery } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import WarningIcon from '@mui/icons-material/Warning';
import Button from '../button';

export default function NotRunning({ did }) {
  const { t } = useLocaleContext();
  const theme = useTheme();
  const isBreakpointsDownSm = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      <div className="body">
        <WarningIcon className="status_icon" />
        <div className="status_title">{t('launchBlocklet.error.installedButStopped')}</div>
      </div>
      <div className="footer">
        <Button
          style={{ width: '300px' }}
          className="footer-item"
          component={Link}
          to={`/blocklets/${did}/overview`}
          fullWidth={isBreakpointsDownSm}
          color="primary"
          variant="contained">
          {t('launchBlocklet.viewApplication')}
        </Button>
      </div>
    </>
  );
}

NotRunning.propTypes = {
  did: PropTypes.string.isRequired,
};
