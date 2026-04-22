import { useContext } from 'react';
import PropTypes from 'prop-types';
import { Skeleton, Box, CircularProgress } from '@mui/material';
import UserInfoCard from '@arcblock/ux/lib/UserCard';
import { InfoType } from '@arcblock/ux/lib/UserCard/types';
import { Icon } from '@iconify/react';
import { WELLKNOWN_BLOCKLET_USER_PATH } from '@abtnode/constant';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import noop from 'lodash/noop';
import { joinURL, withQuery } from 'ufo';

import { CardWrapper, commonProps, ButtonWrapper } from './basic';

export default function UserCard({ loading = false, user = null, switchUser = noop, connecting = false, url = '' }) {
  const { t } = useContext(LocaleContext);

  if (!user && !loading) {
    return null;
  }

  return (
    <CardWrapper>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 2, height: '100%' }}>
          <Skeleton variant="circular" width={48} height={48} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
            <Skeleton variant="rounded" sx={{ width: '80%', height: 20 }} />
            <Skeleton variant="rounded" sx={{ width: '40%', height: 20 }} />
            <Skeleton variant="rounded" sx={{ width: '30%', height: 20 }} />
            <Skeleton variant="rounded" sx={{ width: '60%', height: 20 }} />
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            height: '100%',
          }}>
          <UserInfoCard
            size="large"
            showDid
            showHoverCard
            user={user}
            avatarProps={{ size: 48 }}
            infoType={InfoType.Minimal}
            popupInfoType={InfoType.Basic}
            sx={{
              border: 'none',
              p: 0,
            }}
            onAvatarClick={() => {
              if (url) {
                window.open(withQuery(joinURL(url, WELLKNOWN_BLOCKLET_USER_PATH), { did: user.did }), '_blank');
              }
            }}
          />
          <Box>
            <ButtonWrapper
              variant="outlined"
              disabled={connecting}
              startIcon={
                connecting ? (
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                ) : (
                  <Icon style={{ fontSize: 16 }} icon="tabler:switch-horizontal" />
                )
              }
              onClick={switchUser}>
              {t('setting.aigne.switchUser')}
            </ButtonWrapper>
          </Box>
        </Box>
      )}
    </CardWrapper>
  );
}

UserCard.propTypes = {
  loading: PropTypes.bool,
  user: PropTypes.object,
  switchUser: PropTypes.func,
  url: PropTypes.string,
  ...commonProps,
};
