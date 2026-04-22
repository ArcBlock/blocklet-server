/**
 * Notifications Actions
 */
import { Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';

function NotificationActions({ notification }) {
  const notificationActions = useMemo(() => {
    const { actions, action } = notification;

    let actionList = actions ?? [];
    if (!actionList.length && action) {
      actionList = [
        {
          name: 'Visit',
          link: action,
        },
      ];
    }
    return actionList;
  }, [notification]);

  if (!notificationActions.length) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'start',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
      }}>
      {notificationActions.map((action, index) => (
        <Fragment key={action.link}>
          <Link
            key={action.link}
            href={action.link}
            target="_blank"
            className="link"
            rel="noopener noreferrer"
            sx={{ fontSize: '15px' }}
            onClick={(e) => {
              // 设置自定义标记并阻止冒泡，防止父组件重复打开链接
              e.customPreventRedirect = true;
              // 不阻止默认行为，让链接正常打开
            }}>
            {action.name}
          </Link>
          {index < notificationActions.length - 1 ? (
            <Divider orientation="vertical" sx={{ height: 12, borderWidth: '1px' }} />
          ) : null}
        </Fragment>
      ))}
    </Box>
  );
}

NotificationActions.propTypes = {
  notification: PropTypes.object.isRequired,
};

export default NotificationActions;
