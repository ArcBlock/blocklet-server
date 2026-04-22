import { Box, Typography } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import useUserCenter from './use-user-center';
import Passport from './components/passport';
import Nft from './components/nfts';

export default function Nfts() {
  const { t } = useLocaleContext();
  const { user, isMyself, viewUser } = useUserCenter();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
      }}>
      {isMyself ? (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 2 }}>
          <Typography
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              mb: 2.5,
            }}>
            {t('userCenter.passport')}
          </Typography>
          <Passport user={user} />
        </Box>
      ) : null}
      <Nft user={isMyself ? user : viewUser} />
    </Box>
  );
}
