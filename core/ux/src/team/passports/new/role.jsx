import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';

import Toast from '@arcblock/ux/lib/Toast';
import Button from '@arcblock/ux/lib/Button';
import SplitButton from '@arcblock/ux/lib/SplitButton';
import Spinner from '@mui/material/CircularProgress';
import Dialog from '@arcblock/ux/lib/Dialog';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useNodeContext } from '../../../contexts/node';
import { useTeamContext } from '../../../contexts/team';
import { sleep, BlockletAdminRoles } from '../../../util';
import Permission from '../../../permission';
import Color from '../color';
import TrustedIssuers from '../trusted-issuers';
import TrustedFactories from '../trusted-factories';
import Passports from '../index';

export default function PassportRole({ createPassportSvg }) {
  const { t } = useLocaleContext();
  const { api, inService } = useNodeContext();
  const { teamDid, refresh: refreshTeam, enablePassportIssuance, isNodeTeam } = useTeamContext();

  const [showColor, setShowColor] = useState(false);
  const [showTrustedIssuers, setShowTrustedIssuers] = useState(false);
  const [showTrustedFactories, setShowTrustedFactories] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roleDialog, setRoleDialog] = useState(false);

  const toggleShowIssue = async (e) => {
    e.stopPropagation();

    if (loading) {
      return;
    }
    setLoading(true);
    try {
      await api.configPassportIssuance({ input: { teamDid, enable: !enablePassportIssuance } });
      refreshTeam();
      await sleep(800);
      Toast.success(t('common.configSuccess'));
    } catch (error) {
      Toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        ml: 1,
      }}>
      <Permission permission={inService ? '' : 'mutate_team'} role={inService ? BlockletAdminRoles : []}>
        <SplitButton
          variant="outlined"
          menuButtonProps={{ 'data-cy': 'trusted-issuers-more' }}
          menu={
            <>
              <SplitButton.Item onClick={() => setShowTrustedIssuers(true)} data-cy="config-trusted-issuers">
                <Box>
                  {t('team.passport.trustedPassportIssuers')}
                  <Box
                    sx={{
                      fontSize: 12,
                      color: '#888',
                    }}>
                    {t('team.passport.trustedPassportIssuersTip')}
                  </Box>
                </Box>
              </SplitButton.Item>

              <SplitButton.Item onClick={() => setShowTrustedFactories(true)} data-cy="config-show-trusted-factories">
                <Box>
                  {t('team.passport.configFactories')}
                  <Box
                    sx={{
                      fontSize: 12,
                      color: '#888',
                    }}>
                    {t('team.passport.configFactoriesTip')}
                  </Box>
                </Box>
              </SplitButton.Item>
              <SplitButton.Item data-cy="config-show-issue-passport" onClick={toggleShowIssue}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                  {loading && <Spinner size={16} style={{ marginRight: 8 }} />}
                  <Box>
                    {enablePassportIssuance ? t('team.passport.disableIssuance') : t('team.passport.enableIssuance')}
                    <Box
                      sx={{
                        fontSize: 12,
                        color: '#888',
                      }}>
                      {enablePassportIssuance
                        ? t('team.passport.disableIssuanceTip')
                        : t('team.passport.enableIssuanceTip')}
                    </Box>
                  </Box>
                </Box>
              </SplitButton.Item>
              {!isNodeTeam && (
                <SplitButton.Item onClick={() => setShowColor(true)} data-cy="config-passport-color">
                  <Box>
                    {t('team.passport.configColor')}
                    <Box
                      sx={{
                        fontSize: 12,
                        color: '#888',
                      }}>
                      {t('team.passport.configColorTip')}
                    </Box>
                  </Box>
                </SplitButton.Item>
              )}
            </>
          }>
          {() => (
            <Button
              variant="outlined"
              onClick={() => {
                setRoleDialog(true);
              }}>
              {t('team.passport.view')}
            </Button>
          )}
        </SplitButton>
      </Permission>
      {showTrustedIssuers && <TrustedIssuers onCancel={() => setShowTrustedIssuers(false)} />}
      {showTrustedFactories && <TrustedFactories onCancel={() => setShowTrustedFactories(false)} />}
      {showColor && <Color onCancel={() => setShowColor(false)} onSuccess={() => setShowColor(false)} />}
      {roleDialog && (
        <Dialog
          open
          maxWidth="lg"
          onClose={() => setRoleDialog(false)}
          onBackdropClick={() => setRoleDialog(false)}
          onEscapeKeyDown={() => setRoleDialog(false)}
          title={t('team.passport.view')}>
          <Passports createPassportSvg={createPassportSvg} onCancel={() => setRoleDialog(false)} />
        </Dialog>
      )}
    </Box>
  );
}

PassportRole.propTypes = {
  createPassportSvg: PropTypes.func.isRequired,
};
