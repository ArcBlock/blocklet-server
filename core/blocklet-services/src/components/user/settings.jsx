/* eslint-disable react/prop-types */
import React from 'react';
import merge from 'lodash/merge';
import get from 'lodash/get';
import Empty from '@arcblock/ux/lib/Empty';
import InfoRow from '@arcblock/ux/lib/InfoRow';
import Toast from '@arcblock/ux/lib/Toast';
import Button from '@arcblock/ux/lib/Button';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { getWalletDid } from '@blocklet/meta/lib/did-utils';
import isUrl from 'is-url';
import { AddOutlined, SendOutlined, DeleteOutlineOutlined } from '@mui/icons-material';
import {
  Alert,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Checkbox,
  InputAdornment,
  Stack,
  Select,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useMount, useRequest, useSetState } from 'ahooks';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatError } from '@blocklet/error';
import { useConfirm } from '@arcblock/ux/lib/Dialog';

import { useSessionContext } from '../../contexts/session';

export function UserSettingsForm({ data, user, onChange }) {
  const { t } = useLocaleContext();
  const { api } = useSessionContext();
  const [state, setState] = useSetState({ editing: false, dirty: false });
  const { control, getValues, setValue, formState, handleSubmit } = useForm({
    defaultValues: merge(
      {
        notifications: {
          email: true,
          wallet: true,
          phone: false,
        },
        webhooks: [],
      },
      data
    ),
  });

  const { confirmApi, confirmHolder } = useConfirm();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const navigate = useNavigate();

  const webhooks = useFieldArray({ control, name: 'webhooks' });

  const onSaveChanges = async (values) => {
    try {
      await api.post('/api/user/extra', values);
      Toast.success(t('common.saveSuccess'));
      setState({ editing: false });
      await onChange();
    } catch (err) {
      Toast.error(formatError(err));
    }
  };

  useMount(() => {
    if (searchParams.get('action') === 'unsubscribe') {
      const channel = searchParams.get('channel');
      if (['email', 'wallet', 'phone'].includes(channel)) {
        navigate(location.pathname, { replace: true });
        confirmApi.open({
          title: t('notification.email.disable'),
          content: t('notification.email.disableDescription'),
          confirmButtonText: t('common.confirm'),
          cancelButtonText: t('common.cancel'),
          async onConfirm(close) {
            await onSaveChanges({
              notifications: {
                [channel]: false,
              },
            });
            close();
          },
        });
      }
    }
  });

  const onTestWebhook = async (index) => {
    try {
      const values = getValues();
      await api.put('/api/user/extra', values.webhooks[index]);
      Toast.success(t('team.member.settings.tested'));
    } catch (err) {
      Toast.error(formatError(err));
    }
  };

  return (
    <Stack spacing={3}>
      <Stack sx={{ width: '100%' }}>
        <Stack
          direction="row"
          sx={{
            justifyContent: 'space-between',
          }}>
          <Typography variant="h6" gutterBottom>
            {t('team.member.settings.notification')}
          </Typography>
          <Button
            variant="contained"
            size="small"
            color="primary"
            style={{ height: '32px' }}
            onClick={handleSubmit(onSaveChanges)}
            disabled={formState.isSubmitting}>
            {t('common.save')}
          </Button>
        </Stack>
        <Controller
          name="notifications.wallet"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={getValues().notifications.wallet}
                  {...field}
                  onChange={(_, checked) => setValue(field.name, checked)}
                />
              }
              disableTypography
              label={
                <Typography
                  sx={{
                    color: 'text.primary',
                  }}>
                  {t('team.member.settings.wallet')}
                  <Typography
                    component="span"
                    sx={{
                      color: 'text.secondary',
                      ml: 1,
                    }}>
                    {getWalletDid(user)}
                  </Typography>
                </Typography>
              }
            />
          )}
        />
        <Controller
          name="notifications.email"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={getValues().notifications.email}
                  {...field}
                  onChange={(_, checked) => setValue(field.name, checked)}
                />
              }
              disableTypography
              label={
                <Typography
                  sx={{
                    color: 'text.primary',
                  }}>
                  {t('team.member.settings.email')}
                  <Typography
                    component="span"
                    sx={{
                      color: 'text.secondary',
                      ml: 1,
                    }}>
                    {user.email || ''}
                  </Typography>
                </Typography>
              }
            />
          )}
        />
        <Controller
          name="notifications.phone"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={getValues().notifications.phone}
                  {...field}
                  onChange={(_, checked) => setValue(field.name, checked)}
                />
              }
              disableTypography
              disabled
              label={
                <Typography
                  sx={{
                    color: 'text.primary',
                  }}>
                  {t('team.member.settings.phone')}
                  <Typography
                    component="span"
                    sx={{
                      color: 'text.secondary',
                      ml: 1,
                    }}>
                    {user.phone || ''}
                  </Typography>
                </Typography>
              }
            />
          )}
        />
      </Stack>
      <Stack>
        <Stack
          direction="row"
          sx={{
            justifyContent: 'space-between',
          }}>
          <Typography variant="h6" gutterBottom>
            {t('team.member.settings.webhook')}
          </Typography>
          <Stack direction="row">
            {state.editing && (
              <Button
                variant="text"
                size="small"
                color="primary"
                style={{ height: '32px' }}
                onClick={() => setState({ editing: false })}>
                {t('common.cancel')}
              </Button>
            )}
            <Button
              variant="contained"
              size="small"
              color="primary"
              style={{ height: '32px' }}
              onClick={state.editing ? handleSubmit(onSaveChanges) : () => setState({ editing: true })}
              disabled={formState.isSubmitting}>
              {state.editing ? t('common.save') : t('common.edit')}
            </Button>
          </Stack>
        </Stack>
        {webhooks.fields.map((webhook, index) => {
          const error = get(formState.errors, `webhooks.${index}.url`)?.message;
          if (state.editing) {
            return (
              <Stack
                key={webhook.id}
                spacing={2}
                direction="row"
                sx={{
                  mt: 2,
                  alignItems: 'center',
                  width: '100%',
                }}>
                <Stack direction="row" spacing={2} sx={{ width: '80%' }}>
                  <Controller
                    name={`webhooks.${index}.type`}
                    control={control}
                    rules={{ required: t('common.required') }}
                    render={({ field }) => (
                      <Select {...field} sx={{ flex: 1 }} fullWidth size="small">
                        <MenuItem value="api">{t('team.member.settings.url')}</MenuItem>
                        <MenuItem value="slack">{t('team.member.settings.slack')}</MenuItem>
                      </Select>
                    )}
                  />
                  <Controller
                    name={`webhooks.${index}.url`}
                    control={control}
                    rules={{ required: t('common.required'), validate: (v) => isUrl(v) || t('common.invalid') }}
                    render={({ field }) => (
                      <TextField
                        sx={{ flex: 4 }}
                        fullWidth
                        size="small"
                        required
                        {...field}
                        error={!!error}
                        slotProps={{
                          input: {
                            endAdornment: error ? (
                              <InputAdornment position="end">
                                <Typography component="span" color="error">
                                  {error}
                                </Typography>
                              </InputAdornment>
                            ) : null,
                          },
                        }}
                      />
                    )}
                  />
                </Stack>
                <Stack direction="row" spacing={1}>
                  <IconButton size="small" onClick={() => onTestWebhook(index)}>
                    <SendOutlined color="primary" sx={{ opacity: 0.75 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => webhooks.remove(index)}>
                    <DeleteOutlineOutlined color="error" sx={{ opacity: 0.75 }} />
                  </IconButton>
                </Stack>
              </Stack>
            );
          }

          return (
            <InfoRow
              style={{ alignItems: 'flex-start' }}
              valueComponent="div"
              key={webhook.id}
              nameWidth={120}
              name={webhook.type}>
              {webhook.url}
            </InfoRow>
          );
        })}
        {!state.editing && !webhooks.fields.length && <Empty>{t('common.empty')}</Empty>}
        {state.editing && (
          <Stack
            direction="row"
            sx={{
              mt: webhooks.fields.length ? 2 : 1,
              justifyContent: 'space-between',
            }}>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => webhooks.append({ type: 'slack', url: '' })}>
              <AddOutlined fontSize="small" /> {t('team.member.settings.add')}
            </Button>
          </Stack>
        )}
      </Stack>
      {confirmHolder}
    </Stack>
  );
}

// eslint-disable-next-line react/prop-types
export default function UserSettings({ user }) {
  const { api } = useSessionContext();
  const { loading, error, runAsync, data } = useRequest(() => api.get('/api/user/extra').then((res) => res.data));

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  if (loading || !data) {
    return <CircularProgress />;
  }

  return <UserSettingsForm data={data} user={user} onChange={runAsync} />;
}
