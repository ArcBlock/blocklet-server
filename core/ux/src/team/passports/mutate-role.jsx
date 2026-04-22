import React, { useState } from 'react';
import PropTypes from 'prop-types';
import md5 from 'md5';

import Dialog from '@arcblock/ux/lib/Dialog';
import Spinner from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormHelperText from '@mui/material/FormHelperText';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';
import Alert from '@mui/material/Alert';

import { useNodeContext } from '../../contexts/node';
import { formatError } from '../../util';

export default function MutateRole({
  teamDid,
  onCancel,
  onSuccess,
  onError = () => {},
  mode = 'create',
  item = {},
  orgId = '',
}) {
  const { api } = useNodeContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLocaleContext();

  const [title, setTitle] = useState(item.title || '');
  const [description, setDescription] = useState(item.description || '');
  const [display, setDisplay] = useState(item?.extra?.display || 'builtin');
  const [types, setTypes] = useState(item?.extra?.types ? item.extra.types.join(',') : '');

  const onCreate = async () => {
    const _title = title.trim();
    if (!_title) {
      setError(t('team.passport.error.titleEmpty'));
      return;
    }

    if (_title.length > 64) {
      setError(t('team.passport.error.titleTooLong', { length: 64 }));
      return;
    }

    const desc = description.replace(/\n/g, ' ');
    if (!desc) {
      setError(t('team.passport.error.descriptionEmpty'));
      return;
    }

    const name = mode === 'create' ? md5(orgId ? `${orgId}-${_title}` : _title) : item.name;

    setError(null);
    setLoading(true);

    try {
      if (mode === 'create') {
        const input = { teamDid, name, title: _title, description: desc, ...(orgId ? { orgId } : {}) };
        if (display === 'custom') {
          input.extra = JSON.stringify({
            display: 'custom',
            types: types.split(','),
          });
        }
        await api.createRole({ input });
      } else {
        const input = { teamDid, role: { name, title: _title, description: desc }, ...(orgId ? { orgId } : {}) };
        await api.updateRole({ input });
      }
      onSuccess();
    } catch (err) {
      const errMsg = formatError(err);
      setError(errMsg);
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  const body = (
    <div>
      {mode === 'update' && (
        <Typography component="div" style={{ paddingTop: 16 }}>
          <TextField
            label="ID"
            autoComplete="off"
            variant="outlined"
            name="url"
            data-cy="mutate-role-input-name"
            fullWidth
            autoFocus
            value={item.name}
            disabled
          />
        </Typography>
      )}

      <Typography component="div" style={{ marginTop: 16 }}>
        <TextField
          label={t('common.title')}
          autoComplete="off"
          variant="outlined"
          name="title"
          data-cy="mutate-role-input-title"
          fullWidth
          autoFocus
          value={title}
          onChange={(e) => {
            setError(null);
            setTitle(e.target.value);
          }}
          disabled={mode === 'update' || loading}
          helperText={t('team.passport.create.titleTip')}
        />
      </Typography>

      <Typography component="div" style={{ marginTop: 16, marginBottom: 16 }}>
        <TextField
          label={t('common.description')}
          autoComplete="off"
          variant="outlined"
          name="description"
          data-cy="mutate-role-input-description"
          fullWidth
          autoFocus
          value={description}
          onChange={(e) => {
            setError(null);
            setDescription(e.target.value);
          }}
          disabled={loading}
          multiline
          rows={3}
        />
      </Typography>

      {mode === 'create' && (
        <div style={{ marginBottom: 16 }}>
          <InputLabel>{t('common.display')}</InputLabel>
          <ToggleButtonGroup
            color="primary"
            size="small"
            value={display}
            exclusive
            style={{ marginTop: 16 }}
            disabled={loading}
            onChange={(e, value) => setDisplay(value)}
            data-cy="input-role-display">
            <ToggleButton value="builtin" data-cy="input-role-display-builtin">
              <Typography>{t('team.passport.displayBuiltin')}</Typography>
            </ToggleButton>
            <ToggleButton value="custom" data-cy="input-role-display-custom">
              <Typography>{t('team.passport.displayCustom')}</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
          {display === 'custom' && (
            <>
              <OutlinedInput
                fullWidth
                type="text"
                style={{ marginTop: 16 }}
                data-cy="input-role-types"
                value={types}
                disabled={loading}
                onChange={(e) => {
                  setTypes(e.target.value);
                }}
              />
              <FormHelperText>{t('team.passport.typesTip')}</FormHelperText>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Dialog
      title={mode === 'create' ? t('team.passport.create.title') : ''}
      fullWidth
      open
      onClose={onCancel}
      showCloseButton={false}
      actions={
        <>
          <Button onClick={onCancel} color="inherit">
            {t('common.cancel')}
          </Button>
          <Button
            data-cy="mutate-role-confirm"
            onClick={onCreate}
            color="primary"
            disabled={loading}
            variant="contained"
            autoFocus>
            {loading && <Spinner size={16} />}
            {mode === 'create' ? t('common.create') : t('common.update')}
          </Button>
        </>
      }>
      <DialogContentText component="div">{body}</DialogContentText>
      {!!error && (
        <Alert severity="error" style={{ width: '100%', margin: 0 }}>
          {error}
        </Alert>
      )}
    </Dialog>
  );
}

MutateRole.propTypes = {
  teamDid: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func,
  mode: PropTypes.oneOf(['create', 'update']),
  item: PropTypes.object,
  orgId: PropTypes.string, // 用于记录是否是一个 org 下的私有角色
};
