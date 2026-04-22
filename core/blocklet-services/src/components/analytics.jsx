import { useContext, isValidElement, useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useSearchParams } from 'react-router-dom';

import Tabs from '@arcblock/ux/lib/Tabs';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';

import Traffic from '@abtnode/ux/lib/analytics/traffic';
import Runtime from '@abtnode/ux/lib/analytics/runtime';

import ListHeader from '@abtnode/ux/lib/list-header';
import { useBlockletContext } from '../contexts/blocklet';

export default function Insights() {
  const { t } = useContext(LocaleContext);
  const { did, client } = useBlockletContext();

  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'traffic');

  const onTabChange = (newTab) => {
    setTab(newTab);
  };

  useEffect(() => {
    params.set('tab', tab);
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const tabs = [
    { label: t('common.traffic'), value: 'traffic' },
    { label: t('common.runtime'), value: 'runtime' },
  ];

  const renders = {
    traffic: Traffic,
    runtime: Runtime,
  };

  const TabComponent = renders[tab] || renders.traffic;

  return (
    <Main key={tab}>
      <ListHeader left={<Tabs tabs={tabs} current={tab} onChange={onTabChange} />} />
      <div className="page-content">
        {isValidElement(TabComponent) ? TabComponent : <TabComponent client={client} did={did} />}
      </div>
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
