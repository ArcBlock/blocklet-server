import { useEffect } from 'react';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import PropTypes, { func } from 'prop-types';
import Center from '@arcblock/ux/lib/Center';
import { CircularProgress } from '@mui/material';
import StepActions from '../step-actions';
import Layout from '../../../launch-blocklet/content-layout';
import Disconnect from './disconnect';
import Connected from './connected';
import { useConfigSpaceContext } from '../../../contexts/config-space';
import useMobile from '../../../hooks/use-mobile';
import ConnectTo from './connect-to';
import { useBlockletContext } from '../../../contexts/blocklet';

/**
 * @description
 * @param {{
 *  blockletMeta: import('@blocklet/server-js').BlockletMeta,
 *  onEndpointUpdate: Function,
 * }} { blockletMeta }
 * @return {React.Component}
 */
function DidSpace({ blockletMeta, onEndpointUpdate = () => undefined }) {
  const isMobile = useMobile();
  /** @type {{ blocklet: import('@blocklet/server-js').BlockletState }} */
  const { blocklet } = useBlockletContext();
  const { updateSpaceGateway, loading, hasStorageEndpoint } = useConfigSpaceContext();

  useEffect(() => {
    onEndpointUpdate?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocklet]);

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
          width: isMobile ? '360px' : '720px',
        }}>
        {hasStorageEndpoint ? <Connected /> : <Disconnect />}
      </Box>
      {blockletMeta?.capabilities?.didSpace === 'required' && (
        <StepActions mt={8}>
          <ConnectTo onConnect={updateSpaceGateway} />
        </StepActions>
      )}
    </Container>
  );
}

DidSpace.propTypes = {
  blockletMeta: PropTypes.any.isRequired,
  onEndpointUpdate: func,
};

const Container = styled(Layout)`
  height: 100%;
  overflow-y: auto;
  padding-bottom: 32px;
  overflow-x: hidden;
`;

export default DidSpace;
