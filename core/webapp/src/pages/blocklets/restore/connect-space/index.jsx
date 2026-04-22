import React, { useContext, useMemo } from 'react';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import PageHeader from '@blocklet/launcher-layout/lib/page-header';
import { getServerUrl } from '@abtnode/ux/lib/blocklet/util';
import styled from '@emotion/styled';
import { Box } from '@mui/material';
import { joinURL } from 'ufo';
import getSafeUrlWithToast from '@abtnode/ux/lib/util/get-safe-url';

import { useNodeContext } from '../../../../contexts/node';
import ConnectSpaceSelector from './selector';
import { SpaceSelectorProvider } from '../../../../contexts/space-selector';

const Container = styled(Box)`
  width: 100%;
  height: 100%;
  overflow-y: auto;
`;

function ConnectSpace() {
  const { info } = useNodeContext();
  const { t, locale } = useContext(LocaleContext);
  const serverUrl = useMemo(() => (info ? getServerUrl(info) : ''), [info]);

  /**
   * @description
   * @param {import('./selector').SpaceGateway} spaceGateway
   */
  const onGoToAuthorization = spaceGateway => {
    const nextUrl = new URL(joinURL(spaceGateway.url, 'restore'));
    const redirectUrl = joinURL(serverUrl, 'blocklets/restore/verify-ownership');
    nextUrl.searchParams.set('redirectUrl', redirectUrl);
    nextUrl.searchParams.set('locale', locale);
    // 从 gateway 相关接口中获得，可以信任
    window.location.href = getSafeUrlWithToast(nextUrl.toString(), { allowDomains: null });
  };

  return (
    <SpaceSelectorProvider>
      <Container>
        <PageHeader
          title={t('blocklet.restoreFromSpaces.connect.title')}
          subTitle={t('blocklet.restoreFromSpaces.connect.subTitle')}
          onClickBack={() => window.history.back()}
        />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
          }}>
          <ConnectSpaceSelector
            sx={{
              marginTop: '64px',
              marginBottom: '32px',
              width: '100%',
              maxWidth: '720px',
            }}
            onConnect={onGoToAuthorization}
          />
        </Box>
      </Container>
    </SpaceSelectorProvider>
  );
}

export default ConnectSpace;
