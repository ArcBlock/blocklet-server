/* eslint-disable import/no-unresolved */
/* eslint-disable react/jsx-one-expression-per-line */
import { useState, useRef, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Link } from 'react-router-dom';
import Spinner from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Popper from '@mui/material/Popper';
import NotificationIcon from '@arcblock/icons/lib/Notification';

// import NotificationList from './list';
import { styled } from '@mui/material';
import NotificationList from './pages/index';

export default function NotificationAddon({ viewAllUrl, context, blocklets }) {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationAnchorRef = useRef(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  // TODO 使用 context queryParams
  const [showRead, setShowRead] = useState(true);
  const btnRef = useRef(null);

  const { t } = useContext(LocaleContext);

  const onToggleNotification = () => {
    setNotificationOpen((prevOpen) => !prevOpen);
  };

  const onCloseNotification = (e) => {
    if (notificationAnchorRef.current && notificationAnchorRef.current.contains(e.target)) {
      return;
    }
    setNotificationOpen(false);
  };

  const onReadAllNotifications = async () => {
    setIsMarkingAll(true);
    if (context.makeAllAsRead && typeof context.makeAllAsRead === 'function') {
      await context.makeAllAsRead();
    }
    setIsMarkingAll(false);
  };

  const toViewAll = () => {
    if (btnRef.current) {
      btnRef.current.click();
    }
  };

  const switchListByRead = useCallback(
    (e) => {
      const { checked } = e.target;
      context.refresh(
        checked
          ? {
              page: 1,
            }
          : { page: 1, read: false }
      );
      setShowRead(checked);
    },
    [context]
  );

  const { unReadCount } = context;

  return (
    <div className="notification-addon">
      <IconButton
        ref={notificationAnchorRef}
        aria-controls="notify-list-grow"
        aria-haspopup="true"
        data-cy="toggle-notification-btn"
        onClick={onToggleNotification}>
        <Badge badgeContent={unReadCount} color="error" invisible={unReadCount === 0}>
          <NotificationIcon style={{ width: 'auto', height: 24 }} />
        </Badge>
      </IconButton>
      {notificationOpen && (
        <Popper
          open
          anchorEl={notificationAnchorRef.current}
          disablePortal
          placement="bottom-end"
          sx={{ zIndex: 9999 }}>
          <Paper id="notify-list-grow">
            <ClickAwayListener onClickAway={onCloseNotification}>
              <NotificationListWrapper>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}>
                  <h3>{t('notification.title')}</h3>
                  <FormControlLabel
                    control={
                      <Checkbox checked={showRead} onChange={switchListByRead} name="showRead" color="primary" />
                    }
                    label={t('notification.showRead')}
                  />
                </Box>

                <NotificationList
                  tabType="line"
                  blocklets={blocklets}
                  context={context}
                  pagination={false}
                  inDialog
                  toViewAll={toViewAll}
                />
                <Divider />
                <Typography component="div" className="notification-footer">
                  <Button
                    component={Link}
                    to={viewAllUrl}
                    data-cy="view-all-notifications-btn"
                    className="view-all"
                    ref={btnRef}
                    onClick={onCloseNotification}>
                    {t('notification.viewAll')}
                  </Button>
                  {unReadCount > 0 && (
                    <Button disabled={isMarkingAll} onClick={onReadAllNotifications} className="">
                      {isMarkingAll && <Spinner size={16} style={{ marginRight: '1em' }} />}
                      {t('notification.markAllAsRead')}
                    </Button>
                  )}
                </Typography>
              </NotificationListWrapper>
            </ClickAwayListener>
          </Paper>
        </Popper>
      )}
    </div>
  );
}

NotificationAddon.propTypes = {
  viewAllUrl: PropTypes.string.isRequired,
  context: PropTypes.object.isRequired,
  blocklets: PropTypes.array.isRequired, // blocklet 列表用于显示 头像
};

const NotificationListWrapper = styled(Box)`
  width: ${(props) => props.theme.spacing(52.5)}; // 420px -> 52.5 * 8
  h3 {
    margin: 0;
    padding: ${(props) => props.theme.spacing(2)}; // 16px
  }
  .severity-tabs {
    padding: ${(props) => `0 ${props.theme.spacing(1.5)}`}; // 12px
  }
  .notification-row {
    padding: ${(props) => `${props.theme.spacing(2)} ${props.theme.spacing(1.2)}`}; // 16px
  }
  .notification-footer {
    padding: ${(props) => `${props.theme.spacing(1)} ${props.theme.spacing(2)}`}; // 8px 16px
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: ${(props) => props.theme.typography.fontSize}px; // 14px
    .view-all {
      font-size: ${(props) => props.theme.typography.fontSize}px; // 14px
      border-radius: ${(props) => props.theme.shape.borderRadius}px; // 4px
      padding-left: 0;
      padding-right: 0;
      &:hover: {
        background: unset;
      }
    }
    button {
      font-size: ${(props) => props.theme.typography.fontSize}px; // 14px
      border-radius: ${(props) => props.theme.shape.borderRadius}px; // 4px
    }
  }
`;
