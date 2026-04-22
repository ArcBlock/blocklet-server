import { useState } from 'react';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import TimeSelect from '../../team/members/time-select';
import Confirm from '../../../lib/confirm';
import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';
import { AuthType } from './component';
import useAccessKeyRoles from './use-roles';

export default function UpdateAccessKey({
  accessKeyId,
  remark = '',
  onUpdate = () => {},
  passport = '',
  expireAt = '',
  authType = 'signature',
  onClose = () => {},
}) {
  const { api } = useNodeContext();
  const { teamDid } = useTeamContext();
  const { t } = useLocaleContext();
  const [loading, setLoading] = useState(false);

  const roles = useAccessKeyRoles();

  const onCancel = () => {
    setLoading(false);
    onClose();
  };

  const onConfirm = async (params) => {
    // eslint-disable-next-line no-shadow
    const { accessKeyId, remark = '', passport, expireAt, authType } = params;
    setLoading(true);
    await api.updateAccessKey({
      input: {
        teamDid,
        accessKeyId,
        remark: remark.trim(),
        passport,
        expireAt: expireAt ? new Date(expireAt).getTime() : null,
        authType,
      },
    });
    onUpdate();
    onCancel();
  };

  const confirmSetting = {
    title: `${t('common.update')} ${t('accessKey')}`,
    // eslint-disable-next-line react/no-unstable-nested-components
    description: (params, setParams, setError) => (
      <Stack
        sx={{
          gap: 3,
        }}>
        <TextField
          label={t('setting.accessKey.accessKeyId')}
          autoComplete="off"
          variant="outlined"
          name="accessKeyId"
          fullWidth
          autoFocus
          margin="dense"
          value={params.accessKeyId}
          disabled
        />
        <TextField
          label={t('common.remark')}
          autoComplete="off"
          variant="outlined"
          name="remark"
          fullWidth
          autoFocus
          value={params.remark}
          onChange={(e) => {
            setParams({ ...params, remark: e.target.value, __disableConfirm: !e.target.value.trim() });
            if (!e.target.value.trim()) {
              setError(t('setting.accessKey.remarkInvalid'));
            } else {
              setError('');
            }
          }}
        />

        <FormControl style={{ width: '100%' }} variant="outlined">
          <InputLabel>{t('setting.accessKey.passport')}</InputLabel>
          <Select
            data-cy="update-access-key-select-passport"
            value={params.passport}
            onChange={(e) => {
              // eslint-disable-next-line no-shadow
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
            disabled={loading}>
            {roles.map((r) => (
              <MenuItem key={r.name} value={r.name} data-cy={`update-access-key-passport-option-${r.name}`}>
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
          disabled
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
      accessKeyId,
      remark,
      passport,
      expireAt,
      authType,
    },
    onConfirm,
    onCancel,
  };

  return (
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
  );
}

UpdateAccessKey.propTypes = {
  accessKeyId: PropTypes.string.isRequired,
  remark: PropTypes.string,
  passport: PropTypes.string,
  expireAt: PropTypes.string,
  authType: PropTypes.string,
  onUpdate: PropTypes.func,
  onClose: PropTypes.func,
};
