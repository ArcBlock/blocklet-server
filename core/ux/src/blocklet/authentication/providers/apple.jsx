import { Box, FormControl, TextField } from '@mui/material';
import pick from 'lodash/pick';
import { useMemoizedFn } from 'ahooks';
import { Controller, useForm } from 'react-hook-form';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import { CopyButton } from '@arcblock/ux/lib/ClickToCopy';
import { joinURL } from 'ufo';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import noop from 'lodash/noop';
import { useImperativeHandle } from 'react';
import PropTypes from 'prop-types';

import { useNodeContext } from '../../../contexts/node';
import { useBlockletContext } from '../../../contexts/blocklet';
import Section from '../../../component/section';

const defaultValue = {
  teamId: '',
  serviceId: '',
  keyId: '',
  authKey: '',
  bundleId: '',
};

function OAuthApple({ ref = null, onSuccess = noop, sortMaps = {} }) {
  const { api } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const { t, locale } = useLocaleContext();
  const did = blocklet?.meta?.did;
  const authData = Object.assign({ ...defaultValue }, blocklet?.settings?.authentication?.apple || {});
  const appUrl =
    (blocklet.environments || []).find((item) => item.key === 'BLOCKLET_APP_URL')?.value || window.location.origin;
  const { handleSubmit, control, formState, reset } = useForm({
    defaultValues: pick(authData, Object.keys(defaultValue)),
  });
  const onSubmit = useMemoizedFn(async (data) => {
    try {
      const { blocklet: blockletChanged } = await api.configAuthentication({
        input: {
          did,
          authentication: JSON.stringify({
            ...sortMaps,
            apple: {
              ...data,
              order: sortMaps.apple?.order ?? Object.keys(sortMaps).length,
              enabled: true,
              type: 'oauth',
            },
          }),
        },
      });

      const defaultValues = Object.assign({ ...defaultValue }, blockletChanged?.settings?.authentication?.apple || {});
      // 将当前表单的默认值重置为新的数据，这样能够修正页面的 isDirty 数据
      reset(defaultValues);
      Toast.success(t('common.saveSuccess'));
      onSuccess();
    } catch (err) {
      Toast.error(err.message || t('common.saveFailed'));
    }
  });
  const validateTeamId = useMemoizedFn((val) => {
    if (!val?.trim()) {
      return t('authentication.apple.teamIdDescription');
    }
    return true;
  });
  const validateServiceId = useMemoizedFn((val) => {
    if (!val?.trim()) {
      return t('authentication.apple.serviceIdDescription');
    }
    return true;
  });
  const validateKeyId = useMemoizedFn((val) => {
    if (!val?.trim()) {
      return t('authentication.apple.keyIdDescription');
    }
    return true;
  });
  const validateAuthKey = useMemoizedFn((val) => {
    if (!val?.trim()) {
      return t('authentication.apple.authKeyDescription');
    }
    return true;
  });
  const validateBundleId = useMemoizedFn((val) => {
    if (!val?.trim()) {
      return t('authentication.apple.bundleIdDescription');
    }
    return true;
  });

  const callbackUrl = joinURL(appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, 'oauth/callback/apple');

  useImperativeHandle(
    ref,
    () => ({
      submit: handleSubmit(onSubmit),
    }),
    [handleSubmit, onSubmit]
  );

  return (
    <Box>
      <form>
        <Section title={t('authentication.oauthCallbackUrl')}>
          <Box sx={{ mb: 1, verticalAlign: 'middle', fontSize: '14px', wordBreak: 'break-all' }}>
            {callbackUrl}
            <CopyButton
              locale={locale}
              content={callbackUrl}
              style={{
                marginLeft: '6px',
                verticalAlign: 'middle',
                scale: 0.8,
                lineHeight: 1,
              }}
            />
          </Box>
        </Section>
        <Section title={t('authentication.apple.teamId')}>
          <Controller
            name="teamId"
            control={control}
            rules={{ validate: validateTeamId }}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  label={t('authentication.apple.teamId')}
                  error={!!formState.errors[field.name]}
                  helperText={formState.errors[field.name]?.message || '　'}
                />
              </FormControl>
            )}
          />
        </Section>

        <Section title={t('authentication.apple.bundleId')}>
          <Controller
            name="bundleId"
            control={control}
            rules={{ validate: validateBundleId }}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  label={t('authentication.apple.bundleId')}
                  error={!!formState.errors[field.name]}
                  helperText={formState.errors[field.name]?.message || '　'}
                />
              </FormControl>
            )}
          />
        </Section>

        <Section title={t('authentication.apple.serviceId')}>
          <Controller
            name="serviceId"
            control={control}
            rules={{ validate: validateServiceId }}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  label={t('authentication.apple.serviceId')}
                  error={!!formState.errors[field.name]}
                  helperText={formState.errors[field.name]?.message || '　'}
                />
              </FormControl>
            )}
          />
        </Section>

        <Section title={t('authentication.apple.keyId')}>
          <Controller
            name="keyId"
            control={control}
            rules={{ validate: validateKeyId }}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  label={t('authentication.apple.keyId')}
                  error={!!formState.errors[field.name]}
                  helperText={formState.errors[field.name]?.message || '　'}
                />
              </FormControl>
            )}
          />
        </Section>

        <Section title={t('authentication.apple.authKey')}>
          <Controller
            name="authKey"
            control={control}
            rules={{ validate: validateAuthKey }}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  type="password"
                  label={t('authentication.apple.authKey')}
                  multiline
                  rows={4}
                  error={!!formState.errors[field.name]}
                  helperText={formState.errors[field.name]?.message || '　'}
                  slotProps={{
                    input: {
                      sx: {
                        WebkitTextSecurity: 'disc', // mask characters
                        fontFamily: 'text-security-disc, monospace', // fallback if available
                      },
                    },
                  }}
                />
              </FormControl>
            )}
          />
        </Section>
      </form>
    </Box>
  );
}

OAuthApple.propTypes = {
  ref: PropTypes.any,
  onSuccess: PropTypes.func,
  sortMaps: PropTypes.object,
};

export default OAuthApple;
