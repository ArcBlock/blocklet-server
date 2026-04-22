/* eslint-disable react/no-unused-prop-types */
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { useContext, useMemo, useRef, useState } from 'react';
import { Box, Button } from '@mui/material';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import PageHeader from '@blocklet/launcher-layout/lib/page-header';
import { useBlockletContext } from '@abtnode/ux/lib/contexts/blocklet';
import { AigneConfig } from '@abtnode/ux/lib/blocklet/aigne-config';

import StepActions from './step-actions';
import Layout from './layout';

function Aigne({ onNext = () => {}, onPrevious = () => {} }) {
  const { t } = useContext(LocaleContext);
  const { blocklet } = useBlockletContext();
  const requirements = useMemo(() => blocklet?.meta?.requirements, [blocklet]);

  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async () => {
    try {
      setLoading(true);
      const res = await formRef.current.onSubmit();
      if (res || !requirements?.aigne) {
        onNext();
      }
    } catch (error) {
      console.error('error', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="header">
        <PageHeader title={t('setting.aigne.config')} onClickBack={onPrevious} />
      </div>

      <Box className="form-container">
        <AigneConfig
          orientation="vertical"
          hideSubmitButton
          hideDivider
          ref={formRef}
          source="setup"
          forceValidate={requirements?.aigne}
        />
      </Box>

      <StepActions blocklet={blocklet}>
        {!requirements?.aigne && (
          <Button className="bottom-button-skip" sx={{ mr: 1 }} onClick={() => onNext()}>
            {t('setup.skip')}
          </Button>
        )}
        <Button
          className="start-now bottom-button"
          loading={loading}
          variant="contained"
          disabled={loading}
          onClick={handleFormSubmit}>
          {t('setup.continue')}
        </Button>
      </StepActions>
    </Container>
  );
}

Aigne.propTypes = {
  onNext: PropTypes.func,
  onPrevious: PropTypes.func,
};

const Container = styled(Layout)`
  height: 100%;
  overflow-y: auto;

  .form-container {
    width: 100%;
    margin: 0 auto;
    padding: 0 16px;
  }
`;

export default Aigne;
