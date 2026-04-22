import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';
import TransferIcon from '@mui/icons-material/VolunteerActivismOutlined';
import VaultIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { useSetState } from 'ahooks';

import { BLOCKLET_CONFIGURABLE_KEY, BLOCKLET_TENANT_MODES } from '@blocklet/constant';
import Toast from '@arcblock/ux/lib/Toast';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useNodeContext } from '../contexts/node';
import { isInstalling, BlockletAdminRoles, updateWindowEnv } from '../util';
import { enableDebug } from '../util/mode';
import Permission, { withPermission } from '../permission';
import ClearCache from '../clear-cache';
import AppSk from './preferences/app-sk';
import TransferOwner from './transfer-owner';
import ConfigVault from './vault/config';
import RotateSessionKey from '../rotate-session-key';
import Section from '../component/section';
import FormTextInput from '../form/form-text-input';

function BlockletDangerZone({ blocklet, onUpdate = () => {}, hasPermission = false }) {
  const { info, api, inService } = useNodeContext();
  const { t, locale } = useContext(LocaleContext);
  const [state, setState] = useSetState({
    loading: false,
    showTransferOwner: false,
    showConfigVault: false,
  });
  const [wafEnabled, setWafEnabled] = useState(() => blocklet?.settings?.gateway?.wafPolicy?.enabled ?? true);
  const [enableSessionHardening, setEnableSessionHardening] = useState(
    () => !!blocklet?.settings?.enableSessionHardening ?? false
  );
  const [inviteEnabled, setInviteEnabled] = useState(() => !!blocklet?.settings?.invite?.enabled ?? false);

  const [orgSettings, setOrgSettings] = useState(() => {
    const settings = blocklet?.settings?.org || {};
    return {
      enabled: settings.enabled || false,
      maxMemberPerOrg: settings.maxMemberPerOrg || 100,
      maxOrgPerUser: settings.maxOrgPerUser || 10,
    };
  });

  const disabled = state.loading || !hasPermission;

  const { did } = blocklet.meta;

  const isServerWafEnabled = inService ? window.env?.gateway?.wafPolicy?.enabled : info?.routing.wafPolicy?.enabled;

  if (isInstalling(blocklet.status)) {
    return null;
  }

  // configurable blocklet environment
  const customDelete = blocklet.environments.find((x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_DELETABLE);
  const deletable = !customDelete || customDelete.value === 'yes';
  const customTenantMode = blocklet.environments.find(
    (x) => x.key === BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_TENANT_MODE
  );
  const tenantMode = customTenantMode?.value || BLOCKLET_TENANT_MODES.SINGLE;

  const createBooleanConfigHandler = (key, value) => async (e) => {
    if (state.loading) {
      return;
    }

    setState({ loading: true });
    try {
      const { checked } = e.target;
      const { blocklet: data } = await api.configBlocklet({
        input: {
          did: blocklet.meta.did,
          configs: [
            {
              key: BLOCKLET_CONFIGURABLE_KEY[key],
              value: value(checked),
            },
          ],
        },
      });

      onUpdate(data);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setState({ loading: false });
    }
  };

  const onDeletableChange = createBooleanConfigHandler('BLOCKLET_DELETABLE', (checked) => (checked ? 'no' : 'yes'));
  const onTenantModeChange = createBooleanConfigHandler('BLOCKLET_APP_TENANT_MODE', (checked) =>
    checked ? BLOCKLET_TENANT_MODES.MULTIPLE : BLOCKLET_TENANT_MODES.SINGLE
  );

  const createSwitchHandler = (inputBuilder, localSetter) => async (e) => {
    if (state.loading) return;

    setState({ loading: true });
    try {
      const value = e.target.checked;
      await api.updateBlockletSettings({
        input: inputBuilder(value),
      });
      if (localSetter) localSetter(value);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setState({ loading: false });
    }
  };

  const onChangeInviteSettings = createSwitchHandler(
    (value) => ({ did: blocklet.meta.did, invite: { enabled: value } }),
    setInviteEnabled
  );

  // org settings
  const onSwitchOrg = createSwitchHandler(
    (enabled) => ({
      did: blocklet.meta.did,
      org: {
        enabled,
        maxMemberPerOrg: 100, // 切换 org enabled 时，将 maxMemberPerOrg 恢复默认
        maxOrgPerUser: 10,
      },
    }),
    (enabled) => {
      setOrgSettings({
        ...orgSettings,
        enabled,
      });
    }
  );

  const onSettingsOrgMaxMembers = async (key, v) => {
    if (state.loading) return;

    setState({ loading: true });
    try {
      await api.updateBlockletSettings({
        input: { did: blocklet.meta.did, org: { ...orgSettings, [key]: v } },
      });
      setOrgSettings({ ...orgSettings, [key]: v });
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setState({ loading: false });
    }
  };

  const onChangeWAFSettings = createSwitchHandler(
    (value) => ({ did: blocklet.meta.did, gateway: { wafPolicy: { enabled: value } } }),
    setWafEnabled
  );

  const onChangeEnableSessionHardening = createSwitchHandler(
    (value) => ({ did: blocklet.meta.did, enableSessionHardening: value }),
    (v) => {
      setEnableSessionHardening(v);
      updateWindowEnv();
    }
  );

  const onAppSkChanged = async () => {
    if (state.loading) {
      return;
    }

    setState({ loading: true });
    try {
      const { blocklet: data } = await api.getBlocklet({
        input: {
          did: blocklet.meta.did,
        },
      });

      onUpdate(data);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setState({ loading: false });
    }
  };

  return (
    <Stack p={3} sx={{ border: '1px solid red', borderRadius: 2, p: 3 }} className="advanced-config">
      {!inService && (
        <>
          <Section
            title={t('blocklet.config.deletable.name')}
            desc={deletable ? t('blocklet.config.deletable.disable') : t('blocklet.config.deletable.enable')}>
            <Box sx={{ alignSelf: { xs: 'flex-start', md: 'flex-end' } }}>
              <Switch disabled={disabled} checked={!deletable} defaultChecked onChange={onDeletableChange} />
            </Box>
          </Section>
          <Box
            className="config-form"
            component={Divider}
            sx={{
              my: 3,
            }}
          />
        </>
      )}
      <AppSk inService={inService} disabled={disabled} loading={state.loading} onChange={onAppSkChanged} />
      <Box
        className="config-form"
        component={Divider}
        sx={{
          my: 3,
        }}
      />
      {inService && (
        // eslint-disable-next-line jsx-a11y/aria-role
        <Permission role="owner">
          {(isOwner) =>
            (isOwner || enableDebug) && (
              <>
                <Section title={t('blocklet.config.vault.title')} desc={t('blocklet.config.vault.desc')}>
                  <Box sx={{ alignSelf: { xs: 'flex-start', md: 'flex-end' } }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      data-cy="config-vault"
                      onClick={() => setState({ showConfigVault: true })}>
                      <VaultIcon style={{ fontSize: '1.3em', marginRight: 4 }} />
                      {t('blocklet.config.vault.title')}
                    </Button>
                  </Box>
                </Section>

                <Box
                  className="config-form"
                  component={Divider}
                  sx={{
                    my: 3,
                  }}
                />

                {state.showConfigVault && (
                  <ConfigVault
                    blocklet={blocklet}
                    onCancel={() => setState({ showConfigVault: false })}
                    onSuccess={() => setState({ showConfigVault: false })}
                  />
                )}

                <Section title={t('team.transferApp.name')} desc={t('team.transferApp.description')}>
                  <Box sx={{ alignSelf: { xs: 'flex-start', md: 'flex-end' } }}>
                    <Button
                      variant="contained"
                      edge="end"
                      color="primary"
                      size="small"
                      data-cy="transfer-app"
                      onClick={() => setState({ showTransferOwner: true })}>
                      <TransferIcon style={{ fontSize: '1.3em', marginRight: 4 }} />
                      {t('team.transferApp.name')}
                    </Button>
                  </Box>
                </Section>

                <Box
                  className="config-form"
                  component={Divider}
                  sx={{
                    my: 3,
                  }}
                />

                {state.showTransferOwner && (
                  <TransferOwner
                    onCancel={() => setState({ showTransferOwner: false })}
                    onSuccess={() => setState({ showTransferOwner: false })}
                  />
                )}
              </>
            )
          }
        </Permission>
      )}
      <Section title={t('blocklet.config.clearCache.name')} desc={t('blocklet.config.clearCache.purpose')}>
        <Box sx={{ alignSelf: { xs: 'flex-start', md: 'flex-end' } }}>
          <ClearCache teamDid={did} />
        </Box>
      </Section>
      <Box
        className="config-form"
        component={Divider}
        sx={{
          my: 3,
        }}
      />
      <Section title={t('blocklet.config.rotateSessionKey.name')} desc={t('blocklet.config.rotateSessionKey.purpose')}>
        <Box sx={{ alignSelf: { xs: 'flex-start', md: 'flex-end' } }}>
          <RotateSessionKey style={{ whiteSpace: 'nowrap' }} teamDid={did} />
        </Box>
      </Section>
      <Box
        className="config-form"
        component={Divider}
        sx={{
          my: 3,
        }}
      />
      <Section title={t('blocklet.config.tenantMode.name')} desc={t(`blocklet.config.tenantMode.${tenantMode}`)}>
        <Box sx={{ alignSelf: { xs: 'flex-start', md: 'flex-end' } }}>
          <Switch
            disabled={disabled}
            checked={tenantMode === BLOCKLET_TENANT_MODES.MULTIPLE}
            onChange={onTenantModeChange}
          />
        </Box>
      </Section>
      <Box
        className="config-form"
        component={Divider}
        sx={{
          my: 3,
        }}
      />
      <Section title={t('team.invite.setting')} desc={t(`team.invite.${inviteEnabled ? 'enabled' : 'disabled'}`)}>
        <Box sx={{ alignSelf: { xs: 'flex-start', md: 'flex-end' } }}>
          <Switch disabled={disabled} checked={inviteEnabled} onChange={onChangeInviteSettings} />
        </Box>
      </Section>
      <Box
        className="config-form"
        component={Divider}
        sx={{
          my: 3,
        }}
      />
      <Section
        title={
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              gap: 1,
            }}>
            {t('setting.form.enableSessionHardening.switchLabel')}
            <Tooltip title={t('setting.form.enableSessionHardening.switchTips')}>
              <InfoOutlinedIcon sx={{ ml: 0.5, fontSize: '20px' }} color="primary" />
            </Tooltip>
          </Stack>
        }>
        <Box sx={{ alignSelf: { xs: 'flex-start', md: 'flex-end' } }}>
          <Switch disabled={disabled} checked={enableSessionHardening} onChange={onChangeEnableSessionHardening} />
        </Box>
      </Section>
      {isServerWafEnabled && (
        <>
          <Box
            className="config-form"
            component={Divider}
            sx={{
              my: 3,
            }}
          />

          <Section
            title={
              <Stack
                direction="row"
                sx={{
                  alignItems: 'center',
                  gap: 1,
                }}>
                {t('router.gateway.wafPolicy.title')}
                <Tooltip
                  title={
                    <Box sx={{ fontSize: '14px', lineHeight: 1.5 }}>
                      <Box
                        sx={{ color: 'common.white', ml: 0.5 }}
                        component="a"
                        href={`https://www.arcblock.io/docs/blocklet-developer/${locale}/enable-web-application-firewall`}
                        target="_blank"
                        rel="noopener noreferrer">
                        {t('dashboard.document')}
                      </Box>
                    </Box>
                  }>
                  <InfoOutlinedIcon fontSize="small" color="action" sx={{ fontSize: 16, cursor: 'pointer' }} />
                </Tooltip>
              </Stack>
            }
            desc={t('router.gateway.wafPolicy.switchLabel')}>
            <Box sx={{ alignSelf: { xs: 'flex-start', md: 'flex-end' } }}>
              <Switch disabled={disabled} checked={wafEnabled} onChange={onChangeWAFSettings} />
            </Box>
          </Section>
        </>
      )}
      <Box
        className="config-form"
        component={Divider}
        sx={{
          my: 3,
        }}
      />
      <Section
        title={
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              gap: 1,
            }}>
            {t('common.orgs')}
          </Stack>
        }
        desc={t('team.orgs.explain')}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
            alignSelf: { xs: 'flex-start', md: 'flex-end' },
          }}>
          <Switch disabled={disabled} checked={orgSettings.enabled} onChange={onSwitchOrg} />
          {orgSettings.enabled && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                minWidth: 400,
                mt: 1,
              }}>
              <FormTextInput
                style={{ marginTop: 0 }}
                disabled={disabled}
                loading={state.loading}
                type="number"
                min={2}
                initialValue={orgSettings.maxOrgPerUser}
                label={t('team.orgs.invite.maxOrgs')}
                placeholder={t('team.orgs.invite.maxOrgs')}
                onSubmit={(value) => onSettingsOrgMaxMembers('maxOrgPerUser', value)}
              />
              <FormTextInput
                style={{ marginTop: 0 }}
                disabled={disabled}
                loading={state.loading}
                type="number"
                min={2}
                initialValue={orgSettings.maxMemberPerOrg}
                label={t('team.orgs.invite.maxMembers')}
                placeholder={t('team.orgs.invite.maxMembers')}
                onSubmit={(value) => onSettingsOrgMaxMembers('maxMemberPerOrg', value)}
              />
            </Box>
          )}
        </Box>
      </Section>
    </Stack>
  );
}

const BlockletDangerZoneInDaemon = withPermission(BlockletDangerZone, 'mutate_blocklets');
const BlockletDangerZoneInService = withPermission(BlockletDangerZone, '', BlockletAdminRoles);

export default function BlockletDangerZoneWithPermission(props) {
  const { inService } = useNodeContext();
  if (inService) {
    return <BlockletDangerZoneInService {...props} />;
  }

  return <BlockletDangerZoneInDaemon {...props} />;
}

BlockletDangerZone.propTypes = {
  blocklet: PropTypes.object.isRequired,
  onUpdate: PropTypes.func,
  hasPermission: PropTypes.bool,
};
