/* eslint-disable react/no-unstable-nested-components */
import PropTypes from 'prop-types';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import DeleteIcon from '@mui/icons-material/Delete';
import LaunchIcon from '@mui/icons-material/Launch';
import IconButton from '@mui/material/IconButton';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import Box from '@mui/material/Box';

import { useBlockletContext } from '../../contexts/blocklet';
import DeleteRule from './action/delete-rule';
import UpdateRule from './action/update-rule';
import { getBlockletUrlParams, getAccessUrl } from '../../util';

// eslint-disable-next-line react/prop-types
export default function RuleActions({ from, isProtected = false, ...rest }) {
  const { locale } = useLocaleContext();
  const { blocklet, recommendedDomain: domain } = useBlockletContext();

  // eslint-disable-next-line react/prop-types
  const href = getAccessUrl(domain, from.pathPrefix, getBlockletUrlParams(blocklet, locale));

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}>
      <Box
        component="a"
        sx={{ display: { xs: 'flex', md: 'none' } }}
        target="_blank"
        href={href}
        rel="noopener noreferrer"
        title={href}>
        <IconButton size="small">
          <LaunchIcon />
        </IconButton>
      </Box>
      <UpdateRule {...rest} isProtected={isProtected} from={from}>
        {({ open: o }) => (
          <IconButton size="small" onClick={o} disabled={isProtected} data-cy="action-update-rule">
            <SettingsOutlinedIcon />
          </IconButton>
        )}
      </UpdateRule>
      <DeleteRule {...rest} isProtected={isProtected} from={from}>
        {({ open }) => (
          <IconButton size="small" onClick={open} disabled={isProtected} data-cy="action-delete-rule">
            <DeleteIcon />
          </IconButton>
        )}
      </DeleteRule>
    </Box>
  );
}

RuleActions.propTypes = {
  isProtected: PropTypes.bool,
};
