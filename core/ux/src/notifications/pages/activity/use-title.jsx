import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { useCreation, useMemoizedFn } from 'ahooks';
import Link from '@mui/material/Link';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { joinURL, withQuery } from 'ufo';
import isEmpty from 'lodash/isEmpty';
import { getActivityLink, isValidUrl } from './utils';
import { useSessionContext } from '../../../contexts/session';

/**
 * Activity types enum for type safety
 * @readonly
 * @enum {string}
 */
const ACTIVITY_TYPES = {
  COMMENT: 'comment',
  LIKE: 'like',
  FOLLOW: 'follow',
  TIPS: 'tips',
  MENTION: 'mention',
  ASSIGN: 'assign',
  UN_ASSIGN: 'un_assign',
};

/**
 * Activity descriptions mapping
 * @type {Object.<string, React.ReactNode>}
 */
const ACTIVITY_DESCRIPTIONS = {
  [ACTIVITY_TYPES.COMMENT]: (targetType, count, isAuthor) =>
    count > 1 ? (
      <>
        have left {count} comments on {isAuthor ? 'your' : 'the'} {targetType}:
      </>
    ) : (
      <>
        has commented on {isAuthor ? 'your' : 'the'} {targetType}:
      </>
    ),
  [ACTIVITY_TYPES.LIKE]: (targetType, count, isAuthor) =>
    count > 1 ? (
      <>
        have liked {isAuthor ? 'your' : 'the'} {targetType}:
      </>
    ) : (
      <>
        have liked {isAuthor ? 'your' : 'the'} {targetType}:
      </>
    ),
  [ACTIVITY_TYPES.FOLLOW]: (targetType, count) => (count > 1 ? <>have followed you</> : <>has followed you</>),
  [ACTIVITY_TYPES.TIPS]: (targetType, count, isAuthor) =>
    count > 1 ? (
      <>
        left tips for {isAuthor ? 'your' : 'the'} {targetType}:
      </>
    ) : (
      <>
        left a tip for {isAuthor ? 'your' : 'the'} {targetType}:
      </>
    ),
  [ACTIVITY_TYPES.MENTION]: (targetType, count, isAuthor) =>
    count > 1 ? (
      <>
        have mentioned you in {isAuthor ? 'your' : 'the'} {targetType}:
      </>
    ) : (
      <>
        mentioned you in {isAuthor ? 'your' : 'the'} {targetType}:
      </>
    ),
  // FIXME: liuShuang  如果不是 target 的作者，只用做通知相关用户
  [ACTIVITY_TYPES.ASSIGN]: () => <>has assigned you a task: </>,
  [ACTIVITY_TYPES.UN_ASSIGN]: () => <>has revoked your task assignment: </>,
};

/**
 * UserLink component for rendering a user's name as a profile link
 * Memoized to prevent unnecessary re-renders
 */
const UserLink = memo(function UserLink({ user, color = 'text.secondary' }) {
  const profileLink = withQuery(joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, 'user'), { did: user.did });

  return (
    <Link
      href={profileLink}
      color={color}
      target="_blank"
      onClick={(e) => {
        e.customPreventRedirect = true;
      }}
      sx={{
        fontWeight: 600,
        textDecoration: 'none',
      }}>
      {user.fullName || 'System'}
    </Link>
  );
});

UserLink.propTypes = {
  user: PropTypes.shape({
    did: PropTypes.string.isRequired,
    fullName: PropTypes.string.isRequired,
  }).isRequired,
  // eslint-disable-next-line react/require-default-props
  color: PropTypes.string,
};

UserLink.displayName = 'UserLink';

/**
 * A hook that returns a formatted activity title with linked usernames
 * @param {Object} params - The parameters object
 * @param {keyof typeof ACTIVITY_TYPES} params.type - The activity type
 * @param {Object} params.target - The target object
 * @param {Array<{did: string, fullName: string}>} params.users - Array of user objects
 * @param {Object} params.extra - Extra parameters
 * @returns {React.ReactNode} Formatted title with linked usernames
 */
