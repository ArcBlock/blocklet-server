import Box from '@mui/material/Box';
import { styled } from '@mui/material';
import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';
import UserCard from '@arcblock/ux/lib/UserCard';
import { CardType, InfoType } from '@arcblock/ux/lib/UserCard/types';
import Chip from '@mui/material/Chip';
import AppleIcon from '@mui/icons-material/Apple';
import LaptopIcon from '@mui/icons-material/Laptop';
import WebIcon from '@mui/icons-material/Web';
import AndroidIcon from '@mui/icons-material/Android';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import TabletIcon from '@mui/icons-material/Tablet';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { UAParser } from 'ua-parser-js';
import semver from 'semver';
import React from 'react';
import { useCreation } from 'ahooks';
import DidAddress from '../../../did-address';
import InfoCard from './base-info';
import { parseAvatar } from '../../members/util';
import { useTeamContext } from '../../../contexts/team';

function parseUserAgent(uaString) {
  try {
    if (!uaString.trim()) {
      return {
        device: { icon: <DesktopWindowsIcon fontSize="small" />, text: 'Unknown Device' },
        os: { icon: null, text: 'Unknown OS' },
        browser: { icon: <WebIcon fontSize="small" />, text: 'Unknown Browser' },
      };
    }

    const parser = new UAParser(uaString);
    const result = parser.getResult();

    let walletVersion = '';
    const match = uaString.split(/\s+/).find((x) => x.startsWith('arcwallet'));
    if (match) {
      const tmp = match.split('/');
      if (tmp.length > 1 && semver.coerce(tmp[1])) {
        walletVersion = semver.coerce(tmp[1]).version;
      }
    }

    const device = (() => {
      const { type = '', model = '' } = result.device;
      if (type === 'mobile') {
        return { icon: <PhoneIphoneIcon fontSize="small" />, text: model || 'Mobile Device' };
      }
      if (type === 'tablet') {
        return { icon: <TabletIcon fontSize="small" />, text: model || 'Tablet' };
      }
      return { icon: <LaptopIcon fontSize="small" />, text: model || 'Desktop' };
    })();

    const os = (() => {
      const { name = '', version = '' } = result.os;
      if (name.toLowerCase().includes('mac')) {
        return { icon: <AppleIcon fontSize="small" />, text: `${name} ${version}` };
      }
      if (name.toLowerCase().includes('ios')) {
        return { icon: <AppleIcon fontSize="small" />, text: `${name} ${version}` };
      }
      if (name.toLowerCase().includes('android')) {
        return { icon: <AndroidIcon fontSize="small" />, text: `${name} ${version}` };
      }
      if (name.toLowerCase().includes('windows')) {
        return { icon: <DesktopWindowsIcon fontSize="small" />, text: `${name} ${version}` };
      }
      return { icon: null, text: name ? `${name} ${version}` : 'Unknown OS' };
    })();

    const browser = (() => {
      const { name = '', version = '' } = result.browser;
      return {
        icon: <WebIcon fontSize="small" />,
        text: name ? `${name} ${version}` : 'Unknown Browser',
      };
    })();

    return {
      device,
      os,
      browser,
      ...(walletVersion
        ? {
            walletVersion: {
              icon: null,
              text: walletVersion,
            },
          }
        : {}),
    };
  } catch (error) {
    console.error('Error parsing user agent:', error);
    return {
      device: { icon: <DesktopWindowsIcon fontSize="small" />, text: 'Unknown Device' },
      os: { icon: null, text: 'Unknown OS' },
      browser: { icon: <WebIcon fontSize="small" />, text: 'Unknown Browser' },
    };
  }
}

