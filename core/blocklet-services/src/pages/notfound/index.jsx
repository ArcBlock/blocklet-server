/* eslint-disable react/jsx-one-expression-per-line */
import { useContext } from 'react';
import styled from '@emotion/styled';

import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Result from '@arcblock/ux/lib/Result';

export default function NotFound() {
  const { t } = useContext(LocaleContext);
  return (
    <Main style={{ paddingTop: '25vh' }}>
      <Result status="404" description={t('noMatch.desc')} style={{ backgroundColor: 'transparent' }} />
    </Main>
  );
}

const Main = styled.main``;