export default function useActivityTitle({ activity, users, actors, extra = {}, mountPoint = '' }) {
  const { session } = useSessionContext() || {}; // server 端没有 session
  const { type, target } = activity || {};
  const { type: targetType, author } = target || {};
  const { linkColor = 'text.secondary' } = extra || {};

  const isAuthor = useCreation(() => {
    // 兼容旧数据，旧数据中没有 author 字段, 认为是 target 作者
    if (!author) return true;
    const userDid = session?.user?.did || extra?.userDid;
    return userDid === author;
  }, [session, author]);

  // Create a map of users by their DID for efficient lookup
  const usersMap = useCreation(() => {
    if (!Array.isArray(users)) return new Map();
    const map = new Map();
    users.forEach((user) => {
      if (user?.did && !map.has(user.did)) {
        map.set(user.did, user);
      }
    });
    return map;
  }, [users]);

  // Get unique users from actors, using the map and providing fallback for missing users
  const uniqueUsers = useCreation(() => {
    if (!Array.isArray(actors)) return [];
    const uniqueActors = [...new Set(actors)];
    return uniqueActors.map((actorId) => {
      if (!actorId) return null;
      // If user exists in map, return the user object, otherwise create a basic object with DID
      return usersMap.get(actorId) || { did: actorId, fullName: 'System' };
    });
  }, [actors, usersMap]);

  // Memoized function to format user names with links
  const formatLinkedUserNames = useMemoizedFn(() => {
    if (!Array.isArray(uniqueUsers) || uniqueUsers.length === 0) {
      return null;
    }

    // Early return for single user case
    if (uniqueUsers.length === 1) {
      return <UserLink user={uniqueUsers[0]} color={linkColor} />;
    }

    // Get all users except the last one for multi-user cases
    const initialUsers = uniqueUsers.slice(0, -1);
    const lastUser = uniqueUsers[uniqueUsers.length - 1];

    // Early return for two users case
    if (uniqueUsers.length === 2) {
      return (
        <>
          <UserLink user={initialUsers[0]} color={linkColor} />
          {' and '}
          <UserLink user={lastUser} color={linkColor} />
        </>
      );
    }

    // Handle three or more users
    const isMoreThanThree = uniqueUsers.length > 3;
    const displayUsers = isMoreThanThree ? uniqueUsers.slice(0, 2) : initialUsers;

    return (
      <>
        {displayUsers.map((user, index) => (
          <React.Fragment key={user.did}>
            <UserLink user={user} color={linkColor} />
            {index < displayUsers.length - 1 ? ', ' : ''}
          </React.Fragment>
        ))}
        {isMoreThanThree ? (
          `, and ${uniqueUsers.length - 2} others`
        ) : (
          <>
            , and <UserLink user={lastUser} color={linkColor} />
          </>
        )}
      </>
    );
  });

  // Memoized function to get activity description
  const getActivityDescription = useMemoizedFn(() => {
    const descriptionFn = ACTIVITY_DESCRIPTIONS[type];
    const targetName = targetType === 'doc' ? 'document' : targetType;
    return descriptionFn ? descriptionFn(targetName, users.length, isAuthor) : null;
  });

  // Create the final title using memoization
  const title = useCreation(() => {
    const linkedNames = formatLinkedUserNames();
    const description = getActivityDescription();

    if (!linkedNames || !description) {
      return null;
    }

    return (
      <>
        {linkedNames} {description}
      </>
    );
  }, [type, targetType, uniqueUsers, formatLinkedUserNames, getActivityDescription]);

  const targetLink = useCreation(() => {
    if (!activity) return null;
    const link = getActivityLink(activity);
    if (link?.targetLink) {
      return isValidUrl(link?.targetLink) ? link?.targetLink : joinURL(mountPoint, link.targetLink);
    }
    return null;
  }, [activity, mountPoint]);

  if (!type || isEmpty(target)) {
    return null;
  }

  return (
    <>
      {title}{' '}
      <Link
        href={targetLink}
        color="primary"
        target="_blank"
        sx={{ textDecoration: 'none' }}
        onClick={(e) => {
          e.customPreventRedirect = true;
        }}>
        {target.name || target.desc}
      </Link>
    </>
  );
}
