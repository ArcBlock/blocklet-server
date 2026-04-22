/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-nested-ternary */
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import ms from 'ms';
import { isValid } from '@arcblock/did';

import Dialog from '@arcblock/ux/lib/Dialog';
import Spinner from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

import { MAIN_CHAIN_ENDPOINT } from '@abtnode/constant';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';

import useSetState from 'react-use/lib/useSetState';
import Toast from '@arcblock/ux/lib/Toast';

import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';
import { sleep, formatError } from '../../util';

import getChainClient from '../../chain';

export default function TrustedFactory({ onCancel, onSuccess, data = {}, trustedFactories = [] }) {
  const { api } = useNodeContext();
  const { roles, teamDid } = useTeamContext();
  const { t } = useLocaleContext();
  const [state, setState] = useSetState({
    loading: false,
    fetching: false,
    fetched: [],
    errored: [],
    factoryAddress: data.factoryAddress || '',
    remark: data.remark || '',
    role: data.passport?.role || 'member',
    ttlPolicy: data.passport?.ttlPolicy || 'never',
    // eslint-disable-next-line no-unsafe-optional-chaining
    ttl: ms(+data.passport?.ttl || 365 * 24 * 60 * 60 * 1000),
    error: '',
  });

  const editIndex = trustedFactories.findIndex((x) => x.factoryAddress === data.factoryAddress);

  const configTrustedFactories = async () => {
    if (state.loading) {
      return;
    }

    const { factoryAddress, remark, role, ttlPolicy, ttl } = state;
    const item = {
      factoryAddress,
      remark,
      passport: { role, ttlPolicy, ttl: ttlPolicy === 'never' ? 0 : ms(ttl) },
    };

    const trustedList = [...trustedFactories];

    if (editIndex === -1) {
      trustedList.unshift(item);
    } else {
      trustedList[editIndex] = item;
    }

    try {
      setState({ loading: true });
      await api.configTrustedFactories({ input: { teamDid, trustedFactories: trustedList } });
      await sleep(800);
      Toast.success(t('common.saveSuccess'));
      onSuccess();
    } catch (err) {
      console.error(err);
      Toast.error(formatError(err));
    } finally {
      setState({ loading: false });
    }
  };

  useEffect(() => {
    const fetched = state.fetched.find((x) => x.address === state.factoryAddress);
    const errored = state.errored.find((x) => x.address === state.factoryAddress);
    if (isValid(state.factoryAddress) && !state.fetching && !fetched && !errored) {
      setState({ fetching: true });
      const client = getChainClient(MAIN_CHAIN_ENDPOINT);
      client
        .getFactoryState({ address: state.factoryAddress })
        .then((res) => {
          if (res.state) {
            setState({
              fetching: false,
              fetched: [...state.fetched.filter((x) => x.address !== state.factoryAddress), res.state],
              remark: res.state.name,
            });
          } else {
            setState({
              fetching: false,
              errored: [
                ...state.errored.filter((x) => x.address !== state.factoryAddress),
                { address: state.factoryAddress },
              ],
              error: t('team.passport.factory404', state),
            });
          }
        })
        .catch((err) => {
          console.error(err);
          setState({ fetching: false, error: formatError(err) });
        });
    }
  }, [state.factoryAddress, state.fetching]);

  let tip = state.error;
  const errored = state.factoryAddress ? state.errored.find((x) => x.address === state.factoryAddress) : null;
  if (!tip && errored) {
    tip = t('team.passport.factory404', state);
  }
  const fetched = state.factoryAddress ? state.fetched.find((x) => x.address === state.factoryAddress) : null;
  if (!tip && fetched) {
    tip = fetched.description;
  }
  if (!tip) {
    tip = t('team.passport.factoryAddressTip');
  }

  return (
    <Dialog
      title={t('team.passport.trustedFactories')}
      open
      showCloseButton={false}
      PaperProps={{ style: { minHeight: '80vh' } }}
      fullWidth
      prepend={
        <IconButton onClick={onCancel} data-cy="close-trusted-factory" size="large">
          <ArrowBackIcon />
        </IconButton>
      }
      actions={
        <>
          <Button onClick={onCancel} color="inherit">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => configTrustedFactories()}
            color="primary"
            disabled={!state.factoryAddress || !state.remark || !state.role || state.loading || state.error || errored}
            variant="contained"
            autoFocus
            data-cy="save-trusted-factory">
            {state.loading && <Spinner size={16} />}
            {t('common.save')}
          </Button>
        </>
      }>
      <Div>
        <div className="dialog-content">
          <TextField
            fullWidth
            error={!!state.error || !!errored}
            data-cy="input-factory-address"
            label={t('team.passport.factoryAddress')}
            helperText={tip}
            value={state.factoryAddress}
            onChange={(e) => {
              setState({ factoryAddress: e.target.value, error: '' });
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
          <TextField
            style={{ marginTop: 32 }}
            fullWidth
            data-cy="input-factory-remark"
            label={t('common.remark')}
            value={state.remark}
            onChange={(e) => {
              setState({ remark: e.target.value });
            }}
          />
          <TextField
            style={{ marginTop: 32 }}
            fullWidth
            data-cy="input-passport-role"
            label={t('team.passport.role')}
            select
            value={state.role}
            onChange={(e) => {
              setState({ role: e.target.value });
            }}
            variant="outlined">
            {roles
              .filter((d) => d.name !== 'owner')
              .map((r) => (
                <MenuItem key={r.name} value={r.name} data-cy={`passport-role-select-option-${r.name}`}>
                  <span>{r.title || r.name}</span>
                </MenuItem>
              ))}
          </TextField>

          <div style={{ marginTop: 32 }}>
            <InputLabel>{t('team.passport.ttl')}</InputLabel>
            <ToggleButtonGroup
              color="primary"
              size="small"
              value={state.ttlPolicy}
              exclusive
              style={{ marginTop: 16 }}
              onChange={(e, value) => setState({ ttlPolicy: value })}
              data-cy="input-passport-ttl-since"
              aria-label="Expire Policy">
              <ToggleButton value="never" data-cy="input-passport-ttl-never">
                <Tooltip title={t('team.passport.ttlNeverTip')}>
                  <Typography>{t('team.passport.ttlNever')}</Typography>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="mint" data-cy="input-passport-ttl-mint">
                <Tooltip title={t('team.passport.ttlMintTip')}>
                  <Typography>{t('team.passport.ttlMint')}</Typography>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="exchange" data-cy="input-passport-ttl-exchange">
                <Tooltip title={t('team.passport.ttlExchangeTip')}>
                  <Typography>{t('team.passport.ttlExchange')}</Typography>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
            {state.ttlPolicy !== 'never' && (
              <>
                <OutlinedInput
                  fullWidth
                  type="text"
                  style={{ marginTop: 16 }}
                  data-cy="input-passport-ttl"
                  value={state.ttl}
                  onChange={(e) => {
                    setState({ ttl: e.target.value });
                  }}
                />
                <FormHelperText>{t('team.passport.ttlTip')}</FormHelperText>
              </>
            )}
          </div>
        </div>
      </Div>
    </Dialog>
  );
}

TrustedFactory.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  trustedFactories: PropTypes.array,
  data: PropTypes.object,
};

const Div = styled.div`
  .dialog-h1 {
    font-size: 18px;
  }

  .list {
    .MuiIconButton-root {
      svg {
        fill: #bfbfbf;
      }
    }
  }
`;
