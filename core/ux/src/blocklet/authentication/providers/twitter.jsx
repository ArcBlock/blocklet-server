import { Box, FormControl, TextField } from '@mui/material';
import pick from 'lodash/pick';
import noop from 'lodash/noop';
import { useMemoizedFn } from 'ahooks';
import { Controller, useForm } from 'react-hook-form';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Toast from '@arcblock/ux/lib/Toast';
import { CopyButton } from '@arcblock/ux/lib/ClickToCopy';
import { joinURL } from 'ufo';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { useImperativeHandle } from 'react';
import PropTypes from 'prop-types';

import { useNodeContext } from '../../../contexts/node';
import { useBlockletContext } from '../../../contexts/blocklet';
import Section from '../../../component/section';

const defaultValue = {
  clientId: '',
  clientSecret: '',
};

function OAuthTwitter({ ref = null, onSuccess = noop, sortMaps = {} }) {
  const { api } = useNodeContext();
  const { blocklet } = useBlockletContext();
  const { t, locale } = useLocaleContext();
  const did = blocklet?.meta?.did;
  const twitter = Object.assign({ ...defaultValue }, blocklet?.settings?.authentication?.twitter || {});
  const appUrl =
    (blocklet.environments || []).find((item) => item.key === 'BLOCKLET_APP_URL')?.value || window.location.origin;
  const { handleSubmit, control, formState, reset } = useForm({
    defaultValues: pick(twitter, Object.keys(defaultValue)),
  });
  const onSubmit = useMemoizedFn(async (data) => {
    try {
      const { blocklet: blockletChanged } = await api.configAuthentication({
        input: {
          did,
          authentication: JSON.stringify({
            ...sortMaps,
            twitter: {
              ...data,
              order: sortMaps.twitter?.order ?? Object.keys(sortMaps).length,
              enabled: true,
              type: 'oauth',
            },
          }),
        },
      });

      const defaultValues = Object.assign(
        { ...defaultValue },
        blockletChanged?.settings?.authentication?.twitter || {}
      );
      // 将当前表单的默认值重置为新的数据，这样能够修正页面的 isDirty 数据
      reset(defaultValues);
      Toast.success(t('common.saveSuccess'));
      onSuccess();
    } catch (err) {
      Toast.error(err.message || t('common.saveFailed'));
    }
  });
  const validateClientId = useMemoizedFn((val) => {
    if (!val?.trim()) {
      return t('authentication.twitter.clientIdDescription');
    }
    return true;
  });
  const validateClientSecret = useMemoizedFn((val) => {
    if (!val?.trim()) {
      return t('authentication.twitter.clientSecretDescription');
    }
    return true;
  });

  const callbackUrl = joinURL(appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, 'oauth/callback/twitter');

  useImperativeHandle(
    ref,
    () => ({
      submit: handleSubmit(onSubmit),
    }),
    [handleSubmit, onSubmit]
  );

  return (
    <Box>
      <form onSubmit={handleSubmit(onSubmit)} disabled>
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
        <Section title={t('authentication.twitter.clientId')}>
          <Controller
            name="clientId"
            control={control}
            rules={{ validate: validateClientId }}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  label={t('authentication.twitter.clientId')}
                  error={!!formState.errors[field.name]}
                  helperText={formState.errors[field.name]?.message || '　'}
                />
              </FormControl>
            )}
          />
        </Section>

        <Section title={t('authentication.twitter.clientSecret')}>
          <Controller
            name="clientSecret"
            control={control}
            rules={{ validate: validateClientSecret }}
            render={({ field }) => (
              <FormControl fullWidth>
                <TextField
                  {...field}
                  size="small"
                  type="password"
                  label={t('authentication.twitter.clientSecret')}
                  error={!!formState.errors[field.name]}
                  helperText={formState.errors[field.name]?.message || '　'}
                />
              </FormControl>
            )}
          />
        </Section>
      </form>
    </Box>
  );
}

OAuthTwitter.propTypes = {
  ref: PropTypes.any,
  onSuccess: PropTypes.func,
  sortMaps: PropTypes.object,
};

export default OAuthTwitter;
