/**
 * 显示 members 头像组，最多显示5个，超过5个显示加号
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Box, Avatar } from '@mui/material';
import UserCard from '@arcblock/ux/lib/UserCard';
import { CardType } from '@arcblock/ux/lib/UserCard/types';

export default function MembersAvatarGroup({ members, total }) {
  return (
    <Box
      className="members-avatar-group"
      sx={{
        display: 'flex',
        alignItems: 'center',
        '& > *:not(:first-of-type)': {
          ml: -1, // 重叠效果
        },
      }}>
      {members.map((member, index) => (
        <Box
          key={member.userDid}
          sx={{
            position: 'relative',
            zIndex: index, // 从左到右 z-index 递增
          }}>
          <UserCard did={member.userDid} avatarSize={32} cardType={CardType.AvatarOnly} showHoverCard={false} />
        </Box>
      ))}

      {total > 5 && <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey', fontSize: 14 }}>+{total - 5}</Avatar>}
    </Box>
  );
}

MembersAvatarGroup.propTypes = {
  members: PropTypes.array.isRequired,
  total: PropTypes.number.isRequired,
};
