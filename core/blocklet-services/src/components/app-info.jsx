import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import Avatar from '@arcblock/ux/lib/Avatar';
import DID from '@arcblock/ux/lib/DID';
import { memo } from 'react';

function AppInfo({ blocklet = window.blocklet }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      <Avatar variant="rounded" shape="square" did={blocklet.appPid} src={blocklet.appLogo} size={80} />
      <Typography component="h2" variant="h6">
        {blocklet.appName}
      </Typography>
      <DID did={blocklet.appPid} />
    </Box>
  );
}

export default memo(AppInfo);

AppInfo.propTypes = {
  blocklet: PropTypes.shape({
    appName: PropTypes.string,
    appLogo: PropTypes.string,
    appPid: PropTypes.string,
  }),
};
