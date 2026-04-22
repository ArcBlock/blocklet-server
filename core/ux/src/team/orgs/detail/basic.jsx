import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Skeleton } from '@mui/material';
import Img from '@arcblock/ux/lib/Img';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

/**
 * 获取组织名称的首字符或首单词
 */
function getOrgInitial(name) {
  if (!name) return '';

  // 如果是中文字符，取第一个字
  if (/[\u4e00-\u9fa5]/.test(name.charAt(0))) {
    return name.charAt(0);
  }

  // 如果是英文，取第一个单词的首字母，最多2个字符
  const words = name.trim().split(/\s+/);
  if (words.length > 1) {
    return words
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('');
  }

  return name.charAt(0).toUpperCase();
}

/**
 * 获取 org 头像 URL
 */
function getOrgAvatarUrl(org) {
  if (!org.avatar) return null;

  const { appId } = window.blocklet || {};
  if (!appId) return null;

  return `${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/${appId}/orgs/avatar/${org.avatar}`;
}

/**
 * 组织基本信息
 */
export default function Basic({ org, loading = false }) {
  const avatarUrl = getOrgAvatarUrl(org);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 1,
          backgroundColor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
        {loading ? (
          <Skeleton variant="text" width={25} height={25} />
        ) : (
          // eslint-disable-next-line react/jsx-no-useless-fragment
          <>
            {avatarUrl ? (
              <Img
                src={avatarUrl}
                alt={org.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Typography sx={{ fontSize: 30, fontWeight: 600 }}>{getOrgInitial(org.name)}</Typography>
            )}
          </>
        )}
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Typography
          variant="h4"
          sx={{
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            textOverflow: 'ellipsis',
          }}>
          {loading ? <Skeleton variant="text" width="10%" height={24} /> : org.name || '-'}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            fontSize: 14,
            lineHeight: 1.2,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
          {loading ? <Skeleton variant="text" width="30%" height={24} /> : org.description || '-'}
        </Typography>
      </Box>
    </Box>
  );
}

Basic.propTypes = {
  org: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    avatar: PropTypes.string,
  }).isRequired,
  loading: PropTypes.bool,
};