function UserAgentInfo({ ua }) {
  const info = parseUserAgent(ua);

  return (
    <Stack spacing={1}>
      {Object.entries(info).map(([key, { icon, text }]) => (
        <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</Box>
          <Typography variant="body2" sx={{ display: 'flex' }}>
            {text}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

UserAgentInfo.propTypes = {
  ua: PropTypes.string.isRequired,
};

export const useSystemRoles = () => {
  const { t } = useLocaleContext();

  const SYSTEM_ROLES = {
    $all: t('common.all'),
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
    guest: 'Guest',
  };

  const formatRoleName = (role) => {
    const key = (role || '').toLowerCase();
    if (key.startsWith('$')) {
      return SYSTEM_ROLES[key] || key.slice(1);
    }

    return SYSTEM_ROLES[key] || key;
  };

  return { SYSTEM_ROLES, formatRoleName };
};

const getRoleColor = (role, selected = false) => {
  const opacity = selected ? 1 : 0.6;
  switch (role) {
    case 'owner':
      return `rgba(232, 222, 255, ${opacity})`;
    case 'admin':
      return `rgba(227, 242, 253, ${opacity})`;
    case 'member':
      return `rgba(232, 245, 233, ${opacity})`;
    case 'guest':
      return `rgba(245, 245, 245, ${opacity})`;
    default:
      return `rgba(245, 245, 245, ${opacity})`;
  }
};

const RoleChip = styled(Chip)(({ role }) => ({
  backgroundColor: getRoleColor(role.toLowerCase()),
  color: '#000000',
}));

const getStatusColor = (status) => {
  switch (status) {
    case 'valid':
      return (theme) => theme.palette.success.light;
    case 'expired':
      return (theme) => theme.palette.text.disabled;
    case 'revoked':
      return (theme) => theme.palette.error.light;
    default:
      return (theme) => theme.palette.warning.light;
  }
};

const StatusChip = styled(Chip)(({ theme, status }) => ({
  backgroundColor: getStatusColor(status)(theme),
  color: '#FFFFFF',
}));

function RenderDid({ did }) {
  return <DidAddress size={14} responsive={false} compact copyable={false} did={did} />;
}

RenderDid.propTypes = {
  did: PropTypes.string.isRequired,
};

function RenderTime({ timestamp, locale }) {
  return (
    <Box sx={{ minWidth: '100px' }}>
      <RelativeTime value={timestamp} locale={locale} />
    </Box>
  );
}

RenderTime.propTypes = {
  timestamp: PropTypes.number.isRequired,
  locale: PropTypes.string.isRequired,
};

function RenderRole({ name = '', role }) {
  const { formatRoleName } = useSystemRoles();
  return <RoleChip label={formatRoleName(name || role)} size="small" role={name || role} sx={{ borderRadius: 1 }} />;
}

RenderRole.propTypes = {
  role: PropTypes.string.isRequired,
  name: PropTypes.string,
};

export function RenderStatus({ status }) {
  const { t } = useLocaleContext();
  return (
    <StatusChip label={t(`team.passport.statusMap.${status}`)} size="small" status={status} sx={{ borderRadius: 1 }} />
  );
}

RenderStatus.propTypes = {
  status: PropTypes.string.isRequired,
};

function RenderSource({ source }) {
  const { t } = useLocaleContext();

  if (!source) {
    return '-';
  }

  return t(`team.passport.sourceMaps.${source}`);
}

RenderSource.propTypes = {
  source: PropTypes.string.isRequired,
};

function RenderUser({ user, size = 'default', tooltip = false, inService = false }) {
  const { teamDid } = useTeamContext();
  const avatar = React.useMemo(() => parseAvatar(user.avatar, teamDid, inService), [user.avatar, teamDid, inService]);
  const description = React.useMemo(
    () => <DidAddress did={user?.did} compact responsive={false} sx={{ whiteSpace: 'nowrap' }} size={12} />,
    [user?.did]
  );

  const userInfo = useCreation(() => {
    return {
      ...user,
      avatar,
    };
  }, [user, avatar]);

  if (size === 'small') {
    return (
      <InfoCard
        variant="circular"
        logo={avatar}
        name={
          <Typography
            sx={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            className="customer-link-name">
            {user.fullName || user.email}
          </Typography>
        }
        {...(size === 'small'
          ? { tooltip: tooltip ? <DidAddress did={user?.did} /> : false, size: 24 }
          : {
              description,
              size: 36,
            })}
      />
    );
  }
  return (
    <UserCard
      user={userInfo}
      avatarSize={size === 'small' ? 24 : 36}
      cardType={CardType.Detailed}
      infoType={InfoType.Minimal}
      sx={{
        padding: 0,
        border: 'none',
      }}
      showDid
      didProps={{ compact: true, responsive: false }}
      showHoverCard={false}
    />
  );
}

RenderUser.propTypes = {
  user: PropTypes.object.isRequired,
  size: PropTypes.string,
  tooltip: PropTypes.bool,
  inService: PropTypes.bool,
};

const MemoizedRenderUser = React.memo(RenderUser);

export const renderDid = (did) => <RenderDid did={did} />;
export const renderRole = (name, role) => <RenderRole name={name} role={role} />;
export const renderStatus = (status) => <RenderStatus status={status} />;
export const renderTime = (timestamp, locale) => <RenderTime timestamp={timestamp} locale={locale} />;
export const renderSource = (source) => <RenderSource source={source} />;
export const renderUser = (user, inService = false) => <MemoizedRenderUser user={user} inService={inService} />;
export const renderUserAgent = (ua) => <UserAgentInfo ua={ua} />;
