import { Avatar } from '@mui/material';
import { joinURL } from 'ufo';
import PropTypes from 'prop-types';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

function DeveloperAvatar({ developerUrl, developerDid, sx = {}, ...rest }) {
  return (
    <Avatar
      sx={{ width: 24, height: 24, ...sx }}
      src={joinURL(
        new URL(developerUrl).origin,
        WELLKNOWN_SERVICE_PATH_PREFIX,
        `/user/avatar/${developerDid}?imageFilter=resize&w=120&h=120`
      )}
      {...rest}
    />
  );
}

DeveloperAvatar.propTypes = {
  developerDid: PropTypes.string.isRequired,
  developerUrl: PropTypes.string.isRequired,
  sx: PropTypes.object,
};

export default DeveloperAvatar;
