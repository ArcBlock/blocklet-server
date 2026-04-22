import { useEffect, useMemo, lazy } from 'react';
import get from 'lodash/get';
import { LOGIN_PROVIDER_NAME } from '@arcblock/ux/lib/Util/constant';
import { SECURITY_RULE_DEFAULT_ID } from '@abtnode/constant';
import { useAppInfo } from '@blocklet/ui-react/lib/Dashboard';
import { useBlockletContext } from '@abtnode/ux/lib/contexts/blocklet';
import { useNodeContext } from '@abtnode/ux/lib/contexts/node';
import { useTeamContext } from '@abtnode/ux/lib/contexts/team';
import DIDIcon from '@abtnode/ux/lib/component/did-icon';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import { createPassportSvg } from '@abtnode/ux/lib/util/passport';
import { Stack } from '@mui/material';
import ProviderIcon from '@arcblock/ux/lib/DIDConnect/provider-icon';
import AppContent from '../app-content';

const Members = lazy(() => import('@abtnode/ux/lib/team/members'));
const Orgs = lazy(() => import('@abtnode/ux/lib/team/orgs'));
const Passports = lazy(() => import('@abtnode/ux/lib/team/passports/new'));
const Settings = lazy(() => import('@abtnode/ux/lib/blocklet/authentication'));
const Security = lazy(() => import('@abtnode/ux/lib/blocklet/preferences/security'));

export default function DidConnectService() {
  const { t, locale } = useLocaleContext();
  const { navItem, updateAppInfo, TabComponent } = useAppInfo();
  const { blocklet } = useBlockletContext();
  const { api } = useNodeContext();
  const { teamDid } = useTeamContext();

  const orgsIsEnabled = useMemo(() => {
    return get(blocklet, 'settings.org.enabled', false);
  }, [blocklet]);

  // 获取数据
  const blockletStats = useAsyncRetry(() => api.getBlockletBaseInfo({ input: { teamDid } }), [teamDid, api]);

  // 获取 Default 规则的 ACCESS POLICY
  const defaultSecurityRule = useAsyncRetry(async () => {
    if (!blocklet?.meta?.did) return null;
    const { securityRules } = await api.getBlockletSecurityRules({
      input: { did: blocklet.meta.did, includeDisabled: true },
    });
    return securityRules.find((rule) => rule.id === SECURITY_RULE_DEFAULT_ID);
  }, [blocklet?.meta?.did, api]);

  // 计算启用的 login providers
  const enabledAuthentications = useMemo(() => {
    const authenticationConfig = blocklet?.settings?.authentication || {};
    const enabledProviders = Object.keys(authenticationConfig)
      .filter((key) => authenticationConfig[key]?.enabled)
      .sort((a, b) => {
        return (authenticationConfig[a]?.order || 0) - (authenticationConfig[b]?.order || 0);
      })
      .map((key) => {
        return {
          name: key,
          title: LOGIN_PROVIDER_NAME[key] || key,
        };
      });

    return enabledProviders;
  }, [blocklet?.settings?.authentication]);

  // 统一登录状态
  const federatedEnabled = useMemo(() => {
    const federatedSites = blocklet?.settings?.federated?.sites || [];
    return federatedSites.length > 0;
  }, [blocklet?.settings?.federated?.sites]);

  // 设置 app info
  useEffect(() => {
    const desc = t('navigation.didConnectDesc');
    const poweredBy = t('common.poweredBy', { brand: '$placeholder' });
    const period = desc ? desc.slice(-1) : '';
    const [p1, p2] = poweredBy.split('$placeholder');

    updateAppInfo({
      name: navItem?.title || '',
      description: (
        <span>
          {desc} {p1}
          <a href={`https://www.didconnect.io/${locale}`} target="_blank" style={{ color: '#5bbec5' }} rel="noreferrer">
            <DIDIcon color="#5bbec5" /> Connect
          </a>
          {p2} {period}
        </span>
      ),
    });
  }, [navItem, t, locale, updateAppInfo]);

  // app badges
  useEffect(() => {
    const badges = [];
    const { users = 0 } = blockletStats.value?.user ?? {};
    const { passports = 0 } = blockletStats.value?.passport ?? {};

    // Member 数量
    badges.push({
      variant: 'number',
      label: t('common.members'),
      value: users,
      to: `${navItem.link}/members`,
      round: 0,
    });

    // Passport 数量
    badges.push({
      variant: 'number',
      label: t('team.member.passports'),
      value: passports,
      to: `${navItem.link}/passports`,
      round: 0,
    });

    // 已启用的第三方登录 Icon
    if (enabledAuthentications.length > 0) {
      badges.push({
        label: t('authentication.loginProviders'),
        value: (
          <Stack component="span" direction="row" spacing={0.5}>
            {enabledAuthentications.map((v) => (
              <ProviderIcon provider={v.name} key={v.name} sx={{ width: 12, height: 12 }} />
            ))}
          </Stack>
        ),
        to: `${navItem.link}/settings`,
      });
    }

    // 统一登录状态
    badges.push({
      label: t('authentication.federated'),
      value: federatedEnabled ? 'ON' : 'OFF',
      to: `${navItem.link}/settings`,
    });

    // Default 规则的 ACCESS POLICY
    const defaultAccessPolicyName = defaultSecurityRule.value?.accessPolicy?.name;
    if (defaultAccessPolicyName) {
      badges.push({
        label: t('accessPolicy.title'),
        value: defaultAccessPolicyName,
        to: `${navItem.link}/security`,
      });
    }

    updateAppInfo({ badges });
  }, [
    updateAppInfo,
    blockletStats.value,
    blockletStats.loading,
    t,
    enabledAuthentications,
    federatedEnabled,
    defaultSecurityRule.value,
    defaultSecurityRule.loading,
    navItem.link,
  ]);

  // app tabs
  const tabs = useMemo(() => {
    return [
      {
        label: t('common.members'),
        value: 'members',
        render: <Members type="blocklet" createPassportSvg={createPassportSvg} />,
      },
      orgsIsEnabled && {
        label: t('common.orgs'),
        value: 'orgs',
        render: <Orgs editable={false} mode="dashboard" layout="table" />,
      },
      {
        label: t('team.member.passports'),
        value: 'passports',
        render: <Passports createPassportSvg={createPassportSvg} />,
      },
      { label: t('common.setting'), value: 'settings', render: <Settings orientation="vertical" /> },
      { label: t('common.policies'), value: 'security', render: <Security /> },
    ].filter(Boolean);
  }, [t, orgsIsEnabled]);

  useEffect(() => {
    updateAppInfo({ tabs });
  }, [tabs, updateAppInfo]);

  return <AppContent component={TabComponent} />;
}
