/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
/* eslint-disable react/jsx-one-expression-per-line */
import { useContext } from 'react';
import styled from '@emotion/styled';

import Typography from '@mui/material/Typography';

import { LocaleContext } from '@arcblock/ux/lib/Locale/context';

import EulaContent from '../../components/node/eula-content';

export default function EULA() {
  const { t } = useContext(LocaleContext);

  return (
    <Main>
      <Typography component="h2" variant="h4" className="page-header" color="textPrimary">
        {t('setup.steps.eula')}
      </Typography>
      <EulaContent />
    </Main>
  );
}

const Main = styled.main`
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .page-content {
    margin-top: 16px;
  }
`;
