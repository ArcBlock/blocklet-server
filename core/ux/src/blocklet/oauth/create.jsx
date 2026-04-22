import { useState } from 'react';
import PropTypes from 'prop-types';
import { useForm, Controller } from 'react-hook-form';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';
import CloseIcon from '@mui/icons-material/Close';
import { OAUTH_SCOPES } from '@abtnode/constant';
import Toast from '@arcblock/ux/lib/Toast';
import { omitBy, isNil } from 'lodash';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';

const defaultValues = {
  clientName: '',
  clientUri: '',
  redirectUris: '',
  scope: ['profile:read'],
  contacts: '',
  tosUri: '',
  policyUri: '',
};

export default function CreateOauthClient({ onCreated, onClose }) {
  const [loading, setLoading] = useState(false);
  const { t, locale } = useLocaleContext();
  const { api } = useNodeContext();
  const { teamDid } = useTeamContext();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({ defaultValues, mode: 'onChange' });

  const selectedScopes = watch('scope');

  const handleScopeChange = (scope) => {
    if (scope === 'profile:read') return; // profile:read is always required

    setValue(
      'scope',
      selectedScopes.includes(scope) ? selectedScopes.filter((s) => s !== scope) : [...selectedScopes, scope]
    );
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        redirectUris: data.redirectUris,
        contacts: data.contacts ? data.contacts.split(',').map((s) => s.trim()) : [],
        scope: data.scope.join(' '),
      };
      await api.createOAuthClient({ input: { teamDid, input: omitBy(payload, isNil) } });
      onCreated(payload);
    } catch (e) {
      Toast.error(e.message || 'Failed to create OAuth App');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {t('oauth.client.register')}{' '}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={4} sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('oauth.client.requiredInformation')}
          </Typography>

          <Box>
            <Controller
              name="clientName"
              control={control}
              rules={{
                required: t('oauth.client.validate.clientName'),
                minLength: {
                  value: 3,
                  message: t('oauth.client.validate.clientNameMinLength'),
                },
              }}
              render={({ field }) => (
                <>
                  <TextField
                    size="small"
                    {...field}
                    label={t('oauth.client.name')}
                    required
                    fullWidth
                    placeholder={t('oauth.client.input.clientNamePlaceholder')}
                    error={!!errors.clientName}
                    helperText={errors.clientName?.message}
                  />
                  <FormHelperText>{t('oauth.client.helperText.clientName')}</FormHelperText>
                </>
              )}
            />
          </Box>

          <Box>
            <Controller
              name="clientUri"
              control={control}
              rules={{
                required: t('oauth.client.validate.clientUri'),
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: t('oauth.client.validate.clientUriInvalid'),
                },
              }}
              render={({ field }) => (
                <>
                  <TextField
                    size="small"
                    {...field}
                    label={t('oauth.client.input.clientUri')}
                    required
                    fullWidth
                    placeholder={t('oauth.client.input.clientUriPlaceholder')}
                    error={!!errors.clientUri}
                    helperText={errors.clientUri?.message}
                  />
                  <FormHelperText>{t('oauth.client.helperText.clientUri')}</FormHelperText>
                </>
              )}
            />
          </Box>

          <Box>
            <Controller
              name="redirectUris"
              control={control}
              rules={{
                required: t('oauth.client.validate.redirectUris'),
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: t('oauth.client.validate.redirectUrisInvalid'),
                },
              }}
              render={({ field }) => (
                <>
                  <TextField
                    size="small"
                    {...field}
                    label={t('oauth.client.input.redirectUris')}
                    required
                    fullWidth
                    placeholder={t('oauth.client.input.redirectUrisPlaceholder')}
                    error={!!errors.redirectUris}
                    helperText={errors.redirectUris?.message}
                  />

                  <Box sx={{ display: 'flex', gap: '2px' }}>
                    <FormHelperText>{t('oauth.client.helperText.redirectUris')}</FormHelperText>
                    <FormHelperText>{t('oauth.client.helperText.read')}</FormHelperText>
                    <FormHelperText
                      sx={{ color: 'info.main' }}
                      component="a"
                      href={`https://www.arcblock.io/docs/blocklet-developer/${locale}/oauth-service`}
                      target="_blank"
                      rel="noopener noreferrer">
                      {t('oauth.client.helperText.document')}
                    </FormHelperText>
                    <FormHelperText>{t('oauth.client.helperText.more')}</FormHelperText>
                  </Box>
                </>
              )}
            />
          </Box>

          <Card variant="outlined" sx={{ p: 2, display: 'none' }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('oauth.client.input.permissions')}
            </Typography>
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <FormGroup>
                {Object.entries(OAUTH_SCOPES).map(([scope, description]) => (
                  <FormControlLabel
                    key={scope}
                    control={
                      <Checkbox
                        checked={selectedScopes.includes(scope)}
                        onChange={() => handleScopeChange(scope)}
                        disabled={scope === 'profile:read'}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {description}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </Box>
          </Card>

          <Divider />

          <Typography variant="h6" gutterBottom>
            {t('oauth.client.optionalInformation')}
          </Typography>

          <Stack>
            <Controller
              name="contacts"
              control={control}
              rules={{
                pattern: {
                  value: /^$|^[^@\s]+@[^@\s]+\.[^@\s]+(\s*,\s*[^@\s]+@[^@\s]+\.[^@\s]+)*$/,
                  message: t('oauth.client.validate.contacts'),
                },
              }}
              render={({ field }) => (
                <>
                  <TextField
                    size="small"
                    {...field}
                    label={t('oauth.client.input.contacts')}
                    fullWidth
                    placeholder={t('oauth.client.input.contactsPlaceholder')}
                    error={!!errors.contacts}
                    helperText={errors.contacts?.message}
                  />
                  <FormHelperText>{t('oauth.client.helperText.contacts')}</FormHelperText>
                </>
              )}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="tosUri"
              control={control}
              rules={{
                pattern: {
                  value: /^$|^https?:\/\/.+/,
                  message: t('oauth.client.validate.tosUriInvalid'),
                },
              }}
              render={({ field }) => (
                <Box sx={{ width: '50%' }}>
                  <TextField
                    size="small"
                    {...field}
                    label={t('oauth.client.input.tosUri')}
                    fullWidth
                    placeholder={t('oauth.client.input.tosUriPlaceholder')}
                    error={!!errors.tosUri}
                    helperText={errors.tosUri?.message}
                  />
                  <FormHelperText>{t('oauth.client.helperText.tosUri')}</FormHelperText>
                </Box>
              )}
            />
            <Controller
              name="policyUri"
              control={control}
              rules={{
                pattern: {
                  value: /^$|^https?:\/\/.+/,
                  message: t('oauth.client.validate.policyUriInvalid'),
                },
              }}
              render={({ field }) => (
                <Box sx={{ width: '50%' }}>
                  <TextField
                    size="small"
                    {...field}
                    label={t('oauth.client.input.policyUri')}
                    fullWidth
                    placeholder={t('oauth.client.input.policyUriPlaceholder')}
                    error={!!errors.policyUri}
                    helperText={errors.policyUri?.message}
                  />
                  <FormHelperText>{t('oauth.client.helperText.policyUri')}</FormHelperText>
                </Box>
              )}
            />
          </Stack>

          {errors.error && <Alert severity="error">{errors.error.message}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleSubmit(onSubmit)} disabled={loading} variant="contained" color="primary">
          {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
          {t('oauth.client.registerButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

CreateOauthClient.propTypes = {
  onCreated: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
