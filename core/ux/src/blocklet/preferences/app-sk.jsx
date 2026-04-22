import React from 'react';
import PropTypes from 'prop-types';
import useSetState from 'react-use/lib/useSetState';
import DidConnect from '@arcblock/did-connect-react/lib/Connect';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconKey from '@mui/icons-material/KeyOutlined';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { isInProgress } from '@blocklet/meta/lib/util';
import Toast from '@arcblock/ux/lib/Toast';

import Confirm from '../../confirm';
import { useSessionContext } from '../../contexts/session';
import { useBlockletContext } from '../../contexts/blocklet';
import Section from '../../component/section';

export default function AppSk({ onChange = () => {}, disabled = false, loading = false, inService = false }) {
  const { t } = useLocaleContext();
  const { api, session } = useSessionContext();
  const { blocklet } = useBlockletContext();

  const [state, setState] = useSetState({ newAppSk: '', isConnectOpen: false, confirmDialogOpen: false });

  const onClose = () => setState({ isConnectOpen: false });
  const onStart = () => {
    if (isInProgress(blocklet.status)) {
      Toast.error(t('blocklet.error.isInProgress'));
      return;
    }
    setState({ confirmDialogOpen: true });
  };

  return (
    <>
      <Section title={t('blocklet.config.migrate.button')} desc={t('blocklet.config.migrate.description')}>
        <Box sx={{ alignSelf: { xs: 'flex-start', md: 'flex-end' } }}>
          <Button
            style={{ flexShrink: 0 }}
            variant="contained"
            color="primary"
            size="small"
            data-cy="config-did"
            disabled={disabled || loading}
            onClick={onStart}>
            <IconKey style={{ fontSize: '1.3em', marginRight: 4 }} />
            {t('blocklet.config.migrate.button')}
          </Button>
        </Box>
      </Section>

      <>
        {state.isConnectOpen && (
          <DidConnect
            popup
            open={state.isConnectOpen}
            forceConnected={false}
            saveConnect={false}
            action="rotate-key-pair"
            checkFn={api.get}
            checkTimeout={5 * 60 * 1000}
            onSuccess={() => {
              onChange();

              if (inService) {
                session.logout();
              }

              onClose();
            }}
            extraParams={{ appDid: blocklet.appDid }}
            messages={{
              title: t('setup.keyPair.title'),
              scan: t('setup.keyPair.scan'),
              confirm: t('setup.keyPair.confirm'),
              success: t('setup.keyPair.success'),
            }}
            onClose={onClose}
          />
        )}
        {state.confirmDialogOpen && (
          <Confirm
            title={
              <Typography
                sx={{
                  fontSize: '20px',
                  fontWeight: '500',
                }}>
                {t('blocklet.config.migrate.title')}
              </Typography>
            }
            description={
              <Typography
                sx={{
                  fontSize: '14px',
                  color: '#9397A1',
                }}>
                {t('blocklet.config.migrate.confirm')}
              </Typography>
            }
            confirm={t('common.confirm')}
            cancel={t('common.cancel')}
            onConfirm={() => setState({ confirmDialogOpen: false, isConnectOpen: true })}
            onCancel={() => setState({ confirmDialogOpen: false })}
          />
        )}
      </>
    </>
  );
}

AppSk.propTypes = {
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  inService: PropTypes.bool,
};
