/* eslint-disable react/jsx-one-expression-per-line */
import { useCallback, useRef } from 'react';
import styled from '@emotion/styled';
import { useParams, useNavigate } from 'react-router-dom';

import Typography from '@mui/material/Typography';

import Tabs from '@arcblock/ux/lib/Tabs';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import AuditLogs from '@abtnode/ux/lib/blocklet/audit-logs';
import Members from '@abtnode/ux/lib/team/members';
import Passports from '@abtnode/ux/lib/team/passports/new';

import { useNodeContext } from '../../contexts/node';
import { useBlockletsContext } from '../../contexts/blocklets';
import { TeamProvider } from '../../contexts/team';
import { createPassportSvg } from '../../libs/util';
import AccessKeySettings from '../../components/team/access-key';
import useHtmlTitle from '../../hooks/html-title';

export default function TeamPage() {
  const navigate = useNavigate();
  const { t } = useLocaleContext();
  const { info } = useNodeContext();
  const { tab = 'members' } = useParams(); // members, passports
  const createPassportSvgFn = props => createPassportSvg(props, info);
  const { data: blocklets } = useBlockletsContext();
  const scopeFormatter = useCallback(
    scope => {
      const blocklet = blocklets.find(x => [x.meta.did, x.appDid, x.appPid].includes(scope));
      if (blocklet) {
        return blocklet.meta.title;
      }
      return 'Server';
    },
    [blocklets]
  );

  const scopeFormatterRef = useRef(null);
  scopeFormatterRef.current = scopeFormatter;
  const renderAuditLogs = useCallback(() => {
    return <AuditLogs showScope scopeFormatter={scopeFormatterRef.current} blocklets={blocklets} />;
  }, [blocklets]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderMember = useCallback(() => <Members type="server" createPassportSvg={createPassportSvgFn} />, []);

  const teamDid = info.did;

  const onTabChange = newTab => {
    navigate(`/team/${newTab}`);
  };

  const tabConfigs = {
    members: {
      label: t('common.members'),
      value: 'members',
      component: renderMember,
    },
    passports: {
      label: t('team.member.passports'),
      value: 'passports',
      component: Passports,
    },
    'access-keys': {
      label: t('common.accessKey'),
      value: 'access-keys',
      component: AccessKeySettings,
    },
    'audit-logs': {
      label: t('common.auditLogs'),
      value: 'audit-logs',
      component: renderAuditLogs,
    },
  };

  const htmlTitle = useHtmlTitle(tabConfigs[tab], t('common.team'));

  const tabs = Object.values(tabConfigs).map(({ label, value }) => ({ label, value }));

  const tabConfig = tabConfigs[tab] || tabConfigs.member;

  return (
    <TeamProvider teamDid={teamDid}>
      {htmlTitle}
      <Main>
        <Typography component="h2" variant="h4" className="page-header" color="textPrimary">
          {t('common.team')}
        </Typography>
        <Tabs tabs={tabs} current={tab} onChange={onTabChange} scrollButtons="auto" />
        <div className="page-content">
          <tabConfig.component createPassportSvg={createPassportSvgFn} />
        </div>
      </Main>
    </TeamProvider>
  );
}

const Main = styled.main`
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .page-content {
    margin-top: 24px;
  }
`;
