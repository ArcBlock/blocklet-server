import { Suspense, useState, useRef, lazy } from 'react';
import PropTypes from 'prop-types';
import { useForm, Controller } from 'react-hook-form';
import Spinner from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
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
import IconButton from '@mui/material/IconButton';
import FormHelperText from '@mui/material/FormHelperText';
import { OAUTH_SCOPES } from '@abtnode/constant';
import CloseIcon from '@mui/icons-material/Close';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';

import TimeSelect from '../../team/members/time-select';
import { useNodeContext } from '../../contexts/node';
import { useTeamContext } from '../../contexts/team';
import EmptySpinner from '../../empty-spinner';
import { useClientLogo } from './component';

// eslint-disable-next-line import/no-unresolved
const UploaderComponent = lazy(() => import('@blocklet/uploader').then((res) => ({ default: res.Uploader })));

function UpdateForm({ client, onUpdate, onClose }) {
  const [loading, setLoading] = useState(false);
  const { t, locale } = useLocaleContext();
  const uploaderLogoRef = useRef(null);
  const { api } = useNodeContext();
  const { teamDid } = useTeamContext();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm({
    defaultValues: {
      clientName: client.clientName || '',
      clientUri: client.clientUri || '',
      redirectUris: Array.isArray(client.redirectUris) ? client.redirectUris.join(',') : '',
      scope: client.scope ? client.scope.split(' ') : ['profile:read'],
      contacts: Array.isArray(client.contacts) ? client.contacts.join(',') : '',
      tosUri: client.tosUri || '',
      policyUri: client.policyUri || '',
      logoUri: client.logoUri || '',
      clientSecretExpiresAt: client.clientSecretExpiresAt || null,
    },
    mode: 'onChange',
  });

  const selectedScopes = watch('scope');
  const logoUri = watch('logoUri');
  const { clientLogoUrl, apiPath } = useClientLogo(logoUri);

  const handleScopeChange = (scope) => {
    if (scope === 'profile:read') return;

    setValue(
      'scope',
      selectedScopes.includes(scope) ? selectedScopes.filter((s) => s !== scope) : [...selectedScopes, scope]
    );
  };

  const updateOAuthClient = async (data) => {
    const payload = {
      clientId: client.clientId,
      clientName: data.clientName.trim(),
      clientUri: data.clientUri,
      redirectUris: data.redirectUris
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      contacts: data.contacts ? data.contacts.split(',').map((s) => s.trim()) : [],
      scope: data.scope.join(' '),
      tosUri: data.tosUri,
      policyUri: data.policyUri,
      logoUri: data.logoUri,
      clientSecretExpiresAt: data.clientSecretExpiresAt ? parseInt(data.clientSecretExpiresAt / 1000, 10) : null,
    };
    await api.updateOAuthClient({ input: { teamDid, input: payload } });
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await updateOAuthClient(data);
      onUpdate();
      onClose();
    } catch (error) {
      Toast.error(error.message || t('oauth.client.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {t('oauth.client.update')}{' '}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
              {t('oauth.client.logo')}
            </Typography>

            <Box>
              <Box sx={{ width: 120, height: 120, position: 'relative', borderRadius: '4px', overflow: 'hidden' }}>
                {clientLogoUrl ? (
                  <Box>
                    <img src={clientLogoUrl} alt="client-logo" style={{ width: '100%', height: '100%' }} />
                  </Box>
                ) : (
                  <Box
                    onClick={() => {
                      uploaderLogoRef.current?.open();
                    }}
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.200',
                    }}>
                    <AddIcon sx={{ fontSize: 40, color: 'common.white' }} />
                  </Box>
                )}
              </Box>

              <Button
                sx={{ mt: 2 }}
                variant="outlined"
                size="small"
                onClick={() => {
                  uploaderLogoRef.current?.open();
                }}>
                {clientLogoUrl ? t('common.change') : t('common.upload')}
              </Button>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Suspense fallback={<EmptySpinner />}>
                <UploaderComponent
                  key="uploader-logo"
                  ref={uploaderLogoRef}
                  locale={locale}
                  popup
                  onUploadFinish={(result) => {
                    setValue('logoUri', result.data.filename);

                    updateOAuthClient(getValues())
                      .then(() => {
                        onUpdate();
                      })
                      .catch((error) => {
                        Toast.error(error.message || t('oauth.client.updateFailed'));
                      })
                      .finally(() => {
                        uploaderLogoRef.current?.close();
                      });
                  }}
                  plugins={['ImageEditor']}
                  installerProps={{ disabled: true }}
                  apiPathProps={{
                    uploader: apiPath,
                    disableMediaKitPrefix: true,
                    disableAutoPrefix: true,
                    disableMediaKitStatus: true,
                  }}
                  coreProps={{
                    restrictions: {
                      allowedFileTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
                      maxFileSize: 1024 * 1024 * 0.5,
                      maxNumberOfFiles: 1,
                    },
                  }}
                  dashboardProps={{
                    autoOpen: 'imageEditor',
                  }}
                  imageEditorProps={{
                    actions: {
                      revert: true,
                      rotate: true,
                      granularRotate: true,
                      flip: true,
                      zoomIn: true,
                      zoomOut: true,
                      cropSquare: false,
                      cropWidescreen: false,
                      cropWidescreenVertical: false,
                    },
                    cropperOptions: {
                      autoCrop: true,
                      aspectRatio: 1,
                      initialAspectRatio: 1,
                      autoCropArea: 1,
                      croppedCanvasOptions: {
                        minWidth: 256,
                        minHeight: 256,
                      },
                    },
                  }}
                />
              </Suspense>
            </Box>
          </Box>

          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            {t('oauth.client.requiredInformation')}
          </Typography>

          <TextField label="Client Id" fullWidth value={client.clientId} disabled />

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
                    {...field}
                    label={t('oauth.client.name')}
                    required
                    fullWidth
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
                    {...field}
                    label={t('oauth.client.input.clientUri')}
                    required
                    fullWidth
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
                    {...field}
                    label={t('oauth.client.input.redirectUris')}
                    required
                    fullWidth
                    multiline
                    rows={2}
                    error={!!errors.redirectUris}
                    helperText={errors.redirectUris?.message}
                  />
                  <FormHelperText>{t('oauth.client.helperText.redirectUris')}</FormHelperText>
                </>
              )}
            />
          </Box>

          <Controller
            name="clientSecretExpiresAt"
            control={control}
            render={({ field }) => (
              <TimeSelect
                placeholder={t('oauth.client.input.expireTime')}
                value={field.value * 1000}
                onChange={(newValue) => {
                  field.onChange(newValue);
                }}
              />
            )}
          />

          <Box sx={{ display: 'none' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
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
          </Box>

          <Divider />

          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            {t('oauth.client.optionalInformation')}
          </Typography>

          <Box>
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
                    {...field}
                    label={t('oauth.client.input.contacts')}
                    fullWidth
                    error={!!errors.contacts}
                    helperText={errors.contacts?.message}
                  />
                  <FormHelperText>{t('oauth.client.helperText.contacts')}</FormHelperText>
                </>
              )}
            />
          </Box>

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
                    {...field}
                    label={t('oauth.client.input.tosUri')}
                    fullWidth
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
                    {...field}
                    label={t('oauth.client.input.policyUri')}
                    fullWidth
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
          {loading ? <Spinner size={16} /> : t('common.update')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

UpdateForm.propTypes = {
  client: PropTypes.shape({
    clientId: PropTypes.string.isRequired,
    clientName: PropTypes.string.isRequired,
    clientUri: PropTypes.string,
    redirectUris: PropTypes.arrayOf(PropTypes.string),
    scope: PropTypes.string,
    contacts: PropTypes.arrayOf(PropTypes.string),
    tosUri: PropTypes.string,
    policyUri: PropTypes.string,
    logoUri: PropTypes.string,
    clientSecretExpiresAt: PropTypes.number,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default function UpdateOAuthClient({ client, onUpdate, onClose }) {
  return <UpdateForm client={client} onUpdate={(p) => onUpdate(p)} onClose={onClose} />;
}

UpdateOAuthClient.propTypes = {
  client: PropTypes.shape({
    clientId: PropTypes.string.isRequired,
    clientName: PropTypes.string.isRequired,
    clientUri: PropTypes.string,
    redirectUris: PropTypes.arrayOf(PropTypes.string),
    scope: PropTypes.string,
    contacts: PropTypes.arrayOf(PropTypes.string),
    tosUri: PropTypes.string,
    policyUri: PropTypes.string,
    logoUri: PropTypes.string,
    clientSecretExpiresAt: PropTypes.number,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
