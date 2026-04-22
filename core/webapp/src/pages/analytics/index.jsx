import React, { useContext, isValidElement } from 'react';
import styled from '@emotion/styled';
import { useParams, useNavigate } from 'react-router-dom';

import Typography from '@mui/material/Typography';

import Tabs from '@arcblock/ux/lib/Tabs';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';

import Traffic from '../../components/analytics/traffic';
import Runtime from '../../components/analytics/runtime';
import useHtmlTitle from '../../hooks/html-title';

export default function Analytics() {
  const navigate = useNavigate();
  const { t } = useContext(LocaleContext);

  const { tab = 'traffic' } = useParams();

  const onTabChange = newTab => {
    navigate(`/analytics/${newTab}`);
  };

  const tabs = [
    { label: t('common.traffic'), value: 'traffic' },
    { label: t('common.runtime'), value: 'runtime' },
  ];

  const htmlTitle = useHtmlTitle(
    tabs.find(x => x.value === tab),
    t('common.analytics')
  );

  const renders = {
    traffic: Traffic,
    runtime: Runtime,
  };

  const TabComponent = renders[tab] || renders.traffic;

  return (
    <Main>
      {htmlTitle}
      <Typography component="h2" variant="h4" className="page-header" color="textPrimary">
        {t('common.analytics')}
      </Typography>
      <Tabs tabs={tabs} current={tab} onChange={onTabChange} />
      <div className="page-content">{isValidElement(TabComponent) ? TabComponent : <TabComponent />}</div>
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
