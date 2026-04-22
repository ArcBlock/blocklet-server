import { useContext } from 'react';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import PageHeader from '@blocklet/launcher-layout/lib/page-header';
import PropTypes from 'prop-types';
import { useBlockletContext } from '@abtnode/ux/lib/contexts/blocklet';
import Center from '@arcblock/ux/lib/Center';
import { CircularProgress } from '@mui/material';
import Button from '@arcblock/ux/lib/Button';
import { useConfigSpaceContext } from '@abtnode/ux/lib/contexts/config-space';
import ConnectTo from '@abtnode/ux/lib/blocklet/component/did-space/connect-to';
import Disconnect from '@abtnode/ux/lib/blocklet/component/did-space/disconnect';
import Connected from '@abtnode/ux/lib/blocklet/component/did-space/connected';
import StepActions from '../step-actions';
import Layout from '../layout';

function DidSpace({ onNext = () => {}, onPrevious = () => {} }) {
  const { t } = useContext(LocaleContext);
  /** @type {{ blocklet: import('@blocklet/server-js').BlockletState }} */
  const { blocklet } = useBlockletContext();
  const { spaceGateway, settingStorageEndpoint, updateSpaceGateway, hasStorageEndpoint, loading, storageEndpoint } =
    useConfigSpaceContext();

  if (loading) {
    return (
      <Center relative="parent">
        <CircularProgress />
      </Center>
    );
  }

  return (
    <Container>
      {/* 标题区 */}
      <div className="header">
        <PageHeader
          title={t('setup.didSpace.title')}
          subTitle={t('setup.didSpace.subTitle')}
          onClickBack={onPrevious}
        />
      </div>
      <Box
        className="form-container"
        sx={{
          width: '100%',
          maxWidth: '720px',
        }}>
        {hasStorageEndpoint ? (
          <Connected spaceGateway={spaceGateway} settingStorageEndpoint={settingStorageEndpoint} />
        ) : (
          <Disconnect />
        )}
        {blocklet?.capabilities?.didSpace && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: '24px',
            }}>
            <ConnectTo onConnect={updateSpaceGateway} storageEndpoint={storageEndpoint} />
          </Box>
        )}
      </Box>
      {blocklet?.capabilities?.didSpace === 'required' && (
        <StepActions mt={8}>
          <Button loading={loading} variant="contained" disabled={loading || !storageEndpoint} onClick={() => onNext()}>
            {t('setup.continue')}
          </Button>
        </StepActions>
      )}
      {blocklet?.capabilities?.didSpace === 'optional' && (
        <StepActions blocklet={blocklet} onStartNow={() => onNext('complete')}>
          <Button
            className="start-now"
            loading={loading}
            variant="contained"
            disabled={loading}
            onClick={() => onNext()}>
            {storageEndpoint ? t('setup.continue') : t('setup.skip')}
          </Button>
        </StepActions>
      )}
    </Container>
  );
}

DidSpace.propTypes = {
  onNext: PropTypes.func,
  onPrevious: PropTypes.func,
};

const Container = styled(Layout)`
  height: 100%;
  overflow-y: auto;
`;

export default DidSpace;
