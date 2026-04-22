/* eslint-disable react/require-default-props */
import { useContext } from 'react';
import { isEmpty } from 'lodash';
import { useCreation, useMemoizedFn } from 'ahooks';
import PropTypes from 'prop-types';
import { Box, Typography, Button, useTheme, Link } from '@mui/material';
import { joinURL } from 'ufo';
import { LocaleContext, useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Icon } from '@iconify/react';
import ArrowUpRightFilledIcon from '@iconify-icons/tabler/arrow-up-right';
import useActivityTitle from './use-title';
import RelativeTime from '../../../relative-time';
import Meta from './meta';
import ActorAvatar from '../avatars/actor';
import { getActivityLink, isUserActor, isValidUrl } from './utils';

const MAX_DISPLAY_ITEMS = 3;

Activity.propTypes = {
  notification: PropTypes.object.isRequired,
  isMultiple: PropTypes.bool,
  blocklet: PropTypes.object,
  mountPoint: PropTypes.string,
  avatarFallback: PropTypes.node,
};

SingleActivity.propTypes = {
  notification: PropTypes.object.isRequired,
  mountPoint: PropTypes.string,
};

MultipleActivity.propTypes = {
  items: PropTypes.array.isRequired, // notification 的集合
  activity: PropTypes.object.isRequired, // notification 的 activity
  blocklet: PropTypes.object,
  mountPoint: PropTypes.string,
  viewMoreLink: PropTypes.string,
  avatarFallback: PropTypes.node,
};

export function SingleActivity({ notification, mountPoint = '' }) {
  const { activity } = notification;
  const { type, meta = {} } = activity || {};

  const activityTitle = useActivityTitle({
    activity,
    users: [notification?.actorInfo],
    actors: [notification?.activity?.actor],
    mountPoint,
  });

  if (isEmpty(activity) || !activity.type || !activity.actor || isEmpty(activity.target)) {
    return null;
  }

  return (
    <Box>
      <Typography
        variant="body1"
        sx={{
          color: 'text.secondary',
          mb: 0.5,
          wordBreak: 'break-all',
        }}>
        {activityTitle}
      </Typography>
      {meta ? <Meta meta={meta} type={type} /> : null}
    </Box>
  );
}

export function MultipleActivity({
  items,
  activity,
  blocklet,
  mountPoint = '',
  viewMoreLink = '',
  avatarFallback = null,
}) {
  const theme = useTheme();
  const { t } = useLocaleContext();

  const componentDid = useCreation(() => {
    return blocklet?.did || blocklet?.meta?.did || '';
  }, [blocklet]);

  const { locale } = useContext(LocaleContext);

  const includeMeta = useCreation(() => {
    return (
      !isEmpty(activity.meta) && Object.values(activity.meta).some((value) => value !== null && value !== undefined)
    );
  }, [activity]);

  const activityTitle = useActivityTitle({
    activity,
    users: items.map((item) => item?.actorInfo),
    actors: items.map((item) => item?.activity?.actor),
    mountPoint,
  });

  const metaLink = useMemoizedFn((item) => {
    if (!item.activity) {
      return null;
    }
    const link = getActivityLink(item.activity);
    if (link?.metaLink) {
      return isValidUrl(link?.metaLink) ? link?.metaLink : joinURL(mountPoint, link.metaLink);
    }
    return null;
  });

  const onClickMetaItem = useMemoizedFn((e, item) => {
    // e.stopPropagation();
    if (!item) {
      return;
    }
    const link = metaLink(item);
    if (link) {
      window.open(link, '_blank');
      e.customPreventRedirect = true;
    }
  });

  // 显示的条目数和是否需要显示"查看更多"
  const showViewMore = items.length > MAX_DISPLAY_ITEMS;
  const displayItems = items.slice(0, MAX_DISPLAY_ITEMS); // 始终最多显示3个

  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        variant="body1"
        sx={{
          color: 'text.secondary',
          mb: 3,
        }}>
        {activityTitle}
      </Typography>
      {includeMeta ? (
        <Box
          className="sub-content"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}>
          {displayItems.map((item) => (
            <Box
              key={item.id}
              onClick={(e) => onClickMetaItem(e, item)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}>
                {isUserActor(item) ? (
                  <ActorAvatar actors={item.actorInfo} size={32} teamDid={componentDid} />
                ) : (
                  avatarFallback
                )}
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: 'text.primary',
                  }}>
                  {isUserActor(item) ? item?.actorInfo?.fullName : 'System'}
                </Typography>{' '}
                ·
                <RelativeTime
                  value={item.createdAt}
                  locale={locale}
                  shouldUpdate
                  style={{
                    color: theme.palette.text.secondary,
                    fontSize: '0.875rem',
                    minWidth: '50px',
                    whiteSpace: 'nowrap',
                  }}
                />
              </Box>
              {item.activity.meta ? (
                <Box
                  sx={{
                    pl: 5,
                  }}>
                  <Meta meta={item.activity.meta} type={item.activity.type} />
                </Box>
              ) : null}
            </Box>
          ))}
          {showViewMore && viewMoreLink ? (
            <Box
              sx={{
                mt: 1,
                display: 'flex',
                justifyContent: 'center',
              }}>
              <Button
                size="large"
                variant="text"
                component={Link}
                href={viewMoreLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.customPreventRedirect = true;
                }}>
                {t('notification.viewMore')} <Icon icon={ArrowUpRightFilledIcon} style={{ marginLeft: 4 }} />
              </Button>
            </Box>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}

export default function Activity({ notification, isMultiple = false, blocklet, mountPoint = '', avatarFallback }) {
  const viewMoreLink = useCreation(() => {
    if (!notification.activity) {
      return null;
    }
    const link = getActivityLink(notification.activity);
    if (link?.targetLink) {
      return isValidUrl(link?.targetLink) ? link?.targetLink : joinURL(mountPoint, link.targetLink);
    }
    return null;
  }, [notification.activity, mountPoint]);

  if (isMultiple) {
    return (
      <MultipleActivity
        items={notification.items}
        activity={notification.activity}
        blocklet={blocklet}
        mountPoint={mountPoint}
        viewMoreLink={viewMoreLink}
        avatarFallback={avatarFallback}
      />
    );
  }

  return <SingleActivity notification={notification} mountPoint={mountPoint} />;
}
