import React from 'react';
import Header from '@blocklet/ui-react/lib/Header';
import InfoRow from '@arcblock/ux/lib/InfoRow';
import Tabs from '@arcblock/ux/lib/Tabs';
import Empty from '@arcblock/ux/lib/Empty';
import get from 'lodash/get';
import noop from 'lodash/noop';
import styled from '@emotion/styled';
import Button from '@arcblock/ux/lib/Button';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Avatar, Box, Chip, Container, Stack, Typography } from '@mui/material';
import { useReactive } from 'ahooks';
import { USER_TYPE, PASSPORT_STATUS, WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { LOGIN_PROVIDER, LOGIN_PROVIDER_NAME } from '@arcblock/ux/lib/Util/constant';
import { createPassportSvg } from '@abtnode/ux/lib/util/passport';

import DidAddress from '@abtnode/ux/lib/did-address';
import UserConnections from '@abtnode/ux/lib/team/members/connections';
import PassportItem from '@abtnode/ux/lib/team/members/passport-item';
import { formatToDatetime } from '@abtnode/ux/lib/util';
import { useNavigate, useParams } from 'react-router-dom';
import { GppGoodOutlined } from '@mui/icons-material';
import { useSessionContext } from '../contexts/session';
import UserSettings from '../components/user/settings';

export function UserProfile({ user }) {
  const { t, locale } = useLocaleContext();

  const rows = [
    { name: t('team.member.name'), value: user.fullName },
    { name: t('common.email'), value: user.email },
    { name: t('common.phone'), value: user.phone },
    { name: t('team.member.lastLogin'), value: formatToDatetime(user.lastLoginAt, locale) },
    { name: t('team.member.lastLoginIp'), value: user.lastLoginIp || '' },
    { name: t('common.createdAt'), value: formatToDatetime(user.createdAt, locale) },
    {
      name: t('team.member.source'),
      value: LOGIN_PROVIDER_NAME[user?.sourceProvider || USER_TYPE.WALLET] || user?.sourceProvider,
    },
  ].filter(Boolean);

  return rows.map((row) => {
    if (row.name === t('common.did')) {
      return (
        <InfoRow
          valueComponent="div"
          key={row.name}
          nameWidth={120}
          name={row.name}
          nameFormatter={() => t('common.did')}>
          {row.value}
        </InfoRow>
      );
    }

    return (
      <InfoRow style={{ alignItems: 'flex-start' }} valueComponent="div" key={row.name} nameWidth={120} name={row.name}>
        {row.value}
      </InfoRow>
    );
  });
}

// eslint-disable-next-line react/prop-types
export function UserPassports({ user }) {
  const { t } = useLocaleContext();
  const passports = (get(user, 'passports') || []).map((x) => ({
    ...x,
    revoked: x.status === PASSPORT_STATUS.REVOKED,
  }));

  if (passports.length === 0) {
    return <Empty>{t('common.empty')}</Empty>;
  }

  return (
    <Stack direction="row" spacing={3}>
      {passports.map((x) => (
        <PassportItem
          key={x.id}
          passport={x}
          user={user}
          width={200}
          color={window.blocklet.passportColor}
          createPassportSvg={createPassportSvg}
          sx={{ flexDirection: 'column', alignItems: 'center' }}
        />
      ))}
    </Stack>
  );
}

export default function User() {
  const navigate = useNavigate();
  const params = useParams();

  const { t } = useLocaleContext();
  const { session } = useSessionContext();

  const state = useReactive({
    user: session.user,
    tab: params.tab || 'profile',
  });

  const onTabChange = (newTab) => {
    state.tab = newTab;
    navigate(`${WELLKNOWN_SERVICE_PATH_PREFIX}/user/${newTab}`);
  };

  const tabConfigs = {
    info: {
      label: t('common.profile'),
      value: 'profile',
      component: UserProfile,
    },
    oauth: {
      label: t('team.member.connections'),
      value: 'connections',
      component: UserConnections,
    },
    passports: {
      label: t('team.member.passports'),
      value: 'passports',
      component: UserPassports,
    },
    settings: {
      label: t('common.setting'),
      value: 'settings',
      component: UserSettings,
    },
  };

  const tabs = Object.values(tabConfigs)
    .map(({ label, value }) => ({ label, value }))
    .filter((x) => {
      if (x.value === 'connections') {
        const connectedAccounts = state.user?.connectedAccounts || [];
        return connectedAccounts.find(
          (item) => item.provider !== (state.user?.sourceProvider || LOGIN_PROVIDER.WALLET)
        );
      }

      return true;
    });

  const tabConfig = tabConfigs[state.tab] || tabConfigs.info;

  return (
    <>
      <Header />
      <Root sx={{ mt: 4 }}>
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
            }}>
            <Avatar
              src={state.user.avatar}
              variant="rounded"
              style={{ width: 80, height: 80, backgroundColor: 'transparent', marginRight: 8 }}
            />
            <Stack direction="column" spacing={0.5}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 'bold',
                }}>
                {state.user.fullName}
              </Typography>
              <Box>
                <Chip
                  label={state.user.role.toUpperCase()}
                  size="small"
                  variant="outlined"
                  color="success"
                  sx={{
                    height: 'auto',
                    fontWeight: 'bold',
                    fontSize: '12px',
                  }}
                  icon={<GppGoodOutlined sx={{ fontSize: '0.8em' }} />}
                />
              </Box>
              <DidAddress did={state.user.did} />
            </Stack>
          </Stack>
          <Stack>
            {state.tab === 'profile' && (
              <Button variant="contained" size="small" color="primary" onClick={() => session.switchProfile(noop, {})}>
                {t('team.member.switch.profile')}
              </Button>
            )}
            {state.tab === 'passports' && (
              <Button variant="contained" size="small" color="primary" onClick={() => session.switchPassport(noop, {})}>
                {t('team.member.switch.passport')}
              </Button>
            )}
          </Stack>
        </Stack>
        <Box className="tabs" sx={{ my: 3 }}>
          <Tabs tabs={tabs} current={state.tab} onChange={onTabChange} />
        </Box>
        <div className="body">
          <tabConfig.component user={state.user} />
        </div>
      </Root>
    </>
  );
}

const Root = styled(Container)`
  .MuiTab-root {
    padding: 0;
    margin-right: 24px;
    min-height: 32px;
    min-width: auto;
  }

  .MuiTabs-root {
    min-height: 32px;
    margin-bottom: 8px;
  }

  .MuiTabs-scroller {
    border-bottom: 1px solid #eee;
  }

  .MuiCheckbox-root {
    padding-top: 2px;
    padding-bottom: 2px;
  }
`;
