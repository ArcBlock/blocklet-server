/**
 * 用于显示单个或多个用户头像的组件
 */
import React from 'react';
import PropTypes from 'prop-types';
import { useCreation } from 'ahooks';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import AvatarGroup from '@mui/material/AvatarGroup';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import UserCard from '@arcblock/ux/lib/UserCard';
import { CardType, InfoType } from '@arcblock/ux/lib/UserCard/types';
import { joinURL, withQuery } from 'ufo';
import uniqBy from 'lodash/uniqBy';
import { parseAvatar } from '../../../team/members/util';

// 定义用户对象的形状
const actorShape = {
  avatar: PropTypes.string,
  fullName: PropTypes.string,
  did: PropTypes.string,
};

// 单个头像组件
function SingleAvatar({ actor, size, teamDid = '', inService = false, showName = false }) {
  const user = useCreation(() => {
    return {
      ...actor,
      avatar: actor?.avatar ? parseAvatar(actor.avatar, teamDid, inService) : null,
    };
  }, [actor, teamDid, inService]);

  const handleClick = (e) => {
    if (!actor) {
      return;
    }
    e.stopPropagation();
    window.open(withQuery(joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, 'user'), { did: actor.did }), '_blank');
    e.customPreventRedirect = true;
  };

  return (
    <Box
      onClick={handleClick}
      role="button"
      style={{ cursor: 'pointer' }}
      title={actor?.fullName || ''}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}>
      {user.avatar ? (
        <UserCard
          user={user}
          showDid
          cardType={CardType.AvatarOnly}
          infoType={InfoType.Minimal}
          avatarSize={size}
          shape="circle"
          sx={{
            width: size,
            height: size,
            borderRadius: '100%',
            overflow: 'hidden',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.1)',
            },
          }}
        />
      ) : (
        <Avatar
          sx={{
            width: size,
            height: size,
          }}
        />
      )}
      {showName && <span>{actor?.fullName}</span>}
    </Box>
  );
}

SingleAvatar.propTypes = {
  actor: PropTypes.shape(actorShape).isRequired,
  size: PropTypes.number.isRequired,
  teamDid: PropTypes.string,
  inService: PropTypes.bool,
  showName: PropTypes.bool,
};

ActorAvatar.propTypes = {
  actors: PropTypes.oneOfType([PropTypes.shape(actorShape), PropTypes.arrayOf(PropTypes.shape(actorShape))]).isRequired,
  size: PropTypes.number,
  maxDisplay: PropTypes.number,
  teamDid: PropTypes.string,
  inService: PropTypes.bool,
  showName: PropTypes.bool,
  avatarFallback: PropTypes.node,
};

export default function ActorAvatar({
  actors,
  size = 32,
  maxDisplay = 9,
  teamDid = '',
  inService = true,
  showName = false,
  avatarFallback = null,
}) {
  // 如果actors是单个对象而不是数组，将其转换为数组
  const actorsArray = useCreation(() => {
    const actorsList = Array.isArray(actors) ? actors : [actors];

    return uniqBy(actorsList, 'did').filter(Boolean);
  }, [actors]);

  // 如果只有一个用户，直接显示Avatar
  // 单个不需要 fallback, 在使用时就应该处理
  if (actorsArray.length === 1 || !actorsArray.length) {
    return (
      <SingleAvatar actor={actorsArray[0]} size={size} teamDid={teamDid} inService={inService} showName={showName} />
    );
  }

  // 如果有多个用户，使用AvatarGroup
  return (
    <AvatarGroup
      total={actorsArray.length}
      renderSurplus={(surplus) => {
        if (surplus < 100) {
          return <span>+{surplus}</span>;
        }
        return <span>99+</span>;
      }}
      max={maxDisplay}
      sx={{
        justifyContent: 'flex-end',
        height: `${size}px`,
        '.MuiAvatar-root': {
          width: `${size}px`,
          height: `${size}px`,
          fontSize: `${size / 2.5}px`,
          border: 0,
          zIndex: 2,
        },
      }}>
      {actorsArray.map((actor, index) =>
        actor?.avatar ? (
          <SingleAvatar key={actor?.did || index} actor={actor} size={size} teamDid={teamDid} inService={inService} />
        ) : (
          avatarFallback
        )
      )}
    </AvatarGroup>
  );
}
