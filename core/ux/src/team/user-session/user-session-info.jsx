import { Box, Chip, Tooltip, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import Avatar from '@arcblock/ux/lib/Avatar';
import { useCreation } from 'ahooks';

function UserSessionInfo({ user, sessionUser }) {
  const currentRole = useCreation(() => {
    return (user?.passports || [])?.find((item) => item.name === sessionUser.role);
  }, [user?.passports, sessionUser?.role]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}>
      <Avatar
        size={40}
        variant="circle"
        shape="circle"
        src={sessionUser.avatar}
        did={sessionUser.did}
        sx={{ flexShrink: 0 }}
      />
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}>
          <Tooltip title={sessionUser.fullName}>
            <Typography
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
              }}>
              {sessionUser.fullName}
            </Typography>
          </Tooltip>
          <Chip
            label={currentRole?.title || currentRole?.name || 'Guest'}
            size="small"
            variant="outlined"
            sx={{
              flexShrink: 0,
              fontWeight: 'bold',
              fontSize: '12px',
              color: 'text.primary',
              borderColor: 'grey.300',
              backgroundColor: 'transparent',
              textTransform: 'capitalize',
              pr: 0.5,
              pl: 0,
              height: 'auto',
            }}
          />
        </Box>
        <Tooltip title={sessionUser.email}>
          <Typography
            variant="body2"
            color="grey"
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
            {sessionUser.email}
          </Typography>
        </Tooltip>
      </Box>
    </Box>
  );
}

UserSessionInfo.propTypes = {
  user: PropTypes.object.isRequired,
  sessionUser: PropTypes.shape({
    role: PropTypes.string,
    avatar: PropTypes.string,
    did: PropTypes.string,
    fullName: PropTypes.string,
    email: PropTypes.string,
  }).isRequired,
};

export default UserSessionInfo;
