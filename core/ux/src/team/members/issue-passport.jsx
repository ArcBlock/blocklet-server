import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import Dialog from '@arcblock/ux/lib/Dialog';
import Spinner from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Button from '@arcblock/ux/lib/Button';
import Alert from '@mui/material/Alert';
import { useReactive } from 'ahooks';

import { Box, TextField } from '@mui/material';
import { useNodeContext } from '../../contexts/node';
import { formatError } from '../../util';
import TimeSelect from './time-select';

export default function IssuePassport({
  teamDid,
  ownerDid,
  needReceive = true,
  roles = [],
  onCancel,
  onSuccess,
  onError = () => {},
  showOwnerPassport = false,
}) {
  const { api } = useNodeContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLocaleContext();

  const [role, setRole] = useState('');
  const [display, setDisplay] = useState('');

  const currentState = useReactive({
    passportExpireTime: null,
  });

  useEffect(() => {
    if (roles.length > 0) {
      setRole(roles[0].name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = async () => {
    if (!role) {
      setError(t('team.member.error.passportEmpty'));
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const args = {
        teamDid,
        name: role,
        ownerDid,
        passportExpireTime: currentState.passportExpireTime ? currentState.passportExpireTime.toISOString() : '',
      };
      if (display) {
        args.display = { type: 'url', content: display };
      }
      await api.createPassportIssuance({ input: args });
      onSuccess();
    } catch (err) {
      const errMsg = formatError(err);
      setError(errMsg);
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find((r) => r.name === role);

  return (
    <Dialog
      title={t('team.passport.issue')}
      fullWidth
      open
      onClick={(e) => e.stopPropagation()}
      onClose={onCancel}
      disableEscapeKeyDown
      PaperProps={{ style: { minHeight: 'auto' } }}
      actions={
        <>
          <Button onClick={onCancel} color="inherit" size="small">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={onCreate}
            color="primary"
            size="small"
            disabled={loading || !role}
            variant="contained"
            autoFocus
            data-cy="issue-passport-create-btn">
            {loading && <Spinner size={16} />}
            {needReceive ? t('team.passport.issuance.create.title') : t('authentication.issued')}
          </Button>
        </>
      }>
      <DialogContentText component="div">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl style={{ width: '100%' }} variant="outlined">
            <InputLabel>{t('common.passport')}</InputLabel>
            <Select
              data-cy="issue-passport-select-passport"
              value={role}
              onChange={(e) => {
                setError(null);
                setRole(e.target.value);
              }}
              fullWidth
              label={t('common.passport')}
              disabled={loading}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onCreate();
                }
              }}>
              {roles
                .filter((d) => showOwnerPassport || d.name !== 'owner')
                .map((r) => (
                  <MenuItem key={r.name} value={r.name} data-cy={`issue-passport-select-option-${r.name}`}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="subtitle1">{r.title || r.name}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {r.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          {selectedRole?.extra?.display === 'custom' && (
            <TextField
              label={t('common.display')}
              type="url"
              value={display}
              onChange={(e) => setDisplay(e.target.value)}
              fullWidth
              variant="outlined"
              margin="normal"
            />
          )}
          <TimeSelect
            value={currentState.passportExpireTime}
            onChange={(newValue) => {
              currentState.passportExpireTime = newValue;
            }}
          />
        </Box>
      </DialogContentText>
      {!!error && (
        <Alert severity="error" variant="icon">
          {error}
        </Alert>
      )}
    </Dialog>
  );
}

IssuePassport.propTypes = {
  teamDid: PropTypes.string.isRequired,
  ownerDid: PropTypes.string.isRequired,
  needReceive: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func,
  roles: PropTypes.array,
  showOwnerPassport: PropTypes.bool,
};
