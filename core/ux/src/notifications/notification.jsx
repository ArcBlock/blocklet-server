/* eslint-disable react/require-default-props */

import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';

import { amber, green } from '@mui/material/colors';
import { useCreation } from 'ahooks';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useSnackbar, SnackbarContent } from 'notistack';
import { useTheme, Box, IconButton } from '@mui/material';

import useWidth from '../hooks/use-width';
import variants from './default-icon-variants';
import { isIncludeActivity } from './pages/activity/utils';
import useActivityTitle from './pages/activity/use-title';
import Meta from './pages/activity/meta';

const breakpointsMap = {
  xl: '400px',
  lg: '400px',
  md: '400px',
  sm: '300px',
};

function NotificationComponent({ keyId: key, notification = {}, viewAllUrl, content = null }, ref) {
  const theme = useTheme();

  const icon = variants[notification.severity];

  const { closeSnackbar } = useSnackbar();
  const onClickDismiss = () => closeSnackbar(key);

  const navigate = useNavigate();
  const onGoNotification = () => {
    closeSnackbar(key);

    // 已确认 viewAllUrl都是本地的相对地址
    navigate(viewAllUrl);
  };

  const includeActivity = useCreation(() => {
    return isIncludeActivity(notification);
  }, [notification]);
  const activity = useCreation(() => {
    return notification?.activity;
  }, [notification]);

  const activityTitle = useActivityTitle({
    activity,
    users: [notification?.actorInfo],
    actors: [notification?.activity?.actor],
    extra: {
      linkColor: theme.palette.primary.main,
      userDid: notification?.receivers?.[0]?.did,
    },
  });
  const currentWidth = useWidth();

  return (
    <Box
      component={SnackbarContent}
      ref={ref}
      sx={[
        {
          ...theme.typography.body2,
          display: 'flex',
          backgroundColor: theme.palette.background.default,
          color: '#fff',
          alignItems: 'center',
          pl: 2.5,
          pr: 2,
          py: 0.75,
          borderRadius: '4px',
          boxShadow:
            '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
          width: breakpointsMap[currentWidth],
        },
        notification.severity === 'success' ? { backgroundColor: `${green[600]} !important` } : {},
        notification.severity === 'error' ? { backgroundColor: `${theme.palette.error.dark} !important` } : {},
        notification.severity === 'info' ? { backgroundColor: `${theme.palette.primary.main} !important` } : {},
        notification.severity === 'warning' ? { backgroundColor: `${amber[700]} !important` } : {},
      ]}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          py: 1,
          flex: 1,
        }}>
        {icon}
        <Div onClick={onGoNotification} sx={{ flex: 1 }}>
          <Box>
            {includeActivity ? (
              <>
                <span className="title">{activityTitle}</span>
                {activity.meta ? (
                  <Meta
                    meta={activity.meta}
                    type={activity.type}
                    sx={{
                      display: '-webkit-box',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      color: '#fff',
                    }}
                  />
                ) : null}
              </>
            ) : (
              <>
                <span className="title">{notification.title}</span>
                {content || <span className="desc">{notification.description}</span>}
              </>
            )}
          </Box>
        </Div>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          ml: 'auto',
          mr: -1,
          width: 44,
        }}>
        <IconButton key="close" aria-label="close" color="inherit" onClick={onClickDismiss} size="large">
          <Box component={CloseIcon} sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>
    </Box>
  );
}

export default forwardRef(NotificationComponent);

NotificationComponent.propTypes = {
  viewAllUrl: PropTypes.string.isRequired,
  keyId: PropTypes.number.isRequired,
  notification: PropTypes.object.isRequired,
  content: PropTypes.node,
};

const Div = styled.div`
  cursor: pointer;
  display: flex;
  flex-direction: column;
  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    font-weight: bold;
  }
  .desc {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    word-break: break-word;
  }
`;
