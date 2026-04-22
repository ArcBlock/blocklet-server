/* eslint-disable react/jsx-one-expression-per-line */
import { useContext, isValidElement } from 'react';
import styled from '@emotion/styled';
import { useParams, useNavigate } from 'react-router-dom';

import Typography from '@mui/material/Typography';

import Tabs from '@arcblock/ux/lib/Tabs';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';

import { RoutingProvider } from '../../contexts/routing';
import { NodeContext } from '../../contexts/node';
import BasicSettings from '../../components/settings/basic';
import WebHookSetting from '../../components/settings/webhook';
import About from '../../components/settings/about';
import RouterSettings from '../../components/router/router-setting';
import CertSetting from '../../components/router/cert-setting';
import Gateway from '../../components/settings/gateway';
import useHtmlTitle from '../../hooks/html-title';

export default function Settings() {
  const navigate = useNavigate();
  const { node } = useContext(NodeContext);
  const { t } = useContext(LocaleContext);

  const { tab = 'basic' } = useParams();

  const onTabChange = newTab => {
    navigate(`/settings/${newTab}`);
  };

  const tabs = [
    { label: t('common.basic'), value: 'basic' },
    { label: t('router.routerSetting'), value: 'router' },
    { label: t('router.certSetting'), value: 'cert' },
    { label: t('common.gateway'), value: 'gateway' },
    { label: t('common.webhook'), value: 'integration' },
    { label: t('common.about'), value: 'about' },
  ];

  const htmlTitle = useHtmlTitle(
    tabs.find(x => x.value === tab),
    t('common.setting')
  );

  const renders = {
    basic: BasicSettings,
    integration: WebHookSetting,
    about: About,
    router: (
      <RoutingProvider>
        <RouterSettings />
      </RoutingProvider>
    ),
    gateway: Gateway,
    cert: (
      <RoutingProvider>
        <CertSetting />
      </RoutingProvider>
    ),
  };

  const TabComponent = renders[tab] || renders.basic;

  return (
    <Main>
      {htmlTitle}
      <Typography component="h2" variant="h4" className="page-header" color="textPrimary">
        {t('common.setting')}
      </Typography>
      <>
        <Tabs tabs={tabs} current={tab} onChange={onTabChange} scrollButtons="auto" />
        <div className="page-content">{isValidElement(TabComponent) ? TabComponent : <TabComponent node={node} />}</div>
      </>
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
