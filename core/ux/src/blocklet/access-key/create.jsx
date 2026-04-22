import { useState } from 'react';
import PropTypes from 'prop-types';

import AddIcon from '@mui/icons-material/Add';
import Spinner from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Box from '@mui/material/Box';

import Button from '@arcblock/ux/lib/Button';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import ArrowDownwardIcon from '@arcblock/icons/lib/ArrowDown';

import TimeSelect from '../../team/members/time-select';
import Confirm from '../../../lib/confirm';
import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';
import { AuthType } from './component';
import useAccessKeyRoles from './use-roles';

export default function CreateAccessKey({ onCreate = () => {}, remark = '' }) {
  const { api } = useNodeContext();
  const { teamDid } = useTeamContext();
  const { t } = useLocaleContext();
  const [loading, setLoading] = useState(false);
  const [confirmSetting, setConfirmSetting] = useState(null);

  const roles = useAccessKeyRoles();

  const onCancel = () => {
    setLoading(false);
    setConfirmSetting(null);
  };

  const onConfirm = async (params) => {
    // eslint-disable-next-line no-shadow
    const { remark, passport, authType } = params;
    setLoading(true);
    const res = await api.createAccessKey({
      input: {
        teamDid,
        remark: remark.trim(),
        passport,
        expireAt: params.expireAt ? new Date(params.expireAt).getTime() : null,
        authType,
      },
    });
    const { data } = res;
    onCreate(data);
    setConfirmSetting(null);
    setLoading(false);
  };

  const setting = {
    title: `${t('common.create')} ${t('accessKey')}`,
    // eslint-disable-next-line react/no-unstable-nested-components
    description: (params, setParams, setError) => (
      <Stack
        sx={{
          gap: 3,
        }}>
        <TextField
          label={t('setting.accessKey.tip')}
          autoComplete="off"
          variant="outlined"
          name="remark"
          fullWidth
          autoFocus
          margin="dense"
          value={params.remark}
          onChange={(e) => {
            setParams({
              ...params,
              remark: e.target.value,
              __disableConfirm: !params.passport || !e.target.value.trim(),
            });
            if (!e.target.value.trim()) {
              setError(t('setting.accessKey.remarkInvalid'));
            } else {
              setError('');
            }
          }}
          slotProps={{
            htmlInput: {
              'data-cy': 'remark-input',
            },
          }}
        />

        <FormControl style={{ width: '100%' }} variant="outlined">
          <InputLabel
            sx={{
              width: 'calc(100% - 46px)',
            }}>
            {t('setting.accessKey.passport')}
          </InputLabel>
          <Select
            data-cy="create-access-key-select-passport"
            value={params.passport}
            onChange={(e) => {
              const passport = e.target.value;
              setError(null);
              setParams({
                ...params,
                passport,
                __disableConfirm: !params.remark || !passport,
              });
            }}
            fullWidth
            label={t('setting.accessKey.passport')}
            disabled={loading}
            // eslint-disable-next-line react/no-unstable-nested-components
            IconComponent={(props) => <ArrowDownwardIcon {...props} width={20} height={20} />}>
            {roles.map((r) => (
              <MenuItem key={r.name} value={r.name} data-cy={`create-access-key-passport-option-${r.name}`}>
                <Box>
                  <span>{r.title || r.name}</span>
                  <Box
                    sx={{
                      maxWidth: 440,
                      fontSize: 12,
                      color: '#999',
                      whiteSpace: 'normal',
                      textAlign: 'justify',
                    }}>
                    {r.description}
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <AuthType
          value={params.authType}
          onChange={(e) => {
            setParams({ ...params, authType: e.target.value });
          }}
        />

        <TimeSelect
          placeholder={t('setting.accessKey.expireTime')}
          value={params.expireAt}
          onChange={(newValue) => {
            setParams({
              ...params,
              expireAt: newValue,
              __disableConfirm: !params.passport || !params.remark || !newValue,
            });
          }}
        />
      </Stack>
    ),
    confirm: t('common.confirm'),
    cancel: t('common.cancel'),
    color: 'primary',
    params: {
      remark,
      authType: 'signature',
      __disableConfirm: !remark.trim(),
    },
    onConfirm,
    onCancel,
  };

  return (
    <>
      <Button
        edge="end"
        variant="contained"
        color="primary"
        data-cy="add-access-key-btn"
        onClick={(e) => {
          e.stopPropagation();
          setConfirmSetting(setting);
        }}
        className="rule-action">
        {loading ? <Spinner size={16} /> : <AddIcon style={{ fontSize: 16 }} />}
        {t('common.create')}
      </Button>

      {confirmSetting && (
        <Confirm
          title={confirmSetting.title}
          description={confirmSetting.description}
          confirm={confirmSetting.confirm}
          color={confirmSetting.color}
          cancel={confirmSetting.cancel}
          params={confirmSetting.params}
          onConfirm={confirmSetting.onConfirm}
          onCancel={confirmSetting.onCancel}
        />
      )}
    </>
  );
}

CreateAccessKey.propTypes = {
  remark: PropTypes.string,
  onCreate: PropTypes.func,
};
