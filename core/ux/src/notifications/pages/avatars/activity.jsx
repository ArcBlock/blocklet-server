/**
 * 根据 activity 的类型渲染不同的 avatar
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Avatar } from '@mui/material';
import { Icon } from '@iconify/react';
import MessageCircle2FilledIcon from '@iconify-icons/tabler/message-circle-2-filled';
import UserFilledIcon from '@iconify-icons/tabler/user-filled';
import CoinFilledIcon from '@iconify-icons/tabler/coin-filled';
import MentionIcon from '@iconify-icons/tabler/at';
import AssignIcon from '@iconify-icons/tabler/brand-telegram';

const activityConfig = {
  comment: {
    icon: MessageCircle2FilledIcon,
    bgColor: 'rgba(239, 246, 255, 1)',
    color: 'rgba(43, 127, 255, 1)',
  },
  like: {
    icon: '👍',
    bgColor: 'rgba(244, 244, 245, 1)',
    color: 'yellow',
    renderType: 'emoji',
  },
  follow: {
    icon: UserFilledIcon,
    bgColor: 'rgba(238, 242, 255, 1)', // 绿色
    color: 'rgba(97, 95, 255, 1)',
  },
  tips: {
    icon: CoinFilledIcon,
    bgColor: 'rgba(254, 252, 232, 1)',
    color: 'rgba(240, 177, 0, 1)',
  },
  mention: {
    icon: MentionIcon,
    bgColor: 'rgba(244, 244, 245, 1)', // 紫色
    color: 'rgba(43, 127, 255, 1)',
  },
  assign: {
    icon: AssignIcon,
    bgColor: 'rgba(244, 244, 245, 1)', // 棕色
    color: 'rgba(43, 127, 255, 1)',
  },
};

ActivityAvatar.propTypes = {
  activity: PropTypes.oneOf(['comment', 'like', 'follow', 'tips', 'mention', 'assign']).isRequired,
  size: PropTypes.number,
};

export default function ActivityAvatar({ activity, size = 32 }) {
  const config = activityConfig[activity] || activityConfig.comment;

  const IconComponent = config.icon;

  return (
    <Avatar
      sx={{
        bgcolor: config.bgColor,
        color: config.color,
        width: size,
        height: size,
      }}>
      {config.renderType === 'emoji' ? (
        <span style={{ fontSize: '14px' }}>{IconComponent}</span>
      ) : (
        <Icon icon={IconComponent} />
      )}
    </Avatar>
  );
}
