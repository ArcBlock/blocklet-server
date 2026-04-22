import Center from '@arcblock/ux/lib/Center';
import styled from '@emotion/styled';
import { Box, CircularProgress } from '@mui/material';
import { ConfigUserSpaceProvider, useConfigUserSpaceContext } from './context/did-spaces';
import useUserCenter from './use-user-center';
import Connected from './components/did-spaces/connected';
import Disconnect from './components/did-spaces/disconnect';

function DidSpaces() {
  const { spaceGateway, hasStorageEndpoint, loading } = useConfigUserSpaceContext();

  const { isMyself } = useUserCenter();

  if (!isMyself) {
    return null;
  }

  if (loading) {
    return (
      <Center relative="parent">
        <CircularProgress />
      </Center>
    );
  }

  return (
    <Container>
      <Box
        sx={{
          maxWidth: '720px',
        }}>
        {hasStorageEndpoint ? <Connected spaceGateway={spaceGateway} /> : <Disconnect />}
      </Box>
    </Container>
  );
}

function DidSpacesWrapper() {
  return (
    <ConfigUserSpaceProvider>
      <DidSpaces />
    </ConfigUserSpaceProvider>
  );
}

const Container = styled(Box)`
  height: 100%;
  overflow-y: auto;
`;

export default DidSpacesWrapper;
