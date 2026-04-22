import { Avatar } from '@mui/material';
import { joinURL } from 'ufo';
import PropTypes from 'prop-types';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

function DeveloperAvatar({ connectedStore, sx = {}, ...rest }) {
  return (
    <Avatar
      sx={{ width: 24, height: 24, ...sx }}
      src={joinURL(
        connectedStore.storeUrl,
        WELLKNOWN_SERVICE_PATH_PREFIX,
        `/user/avatar/${connectedStore.developerDid}?imageFilter=resize&w=120&h=120`
      )}
      {...rest}
    />
  );
}

DeveloperAvatar.propTypes = {
  connectedStore: PropTypes.object.isRequired,
  sx: PropTypes.object,
};

export default DeveloperAvatar;
