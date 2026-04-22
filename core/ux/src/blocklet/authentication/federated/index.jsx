/* eslint-disable react/no-unstable-nested-components */
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@arcblock/ux/lib/Button';
import Toast from '@arcblock/ux/lib/Toast';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useContext, useRef } from 'react';
import { useMemoizedFn } from 'ahooks';

import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import { useBlockletContext } from '../../../contexts/blocklet';
import FederatedSiteList from './federated-site-list';
import FederatedJoinDialog from './federated-join-dialog';
import FederatedInviteDialog from './federated-invite-dialog';

function UnifiedLoginInfoCard() {
  const { t } = useContext(LocaleContext);

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: 'flex-start',
        p: 2,
      }}>
      <ArticleOutlinedIcon fontSize="large" color="primary" />
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('federated.title')}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}>
          {t('federated.description')}
        </Typography>
        <Link
          href="https://www.arcblock.io/blog/zh/did-connect-federated-login-support"
          underline="hover"
          variant="body2"
          color="primary"
          target="_blank"
          sx={{ display: 'inline-flex', alignItems: 'center', mt: 1 }}>
          {t('federated.link')}
        </Link>
      </Box>
    </Stack>
  );
}

export default function FederatedLogin() {
  const federatedInviteRef = useRef(null);
  const federatedJoinRef = useRef(null);
  const { t } = useContext(LocaleContext);
  const {
    blocklet,
    actions: { refreshBlocklet },
  } = useBlockletContext();

  const showInvite = useMemoizedFn(() => {
    const link = blocklet.site?.domainAliases?.[0]?.href;
    if (link) {
      try {
        const url = new URL(link);
        federatedInviteRef.current?.open({
          link: url.origin,
        });
      } catch {
        Toast.error(t('federated.failedToGetFederatedLoginLink'));
      }
    }
  }, [blocklet.site?.domainAliases?.[0]?.href]);

  const joinInvite = useMemoizedFn(() => {
    federatedJoinRef.current?.open(() => {
      refreshBlocklet();
    });
  }, [refreshBlocklet]);

  if (blocklet.settings.federated?.sites.length > 0) {
    const isMaster = blocklet.settings.federated?.config.isMaster !== false;
    return <FederatedSiteList mode={isMaster ? 'master' : 'member'} />;
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
        }}>
        <Box sx={{ maxWidth: 400, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <UnifiedLoginInfoCard />

          <Divider sx={{ width: 1 }} />

          <Stack
            sx={{
              width: 1,
              p: 2,
              gap: 1.5,
            }}>
            <Button variant="contained" onClick={showInvite} sx={{ width: 1 }}>
              {t('federated.inviteJoinFederatedLogin')}
            </Button>
            <Button variant="outlined" onClick={joinInvite} sx={{ width: 1 }}>
              {t('federated.joinFederatedLogin')}
            </Button>
          </Stack>
        </Box>
      </Box>
      <FederatedInviteDialog ref={federatedInviteRef} />
      <FederatedJoinDialog ref={federatedJoinRef} />
    </>
  );
}
