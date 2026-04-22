import { use } from 'react';
import { Box, Button, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useMemoizedFn } from 'ahooks';
import { useConfirm } from '@arcblock/ux/lib/Dialog';
import { SessionContext } from '@arcblock/did-connect-react/lib/Session';
import Toast from '@arcblock/ux/lib/Toast';

function DangerZone({ onDestroySelf = undefined }) {
  const { confirmHolder } = useConfirm();

  const { t } = useLocaleContext();
  const { session } = use(SessionContext);

  const handleRemoveMyself = useMemoizedFn(async () => {
    if (!onDestroySelf || typeof onDestroySelf !== 'function') {
      return;
    }

    const handle = session.withSecondaryAuth(onDestroySelf, {
      extraParams: {
        removeUserDid: session?.user?.did,
        input: {
          user: { did: session?.user?.did },
          teamDid: window?.blocklet?.did,
        },
      },
      operation: 'destroySelf',
    });
    try {
      await handle();
      session.logout();
    } catch (error) {
      Toast.error(error?.message || t('userCenter.destroyMyself.error'));
    }
  });

  return (
    <>
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontSize: '0.875rem !important',
                fontWeight: 'bold',
              }}>
              {t('userCenter.dangerZone.deleteAccount')}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
              }}>
              {t('userCenter.dangerZone.deleteAccountDescription')}
            </Typography>
          </Box>
          <Button variant="contained" color="error" size="small" onClick={handleRemoveMyself}>
            {t('userCenter.dangerZone.delete')}
          </Button>
        </Box>
      </Box>
      {confirmHolder}
    </>
  );
}

DangerZone.propTypes = {
  onDestroySelf: PropTypes.func,
};

export default DangerZone;
