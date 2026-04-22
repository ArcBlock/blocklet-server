import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSetState } from 'ahooks';
import uniq from 'lodash/uniq';

import Dialog from '@arcblock/ux/lib/Dialog';
import Button from '@arcblock/ux/lib/Button';
import DID from '@arcblock/ux/lib/DID';
import InfoRow from '@arcblock/ux/lib/InfoRow';
import { schemas } from '@arcblock/validator';

import Stack from '@mui/material/Stack';
import Spinner from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import VaultIcon from '@mui/icons-material/AccountBalanceWalletOutlined';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { isValid, toAddress, toTypeInfoStr } from '@arcblock/did';
import { MAIN_CHAIN_ENDPOINT } from '@abtnode/constant';
import { formatError } from '@blocklet/error';

import getChainClient from '../../chain';
import { formatDateTime } from '../../util';
import { useSessionContext } from '../../contexts/session';
import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';
import DidAddress from '../../did-address';

import VaultStatus from './status';

export default function ConfigVault({ onCancel, onSuccess, blocklet }) {
  const { vaults = [], appPid } = blocklet;
  const { t, locale } = useLocaleContext();
  const { connectApi } = useSessionContext();
  const { api } = useNodeContext();
  const { teamDid } = useTeamContext();

  const [state, setState] = useSetState({
    loading: false,
    fetching: false,
    error: '',
    address: '',
    fetched: [],
    errored: [],
  });

  useEffect(() => {
    if (!isValid(state.address)) {
      return;
    }

    const vaultDid = toAddress(state.address);
    const fetched = state.fetched.find((x) => x.address === vaultDid);
    const errored = state.errored.find((x) => x.address === vaultDid);

    if (!state.fetching && !fetched && !errored) {
      setState({ fetching: true });
      const client = getChainClient(MAIN_CHAIN_ENDPOINT);
      client
        .getAccountState({ address: vaultDid })
        .then((res) => {
          if (res.state) {
            setState({
              fetching: false,
              fetched: [...state.fetched.filter((x) => x.address !== vaultDid), res.state],
            });
          } else {
            setState({
              fetching: false,
              errored: [...state.errored.filter((x) => x.address !== vaultDid), { address: vaultDid }],
            });
          }
        })
        .catch((err) => {
          console.error(err);
          setState({ fetching: false, error: formatError(err) });
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.address, state.fetching]);

  useEffect(() => {
    if (state.address) {
      const vaultDid = toAddress(state.address);
      if (!isValid(vaultDid)) {
        setState({ error: t('blocklet.config.vault.error.invalid') });
        return;
      }

      if (schemas.tokenHolder.validate(vaultDid).error) {
        setState({ error: t('blocklet.config.vault.error.holder') });
        return;
      }

      if (vaults.find((x) => x.did === vaultDid)) {
        setState({ error: t('blocklet.config.vault.error.duplicate') });
        return;
      }

      const appDids = uniq(
        [blocklet.appDid, blocklet.appPid, ...blocklet.migratedFrom.map((x) => x.appDid)].filter(Boolean)
      );
      if (appDids.includes(vaultDid)) {
        setState({ error: t('blocklet.config.vault.error.appDid') });
        return;
      }
    }

    setState({ error: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.address]);

  const handleSubmit = async () => {
    setState({ loading: true });

    try {
      const result = await api.configVault({
        input: {
          teamDid,
          vaultDid: toAddress(state.address),
        },
      });
      connectApi.open({
        locale,
        action: 'approve-vault',
        forceConnected: false,
        saveConnect: false,
        autoConnect: false,
        className: 'connect',
        checkTimeout: 10 * 60 * 1000,
        passkeyBehavior: 'none',
        extraParams: {
          sessionId: result.sessionId,
        },
        messages: {
          title: t('blocklet.config.vault.approve.title'),
          scan: t(`blocklet.config.vault.approve.${vaults.length > 0 ? 'byLast' : 'byOwner'}`),
          confirm: t('blocklet.config.vault.approve.confirm'),
          success: t('blocklet.config.vault.approve.success'),
        },
        onSuccess: () => {
          connectApi.open({
            locale,
            action: 'config-vault',
            forceConnected: false,
            saveConnect: false,
            autoConnect: false,
            className: 'connect',
            checkTimeout: 10 * 60 * 1000,
            passkeyBehavior: 'none',
            extraParams: {
              sessionId: result.sessionId,
            },
            messages: {
              title: t('blocklet.config.vault.commit.title'),
              scan: t('blocklet.config.vault.commit.scan'),
              confirm: t('blocklet.config.vault.commit.confirm'),
              success: t('blocklet.config.vault.commit.success'),
            },
            onSuccess: () => {
              setState({ loading: false });
              onSuccess();
            },
            onClose: () => {
              setState({ loading: false });
              connectApi.close();
            },
          });
        },
        onClose: () => {
          setState({ loading: false });
          connectApi.close();
        },
      });
    } catch (err) {
      setState({ loading: false, error: formatError(err) });
    }
  };

  const vaultDid = toAddress(state.address);

  const rows = [];
  if (isValid(vaultDid)) {
    rows.push({
      key: t('blocklet.config.vault.role'),
      value: <Chip color="primary" variant="outlined" size="small" label={toTypeInfoStr(vaultDid).role || '-'} />,
    });
  }

  const fetched = state.fetched.find((x) => x.address === vaultDid);
  if (fetched) {
    rows.push(
      {
        key: t('blocklet.config.vault.firstSeen'),
        value: formatDateTime(fetched.context?.genesisTime, '-'),
      },
      {
        key: t('blocklet.config.vault.lastSeen'),
        value: formatDateTime(fetched.context?.renaissanceTime, '-'),
      },
      {
        key: t('blocklet.config.vault.migratedFrom'),
        value: fetched.migratedFrom.length
          ? fetched.migratedFrom.map((x) => <DID key={x} did={x} showQrcode compact size={14} locale={locale} />)
          : '-',
      },
      {
        key: t('blocklet.config.vault.migratedTo'),
        value: fetched.migratedTo.length
          ? fetched.migratedTo.map((x) => <DID key={x} did={x} showQrcode compact size={14} locale={locale} />)
          : '-',
      }
    );
  }

  return (
    <Dialog
      open
      fullWidth
      showCloseButton={false}
      onClose={onCancel}
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VaultIcon />
          {t('blocklet.config.vault.title')}
        </Box>
      }
      actions={
        <>
          <Button onClick={onCancel}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!!state.error || state.loading}>
            {t('common.confirm')}
          </Button>
        </>
      }>
      <Stack direction="column" spacing={3}>
        <Typography
          variant="body1"
          gutterBottom
          sx={{
            color: 'text.secondary',
          }}>
          {t('blocklet.config.vault.desc')}&nbsp;
          {t('blocklet.config.vault.tip')}
        </Typography>
        {vaults.length > 0 && (
          <Box>
            <Typography
              variant="body1"
              gutterBottom
              sx={{
                color: 'text.secondary',
              }}>
              {t('blocklet.config.vault.current')}:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <DidAddress did={vaults[vaults.length - 1].did} showQrcode style={{ width: 'auto' }} />
              <VaultStatus vaults={vaults} appPid={appPid} />
            </Box>
          </Box>
        )}
        <TextField
          fullWidth
          data-cy="input-factory-address"
          label={t('blocklet.config.vault.address')}
          error={!!state.error}
          helperText={state.error}
          value={state.address}
          onChange={(e) => {
            setState({ address: e.target.value, error: '' });
          }}
          slotProps={{
            input: {
              endAdornment: state.fetching ? (
                <InputAdornment position="end">
                  <Spinner size={16} />
                </InputAdornment>
              ) : null,
            },
          }}
        />
        <Box sx={{ '& .info-row__name': { fontSize: '14px' }, '& .info-row__value': { fontSize: '14px' } }}>
          {rows.map((row) => (
            <InfoRow key={row.key} valueComponent="div" nameWidth={120} name={row.key}>
              {row.value}
            </InfoRow>
          ))}
        </Box>
      </Stack>
    </Dialog>
  );
}

ConfigVault.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  blocklet: PropTypes.object.isRequired,
};
